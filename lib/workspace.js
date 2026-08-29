import { Service } from "@deepseek-ai/cordis";
import { WorkspaceRegistry } from "@deepseek-ai/dsh-workspace";
import { bindTypertRemote } from "@deepseek-ai/dsh-typert-protocol";
import { dshHomePath } from "@deepseek-ai/dsh-home-paths";
import { trackTombstone } from "./tombstone.js";
import { readSettings, sessionsRootFor, storagesRootFor, writeSettings } from "./settings.js";
import { headerIdentity } from "./shared/identity.js";
import { remoteMethod } from "./shared/contracts/remote.js";
import { settingsUpdateSchema } from "./shared/contracts/schemas.js";
import { registerHostRemote } from "./shared/contracts/invocations.js";
import { getLiveSession } from "./upstream/sessions.js";
import { disposeStaleAgent as disposeStaleAgentUpstream } from "./upstream/agents.js";
import * as archiveDomain from "./domains/archive.js";
import * as moveDomain from "./domains/move.js";
import * as deleteDomain from "./domains/delete.js";
import * as syncDomain from "./domains/sync.js";
import * as workspaceSweepDomain from "./domains/workspace-sweep.js";

/**
 * dsh-session-enhance 宿主侧会话管理。
 *
 * 作为工作区注册表门面：保留 RPC 方法注册、启动投影身份对齐、墓碑/身份
 * 探针与基础设置，把删除 / 移动 / 归档 / 同步等领域逻辑委托到 lib/domains/*
 * 的纯函数（以本实例为上下文参数）。单会话与批量方法均通过 Typert Remote
 * 暴露给浏览器，并注册到 typert.local，避免生产环境只靠 SRC 扫描时 404。
 */
var SessionEnhanceWorkspaceRegistry = class extends WorkspaceRegistry {
	static inject = [
		"storageDomain",
		"sessionPersistence",
		"sessionProjectionCache",
		"typert"
	];
	/** 本进程内已物理删除的会话；阻止父类把 stale list() 重新编入索引。 */
	deletedSessionIds = new Set();
	/** 墓碑插入顺序，用于在上限处淘汰最旧项。 */
	deletedSessionOrder = [];
	/** 墓碑上限：足够挡住 stale list()，又避免长驻进程无限增长。 */
	deletedSessionTombstoneLimit = 4096;
	/** 被删生命周期的日志身份（createdAt/cwd）：冷复用探针区分“同 id 新会话”与 stale list() 的依据。 */
	deletedIdentities = new Map();
	constructor(ctx) {
		super(ctx);
		this.typertRemote = bindTypertRemote(this, this.name);
		remoteMethod(this, "unarchiveSession");
		remoteMethod(this, "deleteSession");
		remoteMethod(this, "unarchiveSessions");
		remoteMethod(this, "deleteArchivedSessions");
		remoteMethod(this, "archivedSessionMetadata");
		remoteMethod(this, "moveSession");
		remoteMethod(this, "verifyDeleted");
		remoteMethod(this, "syncRecords");
		remoteMethod(this, "getSettings");
		remoteMethod(this, "setSettings");
		remoteMethod(this, "listEmptyWorkspaceDirectories");
		remoteMethod(this, "deleteEmptyWorkspaceDirectory");
		registerHostRemote(this.ctx);
	}
	/**
	* 服务就绪即把投影缓存行的日志身份（cwd）与物理工件 header 对齐一次。
	* fail-soft：对齐失败仅告警，绝不阻断启动；父类 init 必须先成功。
	*/
	async [Service.init]() {
		await super[Service.init]();
		try {
			const persistence = this.ctx.get("sessionPersistence");
			if (persistence === void 0 || typeof persistence.list !== "function") return;
			const rehomed = await this.reconcileMovedProjectionIdentities(await persistence.list());
			if (rehomed.length > 0) this.ctx.logger.info(`dsh-session-enhance: startup projection-identity reconcile rehomed ${rehomed.length} moved session(s) against their physical headers`);
		} catch (error) {
			this.ctx.logger.warn(`dsh-session-enhance: startup projection-identity reconcile failed (moved-session titles fall back until reopened): ${String(error)}`);
		}
	}
	/**
	* 把投影缓存行的身份 cwd 与权威物理 header 对齐：仅改写同一生命周期
	* （createdAt 相同）但 cwd 陈旧的存量行。供启动对齐与手动对账复用。
	* @param headers - 权威物理 header 列表。
	* @returns 实际被 rehome 的会话 id 列表。
	*/
	async reconcileMovedProjectionIdentities(headers) {
		const projCache = this.ctx.get("sessionProjectionCache");
		if (projCache === void 0 || typeof projCache.requireTable !== "function" || typeof projCache.rehome !== "function") return [];
		let table;
		try {
			table = projCache.requireTable();
		} catch (error) {
			this.ctx.logger.warn(`dsh-session-enhance: projection-identity reconcile could not access the cache table: ${String(error)}`);
			return [];
		}
		const rehomed = [];
		for (const header of headers) {
			const record = table.get(header.id);
			if (record === void 0 || record.identity.createdAt !== header.createdAt) continue;
			const storedCwd = record.identity.cwd ?? null;
			const headerCwd = typeof header.cwd === "string" ? header.cwd : null;
			if (storedCwd === headerCwd) continue;
			try {
				await projCache.rehome(header.id, {
					createdAt: header.createdAt,
					...headerCwd === null ? {} : { cwd: headerCwd }
				});
				rehomed.push(header.id);
			} catch (error) {
				this.ctx.logger.warn(`dsh-session-enhance: projection-identity reconcile for "${header.id}" failed: ${String(error)}`);
			}
		}
		return rehomed;
	}
	/** 基础设置配置文件路径（落在 DSH 家目录下）。 */
	settingsFile() {
		return dshHomePath("session-enhance-settings.json");
	}
	/** `~/storages` 目录（尊重用户配置的 `.dsh` 家目录）。 */
	async storagesRoot() {
		const settings = await readSettings(this.settingsFile());
		return storagesRootFor(settings.homeDir);
	}
	/** `~/sessions` 目录（会话转录根目录，尊重用户配置的 `.dsh` 家目录）。 */
	async sessionsRoot() {
		const settings = await readSettings(this.settingsFile());
		return sessionsRootFor(settings.homeDir);
	}
	/** 读取「基础设置」（`.dsh` 家目录 + 对话通知开关）。 */
	async getSettings() {
		return readSettings(this.settingsFile());
	}
	/** 写入「基础设置」；未提供的字段保持原值。 */
	async setSettings(settings) {
		settings = settingsUpdateSchema.parse(settings);
		const current = await readSettings(this.settingsFile());
		return writeSettings({
			homeDir: settings.homeDir ?? current.homeDir,
			notifyEnabled: settings.notifyEnabled ?? current.notifyEnabled
		}, this.settingsFile());
	}
	// —— 归档域 ——
	async archivedSessionMetadata() {
		return archiveDomain.archivedSessionMetadata(this);
	}
	async unarchiveSession(sessionId) {
		return archiveDomain.unarchiveSession(this, sessionId);
	}
	async unarchiveSessions(target) {
		return archiveDomain.unarchiveSessions(this, target);
	}
	async deleteArchivedSessions(target) {
		return archiveDomain.deleteArchivedSessions(this, target);
	}
	archivedSessionIdsForTarget(target) {
		return archiveDomain.archivedSessionIdsForTarget(this, target);
	}
	// —— 删除域 ——
	async deleteSession(sessionId) {
		return deleteDomain.deleteSession(this, sessionId);
	}
	async deleteSessionCore(sessionId) {
		return deleteDomain.deleteSessionCore(this, sessionId);
	}
	async sweepStorageTraces(sessionId) {
		return deleteDomain.sweepStorageTraces(this, sessionId);
	}
	async verifyPhysicalDeletion(sessionId, transcriptDir) {
		return deleteDomain.verifyPhysicalDeletion(this, sessionId, transcriptDir);
	}
	async verifyDeleted(sessionId) {
		return deleteDomain.verifyDeleted(this, sessionId);
	}
	async removeTranscriptDirectory(sessionId) {
		return deleteDomain.removeTranscriptDirectory(this, sessionId);
	}
	async removeFromWorkspaceAccounts(sessionId) {
		return deleteDomain.removeFromWorkspaceAccounts(this, sessionId);
	}
	async deleteDescendants(sessionId) {
		return deleteDomain.deleteDescendants(this, sessionId);
	}
	async cleanSpill(sessionId) {
		return deleteDomain.cleanSpill(this, sessionId);
	}
	// —— 移动域 ——
	async moveSession(sessionId, targetWorkspaceId) {
		return moveDomain.moveSession(this, sessionId, targetWorkspaceId);
	}
	async rehomeMovedSessionProjection(sessionId, header, newCwd) {
		return moveDomain.rehomeMovedSessionProjection(this, sessionId, header, newCwd);
	}
	async resolveTranscriptDirectory(sessionId) {
		return moveDomain.resolveTranscriptDirectory(this, sessionId);
	}
	// —— 同步域 ——
	async syncRecords() {
		return syncDomain.syncRecords(this);
	}
	// —— 空工作区目录清理域 ——
	async listEmptyWorkspaceDirectories() {
		return workspaceSweepDomain.listEmptyWorkspaceDirectories(this);
	}
	async deleteEmptyWorkspaceDirectory(name) {
		return workspaceSweepDomain.deleteEmptyWorkspaceDirectory(this, name);
	}
	/** 释放仍持有已脱离/已删除会话对象的 agent（薄委托到上游隔离层）。 */
	async disposeStaleAgent(sessionId) {
		await disposeStaleAgentUpstream(this.ctx, sessionId);
	}
	/** 从父类内存索引中遗忘已删除会话，并阻止后续 indexHeaders 把它加回。 */
	clearTombstone(sessionId) {
		this.deletedSessionIds.delete(sessionId);
		this.deletedIdentities.delete(sessionId);
		const idx = this.deletedSessionOrder.indexOf(sessionId);
		if (idx !== -1) this.deletedSessionOrder.splice(idx, 1);
	}
	forgetIndexedSession(sessionId) {
		for (const evicted of trackTombstone(this.deletedSessionIds, this.deletedSessionOrder, sessionId, this.deletedSessionTombstoneLimit)) this.deletedIdentities.delete(evicted);
		this.headers.delete(sessionId);
		this.sessionPaths.delete(sessionId);
		this.invalidSessionPaths.delete(sessionId);
	}
	/**
	* 已删除会话对归档/删除入口都视为未知。实时复用同一 id 时撤墓碑。
	*/
	async sessionKnown(id) {
		if (getLiveSession(this.ctx, id) !== void 0) {
			this.clearTombstone(id);
			return true;
		}
		if (this.deletedSessionIds.has(id)) return this.coldReuseKnown(id);
		return super.sessionKnown(id);
	}
	/** 墓碑分支的冷复用探针：区分同 id 新生命周期与 stale list()。 */
	async coldReuseKnown(id) {
		const deletedIdentity = this.deletedIdentities.get(id);
		if (deletedIdentity === void 0) return false;
		const persistence = this.ctx.get("sessionPersistence");
		if (persistence === void 0 || typeof persistence.list !== "function") return false;
		let header;
		try {
			header = (await persistence.list()).find((item) => item.id === id);
		} catch (error) {
			this.ctx.logger.warn(`dsh-session-enhance: cold-reuse probe for "${id}" failed: ${String(error)}`);
			return false;
		}
		if (header === void 0) return false;
		const listed = headerIdentity(header);
		if (listed.createdAt === deletedIdentity.createdAt && listed.cwd === deletedIdentity.cwd) return false;
		this.clearTombstone(id);
		await this.indexHeader(header);
		return true;
	}
	/** 父类 indexHeaders 只增不减；跳过墓碑 id，避免 stale list() 复活。 */
	async indexHeader(header) {
		if (this.deletedSessionIds.has(header.id)) return;
		return super.indexHeader(header);
	}
};
export { SessionEnhanceWorkspaceRegistry, SessionEnhanceWorkspaceRegistry as default };
