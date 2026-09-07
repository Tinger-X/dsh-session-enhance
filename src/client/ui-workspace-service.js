import { Service } from "@deepseek-ai/cordis";

/**
 * Structured directory failure exposed to directory UI consumers (mirrors the
 * 0.1.2-rc.1 `dsh-client-ui-workspace` `UiWorkspaceService` vocabulary).
 */
class DirectoryBrowseError extends Error {
	constructor(rpcError) {
		super(`directory browse failed: ${rpcError.code}: ${rpcError.message}`);
		this.name = "DirectoryBrowseError";
		this.rpcError = rpcError;
	}
}

/** Stable tie-breaking follows Host Workspace order. */
function recentWorkspace(workspaces, sessions) {
	let selected;
	let selectedTime = Number.NEGATIVE_INFINITY;
	for (const workspace of workspaces) {
		let latest = Number.NEGATIVE_INFINITY;
		for (const sessionId of workspace.sessionIds) {
			const session = sessions[sessionId];
			if (session !== void 0) latest = Math.max(latest, session.updatedAt);
		}
		if (latest === Number.NEGATIVE_INFINITY) latest = Date.parse(workspace.createdAt);
		if (selected === void 0 || latest > selectedTime) {
			selected = workspace.workspaceId;
			selectedTime = latest;
		}
	}
	return selected;
}

/**
 * `uiWorkspace` 服务。0.1.2-rc.1 中侧栏 / 对话 / 聊天 / 目录选择器等客户端
 * 包都依赖 `uiWorkspace` 服务，而该服务由 `dsh-client-ui-workspace` 提供；
 * 本插件通过 cordis.patch.yml 禁用了 `ui-workspace`，因此必须由本插件原样
 * 复刻该服务，否则这些包会因「waiting for service: uiWorkspace」无法激活。
 */
class SessionEnhanceUiWorkspaceService extends Service {
	directoryPicker;
	workspaces;
	sessions;
	connecting = /* @__PURE__ */ new Map();

	/**
	 * @param ctx - Client root Context.
	 * @param directoryPicker - the directory-picking Remote namespace.
	 * @param workspaces - pure Workspace Controller.
	 * @param sessions - pure Session Controller.
	 */
	constructor(ctx, directoryPicker, workspaces, sessions) {
		super(ctx, "uiWorkspace");
		this.directoryPicker = directoryPicker;
		this.workspaces = workspaces;
		this.sessions = sessions;
		ctx.effect(() => this.watchNavigation(), "dsh-session-enhance: Workspace navigation policy");
	}
	async connectWorkspace(workspaceId) {
		const workspace = this.workspaces.list.getSnapshot().items.find((item) => item.workspaceId === workspaceId);
		if (workspace === void 0) throw new Error(`uiWorkspace.connectWorkspace: unknown workspace ${workspaceId}`);
		const inflight = this.connecting.get(workspaceId);
		if (inflight !== void 0) return inflight;
		const archived = this.workspaces.list.getSnapshot().archivedSessionIds;
		const sessions = this.sessions.list.getSnapshot();
		for (const id of sessions.ids) {
			const summary = sessions.byId[id];
			if (summary !== void 0 && summary.blank && summary.cwd === workspace.path && workspace.sessionIds.includes(summary.id) && !archived.includes(summary.id)) return summary.id;
		}
		const attempt = this.sessions.create({ workspaceId }).finally(() => {
			this.connecting.delete(workspaceId);
		});
		this.connecting.set(workspaceId, attempt);
		return attempt;
	}
	startSession(workspaceId) {
		const workspace = this.workspaces.list.getSnapshot();
		const sessions = this.sessions.list.getSnapshot();
		const current = sessions.current;
		const currentWorkspaceId = current === void 0 ? void 0 : workspace.items.find((item) => item.sessionIds.includes(current))?.workspaceId;
		const recent = workspace.phase === "ready" && sessions.phase === "ready" ? recentWorkspace(workspace.items, sessions.byId) : void 0;
		const target = workspaceId ?? currentWorkspaceId ?? recent;
		if (target === void 0) {
			this.sessions.clear();
			return;
		}
		this.connectWorkspace(target).then((sessionId) => {
			this.sessions.open(sessionId);
		}, (reason) => {
			console.warn("new session failed:", reason);
		});
	}
	async archiveSession(sessionId) {
		await this.workspaces.archiveSession(sessionId);
	}
	async pickDirectory() {
		const result = await this.directoryPicker.pick();
		if (!result.ok) throw new Error(`directory picker failed: ${result.error.message}`);
		return result.value;
	}
	async listDirectory(path, signal) {
		const result = await this.directoryPicker.list(path, signal);
		if (!result.ok) throw new DirectoryBrowseError(result.error);
		return result.value;
	}
	async createDirectory(path, name) {
		const result = await this.directoryPicker.createDirectory(path, name);
		if (!result.ok) throw new DirectoryBrowseError(result.error);
		return result.value;
	}
	watchNavigation() {
		let initial = "waiting";
		let disposed = false;
		const reconcile = () => {
			if (disposed) return;
			if (this.clearArchivedCurrent()) return;
			if (initial !== "waiting") return;
			const workspace = this.workspaces.list.getSnapshot();
			const sessions = this.sessions.list.getSnapshot();
			if (workspace.phase !== "ready" || sessions.phase !== "ready") return;
			if (sessions.current !== void 0) {
				initial = "done";
				return;
			}
			const target = recentWorkspace(workspace.items, sessions.byId);
			if (target === void 0) {
				initial = "done";
				return;
			}
			initial = "connecting";
			this.connectWorkspace(target).then((sessionId) => {
				if (disposed) return;
				if (this.sessions.list.getSnapshot().current === void 0) this.sessions.open(sessionId);
				initial = "done";
			}, (reason) => {
				if (disposed) return;
				initial = "waiting";
				console.warn("initial workspace selection failed:", reason);
			});
		};
		const disposeWorkspaces = this.workspaces.list.subscribe(reconcile);
		const disposeSessions = this.sessions.list.subscribe(reconcile);
		reconcile();
		return () => {
			disposed = true;
			disposeSessions();
			disposeWorkspaces();
		};
	}
	/** @returns true when an archived current selection was cleared. */
	clearArchivedCurrent() {
		const current = this.sessions.list.getSnapshot().current;
		if (current === void 0 || !this.workspaces.list.getSnapshot().archivedSessionIds.includes(current)) return false;
		this.sessions.clear();
		return true;
	}
}

export { SessionEnhanceUiWorkspaceService, DirectoryBrowseError, recentWorkspace };
