/**
 * dsh-session-enhance 会话移动编排：物理移动 + 投影 rehome + 目录解析。
 *
 * 物理移动（转录目录 + 工件 header.cwd）先于记账；失败时记账未动可重试。
 */
import { realpath } from "node:fs/promises";
import { dirname } from "node:path";
import { workspaceTargetSchema } from "../shared/contracts/schemas.js";
import { SessionEnhanceUnknownSessionError } from "../shared/errors.js";
import { getLiveSession, flushLiveSession, detachLiveSession } from "../upstream/sessions.js";
import { physicallyMoveSession } from "../session-move.js";

export async function moveSession(registry, sessionId, targetWorkspaceId) {
	return registry.enqueueOperation(async () => {
		if (!await registry.sessionKnown(sessionId)) throw new SessionEnhanceUnknownSessionError(sessionId);
		targetWorkspaceId = workspaceTargetSchema.parse(targetWorkspaceId);
		const state = registry.requireState();
		const table = registry.requireTable();
		const previousWorkspaceId = state.workspaceIds.find((workspaceId) => table.get(workspaceId)?.sessionIds.includes(sessionId)) ?? null;
		if (previousWorkspaceId === targetWorkspaceId) return {
			sessionId,
			workspaceId: targetWorkspaceId ?? "",
			previousWorkspaceId: previousWorkspaceId ?? ""
		};
		const targetRecord = targetWorkspaceId === null ? null : table.get(targetWorkspaceId);
		if (targetWorkspaceId !== null && targetRecord === void 0) {
			throw new Error(`unknown workspace "${targetWorkspaceId}"`);
		}
		// 物理移动：转录目录 + 工件 header.cwd（先于记账，失败时记账未动可重试）。
		if (targetRecord !== null) {
			const header = await registry.readSessionHeader(sessionId);
			if (typeof header?.cwd === "string" && header.cwd !== targetRecord.path) {
				const live = getLiveSession(registry.ctx, sessionId);
				if (live !== void 0) {
					// 持久化屏障先行 + 从存储分离：释放写路径与文件句柄。
					await flushLiveSession(registry.ctx, live);
					detachLiveSession(registry.ctx, live);
				}
				// 旧 agent 仍持有已脱离（或此前就脱离）的会话对象：一律释放。
				await registry.disposeStaleAgent(sessionId);
				const persistence = registry.ctx.get("sessionPersistence");
				const outcome = await physicallyMoveSession(persistence, sessionId, header, targetRecord.path, registry.ctx.logger);
				if (outcome.moved) {
					// 同步内存索引：header cwd 与 canonical sessionPath 指向新工作区。
					const indexed = registry.headers.get(sessionId);
					if (indexed !== void 0) registry.headers.set(sessionId, { ...indexed, cwd: targetRecord.path });
					try {
						const canonical = await realpath(targetRecord.path);
						registry.host.rememberSessionPath(sessionId, canonical);
					} catch (error) {
						registry.ctx.logger.warn(`dsh-session-enhance: could not canonicalize new cwd "${targetRecord.path}" for moved session "${sessionId}": ${String(error)}`);
					}
					registry.ctx.logger.info(`dsh-session-enhance: physically moved transcript of "${sessionId}" from "${outcome.oldDir}" to "${outcome.newDir}"`);
					// 投影缓存行身份（cwd）改写为新路径，避免标题投影回退。
					await rehomeMovedSessionProjection(registry, sessionId, header, targetRecord.path);
					// 诊断：persistence 的 inspect 应已指向新 cwd。
					try {
						const inspected = await persistence.inspect(sessionId);
						if (inspected?.meta?.cwd !== targetRecord.path) {
							registry.ctx.logger.warn(`dsh-session-enhance: after moving "${sessionId}", persistence inspect still reports cwd "${String(inspected?.meta?.cwd)}" (expected "${targetRecord.path}")`);
						}
					} catch (error) {
						registry.ctx.logger.warn(`dsh-session-enhance: post-move inspect probe for "${sessionId}" failed: ${String(error)}`);
					}
				}
			}
		}
		// 先从所有工作区移除（防御重复记账），再加入目标。
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
		if (targetWorkspaceId !== null) {
			const next = await table.update(targetWorkspaceId, (current) => ({
				...current,
				sessionIds: [...current.sessionIds, sessionId],
				updatedAt: new Date().toISOString()
			}));
			const entity = registry.entities.get(targetWorkspaceId);
			if (entity !== void 0) entity.record = next;
		}
		registry.ctx.logger.info(`dsh-session-enhance: moved session "${sessionId}" ${previousWorkspaceId === null ? "from ungrouped" : `from workspace "${previousWorkspaceId}"`} to ${targetWorkspaceId === null ? "ungrouped" : `workspace "${targetWorkspaceId}"`}`);
		return {
			sessionId,
			workspaceId: targetWorkspaceId ?? "",
			previousWorkspaceId: previousWorkspaceId ?? ""
		};
	});
}

export async function rehomeMovedSessionProjection(registry, sessionId, header, newCwd) {
	const projCache = registry.ctx.get("sessionProjectionCache");
	if (projCache === void 0 || typeof projCache.whenIdle !== "function" || typeof projCache.rehome !== "function") return;
	try {
		await projCache.whenIdle();
		await projCache.rehome(sessionId, { createdAt: header.createdAt, cwd: newCwd });
	} catch (error) {
		registry.ctx.logger.warn(`dsh-session-enhance: projection-cache identity refresh for moved session "${sessionId}" failed (title falls back until the session is reopened): ${String(error)}`);
	}
}

/** 解析会话的转录目录路径（目录可能已被删除：不存在时返回 undefined）。 */
export async function resolveTranscriptDirectory(registry, sessionId) {
	const persistence = registry.ctx.get("sessionPersistence");
	if (persistence === void 0 || typeof persistence.locate !== "function") return void 0;
	try {
		const header = await registry.readSessionHeader(sessionId);
		const location = persistence.locate(header);
		if (location === void 0 || typeof location.path !== "string") return void 0;
		return dirname(location.path);
	} catch {
		return void 0;
	}
}
