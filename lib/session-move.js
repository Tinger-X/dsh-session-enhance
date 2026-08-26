//#region lib/types/session-move.js
/**
 * dsh-session-enhance 会话物理移动层。
 *
 * 拖拽修改归属不能只改 storages 记账：`WorkspaceEntity.sessionIds` 用
 * `sessionPath(id) === record.path` 过滤成员，且转录目录按 header.cwd 定位。
 * 本模块把会话的转录目录真实搬到目标工作区，并同步改写工件内的 header 行：
 *
 * 1. `persistence.locate(header)` 解析旧目录（sessions/<projectKey(cwd)>/<id>/）；
 *    用 `{ ...header, cwd: newCwd }` 解析目标目录。
 * 2. 目录整体 rename（跨盘 EXDEV 时退化为拷贝+删除）。
 * 3. 通过 `persistence.readRaw` 读取工件全文（后端解码 zstd 帧），改写**第一行**
 *    header 的 `cwd` 字段，再按后端帧布局重新压缩（encodeArtifact：header
 *    独占第一帧、事件行放入后续帧，checksum flag 与后端 CHECKSUM_OPTIONS
 *    一致），原子写回。
 * 4. 重新 readRaw 验证 header.cwd（兼容 `{ meta }` / `{ header }` 两种形态）；
 *    失败则回滚（恢复原 header + 目录搬回）。
 * 5. `persistence.prepare(id)` 后立即释放：让持久化协调器的内存状态
 *    （states.meta）以新 cwd 落定，避免旧 meta 把后续写入导向旧路径
 *    （分裂写入）；同时顺带校验工件完整可读。
 *
 * 调用方约定：实时会话必须先 flush + detach（释放写路径与文件句柄），
 * 本模块只处理磁盘工件；失败时调用方的记账尚未更新，可安全重试。
 */
import { existsSync } from "node:fs";
import { copyFile, mkdir, readdir, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { promisify } from "node:util";
import { constants, zstdCompress, zstdDecompress } from "node:zlib";
/** 与 @deepseek-ai/dsh-session-persistence-jsonl 后端一致的 zstd 选项（checksum 帧）。 */
const zstdCompressAsync = promisify(zstdCompress);
const zstdDecompressAsync = promisify(zstdDecompress);
const CHECKSUM_OPTIONS = { params: { [constants.ZSTD_c_checksumFlag]: 1 } };
const ZSTD_MAGIC = 4247762216;
/** 工件是否为 zstd 编码（.jsonl.zstd）——否则按明文 .jsonl 处理。 */
function isZstdPath(file) {
	return file.endsWith(".zstd");
}
/**
* 按后端帧布局编码工件全文（encodeMaterialization 语义）：zstd 工件必须由
* 多个独立帧组成，**第一帧恰好是 header 一行**，事件行放入后续帧；明文原样。
* 后端 list()/prepare()/load() 的严格读取器都依赖该布局（first frame is
* exactly one header line），整篇压缩进单帧会让移动后的会话不可读，
* 进而使 session.list 整体 500。
* @param text - 完整 JSONL 文本（首行为 header）。
* @param isZstd - 工件是否为 zstd 编码。
* @returns 待原子写回的完整工件字节。
*/
async function encodeArtifact(text, isZstd) {
	if (!isZstd) return Buffer.from(text, "utf8");
	const newline = text.indexOf("\n");
	const headerLine = newline === -1 ? text : text.slice(0, newline + 1);
	const rest = newline === -1 ? "" : text.slice(newline + 1);
	const frames = [await zstdCompressAsync(Buffer.from(headerLine, "utf8"), CHECKSUM_OPTIONS)];
	if (rest.length > 0) frames.push(await zstdCompressAsync(Buffer.from(rest, "utf8"), CHECKSUM_OPTIONS));
	return Buffer.concat(frames);
}
/**
* 校验编码后缓冲区满足后端不变式：第一帧解压后恰好是 header 一行
* （与后端 assertZstdHeaderFrame 等价）。写盘前调用，把帧布局破坏
* 变成移动失败（可回滚），而不是静默产出 session.list 500。
* @param encoded - 待写入的工件字节（zstd 编码）。
*/
async function assertFirstFrameIsHeader(encoded) {
	let offset = 0;
	if (encoded.length - offset < 4 || encoded.readUInt32LE(offset) !== ZSTD_MAGIC) {
		throw new Error("corrupt Zstandard session log: invalid frame magic");
	}
	offset += 4;
	const descriptor = encoded.readUInt8(offset);
	offset += 1;
	if ((descriptor & 24) !== 0) throw new Error("corrupt Zstandard session log: reserved frame-header bit");
	const contentSizeFlag = descriptor >>> 6;
	const singleSegment = (descriptor & 32) !== 0;
	const checksum = (descriptor & 4) !== 0;
	const dictionaryFlag = descriptor & 3;
	const dictionaryBytes = dictionaryFlag === 3 ? 4 : dictionaryFlag;
	const contentSizeBytes = contentSizeFlag === 0 ? singleSegment ? 1 : 0 : 1 << contentSizeFlag;
	offset += (singleSegment ? 0 : 1) + dictionaryBytes + contentSizeBytes;
	for (;;) {
		if (encoded.length - offset < 3) throw new Error("corrupt Zstandard session log: truncated block header");
		const blockHeader = encoded.readUIntLE(offset, 3);
		offset += 3;
		const lastBlock = (blockHeader & 1) !== 0;
		const blockType = blockHeader >>> 1 & 3;
		const blockSize = blockHeader >>> 3;
		if (blockType === 3) throw new Error("corrupt Zstandard session log: reserved block type");
		offset += blockType === 1 ? 1 : blockSize;
		if (lastBlock) break;
	}
	if (checksum) {
		if (encoded.length - offset < 4) throw new Error("corrupt Zstandard session log: truncated checksum");
		offset += 4;
	}
	const plaintext = await zstdDecompressAsync(encoded.subarray(0, offset));
	if (plaintext.length === 0 || plaintext.indexOf(10) !== plaintext.length - 1) {
		throw new Error("corrupt Zstandard session log: first frame is not exactly one header line");
	}
}
/** 目录整体移动；跨设备（EXDEV）时退化为拷贝+删除。 */
async function moveDirectory(from, to) {
	try {
		await rename(from, to);
	} catch (error) {
		if (error.code !== "EXDEV" && error.code !== "EPERM") throw error;
		await copyDirectory(from, to);
		await rm(from, { recursive: true, force: true });
	}
}
/** 递归拷贝目录树（EXDEV 回退路径）。 */
async function copyDirectory(from, to) {
	await mkdir(to, { recursive: true });
	for (const entry of await readdir(from, { withFileTypes: true })) {
		const source = join(from, entry.name);
		const target = join(to, entry.name);
		if (entry.isDirectory()) await copyDirectory(source, target);
		else await copyFile(source, target);
	}
}
/**
 * 移除目标目录中与后端编码相反的历史遗留工件（fail-soft）。
 *
 * 共享同一会话根目录的多 dsh 实例（如 web 与 TUI）可能用不同工件编码：
 * 例如 zstd 后端旁边的明文 `session.jsonl`。后端严格读取器
 * （findLog/listArtifacts）见到相反编码文件会抛 encodingMismatch，让
 * `session.list` 整体 500、会话无法 resume。目录整体搬移会把这些遗留
 * 文件一起带进目标工作区，因此移动后必须清理；失败仅告警（另一进程
 * 仍持有句柄时删除可能失败，需要先停止该实例）。
 * @param dir - 目标会话目录。
 * @param canonicalPath - 后端 locate 给出的规范工件路径（其 basename
 *   决定当前编码与相反编码的文件名）。
 * @param logger - 日志句柄。
 */
async function removeOppositeArtifacts(dir, canonicalPath, logger) {
	try {
		const expected = basename(canonicalPath);
		const opposite = expected.endsWith(".zstd") ? expected.slice(0, -".zstd".length) : `${expected}.zstd`;
		for (const entry of await readdir(dir, { withFileTypes: true })) {
			if (entry.isFile() && entry.name === opposite) {
				const path = join(dir, entry.name);
				await rm(path, { force: true });
				logger.warn(`dsh-session-enhance: removed opposite-encoding artifact "${path}" from the moved session directory (strict readers reject mixed encodings)`);
			}
		}
	} catch (error) {
		logger.warn(`dsh-session-enhance: could not clean opposite-encoding artifacts in "${dir}": ${String(error)}`);
	}
}
/** 读取工件全文（后端 readRaw 负责解码 zstd 帧；第一行为 header）。 */
async function readArtifactText(persistence, sessionId) {
	const raw = await persistence.readRaw(sessionId);
	if (raw === void 0 || typeof raw.content !== "string") {
		throw new Error(`session "${sessionId}" has no materialized artifact to relocate`);
	}
	return raw.content;
}
/**
 * 改写工件第一行 header 的 cwd 字段并原子写回。
 * 只替换第一行，事件行原样保留（含 packed-chunk 布局）。
 * zstd 工件按后端帧布局重新编码：header 独占第一帧，事件行放入后续帧
 * （encodeArtifact），并先校验第一帧恰好是一行再落盘。
 * @param persistence - 会话持久化服务。
 * @param sessionId - 会话 id。
 * @param file - 工件文件路径（新位置）。
 * @param newCwd - 目标工作区路径。
 * @returns 改写前的完整原文（供回滚恢复）。
 */
async function rewriteHeaderCwd(persistence, sessionId, file, newCwd) {
	const text = await readArtifactText(persistence, sessionId);
	const newline = text.indexOf("\n");
	const headerLine = newline === -1 ? text : text.slice(0, newline);
	const rest = newline === -1 ? "" : text.slice(newline);
	let header;
	try {
		header = JSON.parse(headerLine);
	} catch (error) {
		throw new Error(`cannot parse header line of session "${sessionId}": ${String(error)}`, { cause: error });
	}
	if (header.cwd === newCwd) return text;
	header.cwd = newCwd;
	const next = `${JSON.stringify(header)}${rest}`;
	const encoded = await encodeArtifact(next, isZstdPath(file));
	if (isZstdPath(file)) await assertFirstFrameIsHeader(encoded);
	const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
	try {
		await writeFile(tmp, encoded);
		await rename(tmp, file);
	} catch (error) {
		await rm(tmp, { force: true }).catch(() => {});
		throw error;
	}
	return text;
}
/** 尽力回滚：恢复原 header 文本并把目录搬回旧位置。 */
async function restoreSessionArtifact(file, oldDir, newDir, originalText, logger) {
	try {
		if (originalText !== null) {
			const encoded = await encodeArtifact(originalText, isZstdPath(file));
			const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
			await writeFile(tmp, encoded);
			await rename(tmp, file);
		}
		await moveDirectory(newDir, oldDir);
	} catch (error) {
		logger.warn(`dsh-session-enhance: rollback of physical session move failed: ${String(error)}`);
	}
}
/**
 * 物理移动一个会话的转录目录并同步改写工件 header 的 cwd。
 * @param persistence - 会话持久化服务（需 expose locate / readRaw / prepare）。
 * @param sessionId - 会话 id。
 * @param header - 当前会话 header（旧 cwd）。
 * @param newCwd - 目标工作区路径。
 * @param logger - 日志句柄。
 * @returns `{ moved, reason?, oldDir?, newDir? }`；未移动时 reason 为
 *   `same-directory` 或 `missing-transcript`（幂等）。
 * @throws 移动或改写失败（已尽力回滚；调用方记账未动，可重试）。
 */
async function physicallyMoveSession(persistence, sessionId, header, newCwd, logger) {
	if (persistence === void 0 || typeof persistence.locate !== "function" || typeof persistence.readRaw !== "function") {
		throw new Error(`cannot physically move session "${sessionId}": session persistence does not expose raw artifact relocation (locate/readRaw)`);
	}
	const oldLocation = persistence.locate(header);
	const oldDir = dirname(oldLocation.path);
	const newLocation = persistence.locate({ ...header, cwd: newCwd });
	const newDir = dirname(newLocation.path);
	if (oldDir === newDir) return { moved: false, reason: "same-directory" };
	if (!existsSync(oldDir)) return { moved: false, reason: "missing-transcript" };
	await mkdir(dirname(newDir), { recursive: true });
	await moveDirectory(oldDir, newDir);
	// 目录搬移会把共享会话根下其他编码实例遗留的相反编码工件（如明文
	// session.jsonl）一并带进来；先清理再读取改写，避免严格读取器 500。
	await removeOppositeArtifacts(newDir, newLocation.path, logger);
	let originalText = null;
	try {
		originalText = await rewriteHeaderCwd(persistence, sessionId, newLocation.path, newCwd);
		const verified = await persistence.readRaw(sessionId);
		// 真实后端（dsh-session-persistence-jsonl）的 readRaw 返回 `{ meta, content }`，
		// 参考实现的 fake 返回 `{ header, content }`；两种形态都接受。
		const verifiedHeader = verified === void 0 ? void 0 : (verified.meta ?? verified.header);
		if (verifiedHeader === void 0 || verifiedHeader.cwd !== newCwd) {
			throw new Error(`session "${sessionId}" header verification failed after physical move`);
		}
	} catch (error) {
		await restoreSessionArtifact(newLocation.path, oldDir, newDir, originalText, logger);
		throw error;
	}
	// 让持久化协调器以新 cwd 重新落定内存状态（states.meta），并顺带校验工件可读。
	try {
		const preparation = await persistence.prepare(sessionId);
		preparation?.[Symbol.dispose]?.();
	} catch (error) {
		logger.warn(`dsh-session-enhance: session "${sessionId}" physically moved, but persistence state refresh failed: ${String(error)}`);
	}
	return { moved: true, oldDir, newDir };
}
//#endregion
export { physicallyMoveSession };
