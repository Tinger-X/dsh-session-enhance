import { SESSION_ENHANCE_REMOTE } from "./contracts.js";
import { createWorkspaceViewStore } from "./stores.js";
import { zh, en } from "./locales.js";
import { EnhancementSection, installEnhanceNavIconSwap, installConversationNotifier, deriveArchivedGroups, sortArchivedGroups, deriveArchivedBatchIds } from "./settings.js";
import { WorkspaceBrowser } from "./workspace-browser.js";
import { WorkspacePicker } from "./workspace-picker.js";
import { displayTitle } from "./rows.js";
import { sessionVisible, isUnknownSessionError, deriveGroups, deriveFlat, deriveSearchResults, groupByWorkspace, byRecency } from "./derive.js";

/** Dictionary namespace owned by this plugin. */
const NS = "workspace";
/**
* Required services (cordis fiber inject). The target slots are declared by
* the ui-sidebar / ui-conversation applies, whose activation order relative
* to this one is NOT constrained: dsh.client.inject edges are informational
* (loading/prefetch metadata, never apply sequencing) and neither owner
* provides a waitable service. apply therefore depends on each slot
* declaration through `slots.inject()` instead of assuming order.
*/
const inject = [
	"slots",
	"sessions",
	"workspaces",
	"locale",
	"remote",
	"typert"
];
/**
* Plugin body: mount the dsh-session-enhance Remote contribution, then
* register the workspace browser. `$mount` must complete before the
* injected actions can reach `ctx.remote.workspaceRegistry`, so the
* plugin applies asynchronously and returns a disposer that unmounts the
* contribution (the slot registrations and dictionaries are
* effect-scoped inside `applyWorkspaceBrowser`).
* @param ctx - client root context.
*/
async function apply(ctx) {
	const remote = ctx.get("remote");
	let disposeRemote = () => { };
	if (remote !== void 0) disposeRemote = await remote.$mount(SESSION_ENHANCE_REMOTE);
	applyWorkspaceBrowser(ctx);
	return async () => {
		await disposeRemote();
	};
}
/**
* Register the browser and picker once their slot declarations are on the
* ledger. Inject factories return plain callbacks; data reads use the
* framework's global hooks.
* @param ctx - client root context.
*/
function applyWorkspaceBrowser(ctx) {
	ctx.effect(() => ctx.locale.register(NS, {
		zh,
		en
	}), "dsh-session-enhance: dictionaries");
	// PLUS：设置导航中本分区图标（壳对未知 section id 回退齿轮 → 星光/增强）。
	ctx.effect(() => installEnhanceNavIconSwap(), "dsh-session-enhance: enhance nav icon");
	const searchSessions = async (query, signal) => {
		const result = await ctx.sessions.search(query, signal);
		if (!result.ok) throw new Error(result.error.message);
		return result.value;
	};
	const flowSource = (hole) => ({
		getSnapshot: () => ctx.slots.entries(hole).length > 0,
		subscribe: (listener) => ctx.slots.subscribe(hole, listener)
	});
	const browserFlowSource = flowSource("sidebar.workspaces.directoryFlow");
	const pickerFlowSource = flowSource("conversation.hero.workspace.directoryFlow");
	const unarchiveSession = async (sessionId) => {
		const registry = ctx.get("remote.workspaceRegistry");
		if (registry === void 0) throw new Error("dsh-session-enhance remote service is unavailable");
		const result = await registry.unarchiveSession(sessionId);
		if (!result.ok) throw new Error(result.error.message);
	};
	const deleteSession = async (sessionId) => {
		const registry = ctx.get("remote.workspaceRegistry");
		if (registry === void 0) throw new Error("dsh-session-enhance remote service is unavailable");
		const result = await registry.deleteSession(sessionId);
		if (!result.ok) throw new Error(result.error.message);
	};
	/** PLUS：拖拽修改会话归属。targetWorkspaceId 为 null 表示移入「未分组」。 */
	const moveSession = async (sessionId, targetWorkspaceId) => {
		const registry = ctx.get("remote.workspaceRegistry");
		if (registry === void 0) throw new Error("dsh-session-enhance remote service is unavailable");
		// 移动前它是否是当前会话：移动会触发 host/session-removed，
		// base 客户端会把该会话的常驻实例标记为 removed（输入框「会话不可用」）。
		const wasCurrent = ctx.sessions.list.getSnapshot().current === sessionId;
		const result = await registry.moveSession(sessionId, targetWorkspaceId);
		if (!result.ok) throw new Error(result.error.message);
		// 实时会话被 flush+detach 时会收到 host/session-removed，客户端随之
		// 从会话列表移除该行；重拉基线让它在目标工作区立即恢复显示
		// （宿主侧已同步改写投影缓存身份，重拉的行携带标题投影）。
		if (typeof ctx.sessions?.refresh === "function") {
			const refreshed = ctx.sessions.refresh();
			if (wasCurrent) {
				// 等基线重拉完成（会话已回到列表）再重新武装它：
				// 重新打开 + 清除常驻实例的 removed 标志，立即可继续使用。
				refreshed.then(() => {
					rearmMovedSession(sessionId);
				}).catch((reason) => {
					console.warn("session list refresh after move rejected:", reason);
				});
			} else {
				refreshed.catch((reason) => {
					console.warn("session list refresh after move rejected:", reason);
				});
			}
		}
		return result.value;
	};
	/**
	* 移动后重新武装被移动的当前会话：
	* 1. 重新打开它（staging），让对话窗与输入框恢复就绪；
	* 2. 宿主 detach 实时会话时会广播 host/session-removed，base 客户端据此把
	*    该会话的常驻实例标记为 removed（「常驻实例」规则：页面刷新前不再复位），
	*    输入框因此显示「会话不可用」。移动场景下会话会以同一 id 立即重新可恢复，
	*    这里手动清除该标志。WS 事件帧与 RPC 回复分属两条通道，removed 标志
	*    可能晚于本段代码被置位，故在 2 秒窗口内订阅实例通知，一被置位就再清除。
	* 全部防御性调用：base 客户端内部结构变化时仅静默失效（行为退回原状），不报错。
	* @param sessionId - 被移动的会话 id。
	*/
	const rearmMovedSession = (sessionId) => {
		try {
			ctx.sessions.open(sessionId);
		} catch (reason) {
			console.warn("reopen of the moved current session rejected:", reason);
		}
		const inst = ctx.sessions.binding?.(sessionId)?.session;
		if (inst === void 0) return;
		const clearRemoved = () => {
			if (inst.removed) {
				inst.removed = false;
				inst.notifier?.markDirty?.();
				console.warn(`[dsh-session-enhance] cleared removed flag on moved session ${sessionId}`);
			}
		};
		clearRemoved();
		const unsub = typeof inst.subscribe === "function" ? inst.subscribe(clearRemoved) : void 0;
		setTimeout(() => {
			clearRemoved();
			if (typeof unsub === "function") unsub();
		}, 2000);
	};
	const unarchiveSessions = async (target) => {
		const registry = ctx.get("remote.workspaceRegistry");
		if (registry === void 0) throw new Error("dsh-session-enhance remote service is unavailable");
		const result = await registry.unarchiveSessions(target);
		if (!result.ok) throw new Error(result.error.message);
		return result.value;
	};
	const deleteArchivedSessions = async (target) => {
		const registry = ctx.get("remote.workspaceRegistry");
		if (registry === void 0) throw new Error("dsh-session-enhance remote service is unavailable");
		const result = await registry.deleteArchivedSessions(target);
		if (!result.ok) throw new Error(result.error.message);
		return result.value;
	};
	const archivedSessionMetadata = async () => {
		const registry = ctx.get("remote.workspaceRegistry");
		if (registry === void 0) throw new Error("dsh-session-enhance remote service is unavailable");
		const result = await registry.archivedSessionMetadata();
		if (!result.ok) throw new Error(result.error.message);
		return result.value;
	};
	/** PLUS：读取归档会话的转录消息（预览对话）。 */
	const previewSession = async (sessionId) => {
		const registry = ctx.get("remote.workspaceRegistry");
		if (registry === void 0) throw new Error("dsh-session-enhance remote service is unavailable");
		const result = await registry.previewSession(sessionId);
		if (!result.ok) throw new Error(result.error.message);
		return result.value;
	};
	/** PLUS：按物理 session 文件同步 storages 记录（清理幽灵/修正归属/补记漏记）。 */
	const syncRecords = async () => {
		const registry = ctx.get("remote.workspaceRegistry");
		if (registry === void 0) throw new Error("dsh-session-enhance remote service is unavailable");
		const result = await registry.syncRecords();
		if (!result.ok) throw new Error(result.error.message);
		return result.value;
	};
	/** PLUS：读取「基础设置」（`.dsh` 家目录 + 对话通知开关）。 */
	const getSettings = async () => {
		const registry = ctx.get("remote.workspaceRegistry");
		if (registry === void 0) throw new Error("dsh-session-enhance remote service is unavailable");
		const result = await registry.getSettings();
		if (!result.ok) throw new Error(result.error.message);
		return result.value;
	};
	/** PLUS：写入「基础设置」；未提供的字段保持原值。 */
	const setSettings = async (settings) => {
		const registry = ctx.get("remote.workspaceRegistry");
		if (registry === void 0) throw new Error("dsh-session-enhance remote service is unavailable");
		const result = await registry.setSettings(settings);
		if (!result.ok) throw new Error(result.error.message);
		return result.value;
	};
	/** PLUS：列出可清理的空工作区目录（sessions 根目录下的空子目录残留）。 */
	const listEmptyWorkspaceDirectories = async () => {
		const registry = ctx.get("remote.workspaceRegistry");
		if (registry === void 0) throw new Error("dsh-session-enhance remote service is unavailable");
		const result = await registry.listEmptyWorkspaceDirectories();
		if (!result.ok) throw new Error(result.error.message);
		return result.value;
	};
	/** PLUS：删除一个空工作区目录残留（仅接受 sessions 根目录的直接子目录名）。 */
	const deleteEmptyWorkspaceDirectory = async (name) => {
		const registry = ctx.get("remote.workspaceRegistry");
		if (registry === void 0) throw new Error("dsh-session-enhance remote service is unavailable");
		const result = await registry.deleteEmptyWorkspaceDirectory(name);
		if (!result.ok) throw new Error(result.error.message);
		return result.value;
	};
	// PLUS：对话通知（对话结束/需要操作时，未聚焦且启用通知则弹出系统提示）。
	ctx.effect(() => installConversationNotifier(ctx, getSettings, ctx.locale.bind(NS)), "dsh-session-enhance: conversation notifier");
	const browserInjected = () => ({
		startSession: (workspaceId) => {
			ctx.workspaces.startSession(workspaceId);
		},
		open: (sessionId) => {
			ctx.sessions.open(sessionId);
		},
		searchSessions,
		searchResultLimit: ctx.sessions.searchResultLimit,
		renameSession: async (sessionId, title) => {
			const session = ctx.sessions.binding(sessionId)?.session;
			if (session === void 0) throw new Error(`unknown session "${sessionId}"`);
			const result = await session.rename(title);
			if (!result.ok) throw new Error(result.error.message);
		},
		forkSession: (sessionId) => ctx.sessions.fork({
			sessionId,
			increaseTitle: true
		}).then((childId) => {
			ctx.sessions.open(childId);
		}),
		renameWorkspace: async (workspaceId, title) => {
			await ctx.workspaces.rename(workspaceId, title);
		},
		deleteWorkspace: async (workspaceId) => {
			await ctx.workspaces.delete(workspaceId);
		},
		insertWorkspaceBefore: async (workspaceId, beforeWorkspaceId) => {
			await ctx.workspaces.insertBefore(workspaceId, beforeWorkspaceId);
		},
		archiveSession: async (sessionId) => {
			await ctx.workspaces.archiveSession(sessionId);
		},
		unarchiveSession,
		deleteSession,
		moveSession,
		insertSessionBefore: async (workspaceId, sessionId, beforeSessionId) => {
			await ctx.workspaces.insertSessionBefore(workspaceId, sessionId, beforeSessionId);
		},
		createWorkspace: (input) => ctx.workspaces.create(input),
		hooks: { directoryFlow: browserFlowSource }
	});
	const pickerInjected = () => ({
		createWorkspace: (input) => ctx.workspaces.create(input),
		hooks: { directoryFlow: pickerFlowSource }
	});
	ctx.slots.inject("sidebar.workspaces", () => ctx.slots.register({
		name: "sidebar.workspaces",
		children: {
			"sidebar.workspaces.directoryFlow": {
				kind: "single",
				scope: "root"
			}
		},
		store: createWorkspaceViewStore(),
		inject: browserInjected,
		locale: NS
	}, WorkspaceBrowser));
	ctx.slots.inject("conversation.hero.workspace", () => ctx.slots.register({
		name: "conversation.hero.workspace",
		children: {
			"conversation.hero.workspace.directoryFlow": {
				kind: "single",
				scope: "root"
			}
		},
		inject: pickerInjected,
		locale: NS
	}, WorkspacePicker));
	ctx.slots.inject("settings.section", () => ctx.slots.register({
		name: "settings.section",
		id: "conversation-enhance",
		order: 18,
		label: () => ctx.locale.bind(NS)("settings.manageTitle"),
		icon: "settings",
		locale: NS,
		inject: () => ({
			sessionStore: ctx.sessions.list,
			workspaceStore: ctx.workspaces.list,
			unarchiveSession,
			deleteSession,
			unarchiveSessions,
			deleteArchivedSessions,
			archivedSessionMetadata,
			previewSession,
			syncRecords,
			getSettings,
			setSettings,
			listEmptyWorkspaceDirectories,
			deleteEmptyWorkspaceDirectory,
			deleteWorkspace: async (workspaceId) => {
				await ctx.workspaces.delete(workspaceId);
			},
			pickDirectory: () => ctx.workspaces.pickDirectory(),
			t: ctx.locale.bind(NS)
		})
	}, EnhancementSection));
}

const __test = {
	displayTitle,
	sessionVisible,
	isUnknownSessionError,
	deriveGroups,
	deriveFlat,
	deriveSearchResults,
	deriveArchivedGroups,
	sortArchivedGroups,
	deriveArchivedBatchIds,
	createWorkspaceViewStore,
	groupByWorkspace,
	byRecency,
	SESSION_ENHANCE_REMOTE
};

export { apply, inject, __test };
