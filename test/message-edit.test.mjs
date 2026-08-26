// message-edit 宿主逻辑（合并进 dsh-session-enhance）的纯函数测试。
import test from "node:test";
import assert from "node:assert/strict";
import { __test } from "../lib/message-edit.js";

const { closedTurns, editableMessages, retryableTurns, editPlan, retryPlan, rerollPlan, decodeOperation, versionSeed, ownVersionEvent, MESSAGE_EDIT_VERSION_SCHEMA } = __test;

/** 构造一个完整落定回合的事件序列。 */
function turnEvents(turn, userText, assistantText, baseSeq = 0) {
	return [
		{ type: "turn/start", seq: baseSeq, time: 1, data: { turn } },
		{ type: "user/message", seq: baseSeq + 1, time: 2, data: { turn, source: { kind: "user" }, content: [{ type: "text", text: userText }] } },
		{ type: "step/start", seq: baseSeq + 2, time: 3, data: { turn, step: 1 } },
		{ type: "assistant/message", seq: baseSeq + 3, time: 4, data: { turn, step: 1, message: { id: `m${turn}`, role: "assistant", content: [{ type: "text", text: assistantText }], source: { kind: "model", provider: "p", model: "m" } } } },
		{ type: "step/end", seq: baseSeq + 4, time: 5, data: { turn, step: 1 } },
		{ type: "turn/end", seq: baseSeq + 5, time: 6, data: { turn, reason: { kind: "completed" } } }
	];
}

test("closedTurns folds complete turn brackets", () => {
	const events = [...turnEvents(1, "q1", "a1", 0), ...turnEvents(2, "q2", "a2", 6)];
	const turns = closedTurns(events);
	assert.equal(turns.length, 2);
	assert.equal(turns[0].turn, 1);
	assert.equal(turns[0].user.seq, 1);
	assert.equal(turns[0].assistants.length, 1);
	assert.equal(turns[1].turn, 2);
	assert.equal(turns[1].endSeq, 11);
});

test("editableMessages lists user and assistant text blocks", () => {
	const turns = closedTurns(turnEvents(1, "q1", "a1"));
	const messages = editableMessages(turns);
	assert.equal(messages.length, 2);
	assert.equal(messages[0].kind, "user");
	assert.equal(messages[0].text, "q1");
	assert.equal(messages[1].kind, "assistant.response");
	assert.equal(messages[1].text, "a1");
});

test("retryableTurns exposes user inputs of settled turns", () => {
	const turns = closedTurns(turnEvents(1, "q1", "a1"));
	const rows = retryableTurns(turns);
	assert.equal(rows.length, 1);
	assert.equal(rows[0].turn, 1);
	assert.equal(rows[0].preview, "q1");
});

test("editPlan truncate on a user block rewinds to the boundary", () => {
	const events = turnEvents(1, "q1", "a1");
	const plan = editPlan({ action: "edit", sessionId: "s", eventSeq: 1, blockIndex: 0, text: "q1x", cascade: "truncate" }, closedTurns(events));
	assert.equal(plan.boundary, -1);
	assert.equal(plan.version.effect.operation, "edit");
	assert.equal(plan.version.effect.before, "q1");
	assert.equal(plan.version.effect.after, "q1x");
	assert.equal(plan.queuedUsers.length, 1);
	assert.equal(plan.queuedUsers[0].content[0].text, "q1x");
	assert.equal(plan.manualTurn, undefined);
});

test("editPlan preserve cascades downstream user messages", () => {
	const events = [...turnEvents(1, "q1", "a1", 0), ...turnEvents(2, "q2", "a2", 6)];
	const plan = editPlan({ action: "edit", sessionId: "s", eventSeq: 1, blockIndex: 0, text: "q1x", cascade: "preserve" }, closedTurns(events));
	assert.equal(plan.queuedUsers.length, 2);
	assert.equal(plan.queuedUsers[0].content[0].text, "q1x");
	assert.equal(plan.queuedUsers[1].content[0].text, "q2");
});

test("editPlan on an assistant block builds a manual turn", () => {
	const events = turnEvents(1, "q1", "a1");
	const plan = editPlan({ action: "edit", sessionId: "s", eventSeq: 3, blockIndex: 0, text: "a1x", cascade: "truncate" }, closedTurns(events));
	assert.equal(plan.manualTurn.turn, 1);
	assert.equal(plan.manualTurn.assistant.content[0].text, "a1x");
	assert.equal(plan.version.effect.blockKind, "assistant.response");
});

test("retryPlan replays the target turn", () => {
	const events = turnEvents(1, "q1", "a1");
	const plan = retryPlan("s", 1, "truncate", closedTurns(events));
	assert.equal(plan.version.effect.operation, "retry");
	assert.equal(plan.queuedUsers.length, 1);
	assert.equal(plan.queuedUsers[0].content[0].text, "q1");
});

test("rerollPlan targets the newest text-bearing assistant turn", () => {
	const events = [...turnEvents(1, "q1", "a1", 0), ...turnEvents(2, "q2", "a2", 6)];
	const plan = rerollPlan("s", closedTurns(events));
	assert.equal(plan.version.effect.operation, "reroll");
	assert.equal(plan.version.effect.targetTurn, 2);
	assert.equal(plan.version.effect.cascade, "truncate");
});

test("rerollPlan rejects a session without any assistant text", () => {
	const events = [
		{ type: "turn/start", seq: 0, time: 1, data: { turn: 1 } },
		{ type: "user/message", seq: 1, time: 2, data: { turn: 1, source: { kind: "user" }, content: [{ type: "text", text: "q" }] } },
		{ type: "turn/end", seq: 2, time: 3, data: { turn: 1, reason: { kind: "completed" } } }
	];
	assert.throws(() => rerollPlan("s", closedTurns(events)), /没有可重生成/);
});

test("decodeOperation validates edit / retry / reroll payloads", () => {
	const edit = decodeOperation({ action: "edit", sessionId: "s", eventSeq: 3, blockIndex: 0, text: "x", cascade: "truncate" });
	assert.equal(edit.action, "edit");
	const retry = decodeOperation({ action: "retry", sessionId: "s", turn: 1, cascade: "preserve" });
	assert.equal(retry.action, "retry");
	const reroll = decodeOperation({ action: "reroll", sessionId: "s" });
	assert.equal(reroll.action, "reroll");
	assert.throws(() => decodeOperation({ action: "nope", sessionId: "s" }), TypeError);
	assert.throws(() => decodeOperation({ action: "edit", sessionId: "", eventSeq: 1, blockIndex: 0, text: "x", cascade: "truncate" }), TypeError);
	assert.throws(() => decodeOperation({ action: "retry", sessionId: "s", turn: -1, cascade: "truncate" }), TypeError);
	assert.throws(() => decodeOperation({ action: "retry", sessionId: "s", turn: 1, cascade: "sideways" }), TypeError);
});

test("versionSeed inherits the boundary and appends an ignorable version event", () => {
	const source = { events: turnEvents(1, "q1", "a1"), header: { id: "parent", cwd: "D:\\w" } };
	const plan = editPlan({ action: "edit", sessionId: "parent", eventSeq: 1, blockIndex: 0, text: "q1x", cascade: "truncate" }, closedTurns(source.events));
	const seed = versionSeed(source, plan);
	assert.equal(seed.inheritedLength, 0);
	assert.equal(seed.events.length, 1);
	assert.equal(seed.events[0].type, "message-edit/version");
	assert.equal(seed.events[0].ignorable, true);
	assert.equal(seed.events[0].data.schemaVersion, MESSAGE_EDIT_VERSION_SCHEMA);
	assert.equal(seed.events[0].data.inverse.sessionId, "parent");
});

test("ownVersionEvent projects the paired effect and rejects mismatched inverses", () => {
	const header = { id: "child", seedLength: 1, parentSession: "parent" };
	const event = {
		type: "message-edit/version",
		seq: 1,
		time: 7,
		data: {
			schemaVersion: MESSAGE_EDIT_VERSION_SCHEMA,
			effect: { id: "e1", operation: "edit", cascade: "truncate", targetTurn: 1, targetEventSeq: 1, blockKind: "user", before: "q1", after: "q1x" },
			inverse: { kind: "restore-version", sessionId: "parent" }
		}
	};
	const projection = ownVersionEvent(header, [event]);
	assert.equal(projection.effect.id, "e1");
	assert.equal(projection.inverseSessionId, "parent");

	const bad = { ...event, data: { ...event.data, inverse: { kind: "restore-version", sessionId: "other" } } };
	assert.throws(() => ownVersionEvent(header, [bad]), /逆不匹配/);
});

test("legacy version events stay readable", () => {
	const header = { id: "child", seedLength: 1, parentSession: "parent" };
	const event = {
		type: "message-edit/version",
		seq: 1,
		time: 7,
		data: { sourceSessionId: "parent", operation: "retry", cascade: "truncate", targetTurn: 1, targetEventSeq: 1 }
	};
	const projection = ownVersionEvent(header, [event]);
	assert.equal(projection.effect.id.startsWith("legacy:"), true);
	assert.equal(projection.effect.operation, "retry");
});
