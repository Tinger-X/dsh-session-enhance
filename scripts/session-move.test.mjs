import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import { zstdCompress, zstdDecompress } from "node:zlib";
import { physicallyMoveSession } from "../lib/session-move.js";
import { CHECKSUM_OPTIONS, ZSTD_MAGIC } from "../lib/shared/constants.js";

const SID = "session-0db89bc7-c887-4eb8-b974-aab495c5c152";
const OLD_CWD = "D:/proj/alpha";
const NEW_CWD = "D:/proj/beta";

const zstdCompressAsync = promisify(zstdCompress);
const zstdDecompressAsync = promisify(zstdDecompress);

function quietLogger() {
	return { warn() {}, info() {} };
}

/** 与后端一致的简化 projectKey：分隔符/冒号 → `-`，包 `--...--`。 */
function projectKey(cwd) {
	if (!cwd) return "_no-cwd";
	let readable = "";
	let separatorRun = false;
	for (const ch of cwd) {
		if (ch === "/" || ch === "\\" || ch === ":") {
			if (!separatorRun) readable += "-";
			separatorRun = true;
		} else {
			readable += ch;
			separatorRun = false;
		}
	}
	return `--${(readable.replace(/^-+/, "") || "root").slice(0, 251)}--`;
}

async function findSessionDir(root, id) {
	const projects = await readdir(root, { withFileTypes: true }).catch(() => []);
	for (const project of projects) {
		if (!project.isDirectory()) continue;
		const dir = join(root, project.name, id);
		if (existsSync(dir)) return dir;
	}
	return void 0;
}

/** 精简版后端 scanZstdFrames：只返回第一个完整帧的结束偏移。 */
function firstFrameEnd(buffer) {
	let offset = 0;
	if (buffer.length - offset < 4 || buffer.readUInt32LE(offset) !== ZSTD_MAGIC) {
		throw new Error("corrupt Zstandard session log: invalid frame magic");
	}
	offset += 4;
	const descriptor = buffer.readUInt8(offset);
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
		if (buffer.length - offset < 3) throw new Error("corrupt Zstandard session log: truncated block header");
		const blockHeader = buffer.readUIntLE(offset, 3);
		offset += 3;
		const lastBlock = (blockHeader & 1) !== 0;
		const blockType = blockHeader >>> 1 & 3;
		const blockSize = blockHeader >>> 3;
		if (blockType === 3) throw new Error("corrupt Zstandard session log: reserved block type");
		offset += blockType === 1 ? 1 : blockSize;
		if (lastBlock) break;
	}
	if (checksum) {
		if (buffer.length - offset < 4) throw new Error("corrupt Zstandard session log: truncated checksum");
		offset += 4;
	}
	return offset;
}

/**
* 与后端 encodeMaterialization 一致的编码：zstd 工件由多个独立帧组成，
* **第一帧恰好是 header 一行**，事件行放入后续帧。
*/
async function encodeArtifact(text, plain) {
	if (plain) return Buffer.from(text, "utf8");
	const newline = text.indexOf("\n");
	const headerLine = newline === -1 ? text : text.slice(0, newline + 1);
	const rest = newline === -1 ? "" : text.slice(newline + 1);
	const frames = [await zstdCompressAsync(Buffer.from(headerLine, "utf8"), CHECKSUM_OPTIONS)];
	if (rest.length > 0) frames.push(await zstdCompressAsync(Buffer.from(rest, "utf8"), CHECKSUM_OPTIONS));
	return Buffer.concat(frames);
}

/** 与后端 readRaw 一致：逐帧解码后拼接全文。 */
async function decodeArtifact(buffer, plain) {
	if (plain) return buffer.toString("utf8");
	const parts = [];
	let offset = 0;
	while (offset < buffer.length) {
		const end = offset + firstFrameEnd(buffer.subarray(offset));
		parts.push(await zstdDecompressAsync(buffer.subarray(offset, end)));
		offset = end;
	}
	return Buffer.concat(parts).toString("utf8");
}

/**
* 与后端 list() 的 readFirstZstdLine 一致的严格读取：第一帧必须恰好是
* header 一行，否则视为损坏（后端会抛 corrupt ... first frame is not
* exactly one header line，进而让 session.list 整体 500）。
*/
async function assertStrictlyReadable(file) {
	const buffer = await readFile(file);
	if (file.endsWith(".zstd")) {
		const end = firstFrameEnd(buffer);
		const plaintext = await zstdDecompressAsync(buffer.subarray(0, end));
		if (plaintext.length === 0 || plaintext.indexOf(10) !== plaintext.length - 1) {
			throw new Error(`corrupt Zstandard session log: first frame is not exactly one header line (${file})`);
		}
	}
	return buffer;
}

/** 文件系统支撑的 fake 持久化：locate/readRaw/prepare，zstd 或明文工件。 */
function makePersistence(root, { plain = false, failVerifyId = null, readRawShape = "header" } = {}) {
	const calls = { prepare: [] };
	const artifactName = plain ? "session.jsonl" : "session.jsonl.zstd";
	return {
		calls,
		artifactName,
		readCount: 0,
		locate(meta) {
			return { kind: "jsonl", path: join(root, projectKey(meta.cwd), meta.id, artifactName) };
		},
		async readRaw(id) {
			this.readCount += 1;
			const dir = await findSessionDir(root, id);
			if (dir === void 0) return void 0;
			const content = await decodeArtifact(await readFile(join(dir, artifactName)), plain);
			let header = null;
			try {
				header = JSON.parse(content.slice(0, content.indexOf("\n")));
			} catch {
				header = null;
			}
			// 只在第二次读取（移动后验证）时撒谎，模拟改写未生效。
			if (failVerifyId === id && this.readCount === 2) header = { ...header, cwd: "WRONG-VERIFY" };
			// 真实后端（dsh-session-persistence-jsonl）返回 `{ meta, content }`；
			// 参考实现的 fake 返回 `{ header, content }`。两种形态都要支持。
			return readRawShape === "meta"
				? { content, meta: header }
				: { content, header };
		},
		async prepare(id) {
			calls.prepare.push(id);
			return { [Symbol.dispose]() {} };
		}
	};
}

function header(cwd) {
	return { type: "session", version: 1, id: SID, createdAt: 1787542288340, cwd, title: "T" };
}

async function writeArtifact(persistence, dir, text) {
	await mkdir(dir, { recursive: true });
	const plain = !persistence.artifactName.endsWith(".zstd");
	await writeFile(join(dir, persistence.artifactName), await encodeArtifact(text, plain));
}

const SAMPLE_TEXT = (cwd) => `${JSON.stringify(header(cwd))}\n${JSON.stringify({ type: "user/message", seq: 1, data: {} })}\n${JSON.stringify({ type: "assistant/message", seq: 2, data: {} })}\n`;

test("physicallyMoveSession: moves transcript dir and rewrites header cwd", async () => {
	const root = await mkdtemp(join(tmpdir(), "sm-move-"));
	try {
		const persistence = makePersistence(root);
		const oldDir = join(root, projectKey(OLD_CWD), SID);
		await writeArtifact(persistence, oldDir, SAMPLE_TEXT(OLD_CWD));
		const outcome = await physicallyMoveSession(persistence, SID, header(OLD_CWD), NEW_CWD, quietLogger());
		assert.equal(outcome.moved, true);
		assert.equal(existsSync(oldDir), false, "old transcript dir removed");
		const newDir = join(root, projectKey(NEW_CWD), SID);
		assert.equal(existsSync(newDir), true, "new transcript dir exists");
		const raw = await persistence.readRaw(SID);
		assert.equal(raw.header.cwd, NEW_CWD, "artifact header cwd rewritten");
		assert.ok(raw.content.includes('"type":"user/message"'), "event lines preserved");
		assert.ok(raw.content.includes('"type":"assistant/message"'), "event lines preserved");
		assert.deepEqual(persistence.calls.prepare, [SID], "coordinator state refresh ran");
		// 后端 list()/prepare() 的严格读取必须仍然通过（第一帧恰好是 header 一行）。
		const movedArtifact = join(newDir, persistence.artifactName);
		await assertStrictlyReadable(movedArtifact);
		const firstLine = (await decodeArtifact(await readFile(movedArtifact), false)).split("\n", 1)[0];
		assert.ok(JSON.parse(firstLine).cwd === NEW_CWD, "strict reader sees the rewritten cwd");
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test("physicallyMoveSession: accepts the real backend readRaw shape ({ meta, content })", async () => {
	const root = await mkdtemp(join(tmpdir(), "sm-move-"));
	try {
		const persistence = makePersistence(root, { readRawShape: "meta" });
		const oldDir = join(root, projectKey(OLD_CWD), SID);
		await writeArtifact(persistence, oldDir, SAMPLE_TEXT(OLD_CWD));
		const outcome = await physicallyMoveSession(persistence, SID, header(OLD_CWD), NEW_CWD, quietLogger());
		assert.equal(outcome.moved, true, "verification must pass with the real backend shape");
		const newDir = join(root, projectKey(NEW_CWD), SID);
		await assertStrictlyReadable(join(newDir, persistence.artifactName));
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test("physicallyMoveSession: same-directory and missing-transcript are idempotent no-ops", async () => {
	const root = await mkdtemp(join(tmpdir(), "sm-move-"));
	try {
		const persistence = makePersistence(root);
		const same = await physicallyMoveSession(persistence, SID, header(OLD_CWD), OLD_CWD, quietLogger());
		assert.deepEqual(same, { moved: false, reason: "same-directory" });
		const missing = await physicallyMoveSession(persistence, SID, header(OLD_CWD), NEW_CWD, quietLogger());
		assert.deepEqual(missing, { moved: false, reason: "missing-transcript" });
		assert.deepEqual(persistence.calls.prepare, [], "no refresh for no-ops");
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test("physicallyMoveSession: verification failure rolls back dir and header (artifact stays strictly readable)", async () => {
	const root = await mkdtemp(join(tmpdir(), "sm-move-"));
	try {
		const persistence = makePersistence(root, { failVerifyId: SID });
		const oldDir = join(root, projectKey(OLD_CWD), SID);
		await writeArtifact(persistence, oldDir, SAMPLE_TEXT(OLD_CWD));
		await assert.rejects(
			physicallyMoveSession(persistence, SID, header(OLD_CWD), NEW_CWD, quietLogger()),
			/header verification failed/
		);
		const newDir = join(root, projectKey(NEW_CWD), SID);
		assert.equal(existsSync(newDir), false, "new dir rolled back");
		assert.equal(existsSync(oldDir), true, "old dir restored");
		const raw = await persistence.readRaw(SID);
		assert.equal(raw.header.cwd, OLD_CWD, "original header restored");
		assert.ok(raw.content.includes('"type":"assistant/message"'), "events intact after rollback");
		// 回滚后的工件也必须保持后端帧布局（否则 session.list 500）。
		await assertStrictlyReadable(join(oldDir, persistence.artifactName));
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test("physicallyMoveSession: plaintext artifact (no zstd) works", async () => {
	const root = await mkdtemp(join(tmpdir(), "sm-move-"));
	try {
		const persistence = makePersistence(root, { plain: true });
		const oldDir = join(root, projectKey(OLD_CWD), SID);
		await writeArtifact(persistence, oldDir, SAMPLE_TEXT(OLD_CWD));
		const outcome = await physicallyMoveSession(persistence, SID, header(OLD_CWD), NEW_CWD, quietLogger());
		assert.equal(outcome.moved, true);
		const raw = await persistence.readRaw(SID);
		assert.equal(raw.header.cwd, NEW_CWD);
		assert.equal(existsSync(join(root, projectKey(OLD_CWD), SID)), false);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test("physicallyMoveSession: persistence without raw artifacts refuses loudly", async () => {
	const root = await mkdtemp(join(tmpdir(), "sm-move-"));
	try {
		const bare = { locate() { return { path: join(root, "x", SID, "session.jsonl.zstd") }; } };
		await assert.rejects(
			physicallyMoveSession(bare, SID, header(OLD_CWD), NEW_CWD, quietLogger()),
			/does not expose raw artifact relocation/
		);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test("physicallyMoveSession: removes opposite-encoding artifacts carried into the moved directory", async () => {
	const root = await mkdtemp(join(tmpdir(), "sm-move-"));
	try {
		const persistence = makePersistence(root);
		const oldDir = join(root, projectKey(OLD_CWD), SID);
		await writeArtifact(persistence, oldDir, SAMPLE_TEXT(OLD_CWD));
		// 模拟共享会话根下另一编码实例遗留的明文工件（zstd 后端的相反编码）。
		const foreign = join(oldDir, "session.jsonl");
		await writeFile(foreign, SAMPLE_TEXT(OLD_CWD));
		const outcome = await physicallyMoveSession(persistence, SID, header(OLD_CWD), NEW_CWD, quietLogger());
		assert.equal(outcome.moved, true);
		const newDir = join(root, projectKey(NEW_CWD), SID);
		assert.equal(existsSync(newDir), true, "new transcript dir exists");
		assert.equal(existsSync(join(newDir, "session.jsonl")), false, "opposite-encoding artifact removed after the move");
		assert.equal(existsSync(join(newDir, persistence.artifactName)), true, "canonical artifact preserved");
		const raw = await persistence.readRaw(SID);
		assert.equal(raw.header.cwd, NEW_CWD, "artifact header cwd rewritten");
		await assertStrictlyReadable(join(newDir, persistence.artifactName));
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});
