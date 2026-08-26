// 合并后客户端 bundle 冒烟测试：单一 load 注册、双半区 apply 均执行、
// inject 为并集、session-enhance __test 面保留。
import test from "node:test";
import assert from "node:assert/strict";

test("merged client bundle registers one factory and applies both halves", async () => {
	const registrations = [];
	globalThis.window = {
		__ModuleLoader__: {
			mode: "queue",
			pendingQueue: registrations,
			load(registration) {
				registrations.push(registration);
			},
			create() {
				throw new Error("create should not be called");
			}
		}
	};
	await import("../lib/client.js");

	assert.equal(registrations.length, 1);
	const registration = registrations[0];
	assert.equal(registration.id, "dsh-session-enhance");
	assert.equal(typeof registration.factory, "function");

	const stubModules = {
		"@deepseek-ai/dsh-client-runtime/client": {
			createSnapshotStore: () => ({
				getSnapshot: () => ({}),
				subscribe: () => () => {},
				update: () => {},
				set: () => {}
			}),
			defineStore: () => ({})
		},
		react: {},
		"react/jsx-runtime": { jsx: () => null, jsxs: () => null, Fragment: {} },
		"@deepseek-ai/dsh-client-ui-primitives": {}
	};
	const requireStub = (spec) => stubModules[spec] ?? {};
	const bundleExports = registration.factory(requireStub);

	assert.equal(typeof bundleExports.apply, "function");
	assert.ok(Array.isArray(bundleExports.inject));
	// 两个半区的服务注入并集。
	for (const id of ["slots", "sessions", "workspaces", "locale", "remote", "typert", "conversation", "connection"]) {
		assert.ok(bundleExports.inject.includes(id), `inject should include ${id}`);
	}
	// session-enhance 的测试面保留。
	assert.equal(typeof bundleExports.__test?.deriveGroups, "function");
	// message-edit 客户端的会话消失终态文案随 bundle 内联。
	assert.ok(registration.factory.toString().includes("会话不存在或已被删除。"));
	// 会话菜单的复制ID 词条随 bundle 内联。
	assert.ok(registration.factory.toString().includes('"menu.copySessionId": "复制ID"'));
	// 设置分区升级为「对话增强」二级菜单（基础设置 / 归档管理）随 bundle 内联。
	assert.ok(registration.factory.toString().includes('id: "conversation-enhance"'));
	assert.ok(registration.factory.toString().includes('"settings.manageTitle": "对话增强"'));
	assert.ok(registration.factory.toString().includes('"settings.basicTab": "基础设置"'));

	const registeredSlots = [];
	const ctx = {
		get(key) {
			if (key === "remote") return { $mount: async () => async () => {} };
			return undefined;
		},
		on() {},
		effect(fn) {
			return fn();
		},
		locale: {
			register() {},
			bind() {
				return () => "";
			}
		},
		slots: {
			register(spec) {
				registeredSlots.push(spec.name);
				return undefined;
			},
			inject() {},
			entries() {
				return [];
			},
			subscribe() {
				return () => {};
			}
		},
		sessions: {
			list: { getSnapshot: () => ({ byId: {}, ids: [] }), subscribe: () => () => {} },
			search: async () => ({ ok: true, value: { items: [], hasMore: false } }),
			binding: () => undefined,
			open() {},
			fork: async () => "",
			searchResultLimit: 50
		},
		workspaces: {
			list: { getSnapshot: () => ({ byId: {} }), subscribe: () => () => {} },
			startSession() {},
			rename: async () => {},
			delete: async () => {},
			insertBefore: async () => {},
			create() {},
			archiveSession: async () => {},
			insertSessionBefore: async () => {}
		},
		connection: {},
		conversation: {}
	};

	const disposer = await bundleExports.apply(ctx);
	assert.equal(typeof disposer, "function");
	await disposer();

	// message-edit 的两个插槽在 apply 时同步注册。
	assert.ok(registeredSlots.includes("conversation.view"), "message-edit timeline slot");
	assert.ok(registeredSlots.includes("conversation.session.header.actions"), "message-edit header slot");
});
