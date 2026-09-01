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
	const fork = tree.branchPoints["root:1"];
	assert.ok(fork, "fork point at root:1");
	assert.equal(fork.options.length, 2);
	assert.equal(fork.options[0].branchId, "root");
	assert.equal(fork.options[0].active, true);
	assert.equal(fork.options[1].branchId, "b2");
	assert.equal(fork.options[1].active, false);
	assert.equal(fork.current, 0);
});
