/**
 * dsh-session-enhance 归档预览域：读取归档会话转录，投影为可展示的消息列表。
 *
 * 只做只读投影：通过 persistence.readRaw 读取工件全文（header 行 + 事件行），
 * 把事件投影为三类消息：
 * - `user`：用户真实输入（source.kind === "user"），预览主体；
 * - `assistant`：LLM 回复，预览主体；
 * - `system`：其余内容（注入上下文、工具调用/结果），客户端以标签简要展示。
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
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
 * 耐久图片在转录中以 Markdown 引用形式出现：
 * `![图片](/describe-image/raw/<attachmentId>?ref=<url-encoded JSON>)`。
 * `ref` 查询参数携带 `{attachmentId, mediaType, …}` 元数据，而字节以内容寻址方式
 * 落在 `<attachmentsRoot>/v1/objects/<sha256 前 2 位>/<sha256>`（`attachmentId` 去掉 `sha256:` 前缀）。
 * 预览只读投影无法走会话授权的 attachment 解析，这里直接读附件文件并内联为 `data:` URL，
 * 让浏览器端无需依赖 `/describe-image/raw` 路由即可稳定显示图片。
 */

/** 从图片引用 URL 中解析出耐久附件元数据（失败返回 null）。 */
function parseImageRef(src) {
	try {
		const query = src.indexOf("?");
		if (query === -1) return null;
		const ref = new URLSearchParams(src.slice(query + 1)).get("ref");
		if (ref === null) return null;
		const parsed = JSON.parse(ref);
		if (typeof parsed.attachmentId !== "string" || typeof parsed.mediaType !== "string") return null;
		return parsed;
	} catch {
		return null;
	}
}

/** 读取内容寻址的附件字节并编码为 `data:<mediaType>;base64,<data>`（读取失败返回 null）。 */
async function resolveImageToDataUrl(attachmentId, mediaType, attachmentsRoot, logger) {
	const hash = attachmentId.startsWith("sha256:") ? attachmentId.slice("sha256:".length) : attachmentId;
	if (!/^[0-9a-f]{2,}$/i.test(hash)) return null;
	const file = join(attachmentsRoot, "v1", "objects", hash.slice(0, 2).toLowerCase(), hash);
	try {
		const bytes = await readFile(file);
		return `data:${mediaType};base64,${bytes.toString("base64")}`;
	} catch (error) {
		if (error?.code !== "ENOENT") logger?.warn?.(`dsh-session-enhance: preview could not read attachment "${attachmentId}": ${String(error)}`);
		return null;
	}
}

/** 把文本里的 `/describe-image/raw/…` 引用就地替换为 `data:` URL（其余内容原样保留）。 */
async function inlineDurableImages(text, attachmentsRoot, logger) {
	if (typeof text !== "string" || text === "") return text;
	const pattern = /!\[([^\]]*)\]\(([^)\s]+)\)/g;
	let out = "";
	let cursor = 0;
	let match;
	while ((match = pattern.exec(text)) !== null) {
		out += text.slice(cursor, match.index);
		const src = match[2];
		if (src.startsWith("/describe-image/raw/")) {
			const ref = parseImageRef(src);
			const dataUrl = ref === null ? null : await resolveImageToDataUrl(ref.attachmentId, ref.mediaType, attachmentsRoot, logger);
			out += dataUrl === null ? match[0] : `![${match[1]}](${dataUrl})`;
		} else {
			out += match[0];
		}
		cursor = match.index + match[0].length;
	}
	return out + text.slice(cursor);
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
		// 解析附件存储根（读不到则跳过内联，客户端仍会原样显示 Markdown 引用）。
		let attachmentsRoot = void 0;
		if (typeof registry.attachmentsRoot === "function") {
			try {
				attachmentsRoot = await registry.attachmentsRoot();
			} catch {
				attachmentsRoot = void 0;
			}
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
		if (attachmentsRoot !== void 0) {
			for (const message of messages) {
				if (typeof message.text !== "string") continue;
				message.text = await inlineDurableImages(message.text, attachmentsRoot, registry.ctx.logger);
			}
		}
		return { sessionId, messages };
	});
}
