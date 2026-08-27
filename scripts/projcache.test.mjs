// rehome 单元测试：物理移动后投影缓存行身份改写（保持行内容）。
import test from "node:test";
import assert from "node:assert/strict";
import { Context } from "@deepseek-ai/cordis";
import { SessionEnhanceProjectionCache } from "../lib/projcache.js";
import { SessionEnhanceWorkspaceRegistry } from "../lib/workspace.js";

const SID = "session-0db89bc7-c887-4eb8-b974-aab495c5c152";
const OLD_CWD = "D:/proj/alpha";
const NEW_CWD = "D:/proj/beta";
const CREATED_AT = 1787542288340;

const ROWS = {
	title: { ver: 1, seq: 42, val: "T" },
	sessionListMetadata: { ver: 1, seq: 42, val: { blank: false, lastPromptAt: 1787542288341 } }
};

/** 构造带假表（内存 Map）的投影缓存实例；requireTable 用实例覆盖。 */
function makeCache(initial) {
	const rows = new Map(Object.entries(initial ?? {}));
	const cache = new SessionEnhanceProjectionCache(new Context(), { writeEveryEvents: 200, writeIntervalMs: 5000 });
	cache.requireTable = () => ({
		get: (id) => rows.get(id),
		put: async (id, record) => {
			rows.set(id, record);
		},
		delete: async (id) => {
			rows.delete(id);
		}
	});
	return { cache, rows };
}

test("rehome: rewrites the record identity to the new cwd and preserves rows", async () => {
	const { cache, rows } = makeCache({
		[SID]: { identity: { createdAt: CREATED_AT, cwd: OLD_CWD }, rows: ROWS }
	});
	await cache.rehome(SID, { createdAt: CREATED_AT, cwd: NEW_CWD });
	const record = rows.get(SID);
	assert.deepEqual(record.identity, { createdAt: CREATED_AT, cwd: NEW_CWD });
	assert.deepEqual(record.rows, ROWS, "projection rows preserved (the log content is unchanged by the move)");
});

test("rehome: absent record is a no-op", async () => {
	const { cache, rows } = makeCache();
	await cache.rehome(SID, { createdAt: CREATED_AT, cwd: NEW_CWD });
	assert.equal(rows.size, 0);
});

test("rehome: identity without a stored cwd can be rehomed", async () => {
	const { cache, rows } = makeCache({
		[SID]: { identity: { createdAt: CREATED_AT }, rows: ROWS }
	});
	await cache.rehome(SID, { createdAt: CREATED_AT, cwd: NEW_CWD });
	assert.equal(rows.get(SID).identity.cwd, NEW_CWD);
	assert.deepEqual(rows.get(SID).rows, ROWS);
});

test("rehome: tracked in writeTail so whenIdle settles after it", async () => {
	const { cache } = makeCache({
		[SID]: { identity: { createdAt: CREATED_AT, cwd: OLD_CWD }, rows: ROWS }
	});
	await cache.rehome(SID, { createdAt: CREATED_AT, cwd: NEW_CWD });
	await cache.whenIdle();
	assert.ok(true, "whenIdle resolves after the rehome write");
});

/** 轻量注册表实例：只挂 ctx 存根，验证 moveSession 侧的接线顺序。 */
function makeRegistry(projCache) {
	const registry = Object.create(SessionEnhanceWorkspaceRegistry.prototype);
	registry.ctx = {
		get: (name) => name === "sessionProjectionCache" ? projCache : void 0,
		logger: { warn() {} }
	};
	return registry;
}

test("rehomeMovedSessionProjection: waits for in-flight writes, then rehomes with the new cwd identity", async () => {
	const calls = [];
	const projCache = {
		whenIdle: async () => {
			calls.push("whenIdle");
		},
		rehome: async (id, identity) => {
			calls.push(["rehome", id, identity]);
		}
	};
	await makeRegistry(projCache).rehomeMovedSessionProjection(SID, { createdAt: CREATED_AT, cwd: OLD_CWD }, NEW_CWD);
	assert.deepEqual(calls, ["whenIdle", ["rehome", SID, { createdAt: CREATED_AT, cwd: NEW_CWD }]]);
});

test("rehomeMovedSessionProjection: failures are contained (move already succeeded)", async () => {
	const projCache = {
		whenIdle: async () => {
			throw new Error("boom");
		},
		rehome: async () => {
			throw new Error("boom");
		}
	};
	await makeRegistry(projCache).rehomeMovedSessionProjection(SID, { createdAt: CREATED_AT, cwd: OLD_CWD }, NEW_CWD);
	assert.ok(true, "projection refresh failures must not fail the move");
});

test("rehomeMovedSessionProjection: absent projection-cache service is a no-op", async () => {
	await makeRegistry(void 0).rehomeMovedSessionProjection(SID, { createdAt: CREATED_AT, cwd: OLD_CWD }, NEW_CWD);
	assert.ok(true, "no crash when the cache service is unavailable");
});

test("disposeStaleAgent: disposes the stale agent bound to a detached session", async () => {
	const disposed = [];
	const agent = {
		dispose: async () => {
			disposed.push("disposed");
		}
	};
	const registry = Object.create(SessionEnhanceWorkspaceRegistry.prototype);
	registry.ctx = {
		get: (name) => name === "agents" ? { get: (id) => id === SID ? agent : void 0 } : void 0,
		logger: { warn() {} }
	};
	await registry.disposeStaleAgent(SID);
	assert.deepEqual(disposed, ["disposed"]);
});

test("disposeStaleAgent: dispose failures are contained (move/delete already committed)", async () => {
	const agent = {
		dispose: async () => {
			throw new Error("boom");
		}
	};
	const registry = Object.create(SessionEnhanceWorkspaceRegistry.prototype);
	registry.ctx = {
		get: (name) => name === "agents" ? { get: () => agent } : void 0,
		logger: { warn() {} }
	};
	await registry.disposeStaleAgent(SID);
	assert.ok(true, "stale-agent disposal failures must not fail the move");
});

test("disposeStaleAgent: no live agent is a no-op", async () => {
	const registry = Object.create(SessionEnhanceWorkspaceRegistry.prototype);
	registry.ctx = {
		get: () => void 0,
		logger: { warn() {} }
	};
	await registry.disposeStaleAgent(SID);
	assert.ok(true, "no crash when no agent exists");
});

/** 假投影缓存：内存 Map 支撑 requireTable().get 与 rehome（保持行内容）。 */
function fakeProjCache(initial) {
	const rows = new Map(Object.entries(initial ?? {}));
	return {
		rows,
		requireTable: () => ({ get: (id) => rows.get(id) }),
		rehome: async (id, identity) => {
			const record = rows.get(id);
			if (record === void 0) return;
			rows.set(id, { identity, rows: record.rows });
		}
	};
}

function makeReconcileRegistry(projCache) {
	const registry = Object.create(SessionEnhanceWorkspaceRegistry.prototype);
	registry.ctx = {
		get: (name) => name === "sessionProjectionCache" ? projCache : void 0,
		logger: { warn() {}, info() {} }
	};
	return registry;
}

test("reconcileMovedProjectionIdentities: rehomes a stale cwd to the physical header cwd", async () => {
	const projCache = fakeProjCache({
		[SID]: { identity: { createdAt: CREATED_AT, cwd: OLD_CWD }, rows: ROWS }
	});
	const rehomed = await makeReconcileRegistry(projCache).reconcileMovedProjectionIdentities([
		{ id: SID, createdAt: CREATED_AT, cwd: NEW_CWD }
	]);
	assert.deepEqual(rehomed, [SID]);
	assert.deepEqual(projCache.rows.get(SID).identity, { createdAt: CREATED_AT, cwd: NEW_CWD });
	assert.deepEqual(projCache.rows.get(SID).rows, ROWS, "rows preserved (log content unchanged)");
});

test("reconcileMovedProjectionIdentities: leaves a matching identity untouched", async () => {
	const projCache = fakeProjCache({
		[SID]: { identity: { createdAt: CREATED_AT, cwd: NEW_CWD }, rows: ROWS }
	});
	const rehomed = await makeReconcileRegistry(projCache).reconcileMovedProjectionIdentities([
		{ id: SID, createdAt: CREATED_AT, cwd: NEW_CWD }
	]);
	assert.deepEqual(rehomed, [], "no rehome when stored cwd already matches the header");
});

test("reconcileMovedProjectionIdentities: skips a different lifecycle (createdAt mismatch)", async () => {
	const projCache = fakeProjCache({
		[SID]: { identity: { createdAt: CREATED_AT, cwd: OLD_CWD }, rows: ROWS }
	});
	const rehomed = await makeReconcileRegistry(projCache).reconcileMovedProjectionIdentities([
		{ id: SID, createdAt: CREATED_AT + 1, cwd: NEW_CWD }
	]);
	assert.deepEqual(rehomed, [], "a recreated id (different createdAt) must not be rehomed");
	assert.equal(projCache.rows.get(SID).identity.cwd, OLD_CWD, "stale-lifecycle row left intact");
});

test("reconcileMovedProjectionIdentities: absent row is skipped (cold read rebuilds it)", async () => {
	const projCache = fakeProjCache();
	const rehomed = await makeReconcileRegistry(projCache).reconcileMovedProjectionIdentities([
		{ id: SID, createdAt: CREATED_AT, cwd: NEW_CWD }
	]);
	assert.deepEqual(rehomed, []);
	assert.equal(projCache.rows.size, 0);
});

test("reconcileMovedProjectionIdentities: absent projection-cache service returns []", async () => {
	const rehomed = await makeReconcileRegistry(void 0).reconcileMovedProjectionIdentities([
		{ id: SID, createdAt: CREATED_AT, cwd: NEW_CWD }
	]);
	assert.deepEqual(rehomed, []);
});

test("reconcileMovedProjectionIdentities: a header without a cwd rehomes to a cwd-less identity", async () => {
	const projCache = fakeProjCache({
		[SID]: { identity: { createdAt: CREATED_AT, cwd: OLD_CWD }, rows: ROWS }
	});
	const rehomed = await makeReconcileRegistry(projCache).reconcileMovedProjectionIdentities([
		{ id: SID, createdAt: CREATED_AT }
	]);
	assert.deepEqual(rehomed, [SID]);
	assert.deepEqual(projCache.rows.get(SID).identity, { createdAt: CREATED_AT }, "cwd dropped from identity when the header has none");
});

/** 直接构造实例（跳过字段初始化器）并注入桩 ctx，验证后台预热挑选逻辑。 */
function makeWarmCache({ list, rows = [], live = [], deleted = [], coldRead, coldSnapshot } = {}) {
	const cache = Object.create(SessionEnhanceProjectionCache.prototype);
	const rowSet = new Set(rows);
	const liveSet = new Set(live);
	cache.deletedSessionIds = new Set(deleted);
	cache.warmConcurrency = 2;
	cache.requireTable = () => ({ get: (id) => rowSet.has(id) ? {} : void 0 });
	cache.coldSnapshot = coldSnapshot ?? (async (id) => {
		coldRead?.push(id);
	});
	cache.ctx = {
		sessionPersistence: list === void 0 ? void 0 : { list: async () => list.map((id) => ({ id })) },
		get: (name) => name === "sessions" ? { get: (id) => liveSet.has(id) ? {} : void 0 } : void 0,
		logger: { info() {}, warn() {} }
	};
	return cache;
}

test("warmUncachedProjections: cold-reads only uncached, non-live, non-deleted sessions", async () => {
	const coldRead = [];
	const cache = makeWarmCache({
		list: ["has-row", "live-1", "dead-1", "cold-a", "cold-b"],
		rows: ["has-row"],
		live: ["live-1"],
		deleted: ["dead-1"],
		coldRead
	});
	await cache.warmUncachedProjections();
	assert.deepEqual(coldRead.sort(), ["cold-a", "cold-b"], "only sessions with no row, not live, not tombstoned are warmed");
});

test("warmUncachedProjections: one failing cold read does not abort the rest", async () => {
	const coldRead = [];
	const cache = makeWarmCache({
		list: ["boom", "ok-1", "ok-2"],
		coldRead,
		coldSnapshot: async (id) => {
			coldRead.push(id);
			if (id === "boom") throw new Error("cold-read blew up");
		}
	});
	await cache.warmUncachedProjections();
	assert.deepEqual(coldRead.sort(), ["boom", "ok-1", "ok-2"], "every candidate is attempted despite a failure");
});

test("warmUncachedProjections: absent persistence.list is a contained no-op", async () => {
	const coldRead = [];
	const cache = makeWarmCache({ list: void 0, coldRead });
	await cache.warmUncachedProjections();
	assert.deepEqual(coldRead, [], "nothing warmed and no throw when persistence cannot list");
});
