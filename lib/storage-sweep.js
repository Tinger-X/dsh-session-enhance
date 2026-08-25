//#region lib/types/storage-sweep.js
/**
 * dsh-session-enhance 物理删除的磁盘清扫层。
 *
 * 服务层（工作区注册表 / 投影缓存）通过 storage-domain 的内存 + 写链
 * 移除会话的记账痕迹，最终落盘到 `~/storages/*.json`。本模块在服务层
 * 写链全部落定之后，直接对磁盘上的 `storages/*.json` 做一次全量清扫：
 *
 * - 读取每个 `*.json` 单元文件（workspace.json、session_projcache.json
 *   以及将来任何新存储单元）；
 * - 递归移除目标 sessionId 的全部痕迹：数组中的元素（archivedSessionIds、
 *   各工作区的 sessionIds）、对象键（tables.sessions[sessionId]）；
 * - 仅当内容发生变化时才原子写回（临时文件 + rename），未变化不触碰
 *   文件，避免无谓的 mtime 抖动与磁盘写放大；
 * - 所有失败都降级为日志告警：服务层内存状态已经是权威，清扫只是
 *   磁盘一致性兜底，绝不因清扫失败而回滚已提交的删除。
 *
 * 这样即使任何一层（批量写、崩溃、第三方直写）在删除后把旧行写回，
 * 下一次清扫也会把磁盘文件修正为不含该会话的状态。
 */
import { readdir, readFile, writeFile, rename, rm } from "node:fs/promises";
import { join } from "node:path";
/** 序列化格式与 dsh-storage-json 后端保持一致：2 空格缩进 + 结尾换行。 */
function serializeUnit(unit) {
	return `${JSON.stringify(unit, null, 2)}\n`;
}
/**
 * 递归移除结构中 sessionId 的全部痕迹。
 *
 * - 数组：过滤掉等于 sessionId 的元素，并递归处理其余元素；
 * - 对象：删除键恰为 sessionId 的条目，并递归处理其余值；
 * - 其余类型原样返回。
 *
 * 未发生任何变化时返回原引用（`===` 相等），调用方据此跳过写盘。
 * @param {unknown} value - 待清扫的结构（存储单元根）。
 * @param {string} sessionId - 目标会话 id。
 * @returns 清扫后的结构；无变化时返回原引用。
 */
function stripSessionTraces(value, sessionId) {
	if (Array.isArray(value)) {
		let changed = false;
		const next = [];
		for (const item of value) {
			if (item === sessionId) {
				changed = true;
				continue;
			}
			const cleaned = stripSessionTraces(item, sessionId);
			if (cleaned !== item) changed = true;
			next.push(cleaned);
		}
		return changed ? next : value;
	}
	if (typeof value === "object" && value !== null) {
		let changed = false;
		const next = {};
		for (const [key, item] of Object.entries(value)) {
			if (key === sessionId) {
				changed = true;
				continue;
			}
			const cleaned = stripSessionTraces(item, sessionId);
			if (cleaned !== item) changed = true;
			next[key] = cleaned;
		}
		return changed ? next : value;
	}
	return value;
}
/**
 * 清扫单个存储单元文件：移除 sessionId 的全部痕迹并原子写回。
 * 文件不存在、不可读、非法 JSON 或写回失败都只记录告警，不抛错。
 * @param {string} file - `storages` 目录下的 `*.json` 文件绝对路径。
 * @param {string} sessionId - 目标会话 id。
 * @param {Pick<{ logger: { warn: (msg: string) => void; info: (msg: string) => void } }, "logger">} logger - 日志句柄（上下文 logger 的窄面）。
 * @returns 清扫是否实际写回了文件。
 */
async function sweepStorageFile(file, sessionId, logger) {
	let raw;
	try {
		raw = await readFile(file, "utf8");
	} catch (error) {
		logger.warn(`dsh-session-enhance: could not read storage file "${file}" for sweep: ${String(error)}`);
		return false;
	}
	let unit;
	try {
		unit = JSON.parse(raw);
	} catch (error) {
		// 非法 JSON：不覆盖文件（可能正在被写），服务层已移除内存痕迹，
		// 这里只告警，留给下次删除或人工修复。
		logger.warn(`dsh-session-enhance: storage file "${file}" is not valid JSON, skipping direct sweep: ${String(error)}`);
		return false;
	}
	const next = stripSessionTraces(unit, sessionId);
	if (next === unit) return false;
	const serialized = serializeUnit(next);
	const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
	try {
		await writeFile(tmp, serialized, "utf8");
		await rename(tmp, file);
		logger.info(`dsh-session-enhance: physically removed all traces of "${sessionId}" from ${file}`);
		return true;
	} catch (error) {
		await rm(tmp, { force: true }).catch(() => {});
		logger.warn(`dsh-session-enhance: could not rewrite storage file "${file}" (traces of "${sessionId}" remain on disk): ${String(error)}`);
		return false;
	}
}
/**
 * 清扫整个 `~/storages` 目录：遍历所有 `*.json` 单元文件逐一清扫。
 * 目录不存在或不可枚举时只告警，不抛错。
 * @param {string} root - `storages` 目录绝对路径（由调用方用
 *   `@deepseek-ai/dsh-home-paths` 的 `dshHomePath("storages")` 解析）。
 * @param {string} sessionId - 目标会话 id。
 * @param {*} logger - 日志句柄。
 * @returns 被实际改写过的文件路径列表。
 */
async function sweepStorageRoot(root, sessionId, logger) {
	let entries;
	try {
		entries = await readdir(root, { withFileTypes: true });
	} catch (error) {
		logger.warn(`dsh-session-enhance: storages root "${root}" is not enumerable, skipping direct sweep: ${String(error)}`);
		return [];
	}
	const rewritten = [];
	for (const entry of entries) {
		if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
		const file = join(root, entry.name);
		if (await sweepStorageFile(file, sessionId, logger)) rewritten.push(file);
	}
	return rewritten;
}
/**
 * 校验一个存储单元文件中是否仍残留 sessionId 痕迹（供删除后验证）。
 * @param {string} file - 存储单元文件绝对路径。
 * @param {string} sessionId - 目标会话 id。
 * @returns 是否存在残留。
 */
async function storageFileHasTraces(file, sessionId) {
	try {
		const unit = JSON.parse(await readFile(file, "utf8"));
		return stripSessionTraces(unit, sessionId) !== unit;
	} catch {
		return false;
	}
}
/**
 * 校验整个 `storages` 目录是否仍残留 sessionId（供删除后验证）。
 * @param {string} root - `storages` 目录绝对路径。
 * @param {string} sessionId - 目标会话 id。
 * @returns 含残留的文件路径列表。
 */
async function storageRootHasTraces(root, sessionId) {
	let entries;
	try {
		entries = await readdir(root, { withFileTypes: true });
	} catch {
		return [];
	}
	const leftovers = [];
	for (const entry of entries) {
		if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
		const file = join(root, entry.name);
		if (await storageFileHasTraces(file, sessionId)) leftovers.push(file);
	}
	return leftovers;
}
//#endregion
export { serializeUnit, storageFileHasTraces, storageRootHasTraces, stripSessionTraces, sweepStorageFile, sweepStorageRoot };
