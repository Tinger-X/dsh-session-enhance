/**
 * dsh-session-enhance 删除生命周期：级联删除 + 物理清理 + 验证。
 *
 * 删除顺序即语义：flush→detach→投影缓存落定→清归档标记与工作区记账→删
 * 投影缓存→级联子会话→清 spill→删转录目录（重试）→清扫 storages→验证→
 * 遗忘索引并打墓碑。可失败的持久化清理都先于不可逆的物理删除。
 */
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { dirname } from "node:path";
import { sessionDir } from "@deepseek-ai/dsh-spill-local";
import { storageRootHasTraces, sweepStorageRoot } from "../storage-sweep.js";
import { headerIdentity } from "../shared/identity.js";
import { SessionEnhanceUnknownSessionError } from "../shared/errors.js";
import { getLiveSession, flushLiveSession, detachLiveSession, announceColdSessionRemoval, listLiveSessions } from "../upstream/sessions.js";
import { getSpillRoot } from "../upstream/spill.js";
import { resolveTranscriptDirectory } from "./move.js";

export async function deleteSession(registry, sessionId) {
	return registry.enqueueOperation(() => deleteSessionCore(registry, sessionId));
}

export async function deleteSessionCore(registry, sessionId) {
	if (!await registry.sessionKnown(sessionId)) throw new SessionEnhanceUnknownSessionError(sessionId);
	const live = getLiveSession(registry.ctx, sessionId);
	// 先记录被删生命周期的日志身份：目录删除后头部不可再读。
	const deletedHeader = registry.headers.get(sessionId) ?? live?.header;
	if (live !== void 0) {
		await flushLiveSession(registry.ctx, live);
		detachLiveSession(registry.ctx, live);
		await registry.disposeStaleAgent(sessionId);
	} else await announceColdSessionRemoval(registry.ctx, sessionId);
	const projCache = registry.ctx.get("sessionProjectionCache");
	// dispose 的写后落盘必须先于缓存行删除完成，否则该行会被写回复活。
	await projCache?.whenIdle?.();
	// 物理删除不可逆：先完成所有可失败的持久化清理，失败时仍可重试。
	const state = registry.requireState();
	if (state.archivedSessionIds.includes(sessionId)) {
		await registry.setState({
			...state,
			archivedSessionIds: state.archivedSessionIds.filter((id) => id !== sessionId)
		});
	}
	await removeFromWorkspaceAccounts(registry, sessionId);
	if (projCache !== void 0) await projCache.delete(sessionId);
	await deleteDescendants(registry, sessionId);
	await cleanSpill(registry, sessionId);
	const transcriptDir = await removeTranscriptDirectory(registry, sessionId);
	await sweepStorageTraces(registry, sessionId);
	await verifyPhysicalDeletion(registry, sessionId, transcriptDir);
	// 物理删除已成功：此时再清父类索引。失败时保留索引，便于重试。
	registry.forgetIndexedSession(sessionId);
	if (deletedHeader !== void 0) registry.deletedIdentities.set(sessionId, headerIdentity(deletedHeader));
	return { deleted: true };
}

/** 直接清扫 `~/storages/*.json` 磁盘文件，移除 sessionId 的全部痕迹。 */
export async function sweepStorageTraces(registry, sessionId) {
	await sweepStorageRoot(await registry.storagesRoot(), sessionId, registry.ctx.logger);
}

/** 删除后验证。残留仅告警不抛错（删除已提交）。 */
export async function verifyPhysicalDeletion(registry, sessionId, transcriptDir) {
	const transcriptExists = transcriptDir !== void 0 && transcriptDir !== null && existsSync(transcriptDir);
	const storageTraces = await storageRootHasTraces(await registry.storagesRoot(), sessionId);
	if (transcriptExists || storageTraces.length > 0) {
		const leftovers = [
			...(transcriptExists ? [`transcript directory "${transcriptDir}"`] : []),
			...storageTraces.map((file) => `storage file "${file}"`)
		].join(", ");
		registry.ctx.logger.warn(`dsh-session-enhance: session "${sessionId}" was deleted but physical leftovers remain: ${leftovers}`);
	} else {
		registry.ctx.logger.info(`dsh-session-enhance: session "${sessionId}" physically deleted (transcript + storages/*.json verified clean)`);
	}
	return { sessionId, transcriptExists, storageTraces };
}

/** 对外暴露的删除后验证远程方法（宿主侧诊断，客户端暂未接线）。 */
export async function verifyDeleted(registry, sessionId) {
	const transcriptDir = await resolveTranscriptDirectory(registry, sessionId);
	return verifyPhysicalDeletion(registry, sessionId, transcriptDir);
}

/** 删除会话的转录目录；带短间隔重试（Windows 句柄延迟释放）。 */
export async function removeTranscriptDirectory(registry, sessionId) {
	const persistence = registry.ctx.get("sessionPersistence");
	if (persistence === void 0 || typeof persistence.locate !== "function") {
		throw new Error(`cannot delete session "${sessionId}": the session persistence backend does not expose locate() to resolve its transcript directory`);
	}
	const header = await registry.readSessionHeader(sessionId);
	const location = persistence.locate(header);
	if (location === void 0 || typeof location.path !== "string") {
		throw new Error(`cannot delete session "${sessionId}": the session persistence backend could not resolve its transcript directory`);
	}
	const transcriptDir = dirname(location.path);
	const attempts = 3;
	let lastError;
	for (let attempt = 1; attempt <= attempts; attempt++) {
		try {
			await rm(transcriptDir, { recursive: true, force: true });
			return transcriptDir;
		} catch (error) {
			lastError = error;
			if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, 150 * attempt));
		}
	}
	const message = `cannot delete session "${sessionId}": transcript directory "${transcriptDir}" remains after ${attempts} removal attempts`;
	const detail = `${message}: ${String(lastError)}`;
	registry.ctx.logger.warn(`dsh-session-enhance: ${detail}`);
	throw new Error(detail, { cause: lastError });
}

/** 把 id 从每个工作区记录中移除，并刷新实体快照。 */
export async function removeFromWorkspaceAccounts(registry, sessionId) {
	const table = registry.requireTable();
	const state = registry.requireState();
	for (const workspaceId of state.workspaceIds) {
		const record = table.get(workspaceId);
		if (record === void 0 || !record.sessionIds.includes(sessionId)) continue;
		const next = await table.update(workspaceId, (current) => ({
			...current,
			sessionIds: current.sessionIds.filter((id) => id !== sessionId),
			updatedAt: new Date().toISOString()
		}));
		const entity = registry.entities.get(workspaceId);
		if (entity !== void 0) entity.record = next;
	}
}

/** 尽力而为的级联删除：删除 `sessionId` 的 SUBAGENT 子会话（不含 fork 分支）。 */
export async function deleteDescendants(registry, sessionId) {
	try {
		const descendants = [];
		for (const session of listLiveSessions(registry.ctx)) {
			if (session.header.parentSession === sessionId && session.header.origin === "subagent") descendants.push(session.id);
		}
		for (const header of await registry.ctx.get("sessionPersistence").list()) {
			if (header.parentSession === sessionId && header.origin === "subagent" && !descendants.includes(header.id)) descendants.push(header.id);
		}
		for (const childId of descendants) {
			try {
				if (!await registry.sessionKnown(childId)) continue;
				await deleteSessionCore(registry, childId);
			} catch (error) {
				if (error instanceof SessionEnhanceUnknownSessionError) continue;
				registry.ctx.logger.warn(`dsh-session-enhance: cascade delete of subagent session "${childId}" (child of "${sessionId}") failed: ${String(error)}`);
			}
		}
	} catch (error) {
		registry.ctx.logger.warn(`dsh-session-enhance: descendant enumeration for deleted session "${sessionId}" failed: ${String(error)}`);
	}
}

/** 尽力而为的 spill 清理：移除该会话作用域的 spill 目录。 */
export async function cleanSpill(registry, sessionId) {
	try {
		const root = getSpillRoot(registry.ctx);
		if (typeof root !== "string") return;
		await rm(sessionDir(root, sessionId), { recursive: true, force: true });
	} catch (error) {
		registry.ctx.logger.warn(`dsh-session-enhance: spill cleanup for deleted session "${sessionId}" failed: ${String(error)}`);
	}
}
