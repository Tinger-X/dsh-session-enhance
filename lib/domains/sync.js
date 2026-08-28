/**
 * dsh-session-enhance 记录同步：以物理 header 为权威对账 storages 记账。
 */
import { realpath, rm, readdir } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

export async function syncRecords(registry) {
	return registry.enqueueOperation(async () => {
		const persistence = registry.ctx.get("sessionPersistence");
		if (persistence === void 0 || typeof persistence.list !== "function") {
			throw new Error("session persistence does not expose list() — cannot sync records");
		}
		const headers = await persistence.list();
		const physicalIds = new Set(headers.map((header) => header.id));
		const report = {
			scanned: headers.length,
			archivedRemoved: [],
			workspaceRemoved: [],
			workspaceAdded: [],
			projcacheRemoved: [],
			projcacheRehomed: [],
			artifactMismatchesRemoved: []
		};
		const state = registry.requireState();
		const table = registry.requireTable();
		// 1) 归档集合：清理幽灵。
		const archivedNext = state.archivedSessionIds.filter((id) => {
			if (physicalIds.has(id)) return true;
			report.archivedRemoved.push(id);
			return false;
		});
		if (archivedNext.length !== state.archivedSessionIds.length) {
			await registry.setState({ ...state, archivedSessionIds: archivedNext });
		}
		// canonical cwd（realpath 规范化）→ workspaceId；workspace record.path 已规范化。
		const workspaceByPath = new Map();
		for (const workspaceId of state.workspaceIds) {
			const record = table.get(workspaceId);
			if (record !== void 0) workspaceByPath.set(record.path, workspaceId);
		}
		const canonicalBySession = new Map();
		for (const header of headers) {
			if (typeof header.cwd !== "string") {
				canonicalBySession.set(header.id, null);
				continue;
			}
			try {
				canonicalBySession.set(header.id, await realpath(header.cwd));
			} catch {
				canonicalBySession.set(header.id, null);
			}
		}
		// 2) 各工作区：幽灵移除 + 归属修正（记错工作区的移出）。
		for (const workspaceId of state.workspaceIds) {
			const record = table.get(workspaceId);
			if (record === void 0) continue;
			const ghosts = record.sessionIds.filter((id) => !physicalIds.has(id));
			const wrong = record.sessionIds.filter((id) => {
				const canonical = canonicalBySession.get(id);
				return canonical !== null && canonical !== record.path;
			});
			if (ghosts.length > 0 || wrong.length > 0) {
				const remove = new Set([...ghosts, ...wrong]);
				report.workspaceRemoved.push(...remove);
				await table.update(workspaceId, (current) => ({
					...current,
					sessionIds: current.sessionIds.filter((id) => !remove.has(id)),
					updatedAt: new Date().toISOString()
				}));
			}
		}
		// 3) 漏记补录 + 修正归属的落位。
		for (const header of headers) {
			const canonical = canonicalBySession.get(header.id);
			if (canonical === null) continue;
			const targetWorkspaceId = workspaceByPath.get(canonical);
			if (targetWorkspaceId === void 0) continue;
			const target = table.get(targetWorkspaceId);
			if (target !== void 0 && target.sessionIds.includes(header.id)) continue;
			await table.update(targetWorkspaceId, (current) => ({
				...current,
				sessionIds: current.sessionIds.includes(header.id) ? current.sessionIds : [...current.sessionIds, header.id],
				updatedAt: new Date().toISOString()
			}));
			report.workspaceAdded.push(header.id);
		}
		// 4) 投影缓存：清理无物理文件的幽灵行 + 身份对齐。
		const projCache = registry.ctx.get("sessionProjectionCache");
		if (projCache !== void 0 && typeof projCache.requireTable === "function") {
			try {
				for (const id of projCache.requireTable().keys()) {
					if (physicalIds.has(id)) continue;
					await projCache.requireTable().delete(id);
					report.projcacheRemoved.push(id);
				}
			} catch (error) {
				registry.ctx.logger.warn(`dsh-session-enhance: projection-cache ghost cleanup failed: ${String(error)}`);
			}
			report.projcacheRehomed.push(...await registry.reconcileMovedProjectionIdentities(headers));
		}
		// 4.5) 工件编码卫生：移除与后端编码相反的遗留工件。
		if (persistence !== void 0 && typeof persistence.locate === "function") {
			try {
				for (const header of headers) {
					const location = persistence.locate(header);
					if (location === void 0 || typeof location.path !== "string") continue;
					const canonical = basename(location.path);
					const opposite = canonical.endsWith(".zstd") ? canonical.slice(0, -".zstd".length) : `${canonical}.zstd`;
					const dir = dirname(location.path);
					try {
						const entries = await readdir(dir, { withFileTypes: true });
						for (const entry of entries) {
							if (entry.isFile() && entry.name === opposite) {
								await rm(join(dir, entry.name), { force: true });
								report.artifactMismatchesRemoved.push(join(dir, entry.name));
							}
						}
					} catch (error) {
						if (error?.code !== "ENOENT") throw error;
					}
				}
			} catch (error) {
				registry.ctx.logger.warn(`dsh-session-enhance: artifact-encoding cleanup failed: ${String(error)}`);
			}
		}
		// 5) 重建 header 索引：以当前物理列表为准。
		await registry.replaceHeaderIndex(headers);
		registry.ctx.logger.info(`dsh-session-enhance: synced records against ${headers.length} physical session(s): +${report.workspaceAdded.length} accounted, -${report.archivedRemoved.length + report.workspaceRemoved.length + report.projcacheRemoved.length} ghosts, ${report.projcacheRehomed.length} projection identities rehomed, ${report.artifactMismatchesRemoved.length} mismatched artifacts removed`);
		return report;
	});
}
