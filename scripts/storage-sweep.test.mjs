import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
	serializeUnit,
	storageFileHasTraces,
	storageRootHasTraces,
	stripSessionTraces,
	sweepStorageFile,
	sweepStorageRoot
} from "../lib/storage-sweep.js";

const SID = "session-0db89bc7-c887-4eb8-b974-aab495c5c152";
const OTHER = "session-other-0000-0000-0000-000000000000";

function quietLogger() {
	return { warn() {}, info() {} };
}

test("stripSessionTraces: removes id from arrays and object keys, keeps the rest", () => {
	const unit = {
		global: {
			initialized: true,
			archivedSessionIds: [SID, OTHER, SID]
		},
		tables: {
			workspaces: {
				ws1: { sessionIds: [OTHER, SID] },
				ws2: { sessionIds: [OTHER] }
			},
			sessions: {
				[SID]: { identity: { createdAt: 1 } },
				[OTHER]: { identity: { createdAt: 2 } }
			}
		}
	};
	const next = stripSessionTraces(unit, SID);
	assert.notEqual(next, unit, "structure changed, reference must differ");
	assert.deepEqual(next.global.archivedSessionIds, [OTHER]);
	assert.deepEqual(next.tables.workspaces.ws1.sessionIds, [OTHER]);
	assert.deepEqual(next.tables.workspaces.ws2.sessionIds, [OTHER]);
	assert.equal(next.tables.sessions[SID], undefined);
	assert.ok(next.tables.sessions[OTHER], "unrelated session row must survive");
	assert.equal(next.tables.workspaces.ws2, unit.tables.workspaces.ws2, "unchanged subtree keeps identity");
});

test("stripSessionTraces: returns same reference when nothing matches", () => {
	const unit = { global: { archivedSessionIds: [OTHER] }, tables: { workspaces: { ws: { sessionIds: [OTHER] } } } };
	assert.equal(stripSessionTraces(unit, SID), unit);
});

test("stripSessionTraces: handles scalars and nested arrays", () => {
	assert.equal(stripSessionTraces(42, SID), 42);
	assert.equal(stripSessionTraces(null, SID), null);
	assert.deepEqual(stripSessionTraces([SID, [SID, OTHER], "x"], SID), [[OTHER], "x"]);
});

test("sweepStorageFile: rewrites file atomically and removes all traces", async () => {
	const dir = await mkdtemp(join(tmpdir(), "sm-sweep-"));
	try {
		const file = join(dir, "workspace.json");
		await writeFile(file, JSON.stringify({
			unit: { name: "workspace", version: 2 },
			global: { archivedSessionIds: [SID, OTHER] },
			tables: { workspaces: { ws: { sessionIds: [SID] } } }
		}, null, 2) + "\n");
		const rewritten = await sweepStorageFile(file, SID, quietLogger());
		assert.equal(rewritten, true);
		const disk = JSON.parse(await readFile(file, "utf8"));
		assert.deepEqual(disk.global.archivedSessionIds, [OTHER]);
		assert.deepEqual(disk.tables.workspaces.ws.sessionIds, []);
		// 序列化格式与 dsh-storage-json 一致：2 空格缩进 + 结尾换行
		assert.equal((await readFile(file, "utf8")).endsWith("\n"), true);
		assert.equal(await storageFileHasTraces(file, SID), false);
		// 再次清扫无变化：不写盘
		const before = await readFile(file, "utf8");
		const again = await sweepStorageFile(file, SID, quietLogger());
		assert.equal(again, false);
		assert.equal(await readFile(file, "utf8"), before);
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
});

test("sweepStorageFile: tolerates missing file and malformed JSON", async () => {
	const dir = await mkdtemp(join(tmpdir(), "sm-sweep-"));
	try {
		const missing = join(dir, "nope.json");
		assert.equal(await sweepStorageFile(missing, SID, quietLogger()), false);
		const broken = join(dir, "broken.json");
		await writeFile(broken, "{ not json !!!");
		assert.equal(await sweepStorageFile(broken, SID, quietLogger()), false);
		assert.equal(await readFile(broken, "utf8"), "{ not json !!!", "malformed file untouched");
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
});

test("sweepStorageRoot: sweeps every *.json and ignores non-json", async () => {
	const dir = await mkdtemp(join(tmpdir(), "sm-sweep-"));
	try {
		const a = join(dir, "workspace.json");
		const b = join(dir, "session_projcache.json");
		const c = join(dir, "readme.txt");
		await writeFile(a, serializeUnit({ global: { archivedSessionIds: [SID] } }));
		await writeFile(b, serializeUnit({ tables: { sessions: { [SID]: { rows: {} } } } }));
		await writeFile(c, `session ${SID} mentioned in prose`);
		const rewritten = await sweepStorageRoot(dir, SID, quietLogger());
		assert.deepEqual(rewritten.sort(), [a, b].sort());
		assert.equal(await storageFileHasTraces(a, SID), false);
		assert.equal(await storageFileHasTraces(b, SID), false);
		assert.deepEqual(await storageRootHasTraces(dir, SID), []);
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
});

test("sweepStorageRoot: missing root degrades to warning", async () => {
	const dir = join(tmpdir(), "sm-sweep-does-not-exist-" + Date.now());
	assert.deepEqual(await sweepStorageRoot(dir, SID, quietLogger()), []);
	assert.deepEqual(await storageRootHasTraces(dir, SID), []);
});
