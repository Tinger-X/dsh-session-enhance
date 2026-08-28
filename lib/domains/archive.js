/**
 * dsh-session-enhance 归档域：归档/恢复/批量删除与目标解析。
 *
 * 归档状态（archivedSessionIds）与工作区归属正交，这里只操作全局归档集合；
 * 批量删除复用 delete 域的 deleteSessionCore。
 */
import { archivedBatchTargetSchema } from "../shared/contracts/schemas.js";
import { SessionEnhanceUnknownSessionError } from "../shared/errors.js";
import { deleteSessionCore } from "./delete.js";

/** 归档设置页创建时间排序所需的最小元数据；列表摘要本身只暴露 updatedAt。 */
export async function archivedSessionMetadata(registry) {
	const items = [];
	for (const sessionId of [...new Set(registry.requireState().archivedSessionIds)]) {
		try {
			const header = await registry.readSessionHeader(sessionId);
			if (typeof header.createdAt === "number" && Number.isFinite(header.createdAt)) items.push({ sessionId, createdAt: header.createdAt });
		} catch (error) {
			registry.ctx.logger.warn(`dsh-session-enhance: could not read creation time for archived session "${sessionId}": ${String(error)}`);
		}
	}
	return { items };
}

export async function unarchiveSession(registry, sessionId) {
	return registry.enqueueOperation(async () => {
		if (!await registry.sessionKnown(sessionId)) throw new SessionEnhanceUnknownSessionError(sessionId);
		const state = registry.requireState();
		if (!state.archivedSessionIds.includes(sessionId)) return { archivedSessionIds: [...state.archivedSessionIds] };
		const next = {
			...state,
			archivedSessionIds: state.archivedSessionIds.filter((id) => id !== sessionId)
		};
		await registry.setState(next);
		return { archivedSessionIds: [...next.archivedSessionIds] };
	});
}

export async function unarchiveSessions(registry, target) {
	return registry.enqueueOperation(async () => {
		const unarchivedSessionIds = archivedSessionIdsForTarget(registry, target);
		if (unarchivedSessionIds.length === 0) return {
			archivedSessionIds: [...registry.requireState().archivedSessionIds],
			unarchivedSessionIds: []
		};
		const restored = new Set(unarchivedSessionIds);
		const state = registry.requireState();
		const next = {
			...state,
			archivedSessionIds: state.archivedSessionIds.filter((id) => !restored.has(id))
		};
		await registry.setState(next);
		return {
			archivedSessionIds: [...next.archivedSessionIds],
			unarchivedSessionIds
		};
	});
}

export async function deleteArchivedSessions(registry, target) {
	return registry.enqueueOperation(async () => {
		const requestedSessionIds = archivedSessionIdsForTarget(registry, target);
		const deletedSessionIds = [];
		const skippedSessionIds = [];
		const failures = [];
		for (const sessionId of requestedSessionIds) {
			try {
				await deleteSessionCore(registry, sessionId);
				deletedSessionIds.push(sessionId);
			} catch (error) {
				if (error instanceof SessionEnhanceUnknownSessionError) {
					skippedSessionIds.push(sessionId);
					continue;
				}
				failures.push({ sessionId, message: String(error) });
			}
		}
		return { requestedSessionIds, deletedSessionIds, skippedSessionIds, failures };
	});
}

/** 以归档集合顺序解析批量目标，避免依赖浏览器尚未加载完整的摘要投影。 */
export function archivedSessionIdsForTarget(registry, target) {
	target = archivedBatchTargetSchema.parse(target);
	const state = registry.requireState();
	const archivedSessionIds = [...new Set(state.archivedSessionIds)];
	if (target.scope === "all") return archivedSessionIds;
	if (target.scope === "workspace") {
		const workspace = registry.requireTable().get(target.workspaceId);
		if (workspace === void 0) throw new Error(`unknown workspace "${target.workspaceId}"`);
		const accounted = new Set(workspace.sessionIds);
		return archivedSessionIds.filter((id) => accounted.has(id));
	}
	const accounted = new Set();
	const table = registry.requireTable();
	for (const workspaceId of state.workspaceIds) {
		for (const sessionId of table.get(workspaceId)?.sessionIds ?? []) accounted.add(sessionId);
	}
	return archivedSessionIds.filter((id) => !accounted.has(id));
}
