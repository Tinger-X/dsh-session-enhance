import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTree, closedTurns, emptySidecar, parseLog, serializeLog } from "../lib/tree-model.js";

function makeTurn(turn, text, baseSeq) {
	return [
		{ type: "turn/start", seq: baseSeq, time: 0, data: { turn } },
		{ type: "user/message", seq: baseSeq + 1, time: 0, data: { content: [{ type: "text", text }], source: { kind: "user" } } },
		{ type: "assistant/message", seq: baseSeq + 2, time: 0, data: { turn, step: 1, message: { role: "assistant", content: [{ type: "text", text: "reply" }] } } },
		{ type: "turn/end", seq: baseSeq + 3, time: 0, data: { turn } }
	];
}

test("parseLog/serializeLog round-trips header and events with normalized seq", () => {
	const text = `${JSON.stringify({ type: "session", id: "s1" })}\n${JSON.stringify({ type: "turn/start", seq: 99, data: { turn: 1 } })}\n`;
	const { header, events } = parseLog(text);
	assert.equal(header.id, "s1");
	assert.equal(events.length, 1);
	assert.equal(events[0].seq, 0);
	const normalized = `${JSON.stringify({ type: "session", id: "s1" })}\n${JSON.stringify({ type: "turn/start", seq: 0, data: { turn: 1 } })}\n`;
	assert.equal(serializeLog(header, events), normalized);
});

test("closedTurns splits multiple user turns and extracts user text", () => {
	const events = [...makeTurn(1, "你好", 0), ...makeTurn(2, "第二问", 4)];
	const turns = closedTurns(events);
	assert.equal(turns.length, 2);
	assert.equal(turns[0].userText, "你好");
	assert.equal(turns[0].startSeq, 0);
	assert.equal(turns[0].endSeq, 3);
	assert.equal(turns[1].userText, "第二问");
});

test("buildTree on a branchless session degrades to a single chain", () => {
	const events = [...makeTurn(1, "A", 0), ...makeTurn(2, "B", 4)];
	const tree = buildTree(events, emptySidecar("s1"));
	assert.equal(tree.nodes.length, 2);
	assert.deepEqual(tree.activePath, ["root:1", "root:2"]);
	assert.equal(Object.keys(tree.branchPoints).length, 0);
	assert.equal(tree.nodes[0].active, true);
});

test("buildTree projects forks from detached branch segments", () => {
	const activeEvents = [...makeTurn(1, "A1", 0), ...makeTurn(2, "A2", 4)];
	const sidecar = {
		version: 1,
		sessionId: "s1",
		activeBranchId: "root",
		branches: [
			{ id: "root", parentBranchId: null, forkDepth: 0, name: "主分支", createdAt: 0 },
			{ id: "b2", parentBranchId: "root", forkDepth: 1, name: "分支 2", createdAt: 1 }
		],
		detached: [{ branchId: "b2", events: makeTurn(2, "B2", 4), createdAt: 1 }]
	};
	const tree = buildTree(activeEvents, sidecar);
	const ids = tree.nodes.map((node) => node.id);
	assert.deepEqual(ids, ["root:1", "root:2", "b2:2"]);
	// 分支切换控件应挂在分叉的实际子节点（depth = forkDepth + 1），而非父节点。
	assert.equal(tree.branchPoints["root:1"], void 0, "parent should not be a branch point");
	const rootFork = tree.branchPoints["root:2"];
	assert.ok(rootFork, "fork point at root:2");
	assert.equal(rootFork.options.length, 2);
	assert.equal(rootFork.options[0].branchId, "root");
	assert.equal(rootFork.options[0].active, true);
	assert.equal(rootFork.options[1].branchId, "b2");
	assert.equal(rootFork.options[1].active, false);
	assert.equal(rootFork.current, 0);
	const altFork = tree.branchPoints["b2:2"];
	assert.ok(altFork, "fork point at b2:2");
	assert.equal(altFork.current, 1);
	assert.equal(altFork.options[0].branchId, "root");
	assert.equal(altFork.options[0].active, false);
	assert.equal(altFork.options[1].branchId, "b2");
	assert.equal(altFork.options[1].active, true);
});

test("buildTree structure stays fixed across an active-branch switch (only highlight moves)", () => {
	// root 活动：主干 = A1,A2；b2 在 depth 1 分叉，游离段 = B2。
	const activeEvents = [...makeTurn(1, "A1", 0), ...makeTurn(2, "A2", 4)];
	const sidecarRootActive = {
		version: 1,
		sessionId: "s1",
		activeBranchId: "root",
		branches: [
			{ id: "root", parentBranchId: null, forkDepth: 0, name: "主分支", createdAt: 0 },
			{ id: "b2", parentBranchId: "root", forkDepth: 1, name: "分支 2", createdAt: 1 }
		],
		detached: [{ branchId: "b2", events: makeTurn(2, "B2", 4), createdAt: 1 }]
	};
	const rootTree = buildTree(activeEvents, sidecarRootActive);

	// b2 活动：主干 = root 的 turn 1（共享前缀）+ b2 的 turn 2；root 退为游离段（全长 root 事件）。
	const b2TrunkEvents = [...makeTurn(1, "A1", 0), ...makeTurn(2, "B2", 4)];
	const sidecarB2Active = {
		version: 1,
		sessionId: "s1",
		activeBranchId: "b2",
		branches: [
			{ id: "root", parentBranchId: null, forkDepth: 0, name: "主分支", createdAt: 0 },
			{ id: "b2", parentBranchId: "root", forkDepth: 1, name: "分支 2", createdAt: 1 }
		],
		detached: [{ branchId: "root", events: [...makeTurn(1, "A1", 0), ...makeTurn(2, "A2", 4)], createdAt: 0 }]
	};
	const b2Tree = buildTree(b2TrunkEvents, sidecarB2Active);

	// 节点集合稳定：同样的 id（含 branchId 归属），同样的 parentId 拓扑。
	// （数组顺序不参与比较——渲染按 branchId 列 + depth 定位，与 nodes 顺序无关。）
	const rootById = new Map(rootTree.nodes.map((n) => [`${n.id}@${n.branchId}`, n.parentId]));
	const b2ById = new Map(b2Tree.nodes.map((n) => [`${n.id}@${n.branchId}`, n.parentId]));
	assert.deepEqual([...rootById.keys()].sort(), [...b2ById.keys()].sort(), "node set + branch ownership must be identical across active-branch switch");
	assert.deepEqual(rootById, b2ById, "node topology (parentId) must be identical across switch");

	// 仅活动路径（高亮）改变。
	assert.deepEqual(rootTree.activePath, ["root:1", "root:2"], "root-active highlight on root path");
	assert.deepEqual(b2Tree.activePath, ["root:1", "b2:2"], "b2-active highlight crosses onto b2");
});

