import { realpath, rm, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { Service } from "@deepseek-ai/cordis";
import { WorkspaceRegistry } from "@deepseek-ai/dsh-workspace";
import { bindTypertRemote, Remote } from "@deepseek-ai/dsh-typert-protocol";
import { sessionDir } from "@deepseek-ai/dsh-spill-local";
import { dshHomePath } from "@deepseek-ai/dsh-home-paths";
import { trackTombstone } from "./tombstone.js";
import { storageRootHasTraces, sweepStorageRoot } from "./storage-sweep.js";
import { physicallyMoveSession } from "./session-move.js";
//#region lib/types/index.js
/**
* dsh-session-enhance 宿主侧会话管理。
*
* 在参考实现（@michengai/dsh-archive-manager）的归档语义之上，dsh-session-enhance
* 增强了两处能力：
*
* 1. 物理删除保证：
*    - 转录目录删除带重试：实时会话 flush 分离后，Windows 上文件句柄可能
*      延迟释放，目录删除以短间隔重试数次，避免瞬时占用导致残留。
*    - `~/storages/*.json` 磁盘清扫：服务层写链全部落定后，直接读取
*      workspace.json / session_projcache.json 等单元文件，递归移除该会话
*      的全部痕迹（archivedSessionIds、各工作区 sessionIds、投影缓存行），
*      原子写回。即使批量写、崩溃或第三方直写把旧行写回磁盘，清扫也会
*      把文件修正为不含该会话的状态；并随后验证并告警残留。
* 2. `moveSession`：把一个会话移动到另一个工作区（或移出所有工作区成为
*    未分组），供浏览器端拖拽修改会话归属。归档状态与工作区归属正交，
*    移动不改变 archivedSessionIds。
*
* `deleteSession(sessionId)` 的顺序即语义：校验已知会话；实时会话先
* flush 再 detach；等待投影缓存写入完成；移除归档标记和工作区记账；
* 删除投影缓存，级联删除 SUBAGENT 子会话并清理 spill；删除转录目录
* （重试）；清扫 storages 磁盘文件；验证物理删除结果；最后遗忘父类
* 内存索引并打上删除墓碑。fork 分支虽有 `parentSession`，但属于独立
* 用户会话，不参与级联。
*
* 所有可失败的持久化清理都先于不可逆的物理删除。此前任一步失败时，
* 转录仍保留，可重试删除；物理删除失败时记录残留路径供人工排查。
* 物理删除成功后必须遗忘父类内存索引（headers / sessionPaths /
* invalidSessionPaths）并打上删除墓碑：父类 sessionKnown 以 headers.has
* 短路，indexHeaders 只增不减，stale list() 否则会把已删 id 救活，
* 进而被 archiveSession 重新写回 archivedSessionIds。
* 墓碑同时记录被删生命周期的日志身份（createdAt/cwd）：其他进程以同 id
* 重建并落盘新会话时（冷复用），sessionKnown 的探针以身份差异区分新旧
* 生命周期并撤掉墓碑，避免已重建的会话在本进程永久 UNKNOWN_SESSION。
* 单会话与批量恢复/删除方法均通过 Typert Remote 暴露给浏览器，并注册到
* typert.local，避免生产环境只靠 SRC 扫描时 404。
*/
function markRemoteMethod(instance, method) {
	// 模拟 TS 装饰器管线 `@Remote(method)`：`Remote` 返回标准方法装饰器，
	// 这里构造一个 addInitializer 立即以 `this` = instance 执行的装饰器上下文。
	const context = {
		private: false,
		static: false,
		name: method,
		addInitializer(fn) {
			fn.call(instance);
		}
	};
	Remote(method)(void 0, context);
}
function unknownSessionMessage(sessionId) {
	return `unknown session "${sessionId}" (UNKNOWN_SESSION)`;
}
var SessionEnhanceUnknownSessionError = class extends Error {
	sessionId;
	constructor(sessionId) {
		super(unknownSessionMessage(sessionId));
		this.sessionId = sessionId;
		this.name = "SessionEnhanceUnknownSessionError";
	}
}
/** 头部投影到“日志身份”字段（与投影缓存的 identity 语义一致）。cwd 缺失统一归一为 null，避免一侧带键一侧不带键时的比较歧义。 */
function headerIdentity(header) {
	return {
		createdAt: header.createdAt,
		cwd: header.cwd ?? null
	};
}
const sessionIdSchema = {
	parse(value) {
		if (typeof value !== "string" || value.length === 0) throw new TypeError(`sessionId must be a non-empty string, got ${String(value)}`);
		return value;
	}
};
const workspaceTargetSchema = {
	parse(value) {
		if (value === null) return null;
		if (typeof value === "string" && value.length > 0) return value;
		throw new TypeError("targetWorkspaceId must be a non-empty string (workspace) or null (ungrouped)");
	}
};
const archivedSetSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
		const ids = value.archivedSessionIds;
		if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) throw new TypeError("archivedSessionIds must be a string array");
		return value;
	}
};
const deletedSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value) || value.deleted !== true) throw new TypeError("deleted must be true");
		return value;
	}
};
const archivedBatchTargetSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("target must be an object");
		if (value.scope === "all" || value.scope === "ungrouped") return value;
		if (value.scope === "workspace" && typeof value.workspaceId === "string" && value.workspaceId.length > 0) return value;
		throw new TypeError("target.scope must be all, ungrouped, or workspace with a non-empty workspaceId");
	}
};
const unarchivedBatchSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
		if (!Array.isArray(value.archivedSessionIds) || value.archivedSessionIds.some((id) => typeof id !== "string")) throw new TypeError("archivedSessionIds must be a string array");
		if (!Array.isArray(value.unarchivedSessionIds) || value.unarchivedSessionIds.some((id) => typeof id !== "string")) throw new TypeError("unarchivedSessionIds must be a string array");
		return value;
	}
};
const deletedBatchSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
		for (const key of ["requestedSessionIds", "deletedSessionIds", "skippedSessionIds"]) {
			if (!Array.isArray(value[key]) || value[key].some((id) => typeof id !== "string")) throw new TypeError(`${key} must be a string array`);
		}
		if (!Array.isArray(value.failures) || value.failures.some((failure) => typeof failure !== "object" || failure === null || typeof failure.sessionId !== "string" || typeof failure.message !== "string")) throw new TypeError("failures must contain sessionId/message objects");
		return value;
	}
};
const archivedSessionMetadataSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value) || !Array.isArray(value.items)) throw new TypeError("result.items must be an array");
		if (value.items.some((item) => typeof item !== "object" || item === null || typeof item.sessionId !== "string" || typeof item.createdAt !== "number" || !Number.isFinite(item.createdAt))) throw new TypeError("items must contain sessionId/createdAt objects");
		return value;
	}
};
const moveSessionSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
		if (typeof value.sessionId !== "string" || value.sessionId.length === 0) throw new TypeError("sessionId must be a non-empty string");
		if (typeof value.workspaceId !== "string") throw new TypeError("workspaceId must be a string (empty means ungrouped)");
		if (typeof value.previousWorkspaceId !== "string") throw new TypeError("previousWorkspaceId must be a string (empty means ungrouped)");
		return value;
	}
};
const deletionVerificationSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
		if (typeof value.sessionId !== "string" || value.sessionId.length === 0) throw new TypeError("sessionId must be a non-empty string");
		if (typeof value.transcriptExists !== "boolean") throw new TypeError("transcriptExists must be a boolean");
		if (!Array.isArray(value.storageTraces) || value.storageTraces.some((file) => typeof file !== "string")) throw new TypeError("storageTraces must be a string array");
		return value;
	}
};
const syncRecordsSchema = {
	parse(value) {
		if (typeof value !== "object" || value === null || Array.isArray(value)) throw new TypeError("result must be an object");
		if (!Number.isSafeInteger(value.scanned) || value.scanned < 0) throw new TypeError("scanned must be a non-negative safe integer");
		for (const key of ["archivedRemoved", "workspaceRemoved", "workspaceAdded", "projcacheRemoved"]) {
			if (!Array.isArray(value[key]) || value[key].some((id) => typeof id !== "string")) throw new TypeError(`${key} must be a string array`);
		}
		return value;
	}
};
/**
* Host 严格描述符。网关优先读 typert.local，避免 SRC 扫描缓存
* 或协议包双份导致 /api/workspaceRegistry/deleteSession 在生产环境 404。
*/
const SESSION_ENHANCE_INVOCATIONS = [
	{
		id: "dsh-session-enhance#workspaceRegistry/unarchiveSession",
		service: "workspaceRegistry",
		namespace: "workspaceRegistry",
		method: "unarchiveSession",
		invocation: { kind: "direct" },
		parameters: [{
			name: "sessionId",
			wire: "sessionId",
			source: "json",
			codec: { mode: "strict", typeSymbol: "@deepseek-ai/dsh-session/types#SessionId", schema: sessionIdSchema }
		}],
		result: {
			mode: "strict",
			typeSymbol: "dsh-session-enhance/types#ArchivedSessionIds",
			schema: archivedSetSchema
		},
		sourceLocation: { file: "dsh-session-enhance/lib/workspace.js", line: 1, column: 1 }
	},
	{
		id: "dsh-session-enhance#workspaceRegistry/deleteSession",
		service: "workspaceRegistry",
		namespace: "workspaceRegistry",
		method: "deleteSession",
		invocation: { kind: "direct" },
		parameters: [{
			name: "sessionId",
			wire: "sessionId",
			source: "json",
			codec: { mode: "strict", typeSymbol: "@deepseek-ai/dsh-session/types#SessionId", schema: sessionIdSchema }
		}],
		result: {
			mode: "strict",
			typeSymbol: "dsh-session-enhance/types#Deleted",
			schema: deletedSchema
		},
		sourceLocation: { file: "dsh-session-enhance/lib/workspace.js", line: 1, column: 1 }
	},
	{
		id: "dsh-session-enhance#workspaceRegistry/unarchiveSessions",
		service: "workspaceRegistry",
		namespace: "workspaceRegistry",
		method: "unarchiveSessions",
		invocation: { kind: "direct" },
		parameters: [{
			name: "target",
			wire: "target",
			source: "json",
			codec: { mode: "strict", typeSymbol: "dsh-session-enhance/types#ArchivedBatchTarget", schema: archivedBatchTargetSchema }
		}],
		result: {
			mode: "strict",
			typeSymbol: "dsh-session-enhance/types#UnarchivedBatch",
			schema: unarchivedBatchSchema
		},
		sourceLocation: { file: "dsh-session-enhance/lib/workspace.js", line: 1, column: 1 }
	},
	{
		id: "dsh-session-enhance#workspaceRegistry/deleteArchivedSessions",
		service: "workspaceRegistry",
		namespace: "workspaceRegistry",
		method: "deleteArchivedSessions",
		invocation: { kind: "direct" },
		parameters: [{
			name: "target",
			wire: "target",
			source: "json",
			codec: { mode: "strict", typeSymbol: "dsh-session-enhance/types#ArchivedBatchTarget", schema: archivedBatchTargetSchema }
		}],
		result: {
			mode: "strict",
			typeSymbol: "dsh-session-enhance/types#DeletedBatch",
			schema: deletedBatchSchema
		},
		sourceLocation: { file: "dsh-session-enhance/lib/workspace.js", line: 1, column: 1 }
	},
	{
		id: "dsh-session-enhance#workspaceRegistry/archivedSessionMetadata",
		service: "workspaceRegistry",
		namespace: "workspaceRegistry",
		method: "archivedSessionMetadata",
		invocation: { kind: "direct" },
		parameters: [],
		result: {
			mode: "strict",
			typeSymbol: "dsh-session-enhance/types#ArchivedSessionMetadata",
			schema: archivedSessionMetadataSchema
		},
		sourceLocation: { file: "dsh-session-enhance/lib/workspace.js", line: 1, column: 1 }
	},
	{
		id: "dsh-session-enhance#workspaceRegistry/moveSession",
		service: "workspaceRegistry",
		namespace: "workspaceRegistry",
		method: "moveSession",
		invocation: { kind: "direct" },
		parameters: [{
			name: "sessionId",
			wire: "sessionId",
			source: "json",
			codec: { mode: "strict", typeSymbol: "@deepseek-ai/dsh-session/types#SessionId", schema: sessionIdSchema }
		}, {
			name: "targetWorkspaceId",
			wire: "targetWorkspaceId",
			source: "json",
			codec: { mode: "strict", typeSymbol: "dsh-session-enhance/types#WorkspaceTarget", schema: workspaceTargetSchema }
		}],
		result: {
			mode: "strict",
			typeSymbol: "dsh-session-enhance/types#SessionMoved",
			schema: moveSessionSchema
		},
		sourceLocation: { file: "dsh-session-enhance/lib/workspace.js", line: 1, column: 1 }
	},
	{
		id: "dsh-session-enhance#workspaceRegistry/verifyDeleted",
		service: "workspaceRegistry",
		namespace: "workspaceRegistry",
		method: "verifyDeleted",
		invocation: { kind: "direct" },
		parameters: [{
			name: "sessionId",
			wire: "sessionId",
			source: "json",
			codec: { mode: "strict", typeSymbol: "@deepseek-ai/dsh-session/types#SessionId", schema: sessionIdSchema }
		}],
		result: {
			mode: "strict",
			typeSymbol: "dsh-session-enhance/types#DeletionVerification",
			schema: deletionVerificationSchema
		},
		sourceLocation: { file: "dsh-session-enhance/lib/workspace.js", line: 1, column: 1 }
	},
	{
		id: "dsh-session-enhance#workspaceRegistry/syncRecords",
		service: "workspaceRegistry",
		namespace: "workspaceRegistry",
		method: "syncRecords",
		invocation: { kind: "direct" },
		parameters: [],
		result: {
			mode: "strict",
			typeSymbol: "dsh-session-enhance/types#SyncRecords",
			schema: syncRecordsSchema
		},
		sourceLocation: { file: "dsh-session-enhance/lib/workspace.js", line: 1, column: 1 }
	}
];
const SESSION_ENHANCE_TYPERT = {
	package: "dsh-session-enhance",
	face: "host",
	schemas: [],
	model: { services: [], events: [], objects: [] },
	invocations: SESSION_ENHANCE_INVOCATIONS
};
function registerHostRemote(ctx) {
	const existing = ctx.get("typert");
	if (existing !== undefined) {
		existing.register(SESSION_ENHANCE_TYPERT);
		return;
	}
	ctx.inject(["typert"], (typertCtx) => {
		typertCtx.typert.register(SESSION_ENHANCE_TYPERT);
	});
}
var SessionEnhanceWorkspaceRegistry = class extends WorkspaceRegistry {
	static inject = [
		"storageDomain",
		"sessionPersistence",
		"sessionProjectionCache",
		"typert"
	];
	/** 本进程内已物理删除的会话；阻止父类把 stale list() 重新编入索引。 */
	deletedSessionIds = /* @__PURE__ */ new Set();
	/** 墓碑插入顺序，用于在上限处淘汰最旧项。 */
	deletedSessionOrder = [];
	/** 墓碑上限：足够挡住 stale list()，又避免长驻进程无限增长。 */
	deletedSessionTombstoneLimit = 4096;
	/** 被删生命周期的日志身份（createdAt/cwd）：冷复用探针区分“同 id 新会话”与 stale list() 的依据。 */
	deletedIdentities = /* @__PURE__ */ new Map();
	constructor(ctx) {
		super(ctx);
		this.typertRemote = bindTypertRemote(this, this.name);
		markRemoteMethod(this, "unarchiveSession");
		markRemoteMethod(this, "deleteSession");
		markRemoteMethod(this, "unarchiveSessions");
		markRemoteMethod(this, "deleteArchivedSessions");
		markRemoteMethod(this, "archivedSessionMetadata");
		markRemoteMethod(this, "moveSession");
		markRemoteMethod(this, "verifyDeleted");
		markRemoteMethod(this, "syncRecords");
		registerHostRemote(this.ctx);
	}
	/**
	* 服务就绪即把投影缓存行的日志身份（cwd）与物理工件 header 对齐一次。
	*
	* 跨工作区移动会改写工件 header 的 cwd 并即时 `rehome` 投影缓存行；但若
	* 移动发生在上一次运行、且当时的 rehome 未能把新身份持久化（进程退出
	* 时序 / detach 在途旧身份写入的竞态），重启后 `session_projcache` 行仍
	* 绑定旧 cwd——`cachedSnapshot` 的 identityMatches 校验失败，`session.list`
	* 冷列缺失该会话的标题投影，侧栏回退显示其所在工作区名，直到会话被点开
	* 触发冷读重建（即「重启后跨工作区移动的对话有概率显示为工作区名」）。
	* 父类 init 完成引导后、首次冷列被服务前，这里按物理 header 一次性对齐
	* 所有陈旧行身份，把「点开才恢复」的旧行为提前到启动即恢复。
	*
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
	* （createdAt 相同）但 cwd 陈旧的存量行，`rehome` 到 header 的当前 cwd。
	* 缺失行不处理（冷读会以新身份重建）；每行独立容错，一行失败不影响其余。
	* 供启动对齐（{@link Service.init}）与手动对账（{@link syncRecords}）复用。
	* @param headers - 权威物理 header 列表（`persistence.list()` 的结果）。
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
	/** `~/storages` 目录（尊重 $DSH_HOME 覆盖）。 */
	storagesRoot() {
		return dshHomePath("storages");
	}
	/** 归档设置页创建时间排序所需的最小元数据；列表摘要本身只暴露 updatedAt。 */
	async archivedSessionMetadata() {
		const items = [];
		for (const sessionId of [...new Set(this.requireState().archivedSessionIds)]) {
			try {
				const header = await this.readSessionHeader(sessionId);
				if (typeof header.createdAt === "number" && Number.isFinite(header.createdAt)) items.push({ sessionId, createdAt: header.createdAt });
			} catch (error) {
				this.ctx.logger.warn(`dsh-session-enhance: could not read creation time for archived session "${sessionId}": ${String(error)}`);
			}
		}
		return { items };
	}
	/**
	* 把一个会话移出注册表全局归档集合，恢复其正常可见性（其记账位从未
	* 移动，会话在原工作区位置重新出现）。幂等：未归档的已知会话直接返回
	* 当前集合不写入；未知会话与 `archiveSession` 一样抛错。
	* @param sessionId - 要取消归档的会话。
	* @returns 更新后的完整归档集合。
	*/
	async unarchiveSession(sessionId) {
		return this.enqueueOperation(async () => {
			if (!await this.sessionKnown(sessionId)) throw new SessionEnhanceUnknownSessionError(sessionId);
			const state = this.requireState();
			if (!state.archivedSessionIds.includes(sessionId)) return { archivedSessionIds: [...state.archivedSessionIds] };
			const next = {
				...state,
				archivedSessionIds: state.archivedSessionIds.filter((id) => id !== sessionId)
			};
			await this.setState(next);
			return { archivedSessionIds: [...next.archivedSessionIds] };
		});
	}
	/**
	* 按宿主权威归档集合一次恢复全部、一个工作区或未分组的归档会话。
	* 目标全部来自已归档集合，因此即使日志已被外部移除，也会清掉陈旧归档标记。
	*/
	async unarchiveSessions(target) {
		return this.enqueueOperation(async () => {
			const unarchivedSessionIds = this.archivedSessionIdsForTarget(target);
			if (unarchivedSessionIds.length === 0) return {
				archivedSessionIds: [...this.requireState().archivedSessionIds],
				unarchivedSessionIds: []
			};
			const restored = new Set(unarchivedSessionIds);
			const state = this.requireState();
			const next = {
				...state,
				archivedSessionIds: state.archivedSessionIds.filter((id) => !restored.has(id))
			};
			await this.setState(next);
			return {
				archivedSessionIds: [...next.archivedSessionIds],
				unarchivedSessionIds
			};
		});
	}
	/**
	* 按作用域永久删除归档会话。跨会话文件删除无法组成事务，因此继续处理
	* 后续目标并把成功、并发消失和失败分别返回给客户端。
	*/
	async deleteArchivedSessions(target) {
		return this.enqueueOperation(async () => {
			const requestedSessionIds = this.archivedSessionIdsForTarget(target);
			const deletedSessionIds = [];
			const skippedSessionIds = [];
			const failures = [];
			for (const sessionId of requestedSessionIds) {
				try {
					await this.deleteSessionCore(sessionId);
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
	archivedSessionIdsForTarget(target) {
		target = archivedBatchTargetSchema.parse(target);
		const state = this.requireState();
		const archivedSessionIds = [...new Set(state.archivedSessionIds)];
		if (target.scope === "all") return archivedSessionIds;
		if (target.scope === "workspace") {
			const workspace = this.requireTable().get(target.workspaceId);
			if (workspace === void 0) throw new Error(`unknown workspace "${target.workspaceId}"`);
			const accounted = new Set(workspace.sessionIds);
			return archivedSessionIds.filter((id) => accounted.has(id));
		}
		const accounted = /* @__PURE__ */ new Set();
		const table = this.requireTable();
		for (const workspaceId of state.workspaceIds) {
			for (const sessionId of table.get(workspaceId)?.sessionIds ?? []) accounted.add(sessionId);
		}
		return archivedSessionIds.filter((id) => !accounted.has(id));
	}
	/**
	* 永久删除一个会话及其全部痕迹（转录目录、工作区记账、归档标记、
	* 投影缓存行，以及 `~/storages/*.json` 磁盘文件）。
	* @param sessionId - 要删除的会话。
	* @returns 持久化完成后的 `{ deleted: true }`。
	* @throws {@link SessionEnhanceUnknownSessionError} 会话未知时抛出。
	*/
	async deleteSession(sessionId) {
		return this.enqueueOperation(() => this.deleteSessionCore(sessionId));
	}
	/** 串行化后的删除主体（级联路径复用：它已持有操作链，绝不能再入队）。 */
	async deleteSessionCore(sessionId) {
		if (!await this.sessionKnown(sessionId)) throw new SessionEnhanceUnknownSessionError(sessionId);
		const sessions = this.ctx.get("sessions");
		const live = sessions?.get(sessionId);
		// 先记录被删生命周期的日志身份：目录删除后头部不可再读，
		// 冷复用探针（sessionKnown 墓碑分支）靠它区分同 id 的新生命周期。
		const deletedHeader = this.headers.get(sessionId) ?? live?.header;
		if (live !== void 0) {
			// 持久化屏障先行：不能有未落盘的转录写入与目录删除竞争
			//（持久化后端按批关闭句柄，flush 过的会话不再持有打开的文件）。
			await sessions.flush(live);
			// 从存储分离；`session/disposed` 同步触发，驱动浏览器端的
			// `host/session-removed` 帧并启动投影缓存的最终写后落盘。
			const entry = sessions.liveEntryFor(live);
			sessions.detachEntered(entry);
			// 旧 agent 仍持有已删除会话的对象：不释放的话后续 prompt 会
			// 写入脱离对象（事件不广播、不落盘，消息静默丢失）。
			await this.disposeStaleAgent(sessionId);
		} else if (sessions !== void 0) await this.publishColdSessionRemoval(sessionId, sessions);
		const projCache = this.ctx.get("sessionProjectionCache");
		// dispose 的写后落盘必须先于缓存行删除完成，
		// 否则该行会在删除之后被写回（复活）。
		await projCache?.whenIdle?.();
		// 物理删除不可逆：先完成所有可失败的持久化清理，失败时仍可重试。
		const state = this.requireState();
		if (state.archivedSessionIds.includes(sessionId)) {
			await this.setState({
				...state,
				archivedSessionIds: state.archivedSessionIds.filter((id) => id !== sessionId)
			});
		}
		await this.removeFromWorkspaceAccounts(sessionId);
		if (projCache !== void 0) await projCache.delete(sessionId);
		await this.deleteDescendants(sessionId);
		await this.cleanSpill(sessionId);
		const transcriptDir = await this.removeTranscriptDirectory(sessionId);
		// 增强 1：服务层写链已全部落定，直接清扫磁盘上的
		// `~/storages/*.json`，保证任何记账痕迹都不再残留。
		await this.sweepStorageTraces(sessionId);
		// 增强 2：物理删除后验证磁盘状态，残留仅告警不抛错
		//（删除已提交，抛错只会让批量删除把已删会话误报为失败）。
		await this.verifyPhysicalDeletion(sessionId, transcriptDir);
		// 物理删除已成功：此时再清父类索引。失败时保留索引，便于重试。
		this.forgetIndexedSession(sessionId);
		if (deletedHeader !== void 0) this.deletedIdentities.set(sessionId, headerIdentity(deletedHeader));
		return { deleted: true };
	}
	/**
	* 直接清扫 `~/storages/*.json` 磁盘文件，移除 sessionId 的全部痕迹。
	* 所有失败降级为日志告警（服务层内存已更新，清扫只是磁盘一致性兜底）。
	*/
	async sweepStorageTraces(sessionId) {
		await sweepStorageRoot(this.storagesRoot(), sessionId, this.ctx.logger);
	}
	/**
	* 删除后验证。检查转录目录与 storages 文件是否仍残留该会话，
	* 有残留时记录告警路径供人工排查，绝不抛错（删除已提交）。
	* @param sessionId - 已删除的会话 id。
	* @param transcriptDir - removeTranscriptDirectory 返回的转录目录路径。
	* @returns 验证报告 `{ sessionId, transcriptExists, storageTraces }`。
	*/
	async verifyPhysicalDeletion(sessionId, transcriptDir) {
		const transcriptExists = transcriptDir !== void 0 && transcriptDir !== null && existsSync(transcriptDir);
		const storageTraces = await storageRootHasTraces(this.storagesRoot(), sessionId);
		if (transcriptExists || storageTraces.length > 0) {
			const leftovers = [
				...(transcriptExists ? [`transcript directory "${transcriptDir}"`] : []),
				...storageTraces.map((file) => `storage file "${file}"`)
			].join(", ");
			this.ctx.logger.warn(`dsh-session-enhance: session "${sessionId}" was deleted but physical leftovers remain: ${leftovers}`);
		} else {
			this.ctx.logger.info(`dsh-session-enhance: session "${sessionId}" physically deleted (transcript + storages/*.json verified clean)`);
		}
		return { sessionId, transcriptExists, storageTraces };
	}
	/**
	* 对外暴露的删除后验证远程方法（宿主侧诊断，客户端暂未接线）。
	* @param sessionId - 已删除的会话 id。
	* @returns `{ sessionId, transcriptExists, storageTraces }`。
	*/
	async verifyDeleted(sessionId) {
		const transcriptDir = await this.resolveTranscriptDirectory(sessionId);
		return this.verifyPhysicalDeletion(sessionId, transcriptDir);
	}
	/**
	* 按实际物理 session 文件同步 storages 记录（防用户手动修改/删除文件后不一致）。
	*
	* 对账规则（以 `persistence.list()` 的物理 header 为权威）：
	* 1. 幽灵清理：归档集合、各工作区 sessionIds、投影缓存行中无物理文件的
	*    session id 一律移除；
	* 2. 归属修正：已记账但 canonical cwd 属于另一工作区（或不属于任何工作区）
	*    的会话移出原工作区；canonical cwd 无匹配工作区的成为未分组；
	* 3. 漏记补录：物理存在且 canonical cwd 匹配某工作区但未记账的会话加入该
	*    工作区（cwd 不可解析时保守不动）。
	* 最后重建 header 索引（headers / sessionPaths / invalidSessionPaths），
	* 使成员过滤（sessionPath === record.path）与新的记账一致。
	* @returns `{ scanned, archivedRemoved, workspaceRemoved, workspaceAdded, projcacheRemoved }`。
	*/
	async syncRecords() {
		return this.enqueueOperation(async () => {
			const persistence = this.ctx.get("sessionPersistence");
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
			const state = this.requireState();
			const table = this.requireTable();
			// 1) 归档集合：清理幽灵。
			const archivedNext = state.archivedSessionIds.filter((id) => {
				if (physicalIds.has(id)) return true;
				report.archivedRemoved.push(id);
				return false;
			});
			if (archivedNext.length !== state.archivedSessionIds.length) {
				await this.setState({ ...state, archivedSessionIds: archivedNext });
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
						updatedAt: (/* @__PURE__ */ new Date()).toISOString()
					}));
				}
			}
			// 3) 漏记补录 + 修正归属的落位：canonical cwd 匹配某工作区的会话必须记账于该工作区。
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
					updatedAt: (/* @__PURE__ */ new Date()).toISOString()
				}));
				report.workspaceAdded.push(header.id);
			}
			// 4) 投影缓存：清理无物理文件的幽灵行（直接删行，不登记墓碑——
			//    文件日后被恢复时缓存可正常重建）；同时把身份 cwd 与工件 header
			//    不一致的存量行改写为新身份（物理移动后遗留的旧 cwd 身份会让
			//    cachedSnapshot 校验失败、标题投影缺失）。
			const projCache = this.ctx.get("sessionProjectionCache");
			if (projCache !== void 0 && typeof projCache.requireTable === "function") {
				try {
					for (const id of projCache.requireTable().keys()) {
						if (physicalIds.has(id)) continue;
						await projCache.requireTable().delete(id);
						report.projcacheRemoved.push(id);
					}
				} catch (error) {
					this.ctx.logger.warn(`dsh-session-enhance: projection-cache ghost cleanup failed: ${String(error)}`);
				}
				report.projcacheRehomed.push(...await this.reconcileMovedProjectionIdentities(headers));
			}
			// 4.5) 工件编码卫生：移除与后端编码相反的遗留工件（共享会话根下
			//     其他编码实例写入的明文 session.jsonl / zstd 双写会让严格
			//     读取器抛 encodingMismatch，session.list 整体 500）。
			//     另一进程仍持有句柄时删除失败，仅告警（需先停止该实例）。
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
					this.ctx.logger.warn(`dsh-session-enhance: artifact-encoding cleanup failed: ${String(error)}`);
				}
			}
			// 5) 重建 header 索引：以当前物理列表为准（清除已消失会话的内存痕迹）。
			await this.replaceHeaderIndex(headers);
			this.ctx.logger.info(`dsh-session-enhance: synced records against ${headers.length} physical session(s): +${report.workspaceAdded.length} accounted, -${report.archivedRemoved.length + report.workspaceRemoved.length + report.projcacheRemoved.length} ghosts, ${report.projcacheRehomed.length} projection identities rehomed, ${report.artifactMismatchesRemoved.length} mismatched artifacts removed`);
			return report;
		});
	}
	/**
	* 修改一个会话的工作区归属。
	*
	* - `targetWorkspaceId === null`：移出所有工作区，成为「未分组」；
	* - `targetWorkspaceId === 某工作区 id`：移入该工作区（若已在别处先移除）。
	*
	* 移入工作区时执行**物理移动**：转录目录从旧 cwd 的 sessions 目录真实搬到
	* 目标工作区目录，并同步改写工件内 header 行的 cwd（基类
	* `WorkspaceEntity.sessionIds` 按 `sessionPath(id) === record.path` 过滤成员，
	* 只改记账不改 cwd 会让会话从侧栏消失）。物理移动先于记账：失败时记账未动，
	* 可安全重试；实时会话先 flush + detach（释放写路径与句柄，避免旧路径被写回
	* 造成分裂）。
	*
	* 会话必须在注册表中已知；目标工作区必须存在。归档状态（archivedSessionIds）
	* 与工作区归属正交，移动不改变归档标记。会话在注册表中至多归属于一个
	* 工作区（防御性处理重复记账：先从所有工作区移除再加入目标）。
	* @param sessionId - 要移动的会话。
	* @param targetWorkspaceId - 目标工作区 id；null 表示未分组。
	* @returns `{ sessionId, workspaceId, previousWorkspaceId }`（空字符串表示未分组）。
	* @throws {@link SessionEnhanceUnknownSessionError} 会话未知时抛出；目标工作区未知或物理移动失败时抛 Error。
	*/
	async moveSession(sessionId, targetWorkspaceId) {
		return this.enqueueOperation(async () => {
			if (!await this.sessionKnown(sessionId)) throw new SessionEnhanceUnknownSessionError(sessionId);
			targetWorkspaceId = workspaceTargetSchema.parse(targetWorkspaceId);
			const state = this.requireState();
			const table = this.requireTable();
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
				const header = await this.readSessionHeader(sessionId);
				if (typeof header?.cwd === "string" && header.cwd !== targetRecord.path) {
					const sessions = this.ctx.get("sessions");
					const live = sessions?.get(sessionId);
					if (live !== void 0) {
						// 持久化屏障先行 + 从存储分离：释放写路径与文件句柄，
						// 否则移动后旧 meta 会把后续写入导向旧路径（分裂写入）。
						await sessions.flush(live);
						const entry = sessions.liveEntryFor(live);
						sessions.detachEntered(entry);
					}
					// 旧 agent 仍持有已脱离（或此前就脱离）的会话对象：不释放的
					// 话后续 prompt 会命中残留 agent——事件不广播、不落盘，消息
					// 静默丢失（agent-error: session is not live in this store）。
					// 不依赖会话是否 live：残留 agent 一律释放。
					await this.disposeStaleAgent(sessionId);
					const persistence = this.ctx.get("sessionPersistence");
					const outcome = await physicallyMoveSession(persistence, sessionId, header, targetRecord.path, this.ctx.logger);
					if (outcome.moved) {
						// 同步内存索引：header cwd 与 canonical sessionPath 指向新工作区，
						// 保证后续 readSessionHeader / 成员过滤 / locate 一致。
						const indexed = this.headers.get(sessionId);
						if (indexed !== void 0) this.headers.set(sessionId, { ...indexed, cwd: targetRecord.path });
						try {
							const canonical = await realpath(targetRecord.path);
							this.host.rememberSessionPath(sessionId, canonical);
						} catch (error) {
							this.ctx.logger.warn(`dsh-session-enhance: could not canonicalize new cwd "${targetRecord.path}" for moved session "${sessionId}": ${String(error)}`);
						}
						this.ctx.logger.info(`dsh-session-enhance: physically moved transcript of "${sessionId}" from "${outcome.oldDir}" to "${outcome.newDir}"`);
						// 投影缓存行身份（cwd）改写为新路径：否则 cachedSnapshot 身份
						// 校验失败，session.list 缺失标题投影，侧栏回退显示目标工作区名。
						await this.rehomeMovedSessionProjection(sessionId, header, targetRecord.path);
						// 诊断：验证 persistence 的 inspect 已指向新 cwd（prepared 缓存 /
						// coordinator 状态陈旧会让后续 resume 报 session-conflict 或
						// "not live in this store"）。
						try {
							const inspected = await persistence.inspect(sessionId);
							if (inspected?.meta?.cwd !== targetRecord.path) {
								this.ctx.logger.warn(`dsh-session-enhance: after moving "${sessionId}", persistence inspect still reports cwd "${String(inspected?.meta?.cwd)}" (expected "${targetRecord.path}")`);
							}
						} catch (error) {
							this.ctx.logger.warn(`dsh-session-enhance: post-move inspect probe for "${sessionId}" failed: ${String(error)}`);
						}
					}
				}
			}
			// 先从所有工作区移除（通常只有一个归属；防御重复记账）。
			for (const workspaceId of state.workspaceIds) {
				const record = table.get(workspaceId);
				if (record === void 0 || !record.sessionIds.includes(sessionId)) continue;
				const next = await table.update(workspaceId, (current) => ({
					...current,
					sessionIds: current.sessionIds.filter((id) => id !== sessionId),
					updatedAt: (/* @__PURE__ */ new Date()).toISOString()
				}));
				const entity = this.entities.get(workspaceId);
				if (entity !== void 0) entity.record = next;
			}
			if (targetWorkspaceId !== null) {
				const next = await table.update(targetWorkspaceId, (current) => ({
					...current,
					sessionIds: [...current.sessionIds, sessionId],
					updatedAt: (/* @__PURE__ */ new Date()).toISOString()
				}));
				const entity = this.entities.get(targetWorkspaceId);
				if (entity !== void 0) entity.record = next;
			}
			this.ctx.logger.info(`dsh-session-enhance: moved session "${sessionId}" ${previousWorkspaceId === null ? "from ungrouped" : `from workspace "${previousWorkspaceId}"`} to ${targetWorkspaceId === null ? "ungrouped" : `workspace "${targetWorkspaceId}"`}`);
			return {
				sessionId,
				workspaceId: targetWorkspaceId ?? "",
				previousWorkspaceId: previousWorkspaceId ?? ""
			};
		});
	}
	/**
	* 物理移动成功后刷新投影缓存：把该会话缓存行的日志身份（cwd）改写为
	* 目标工作区路径。
	*
	* 转录目录整体搬移后，工件 header 的 cwd 已改写，但 `session_projcache`
	* 行仍绑定旧 cwd——`cachedSnapshot` 的 identityMatches 校验失败，
	* `session.list` 不再携带该会话的投影（标题缺失，侧栏回退显示目标
	* 工作区名，直到会话被重新打开触发冷读重建）。先等待 detach 时刻在途
	* 的旧身份缓存写入落定（whenIdle），再改写行身份，避免旧写入覆盖。
	* @param sessionId - 被移动的会话。
	* @param header - 移动前的会话 header（createdAt 不受移动影响）。
	* @param newCwd - 目标工作区路径。
	*/
	async rehomeMovedSessionProjection(sessionId, header, newCwd) {
		const projCache = this.ctx.get("sessionProjectionCache");
		if (projCache === void 0 || typeof projCache.whenIdle !== "function" || typeof projCache.rehome !== "function") return;
		try {
			await projCache.whenIdle();
			await projCache.rehome(sessionId, { createdAt: header.createdAt, cwd: newCwd });
		} catch (error) {
			this.ctx.logger.warn(`dsh-session-enhance: projection-cache identity refresh for moved session "${sessionId}" failed (title falls back until the session is reopened): ${String(error)}`);
		}
	}
	/**
	* 解析会话的转录目录路径（目录可能已被删除：不存在时返回 undefined）。
	*/
	async resolveTranscriptDirectory(sessionId) {
		const persistence = this.ctx.get("sessionPersistence");
		if (persistence === void 0 || typeof persistence.locate !== "function") return void 0;
		try {
			const header = await this.readSessionHeader(sessionId);
			const location = persistence.locate(header);
			if (location === void 0 || typeof location.path !== "string") return void 0;
			return dirname(location.path);
		} catch {
			return void 0;
		}
	}
	/**
	* 从父类内存索引中遗忘已删除会话，并阻止后续 indexHeaders 把它加回。
	* 实时会话以同 id 重新出现时（自定义 id 复用）会撤掉墓碑。
	*/
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
	* 已删除会话对归档/删除入口都视为未知。实时复用同一 id 时撤墓碑，
	* 避免挡住新会话。
	*/
	async sessionKnown(id) {
		if (this.ctx.get("sessions")?.get(id) !== void 0) {
			this.clearTombstone(id);
			return true;
		}
		if (this.deletedSessionIds.has(id)) return this.coldReuseKnown(id);
		return super.sessionKnown(id);
	}
	/**
	* 墓碑分支的冷复用探针：其他进程以同 id 重建并落盘的新会话（日志身份
	* 不同）撤墓碑放行并重新编入索引；stale list() 里同生命周期的旧头部
	* 仍视为未知。身份不可考（删除时未取到头部）时保守维持未知。
	*/
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
	/**
	* 父类 indexHeaders 只增不减；跳过墓碑 id，避免 stale persistence.list()
	* 把已删除会话重新编入 headers。
	*/
	async indexHeader(header) {
		if (this.deletedSessionIds.has(header.id)) return;
		return super.indexHeader(header);
	}
	/** 为未处于实时状态的持久化会话发布相同的移除事件。 */
	async publishColdSessionRemoval(sessionId, sessions) {
		const persistence = this.ctx.get("sessionPersistence");
		if (persistence === void 0 || typeof persistence.prepare !== "function") return;
		try {
			const preparation = await persistence.prepare(sessionId);
			const detach = sessions.enter(preparation.session);
			try {
				sessions.announce(preparation.session);
			} finally {
				detach();
				preparation[Symbol.dispose]();
			}
		} catch (error) {
			this.ctx.logger.warn(`dsh-session-enhance: could not publish removal for stored session "${sessionId}": ${String(error)}`);
		}
	}
	/** 删除会话的转录目录；仅在所有记账清理完成后调用。
	* 带短间隔重试（Windows 句柄延迟释放），返回转录目录路径。 */
	async removeTranscriptDirectory(sessionId) {
		const persistence = this.ctx.get("sessionPersistence");
		if (persistence === void 0 || typeof persistence.locate !== "function") {
			throw new Error(`cannot delete session "${sessionId}": the session persistence backend does not expose locate() to resolve its transcript directory`);
		}
		const header = await this.readSessionHeader(sessionId);
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
		this.ctx.logger.warn(`dsh-session-enhance: ${detail}`);
		throw new Error(detail, { cause: lastError });
	}
	/**
	* 释放仍持有已脱离/已删除会话对象的 agent。
	*
	* flush + detach 只把会话移出 SessionStore；agent 层不监听
	* `session/disposed`，旧 agent 会继续持有脱离的会话对象。此后对该会话
	* 的 prompt 经 agentFor 命中旧 agent，消息被追加进脱离对象——事件不
	* 广播、不落盘，表现为「发送后无任何显示/响应」。detach 后必须先释放
	* 旧 agent，下次打开/发消息才会按新 cwd 重新 resume。
	* @param sessionId - 已脱离/已删除的会话。
	*/
	async disposeStaleAgent(sessionId) {
		const agents = this.ctx.get("agents");
		if (agents === void 0) return;
		// AgentRegistry.get() 返回 ReactLoopAgent（无 dispose——dispose 是
		// AgentHandle 的方法，而 handle 被 apiproxy 的 ensureSession 丢弃）。
		// 正确的释放路径：registry 的 store（实例字段）+ 公开 detachEntered。
		const entry = agents.store?.get(sessionId);
		this.ctx.logger.warn(`dsh-session-enhance: disposeStaleAgent("${sessionId}"): store=${typeof agents.store}, entry=${entry === void 0 ? "none" : "found"}, detachEntered=${typeof agents.detachEntered}`);
		if (entry !== void 0 && typeof agents.detachEntered === "function") {
			try {
				// 尽力停掉残留 driver 并卸载作用域（失败不影响 detach）。
				const agent = entry.agent;
				try {
					agent.cancel?.({ kind: "disposed" });
				} catch {}
				try {
					await agent.whenIdle?.();
				} catch {}
				try {
					await agent.scope?.dispose();
				} catch {}
			} catch (error) {
				this.ctx.logger.warn(`dsh-session-enhance: stale agent teardown for session "${sessionId}" partially failed: ${String(error)}`);
			}
			agents.detachEntered(entry);
			this.ctx.logger.warn(`dsh-session-enhance: disposeStaleAgent("${sessionId}"): detached stale agent from the registry`);
			return;
		}
		// 兜底：handle 形态（旧版本/自定义 agent）直接 dispose。
		const agent = agents.get?.(sessionId);
		if (agent === void 0 || typeof agent.dispose !== "function") return;
		try {
			await agent.dispose();
		} catch (error) {
			this.ctx.logger.warn(`dsh-session-enhance: could not dispose stale agent for session "${sessionId}": ${String(error)}`);
		}
	}
	/** 把 id 从每个工作区记录中移除，并刷新实体快照。 */
	async removeFromWorkspaceAccounts(sessionId) {
		const table = this.requireTable();
		const state = this.requireState();
		for (const workspaceId of state.workspaceIds) {
			const record = table.get(workspaceId);
			if (record === void 0 || !record.sessionIds.includes(sessionId)) continue;
			const next = await table.update(workspaceId, (current) => ({
				...current,
				sessionIds: current.sessionIds.filter((id) => id !== sessionId),
				updatedAt: (/* @__PURE__ */ new Date()).toISOString()
			}));
			const entity = this.entities.get(workspaceId);
			if (entity !== void 0) entity.record = next;
		}
	}
	/** 尽力而为的级联删除：删除 `sessionId` 的 SUBAGENT 子会话。
	* 仅头部标记 `origin: "subagent"` 的会话参与：单凭 `parentSession` 有歧义
	*（fork 分支也携带它），而 fork 分支是独立的用户会话，绝不能被级联删除。 */
	async deleteDescendants(sessionId) {
		try {
			const descendants = [];
			const sessions = this.ctx.get("sessions");
			if (sessions !== void 0) for (const session of sessions.list()) {
				if (session.header.parentSession === sessionId && session.header.origin === "subagent") descendants.push(session.id);
			}
			for (const header of await this.ctx.sessionPersistence.list()) {
				if (header.parentSession === sessionId && header.origin === "subagent" && !descendants.includes(header.id)) descendants.push(header.id);
			}
			for (const childId of descendants) {
				try {
					if (!await this.sessionKnown(childId)) continue;
					await this.deleteSessionCore(childId);
				} catch (error) {
					if (error instanceof SessionEnhanceUnknownSessionError) continue;
					this.ctx.logger.warn(`dsh-session-enhance: cascade delete of subagent session "${childId}" (child of "${sessionId}") failed: ${String(error)}`);
				}
			}
		} catch (error) {
			this.ctx.logger.warn(`dsh-session-enhance: descendant enumeration for deleted session "${sessionId}" failed: ${String(error)}`);
		}
	}
	/** 尽力而为的 spill 清理：移除该会话作用域的 spill 目录。 */
	async cleanSpill(sessionId) {
		try {
			const spill = this.ctx.get("spillStore");
			if (spill === void 0 || typeof spill.root !== "string") return;
			await rm(sessionDir(spill.root, sessionId), { recursive: true, force: true });
		} catch (error) {
			this.ctx.logger.warn(`dsh-session-enhance: spill cleanup for deleted session "${sessionId}" failed: ${String(error)}`);
		}
	}
};
//#endregion
export { SessionEnhanceWorkspaceRegistry, SessionEnhanceWorkspaceRegistry as default };
