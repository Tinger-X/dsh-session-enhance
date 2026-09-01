/**
 * dsh-session-enhance 对话树编排域。
 *
 * 复用 lib/tree-model.js 的纯函数投影，负责真实 I/O（主干工件 + sidecar 读写）
 * 与 agent 驱动（重新生成）。主干 `session.jsonl[.zstd]` 始终是当前活动分支的
 * 合法线性日志；sidecar `session.tree.json` 保存分支元数据与非活动分支的游离事件段。
 *
 * 关键约束：分支操作**绝不 detach 实时会话**，也不直接改写原始工件绕过持久化
 * 协调器。改用在同一会话内原地回退：
 *   1. flush 实时会话（工件与内存 log 对齐）；
 *   2. 截断实时 log 并重置派生缓存；
 *   3. 同步协调器的内存 cursor（`sessionPersistence.coordinator.states`）；
 *   4. 按后端 header 行格式（`type:"session"` + `delegationDepth`）原子重写工件；
 *   5. 复用仍存活的 agent（`followup`）驱动重新生成。
 * 这样既不触发 `session/disposed` → `host/session-removed` 广播（UI 不丢会话），
 * 也不会让协调器 cursor 与工件脱节（后续 append 的 seq 校验不炸）。
 */
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { readFile, rename, rm, writeFile } from "node:fs/promises";
import { encodeArtifact, isZstdPath } from "../session-move.js";
import {
	buildTree,
	closedTurns,
	emptySidecar,
	normalizeSidecar
} from "../tree-model.js";
import { getLiveSession, flushLiveSession } from "../upstream/sessions.js";

const SIDECAR_NAME = "session.tree.json";

/** 取 sidecar 文件绝对路径。 */
function sidecarPath(persistence, header) {
	const location = persistence.locate(header);
	return join(dirname(location.path), SIDECAR_NAME);
}

/** 读 sidecar；不存在或损坏时返回空。 */
async function readSidecar(persistence, header, sessionId) {
	try {
		const text = await readFile(sidecarPath(persistence, header), "utf8");
		return normalizeSidecar(JSON.parse(text), sessionId);
	} catch {
		return emptySidecar(sessionId);
	}
}

/** 原子写 sidecar。 */
async function writeSidecar(persistence, header, sidecar) {
	const file = sidecarPath(persistence, header);
	const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
	try {
		await writeFile(tmp, JSON.stringify(sidecar, null, 2), "utf8");
		await rename(tmp, file);
	} catch (error) {
		await rm(tmp, { force: true }).catch(() => {});
		throw error;
	}
}

/**
 * 序列化会话 header 行（与 JSONL 后端 `toHeaderLine` 一致）。
 * 实时 `Session.header` 或 `inspect().meta` 都不含 `type` 标记，且实时 header
 * 可能缺省 `delegationDepth`；这里补齐，否则后端严格读取器会拒读、`list()` 会
 * 静默丢弃该会话（正是「对话消失」的直接原因）。
 */
function toHeaderLine(header) {
	return {
		type: "session",
		version: header.version,
		id: header.id,
		createdAt: header.createdAt,
		...header.cwd !== void 0 ? { cwd: header.cwd } : {},
		...header.parentSession !== void 0 ? { parentSession: header.parentSession } : {},
		...header.seedLength !== void 0 ? { seedLength: header.seedLength } : {},
		...header.origin !== void 0 ? { origin: header.origin } : {},
		delegationDepth: header.delegationDepth ?? 0,
		...header.agentPreset !== void 0 ? { agentPreset: header.agentPreset } : {}
	};
}

/**
 * 读取会话事件（已解包、seq 连续）。实时会话走 `live.events`；冷会话走
 * `persistence.inspect`（其内部已用 `decodeStorageRecord` 把 packed chunk 行
 * 还原为原始事件，避免直接把 `reasoning-chunks`/`text-chunks` 存储行当事件）。
 */
async function readEvents(registry, sessionId) {
	const live = getLiveSession(registry.ctx, sessionId);
	if (live !== void 0) return { header: live.header, events: live.events, live };
	const inspection = await registry.ctx.get("sessionPersistence").inspect(sessionId);
	return { header: inspection.meta, events: inspection.events, live: void 0 };
}

/** 序列化主干 JSONL 文本（header 行 + 事件行；事件按后端 reader 可读的逐行布局写入）。 */
function serializeTrunk(header, events) {
	const parts = [JSON.stringify(toHeaderLine(header))];
	for (const event of events) parts.push(JSON.stringify(event));
	return parts.join("\n") + "\n";
}

/** 原子重写主干工件（header + events），保持后端可读的帧布局。 */
async function rewriteTrunk(registry, header, events) {
	const persistence = registry.ctx.get("sessionPersistence");
	const file = persistence.locate(header).path;
	const text = serializeTrunk(header, events);
	const encoded = await encodeArtifact(text, isZstdPath(file));
	const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
	try {
		await writeFile(tmp, encoded);
		await rename(tmp, file);
	} catch (error) {
		await rm(tmp, { force: true }).catch(() => {});
		throw error;
	}
}

/**
 * 截断实时会话的内存 log 并重置全部派生缓存。镜像 RDB 后端
 * `truncateLiveSession` 的语义：`log`/`surfaceManager`/`headerFold`/
 * `contextFold`/`derived` 都是增量缓存，截断后必须同步复位，否则下一次 append
 * 会基于陈旧状态校验/投影。
 */
function truncateLiveSession(session, newLength) {
	const s = session;
	s.log.length = newLength;
	s.eventsSnapshot = void 0;
	s.headerFold = void 0;
	s.headerFoldSeq = 0;
	s.contextFold = void 0;
	s.contextFoldSeq = 0;
	s.derived = [];
	s.derivedNodes = 0;
	s.derivedGeneration = 0;
	s.surfaceManager._state = { nodes: [], replaceGeneration: 0 };
	s.surfaceManager._lastProcessedSeq = s.surfaceManager.baseSeq - 1;
	s.surfaceManager._pendingPlan = void 0;
}

/** 迭代深冻结（与 dsh-session `freezeRestoredObject` 等价）。 */
function deepFreeze(value) {
	const pending = [value];
	while (pending.length > 0) {
		const current = pending.pop();
		Object.freeze(current);
		for (const key in current) {
			const child = current[key];
			if (child !== null && typeof child === "object") pending.push(child);
		}
	}
	return value;
}

/** 用一组已解包事件整体替换实时会话的 log 并复位缓存（用于分支切换）。 */
function replaceLiveLog(session, events) {
	const s = session;
	s.log.length = 0;
	for (const event of events) s.log.push(deepFreeze(event));
	s.eventsSnapshot = void 0;
	s.headerFold = void 0;
	s.headerFoldSeq = 0;
	s.contextFold = void 0;
	s.contextFoldSeq = 0;
	s.derived = [];
	s.derivedNodes = 0;
	s.derivedGeneration = 0;
	s.surfaceManager._state = { nodes: [], replaceGeneration: 0 };
	s.surfaceManager._lastProcessedSeq = s.surfaceManager.baseSeq - 1;
	s.surfaceManager._pendingPlan = void 0;
}

/** 重置 agent 的循环内部状态，使其在回退后的 log 上继续驱动。 */
function resetAgentForRewind(registry, sessionId, lastTurn) {
	const agent = registry.ctx.get("agents")?.get?.(sessionId);
	if (agent === void 0) return;
	try {
		agent.requestHeaderLogged = false;
	} catch {}
	if (agent.phase !== void 0) {
		try {
			agent.phase.lastTurn = lastTurn;
		} catch {}
	}
}

/**
 * 原地回退实时会话到 boundary（含）。保持会话 live：flush → 截断 log →
 * 同步协调器 cursor → 复位 agent → 重写工件。
 */
async function rewindLive(registry, sessionId, boundary, header) {
	const live = getLiveSession(registry.ctx, sessionId);
	if (live === void 0) return false;
	const persistence = registry.ctx.get("sessionPersistence");

	await flushLiveSession(registry.ctx, live);

	const keepLength = boundary + 1;
	const kept = live.events.slice(0, keepLength);
	const lastTurn = [...kept].reverse().find((event) => event.type === "turn/start")?.data?.turn ?? 0;

	truncateLiveSession(live, keepLength);

	const state = persistence.coordinator?.states?.get(sessionId);
	if (state !== void 0) state.cursor = keepLength;

	resetAgentForRewind(registry, sessionId, lastTurn);

	await rewriteTrunk(registry, header, kept);
	return true;
}

/** 解析最近一次 request/header 的 provider/model（用于 agent 驱动）。 */
function modelRoute(events) {
	for (let index = events.length - 1; index >= 0; index -= 1) {
		const event = events[index];
		if (event.type !== "request/header") continue;
		const config = event.data?.header?.config;
		if (config?.provider && config?.model) return { provider: config.provider, model: config.model };
	}
	return null;
}

/** 把用户消息内容重放给 agent（优先复用 live agent 的 followup）。fail-soft。 */
async function driveAgent(registry, sessionId, content, provider, model) {
	const agents = registry.ctx.get("agents");
	if (agents === void 0) return 0;
	const message = {
		id: randomUUID(),
		role: "user",
		content: Array.isArray(content) ? content : [{ type: "text", text: String(content ?? "") }],
		source: { kind: "user" }
	};
	try {
		const existing = agents.get?.(sessionId);
		if (existing !== void 0 && typeof existing.followup === "function") {
			existing.followup(message);
			const sessions = registry.ctx.get("sessions");
			if (existing.session !== void 0 && typeof sessions?.flush === "function") await sessions.flush(existing.session);
			return 1;
		}
		if (typeof agents.resume !== "function") return 0;
		const handle = await agents.resume({
			resumeSessionId: sessionId,
			agentOptions: { provider, model }
		}).catch((error) => {
			registry.ctx.logger.warn(`dsh-session-enhance: agent resume for "${sessionId}" failed: ${String(error)}`);
			return void 0;
		});
		if (handle === void 0) return 0;
		const agent = handle.agent ?? handle;
		if (typeof agent.followup !== "function") return 0;
		agent.followup(message);
		const sessions = registry.ctx.get("sessions");
		if (agent.session !== void 0 && typeof sessions?.flush === "function") await sessions.flush(agent.session);
		return 1;
	} catch (error) {
		registry.ctx.logger.warn(`dsh-session-enhance: agent drive for "${sessionId}" failed (version remains durable): ${String(error)}`);
		return 0;
	}
}

/** 主干中 depth 之前的闭合边界（seq）。返回 -1 表示仅保留 header。 */
function boundaryBefore(turns, depth) {
	if (depth <= 1) {
		const first = turns[0];
		return first === void 0 ? -1 : first.startSeq - 1;
	}
	const prev = turns[depth - 2];
	return prev === void 0 || prev.endSeq === void 0 ? -1 : prev.endSeq;
}

/** 生成分支名（按分叉点计数）。 */
function nextBranchName(sidecar) {
	return `分支 ${sidecar.branches.length + 1}`;
}

/** 解析 `${branchId}:${depth}`。 */
function parseNodeId(nodeId) {
	const index = String(nodeId).lastIndexOf(":");
	if (index <= 0) throw new Error(`invalid node id "${nodeId}"`);
	const depth = Number.parseInt(String(nodeId).slice(index + 1), 10);
	if (!Number.isSafeInteger(depth) || depth < 1) throw new Error(`invalid node id "${nodeId}"`);
	return { branchId: String(nodeId).slice(0, index), depth };
}

/** 用新文本替换消息内容中的第一个文本块（无文本块则追加）。 */
function replaceTextContent(content, text) {
	const next = Array.isArray(content) ? content.map((block) => ({ ...block })) : [];
	const index = next.findIndex((block) => block?.type === "text");
	if (index === -1) next.push({ type: "text", text });
	else next[index] = { ...next[index], text };
	return next;
}

/** 递归重建某分支的完整事件序列。 */
function materializeBranch(branchId, sidecar, activeEvents) {
	if (branchId === sidecar.activeBranchId) return activeEvents;
	const branch = sidecar.branches.find((b) => b.id === branchId);
	if (branch === void 0) throw new Error(`unknown branch "${branchId}"`);
	const own = sidecar.detached.find((item) => item.branchId === branchId)?.events ?? [];
	if (branch.parentBranchId === null) return own;
	const parentEvents = materializeBranch(branch.parentBranchId, sidecar, activeEvents);
	const parentTurns = closedTurns(parentEvents);
	const forkDepth = branch.forkDepth ?? 0;
	const prefixEnd = forkDepth <= 0 ? -1 : (parentTurns[forkDepth - 1]?.endSeq ?? -1);
	return parentEvents.slice(0, prefixEnd + 1).concat(own);
}

/** 把事件序列重编号为连续 seq，并顺带重映射 surface provenance。 */
function renumberContiguous(events) {
	const seqMap = new Map();
	for (let index = 0; index < events.length; index += 1) {
		const seq = events[index]?.seq;
		if (typeof seq === "number") seqMap.set(seq, index);
	}
	return events.map((event, index) => {
		const next = { ...event, seq: index };
		if (Array.isArray(event.sourceEventSeqs) && event.sourceEventSeqs.length > 0) {
			const remapped = [...new Set(event.sourceEventSeqs.map((s) => seqMap.get(s)).filter((s) => typeof s === "number" && s < index))].sort((a, b) => a - b);
			if (remapped.length > 0) next.sourceEventSeqs = remapped;
			else delete next.sourceEventSeqs;
		}
		return next;
	});
}

/** 读取树投影。 */
export async function readTree(registry, sessionId) {
	const { header, events } = await readEvents(registry, sessionId);
	const sidecar = await readSidecar(registry.ctx.get("sessionPersistence"), header, sessionId);
	return buildTree(events, sidecar);
}

/**
 * 在活动分支的指定节点重新生成（创建分支，不新建会话）。
 * @param nodeId - `${branchId}:${depth}`；仅支持活动分支节点。
 */
export async function regenerate(registry, sessionId, nodeId, editedText) {
	return registry.enqueueOperation(async () => {
		if (!await registry.sessionKnown(sessionId)) throw new Error(`unknown session "${sessionId}"`);
		const persistence = registry.ctx.get("sessionPersistence");
		const { header, events, live } = await readEvents(registry, sessionId);
		const sidecar = await readSidecar(persistence, header, sessionId);

		const depth = parseNodeId(nodeId).depth;
		const turns = closedTurns(events);
		const turn = turns[depth - 1];
		if (turn === void 0 || turn.userEventSeq === void 0) throw new Error(`node "${nodeId}" is not a regenerable user turn`);

		const boundary = boundaryBefore(turns, depth);
		const tail = events.slice(boundary + 1);
		const userEvent = events.find((event) => event.seq === turn.userEventSeq);
		const userContent = userEvent?.data?.content ?? [];
		const forkDepth = Math.max(0, depth - 1);

		// 旧尾部保存为新分支（旧内容成为分支）。
		const branchId = randomUUID();
		sidecar.branches.push({
			id: branchId,
			parentBranchId: sidecar.activeBranchId,
			forkDepth,
			name: nextBranchName(sidecar),
			createdAt: Date.now()
		});
		sidecar.detached.push({ branchId, events: tail, createdAt: Date.now() });

		// 回退主干到分叉点之前（保持会话 live）。
		if (live !== void 0) await rewindLive(registry, sessionId, boundary, header);
		else await rewriteTrunk(registry, header, events.slice(0, boundary + 1));
		await writeSidecar(persistence, header, sidecar);

		// 重放（可编辑的）用户消息驱动 agent 重新生成。
		const content = editedText === void 0 || editedText === null
			? userContent
			: replaceTextContent(userContent, editedText);
		const route = modelRoute(events);
		const queued = await driveAgent(registry, sessionId, content, route?.provider ?? "", route?.model ?? "");
		return { sessionId, nodeId, branchId, queued, live: getLiveSession(registry.ctx, sessionId) !== void 0 };
	});
}

/**
 * 切换到指定分支：当前活动分支事件落回 sidecar，目标分支事件重建到主干。
 */
export async function switchBranch(registry, sessionId, targetBranchId) {
	return registry.enqueueOperation(async () => {
		if (!await registry.sessionKnown(sessionId)) throw new Error(`unknown session "${sessionId}"`);
		const persistence = registry.ctx.get("sessionPersistence");
		const { header, events, live } = await readEvents(registry, sessionId);
		const sidecar = await readSidecar(persistence, header, sessionId);

		if (targetBranchId === sidecar.activeBranchId) return { sessionId, branchId: targetBranchId };

		const target = sidecar.branches.find((branch) => branch.id === targetBranchId);
		if (target === void 0) throw new Error(`unknown branch "${targetBranchId}"`);

		// 当前活动分支事件落回 sidecar（不再在主干）：只存本分支在分叉点之后的
		// 自有尾部（与 regenerate 一致）。若误存全长，materializeBranch 会用
		// 「父前缀 + 全长」重复拼接出幻影节点，导致对话树在反复切换分支时不断生长。
		// 边界严格对齐 materializeBranch 的 prefixEnd（forkDepth<=0 视为 -1）。
		const activeBranchMeta = sidecar.branches.find((branch) => branch.id === sidecar.activeBranchId);
		const activeForkDepth = Number.isSafeInteger(activeBranchMeta?.forkDepth) ? activeBranchMeta.forkDepth : 0;
		const activeTurns = closedTurns(events);
		const prefixEnd = activeForkDepth <= 0 ? -1 : (activeTurns[activeForkDepth - 1]?.endSeq ?? -1);
		const ownTail = events.slice(prefixEnd + 1);
		sidecar.detached = sidecar.detached.filter((item) => item.branchId !== sidecar.activeBranchId);
		sidecar.detached.push({ branchId: sidecar.activeBranchId, events: ownTail, createdAt: Date.now() });

		// 重建目标分支事件序列（父分支前缀 + 目标自有事件），并重编号为连续 seq。
		const targetEvents = renumberContiguous(materializeBranch(targetBranchId, sidecar, events));

		if (live !== void 0) {
			await flushLiveSession(registry.ctx, live);
			const lastTurn = [...targetEvents].reverse().find((event) => event.type === "turn/start")?.data?.turn ?? 0;
			replaceLiveLog(live, targetEvents);
			const state = persistence.coordinator?.states?.get(sessionId);
			if (state !== void 0) state.cursor = targetEvents.length;
			resetAgentForRewind(registry, sessionId, lastTurn);
			await rewriteTrunk(registry, header, targetEvents);
		} else {
			await rewriteTrunk(registry, header, targetEvents);
		}

		sidecar.activeBranchId = targetBranchId;
		sidecar.detached = sidecar.detached.filter((item) => item.branchId !== targetBranchId);
		await writeSidecar(persistence, header, sidecar);
		return { sessionId, branchId: targetBranchId };
	});
}
