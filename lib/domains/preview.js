/**
 * dsh-session-enhance 归档预览域：读取归档会话转录，投影为可展示的消息列表。
 *
 * 只做只读投影：通过 persistence.readRaw 读取工件全文（header 行 + 事件行），
 * 把事件投影为三类消息：
 * - `user`：用户真实输入（source.kind === "user"），预览主体；
 * - `assistant`：LLM 回复，预览主体；
 * - `system`：其余内容（注入上下文、工具调用/结果），客户端以标签简要展示。
 */
import { SessionEnhanceUnknownSessionError } from "../shared/errors.js";

/** 从 ContentBlock 树中递归提取可读文本（text / reasoning / 嵌套 tool-result）。 */
function extractText(content) {
	const parts = [];
	for (const block of Array.isArray(content) ? content : []) {
		if (block === null || typeof block !== "object") continue;
		if ((block.type === "text" || block.type === "reasoning") && typeof block.text === "string") {
			parts.push(block.text);
		} else if (block.type === "tool-result" && Array.isArray(block.content)) {
			parts.push(extractText(block.content));
		}
	}
	return parts.join("\n");
}

/**
 * 把一条会话事件投影为预览消息；非消息事件返回 undefined。
 * @param event - 会话事件行。
 * @param toolNames - callId → 工具名 的映射（tool/call 先行填充，供 tool/result 取用）。
 */
function messageFromEvent(event, toolNames) {
	if (event === null || typeof event !== "object" || typeof event.type !== "string") return void 0;
	switch (event.type) {
		case "user/message": {
			const source = event.data?.source;
			// 真实用户输入才是预览主体；注入/合成内容归入 system。
			if (source?.kind === "user") return { kind: "user", text: extractText(event.data?.content), ...(typeof event.time === "number" ? { time: event.time } : {}) };
			const label = source?.form === "notice" && typeof source.summary === "string" ? source.summary : void 0;
			return {
				kind: "system",
				tag: "context",
				text: extractText(event.data?.content),
				...(label === void 0 ? {} : { label })
			};
		}
		case "assistant/message":
			return { kind: "assistant", text: extractText(event.data?.message?.content), ...(typeof event.time === "number" ? { time: event.time } : {}) };
		case "tool/call": {
			const name = typeof event.data?.name === "string" ? event.data.name : void 0;
			if (typeof event.data?.callId === "string") toolNames.set(event.data.callId, name);
			return {
				kind: "system",
				tag: "tool-call",
				text: typeof event.data?.arguments === "string" ? event.data.arguments : "",
				...(name === void 0 ? {} : { name })
			};
		}
		case "tool/result": {
			const callId = event.data?.message?.source?.callId;
			const name = typeof callId === "string" ? toolNames.get(callId) : void 0;
			return {
				kind: "system",
				tag: "tool",
				text: extractText(event.data?.message?.content),
				...(name === void 0 ? {} : { name })
			};
		}
		default:
			return void 0;
	}
}

export async function previewSession(registry, sessionId) {
	return registry.enqueueOperation(async () => {
		if (!await registry.sessionKnown(sessionId)) throw new SessionEnhanceUnknownSessionError(sessionId);
		const persistence = registry.ctx.get("sessionPersistence");
		if (persistence === void 0 || typeof persistence.readRaw !== "function") {
			throw new Error(`cannot preview session "${sessionId}": the session persistence backend does not expose readRaw()`);
		}
		const raw = await persistence.readRaw(sessionId);
		if (raw === void 0 || typeof raw.content !== "string") {
			throw new Error(`session "${sessionId}" has no materialized transcript to preview`);
		}
		const messages = [];
		const toolNames = new Map();
		for (const line of raw.content.split("\n")) {
			const trimmed = line.trim();
			if (trimmed === "") continue;
			let event;
			try {
				event = JSON.parse(trimmed);
			} catch {
				continue;
			}
			const message = messageFromEvent(event, toolNames);
			if (message !== void 0) messages.push(message);
		}
		return { sessionId, messages };
	});
}
