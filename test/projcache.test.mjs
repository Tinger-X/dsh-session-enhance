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
