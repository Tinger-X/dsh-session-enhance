import * as react from "react";
import * as react_jsx_runtime from "react/jsx-runtime";
import * as _deepseek_ai_dsh_client_ui_primitives from "@deepseek-ai/dsh-client-ui-primitives";
import { clsx } from "./clsx.js";
import { FLAT_SESSION_ORDER_KEY } from "./stores.js";
import { deriveGroups, deriveFlat, deriveSearchResults, formatForkError, formatArchiveError, formatUnarchiveError, formatDeleteError } from "./derive.js";
import { ProjectRowItem, SessionNodeItem, SearchResultItem } from "./rows.js";
import { WorkspacePickFlow } from "./workspace-picker.js";

const css = ".qDHVXG_root{--dsh-session-list-edge-inset:var(--dsh-sidebar-inline-padding);--dsh-session-list-scrollbar-width:8px;--dsh-session-list-scrollbar-offset:2px;box-sizing:border-box;min-height:0;padding-right:var(--dsh-session-list-edge-inset);flex-direction:column;flex:1;display:flex}.qDHVXG_root.qDHVXG_rail{padding-right:0}.qDHVXG_iconButton{cursor:pointer;width:28px;height:28px;color:var(--dsw-alias-label-secondary);background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.qDHVXG_iconButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.qDHVXG_sectionHeader{box-sizing:border-box;height:36px;color:var(--dsw-alias-label-tertiary);border-radius:12px;flex:none;justify-content:flex-end;align-items:center;gap:4px;margin-bottom:4px;padding-left:4px;display:flex;overflow:hidden}.qDHVXG_root:not(.qDHVXG_rail) .qDHVXG_sectionHeader{margin-top:2px;margin-right:-4px}.qDHVXG_sectionLabel{white-space:nowrap;opacity:1;visibility:visible;min-width:0;max-width:45%;transition:max-width .18s var(--ds-ease-in-out), margin-right .18s var(--ds-ease-in-out), opacity .12s var(--ds-ease-in-out), transform .18s var(--ds-ease-in-out), visibility 0s linear;flex:none;line-height:20px;overflow:hidden}.qDHVXG_sectionLabelHidden{opacity:0;visibility:hidden;max-width:0;margin-right:-4px;transition-delay:0s,0s,0s,0s,.18s;transform:translate(-4px)}.qDHVXG_searchSlot{box-sizing:border-box;min-width:0;max-width:28px;transition:max-width .18s var(--ds-ease-in-out), padding-left .18s var(--ds-ease-in-out);flex:1;align-items:center;margin-left:auto;padding-left:0;display:flex}.qDHVXG_searchSlotExpanded{max-width:100%;padding-left:0}.qDHVXG_headerActions{opacity:1;visibility:visible;max-width:60px;transition:max-width .18s var(--ds-ease-in-out), opacity .12s var(--ds-ease-in-out), transform .18s var(--ds-ease-in-out), visibility 0s linear;flex:none;align-items:center;gap:4px;display:flex;overflow:hidden}.qDHVXG_headerActionsHidden{opacity:0;visibility:hidden;pointer-events:none;max-width:0;transition-delay:0s,0s,0s,.18s;transform:translate(4px)}.qDHVXG_search{box-sizing:border-box;cursor:text;width:100%;height:28px;color:var(--dsw-alias-label-secondary);transition:width .18s var(--ds-ease-in-out), padding .18s var(--ds-ease-in-out), border-color .18s var(--ds-ease-in-out), background-color .18s var(--ds-ease-in-out);background:0 0;border:none;border-radius:50%;flex:none;align-items:center;gap:0;margin:0;padding:0;display:flex;overflow:hidden}.qDHVXG_searchExpanded{border:1px solid var(--dsw-alias-border-l2);width:calc(100% + 4px);height:30px;color:var(--dsw-alias-label-caption);background:0 0;border-radius:10px;margin-inline:-2px;padding:0 4px 0 0}.qDHVXG_searchButton{cursor:pointer;width:28px;height:28px;color:inherit;background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.qDHVXG_searchExpanded .qDHVXG_searchButton{width:28px;height:30px}.qDHVXG_searchButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.qDHVXG_searchExpanded .qDHVXG_searchButton:hover{background:0 0}.qDHVXG_searchInput{opacity:0;pointer-events:none;width:0;min-width:0;color:var(--dsw-alias-label-primary);transition:opacity .12s var(--ds-ease-in-out);background:0 0;border:none;outline:none;flex:1;font-size:13px;line-height:18px}.qDHVXG_searchExpanded .qDHVXG_searchInput{opacity:1;pointer-events:auto;margin-left:-2px}.qDHVXG_searchInput::placeholder{color:var(--dsw-alias-label-tertiary)}.qDHVXG_clearButton{cursor:pointer;width:24px;height:24px;color:var(--dsw-alias-label-secondary);background:0 0;border:none;border-radius:50%;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.qDHVXG_clearButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.qDHVXG_rail .qDHVXG_sectionHeader{justify-content:flex-start;gap:0;margin-bottom:12px;padding-left:0}.qDHVXG_rail .qDHVXG_headerActions{max-width:none}.qDHVXG_rail .qDHVXG_iconButton{width:36px;height:36px;color:var(--dsw-alias-label-primary)}.qDHVXG_rail .qDHVXG_search{background:0 0;border-color:#0000;gap:0;width:36px;height:36px;margin:0 0 12px;padding:0}.qDHVXG_rail .qDHVXG_searchButton{width:36px;height:36px;color:var(--dsw-alias-label-primary)}.qDHVXG_rail .qDHVXG_searchButton:hover{background:var(--dsw-alias-interactive-bg-hover)}.qDHVXG_listArea{min-height:0;margin-left:-4px;margin-right:calc(-1 * var(--dsh-session-list-edge-inset));flex-direction:column;flex:1;padding-left:4px;display:flex;overflow:visible}.qDHVXG_rail .qDHVXG_listArea{margin-left:0;margin-right:0;padding-left:0}.qDHVXG_treeBody{flex-direction:column;flex:1;min-height:0;display:flex;position:relative}.qDHVXG_fade{left:0;right:var(--dsh-session-list-edge-inset);background:linear-gradient(to bottom, transparent, var(--dsw-specific-sidebar-fill));pointer-events:none;height:24px;position:absolute;bottom:0}.qDHVXG_wide{animation:qDHVXG_wide-in .2s var(--ds-ease-in-out)}@keyframes qDHVXG_wide-in{0%{opacity:0}}.qDHVXG_list{min-height:0;margin-left:-4px;margin-right:var(--dsh-session-list-scrollbar-offset);padding-left:4px;padding-right:calc(var(--dsh-session-list-edge-inset) - var(--dsh-session-list-scrollbar-width) - var(--dsh-session-list-scrollbar-offset));scrollbar-gutter:stable;flex:1;padding-bottom:16px;overflow-y:auto}.qDHVXG_flatList>*+*,.qDHVXG_searchTree>[role=treeitem]+[role=treeitem],.qDHVXG_groupSection>*+*{margin-top:2px}.qDHVXG_searchStatus,.qDHVXG_searchWarning{color:var(--dsw-alias-label-tertiary);padding:10px 12px;font-size:12px;line-height:18px}.qDHVXG_searchWarning{color:var(--dsw-alias-label-secondary)}.qDHVXG_groupSection{position:relative}.qDHVXG_groupSection+.qDHVXG_groupSection{margin-top:4px}.qDHVXG_listTopDropIndicator,.qDHVXG_workspaceDropBefore:before,.qDHVXG_workspaceDropAfter:after{content:\"\";z-index:1;background:linear-gradient(55deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 0 / 5px 7px no-repeat, linear-gradient(125deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 5px / 5px 7px no-repeat, linear-gradient(var(--dsw-alias-state-business-primary) 0 0) 4px 5px / calc(100% - 4px) 2px no-repeat;pointer-events:none;height:12px;position:absolute;left:0;right:0}.qDHVXG_listTopDropIndicator{top:-8px;left:0;right:var(--dsh-session-list-edge-inset)}.qDHVXG_listTopDropActive>.qDHVXG_workspaceDropBefore:first-child:before{display:none}.qDHVXG_workspaceDropBefore:before{top:-8px}.qDHVXG_workspaceDropAfter:after{bottom:-8px}.qDHVXG_sessionOverflowButton{cursor:pointer;text-align:left;width:100%;height:28px;color:var(--dsw-alias-label-tertiary);background:0 0;border:none;border-radius:8px;padding:0 12px 0 28px;font-size:12px}.qDHVXG_groupSection>.qDHVXG_sessionOverflowButton{margin-top:0}.qDHVXG_sessionOverflowButton:hover{color:var(--dsw-alias-label-secondary);background:0 0}.qDHVXG_empty{color:var(--dsw-alias-label-tertiary);padding:16px 12px;font-size:13px}.qDHVXG_renameInput{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);width:100%;height:44px;color:var(--dsw-alias-label-primary);background:0 0;border-radius:22px;outline:none;padding:7px 14px;font-size:14px;font-weight:400;line-height:22px}.qDHVXG_renameInput:disabled{color:var(--dsw-alias-label-dimmed)}.qDHVXG_renameError{color:var(--dsw-alias-state-error-primary);margin-top:8px;font-size:12px;line-height:18px}.qDHVXG_deleteAction:not(:disabled){color:var(--dsw-alias-state-error-primary)}.qDHVXG_deleteStatus{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}@media (prefers-reduced-motion:reduce){.qDHVXG_wide{animation:none}.qDHVXG_search,.qDHVXG_sectionLabel,.qDHVXG_searchSlot,.qDHVXG_searchInput,.qDHVXG_headerActions{transition:none}}";
const tagId = "@deepseek-ai/dsh-client-ui-workspace/WorkspaceBrowser.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-session-enhance";
	tag.dataset.pluginCss = tagId;
	tag.textContent = css;
	document.head.appendChild(tag);
}
var WorkspaceBrowser_module_css_default = {
	"wide-in": "qDHVXG_wide-in",
	"searchWarning": "qDHVXG_searchWarning",
	"empty": "qDHVXG_empty",
	"deleteStatus": "qDHVXG_deleteStatus",
	"search": "qDHVXG_search",
	"fade": "qDHVXG_fade",
	"workspaceDropAfter": "qDHVXG_workspaceDropAfter",
	"searchSlot": "qDHVXG_searchSlot",
	"rail": "qDHVXG_rail",
	"searchSlotExpanded": "qDHVXG_searchSlotExpanded",
	"searchButton": "qDHVXG_searchButton",
	"workspaceDropBefore": "qDHVXG_workspaceDropBefore",
	"deleteAction": "qDHVXG_deleteAction",
	"root": "qDHVXG_root",
	"clearButton": "qDHVXG_clearButton",
	"listTopDropIndicator": "qDHVXG_listTopDropIndicator",
	"listTopDropActive": "qDHVXG_listTopDropActive",
	"headerActions": "qDHVXG_headerActions",
	"searchStatus": "qDHVXG_searchStatus",
	"sectionLabelHidden": "qDHVXG_sectionLabelHidden",
	"searchInput": "qDHVXG_searchInput",
	"listArea": "qDHVXG_listArea",
	"searchExpanded": "qDHVXG_searchExpanded",
	"list": "qDHVXG_list",
	"iconButton": "qDHVXG_iconButton",
	"sectionLabel": "qDHVXG_sectionLabel",
	"groupSection": "qDHVXG_groupSection",
	"renameInput": "qDHVXG_renameInput",
	"sessionOverflowButton": "qDHVXG_sessionOverflowButton",
	"treeBody": "qDHVXG_treeBody",
	"wide": "qDHVXG_wide",
	"flatList": "qDHVXG_flatList",
	"searchTree": "qDHVXG_searchTree",
	"sectionHeader": "qDHVXG_sectionHeader",
	"headerActionsHidden": "qDHVXG_headerActionsHidden",
	"renameError": "qDHVXG_renameError"
};
/**
* The workspace/session browsing region filling the sidebar shell's
* `sidebar.workspaces` hole: section header (title + view options + add
* workspace), search, the grouped tree or flat list, and the workspace
* dialogs. Wide state renders the full browser; rail state renders the two
* region icons (search / add workspace) as 36px controls on the shell's shared
* rail entry path, each requesting expansion through the owner share. Adding
* is the header button's one action, so it raises the directory flow with no
* menu in between; the flow and its error dialog live in WorkspacePicker
* (same package — direct composition, no slot between them).
*/
/**
* Column slide length (--ds-transition-duration-slow): rail-search focus waits it out —
* focus() forces a synchronous layout and would jank the slide.
*/
const EXPAND_SLIDE_MS = 300;
/** Pause between the latest keystroke and a Host content-search request. */
const SEARCH_DEBOUNCE_MS = 250;
/** `session.search` wire bound, measured in JavaScript UTF-16 code units. */
const SEARCH_QUERY_MAX_CODE_UNITS = 500;
/** Session rows visible per Workspace before the local overflow control. */
const COLLAPSED_SESSION_LIMIT = 5;
/** Keep controlled input and RPC payload inside the session.search wire contract. */
function sanitizeSearchQuery(value) {
	const withoutNul = value.replaceAll("\0", "");
	if (withoutNul.length <= SEARCH_QUERY_MAX_CODE_UNITS) return withoutNul;
	let end = SEARCH_QUERY_MAX_CODE_UNITS;
	const last = withoutNul.charCodeAt(end - 1);
	const next = withoutNul.charCodeAt(end);
	if (last >= 55296 && last <= 56319 && next >= 56320 && next <= 57343) end--;
	return withoutNul.slice(0, end);
}
/** Immutable membership toggle for the local expand-all array. */
function toggled(list, key) {
	return list.includes(key) ? list.filter((k) => k !== key) : [...list, key];
}
/**
* Accept the native drag at document level while a row drag is active: row
* hover still owns the insertion marker, and releasing outside the list must
* not be rendered as a rejected drop before dragend commits that last marker.
*/
function useNativeDragAcceptance(active) {
	(0, react.useEffect)(() => {
		if (!active) return;
		const acceptDrag = (event) => {
			event.preventDefault();
			if (event.dataTransfer !== null) event.dataTransfer.dropEffect = "move";
		};
		const acceptDrop = (event) => {
			event.preventDefault();
		};
		document.addEventListener("dragover", acceptDrag);
		document.addEventListener("drop", acceptDrop);
		return () => {
			document.removeEventListener("dragover", acceptDrag);
			document.removeEventListener("drop", acceptDrop);
		};
	}, [active]);
}
/** Reconcile a stored view order with the Workspace's current session account. */
function reconciledSessionOrder(sessionIds, stored) {
	if (stored === void 0) return [...sessionIds];
	const byId = new Map(sessionIds.map((id) => [id, id]));
	const ordered = [];
	const included = /* @__PURE__ */ new Set();
	for (const key of stored) {
		const id = byId.get(key);
		if (id === void 0 || included.has(key)) continue;
		ordered.push(id);
		included.add(key);
	}
	for (const id of sessionIds) {
		if (included.has(id)) continue;
		ordered.push(id);
	}
	return ordered;
}
/** Newest update first with stable Session identity as the tie-break. */
function compareSessionRecency(a, b, byId) {
	const aUpdatedAt = byId[a]?.updatedAt ?? Number.NEGATIVE_INFINITY;
	const bUpdatedAt = byId[b]?.updatedAt ?? Number.NEGATIVE_INFINITY;
	if (aUpdatedAt !== bUpdatedAt) return bUpdatedAt - aUpdatedAt;
	return a < b ? -1 : 1;
}
/** Reconcile one editable order account and apply its activity-promotion policy. */
function nextSessionOrderAccount({ sessionIds, previousOrder, previousUpdatedAt, list, orderBy, sortByRecency }) {
	let order = reconciledSessionOrder(sessionIds, previousOrder);
	if (sortByRecency) order.sort((a, b) => compareSessionRecency(a, b, list.byId));
	else if (orderBy === "updated") {
		const promoted = sessionIds.filter((id) => {
			const session = list.byId[id];
			return session !== void 0 && (previousUpdatedAt[id] === void 0 || session.updatedAt > previousUpdatedAt[id]);
		}).sort((a, b) => compareSessionRecency(a, b, list.byId));
		if (promoted.length > 0) {
			const promotedIds = new Set(promoted);
			order = [...promoted, ...order.filter((id) => !promotedIds.has(id))];
		}
	}
	const updatedAt = {};
	for (const id of sessionIds) {
		const session = list.byId[id];
		if (session !== void 0) updatedAt[id] = session.updatedAt;
	}
	const orderChanged = previousOrder === void 0 || order.length !== previousOrder.length || order.some((id, index) => id !== previousOrder[index]);
	const timestampsChanged = Object.keys(updatedAt).length !== Object.keys(previousUpdatedAt).length || Object.entries(updatedAt).some(([id, timestamp]) => previousUpdatedAt[id] !== timestamp);
	return {
		order,
		updatedAt,
		changed: orderChanged || timestampsChanged
	};
}
/** Grouping and ordering controls for the workspace browser. */
function ViewOptionsMenu({ groupBy, orderBy, onGroupPick, onOrderPick, t }) {
	const [open, setOpen] = (0, react.useState)(false);
	return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
		open,
		onClose: () => {
			setOpen(false);
		},
		items: [
			{
				type: "label",
				id: "group-by",
				text: t("groupBy.label")
			},
			{
				id: "workspace",
				label: t("groupBy.workspace")
			},
			{
				id: "flat",
				label: t("groupBy.flat")
			},
			{
				type: "separator",
				id: "order-by-separator"
			},
			{
				type: "label",
				id: "order-by",
				text: t("orderBy.label")
			},
			{
				id: "manual",
				label: t("orderBy.manual")
			},
			{
				id: "updated",
				label: t("orderBy.updated")
			},
		],
		selectedIds: [groupBy, orderBy],
		onSelect: (id) => {
			if (id === "workspace" || id === "flat") onGroupPick(id);
			else if (id === "manual" || id === "updated") onOrderPick(id);
			setOpen(false);
		},
		align: "end",
		dense: true,
		portal: true,
		anchor: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
			label: t("viewOptions.label"),
			side: "bottom",
			delayMs: 500,
			children: (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: clsx(WorkspaceBrowser_module_css_default.iconButton, WorkspaceBrowser_module_css_default.wide),
				"aria-label": t("viewOptions.label"),
				onClick: () => {
					setOpen((v) => !v);
				},
				children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPersonalizationOutline16, {})
			})
		})
	});
}
/** Resolve an insertion side from the full rendered workspace group. */
function workspaceGroupHalf(e) {
	const rect = e.currentTarget.getBoundingClientRect();
	return e.clientY < rect.top + rect.height / 2 ? "before" : "after";
}
/** The scrolling session tree; unmounting drops the sessions subscription and expand-all state. */
function SessionTree({ useSessions, startSession, open, forkSession, workspaces, archivedSessionIds, showArchived, onRenameRequest, onDeleteRequest, onSessionRename, onSessionArchive, onSessionUnarchive, onCopySessionId, onSessionDelete, onMoveSession, insertWorkspaceBefore, insertSessionBefore, orderBy, groupExpansion, setGroupExpanded, sessionOrderByAccount, sessionUpdatedAtByAccount, syncSessionOrderAccount, setSessionOrder, t }) {
	const list = useSessions((s) => s);
	const current = list.current;
	const [expandedSessionGroups, setExpandedSessionGroups] = (0, react.useState)([]);
	const [drag, setDrag] = (0, react.useState)(null);
	const sessionDropCommitted = (0, react.useRef)(false);
	const [workspaceDrag, setWorkspaceDrag] = (0, react.useState)(null);
	const workspaceDropCommitted = (0, react.useRef)(false);
	/** PLUS：会话拖拽悬停的分组 key（投放高亮）。 */
	const [sessionDropGroup, setSessionDropGroup] = (0, react.useState)(null);
	const previousOrderBy = (0, react.useRef)(orderBy);
	useNativeDragAcceptance(drag !== null || workspaceDrag !== null);
	const currentGroup = current === void 0 ? void 0 : workspaces.find((w) => w.sessionIds.includes(current))?.workspaceId ?? "";
	(0, react.useEffect)(() => {
		if (current === void 0 || currentGroup === void 0 || Object.hasOwn(groupExpansion, currentGroup)) return;
		setGroupExpanded(currentGroup, true);
	}, [
		current,
		currentGroup,
		setGroupExpanded,
		groupExpansion
	]);
	const expandedGroups = (0, react.useMemo)(() => Object.entries(groupExpansion).filter(([, expanded]) => expanded).map(([key]) => key), [groupExpansion]);
	const ungroupedSessionIds = (0, react.useMemo)(() => {
		const accounted = new Set(workspaces.flatMap((workspace) => workspace.sessionIds));
		return list.ids.filter((id) => list.byId[id] !== void 0 && !accounted.has(id));
	}, [list, workspaces]);
	(0, react.useEffect)(() => {
		if (list.phase !== "ready") return;
		const switchedToUpdated = previousOrderBy.current !== "updated" && orderBy === "updated";
		previousOrderBy.current = orderBy;
		const accounts = [...workspaces.map((workspace) => ({
			key: workspace.workspaceId,
			sessionIds: workspace.sessionIds.filter((id) => list.byId[id] !== void 0)
		})), {
			key: "",
			sessionIds: ungroupedSessionIds
		}];
		for (const { key, sessionIds } of accounts) {
			const previousOrder = sessionOrderByAccount[key];
			const next = nextSessionOrderAccount({
				sessionIds,
				previousOrder,
				previousUpdatedAt: sessionUpdatedAtByAccount[key] ?? {},
				list,
				orderBy,
				sortByRecency: orderBy === "updated" && (previousOrder === void 0 || switchedToUpdated)
			});
			if (next.changed) syncSessionOrderAccount(key, next.order.map((id) => id), next.updatedAt);
		}
	}, [
		list,
		orderBy,
		sessionOrderByAccount,
		sessionUpdatedAtByAccount,
		syncSessionOrderAccount,
		ungroupedSessionIds,
		workspaces
	]);
	const orderedWorkspaces = (0, react.useMemo)(() => {
		return workspaces.map((workspace) => {
			const stored = sessionOrderByAccount[workspace.workspaceId];
			const sessionIds = reconciledSessionOrder(workspace.sessionIds, stored);
			return {
				...workspace,
				sessionIds
			};
		});
	}, [sessionOrderByAccount, workspaces]);
	const orderedUngroupedSessionIds = (0, react.useMemo)(() => reconciledSessionOrder(ungroupedSessionIds, sessionOrderByAccount[""]), [sessionOrderByAccount, ungroupedSessionIds]);
	const groups = (0, react.useMemo)(() => deriveGroups(list, orderedWorkspaces, archivedSessionIds, {
		expandedGroups,
		showArchived,
		...sessionOrderByAccount[""] === void 0 ? {} : { ungroupedOrder: sessionOrderByAccount[""] }
	}), [
		list,
		orderedWorkspaces,
		archivedSessionIds,
		showArchived,
		expandedGroups,
		sessionOrderByAccount
	]);
	const now = Date.now();
	const commitSessionDrag = (activeDrag, over) => {
		if (sessionDropCommitted.current) return;
		// PLUS：跨分组投放（拖到别的分组的会话行上）→ 修改该会话的工作区归属。
		const overGroup = groups.find((candidate) => candidate.sessions.some((session) => session.id === over.id));
		if (overGroup !== void 0 && overGroup.key !== activeDrag.accountKey) {
			sessionDropCommitted.current = true;
			setDrag(null);
			onMoveSession(activeDrag.sessionId, overGroup.workspaceId ?? null).catch((reason) => {
				console.warn("session move rejected:", reason);
			});
			return;
		}
		sessionDropCommitted.current = true;
		setDrag(null);
		const group = groups.find((candidate) => candidate.key === activeDrag.accountKey);
		if (group === void 0) return;
		const targetIndex = group.sessions.findIndex((session) => session.id === over.id);
		if (targetIndex === -1) return;
		const anchor = over.half === "before" ? over.id : group.sessions[targetIndex + 1]?.id;
		if (anchor === activeDrag.sessionId) return;
		const sourceIndex = group.sessions.findIndex((session) => session.id === activeDrag.sessionId);
		const anchorIndex = anchor === void 0 ? group.sessions.length : group.sessions.findIndex((session) => session.id === anchor);
		if (sourceIndex !== -1 && (anchorIndex === sourceIndex || anchorIndex === sourceIndex + 1)) return;
		const accountSessionIds = activeDrag.accountKey === "" ? orderedUngroupedSessionIds : orderedWorkspaces.find((workspace) => workspace.workspaceId === activeDrag.accountKey)?.sessionIds;
		if (accountSessionIds === void 0) return;
		const nextOrder = accountSessionIds.filter((id) => id !== activeDrag.sessionId);
		const insertAt = anchor === void 0 ? nextOrder.length : nextOrder.indexOf(anchor);
		nextOrder.splice(insertAt === -1 ? nextOrder.length : insertAt, 0, activeDrag.sessionId);
		setSessionOrder(activeDrag.accountKey, nextOrder.map((id) => id));
		if (orderBy === "updated" || activeDrag.accountKey === "") return;
		insertSessionBefore(activeDrag.accountKey, activeDrag.sessionId, anchor).catch((reason) => {
			console.warn("session reorder rejected:", reason);
		});
	};
	const commitWorkspaceDrag = (activeDrag, over) => {
		if (workspaceDropCommitted.current) return;
		workspaceDropCommitted.current = true;
		setWorkspaceDrag(null);
		const rowIndex = workspaces.findIndex((workspace) => workspace.workspaceId === over.id);
		if (rowIndex === -1) return;
		const anchor = over.half === "before" ? over.id : workspaces[rowIndex + 1]?.workspaceId;
		if (anchor === activeDrag.workspaceId) return;
		const sourceIndex = workspaces.findIndex((workspace) => workspace.workspaceId === activeDrag.workspaceId);
		const anchorIndex = anchor === void 0 ? workspaces.length : workspaces.findIndex((workspace) => workspace.workspaceId === anchor);
		if (sourceIndex !== -1 && (anchorIndex === sourceIndex || anchorIndex === sourceIndex + 1)) return;
		insertWorkspaceBefore(activeDrag.workspaceId, anchor).catch((reason) => {
			console.warn("workspace reorder rejected:", reason);
		});
	};
	const workspaceDropAtListStart = groups[0]?.workspaceId !== void 0 && workspaceDrag?.over?.id === groups[0].workspaceId && workspaceDrag.over.half === "before";
	/** PLUS：把会话拖到分组头部 → 修改该会话的工作区归属（null = 移入未分组）。 */
	const commitSessionHeaderDrop = (activeDrag, targetWorkspaceId) => {
		if (sessionDropCommitted.current) return;
		sessionDropCommitted.current = true;
		setDrag(null);
		onMoveSession(activeDrag.sessionId, targetWorkspaceId).catch((reason) => {
			console.warn("session move rejected:", reason);
		});
	};
	return (0, react_jsx_runtime.jsxs)("div", {
		className: clsx(WorkspaceBrowser_module_css_default.treeBody, WorkspaceBrowser_module_css_default.wide),
		children: [
			workspaceDropAtListStart && (0, react_jsx_runtime.jsx)("span", {
				className: WorkspaceBrowser_module_css_default.listTopDropIndicator,
				"aria-hidden": "true"
			}),
			(0, react_jsx_runtime.jsxs)("div", {
				className: clsx(WorkspaceBrowser_module_css_default.list, workspaceDropAtListStart && WorkspaceBrowser_module_css_default.listTopDropActive),
				role: "tree",
				"aria-label": t("section.sessions"),
				children: [groups.length === 0 && (0, react_jsx_runtime.jsx)("div", {
					className: WorkspaceBrowser_module_css_default.empty,
					children: t("empty.none")
				}), groups.map((group) => {
					const workspaceId = group.workspaceId;
					const workspaceMarker = workspaceId !== void 0 && workspaceDrag?.over?.id === workspaceId ? workspaceDrag.over.half : null;
					const workspaceDragProps = workspaceId === void 0 ? void 0 : {
						start: () => {
							workspaceDropCommitted.current = false;
							setWorkspaceDrag({
								workspaceId,
								over: null
							});
						},
						end: () => {
							if (workspaceDrag?.over !== null && workspaceDrag?.over !== void 0) commitWorkspaceDrag(workspaceDrag, workspaceDrag.over);
							else setWorkspaceDrag(null);
							workspaceDropCommitted.current = false;
						}
					};
					const hoverWorkspace = workspaceId === void 0 ? void 0 : (half) => {
						setWorkspaceDrag((active) => active === null ? active : {
							...active,
							over: {
								id: workspaceId,
								half
							}
						});
					};
					const dropWorkspace = workspaceId === void 0 ? void 0 : (half) => {
						if (workspaceDrag === null) return;
						commitWorkspaceDrag(workspaceDrag, {
							id: workspaceId,
							half
						});
					};
					const groupWorkspaceId = group.workspaceId ?? null;
					const acceptsSessionDrop = drag !== null && (groupWorkspaceId ?? "") !== drag.accountKey;
					return (0, react_jsx_runtime.jsxs)("div", {
						className: clsx(WorkspaceBrowser_module_css_default.groupSection, workspaceMarker === "before" && WorkspaceBrowser_module_css_default.workspaceDropBefore, workspaceMarker === "after" && WorkspaceBrowser_module_css_default.workspaceDropAfter, acceptsSessionDrop && sessionDropGroup === group.key && "dshse_sessionDropTarget"),
						onDragOver: (e) => {
							if (workspaceDrag !== null && hoverWorkspace !== void 0) {
								e.preventDefault();
								e.dataTransfer.dropEffect = "move";
								hoverWorkspace(workspaceGroupHalf(e));
								return;
							}
							if (acceptsSessionDrop) {
								e.preventDefault();
								e.dataTransfer.dropEffect = "move";
								setSessionDropGroup(group.key);
							}
						},
						onDrop: (e) => {
							e.preventDefault();
							if (workspaceDrag !== null && dropWorkspace !== void 0) {
								dropWorkspace(workspaceGroupHalf(e));
								return;
							}
							if (acceptsSessionDrop && drag !== null) commitSessionHeaderDrop(drag, groupWorkspaceId);
						},
						onDragLeave: (e) => {
							if (e.currentTarget.contains(e.relatedTarget)) return;
							setSessionDropGroup((current) => current === group.key ? null : current);
						},
						children: [
							(0, react_jsx_runtime.jsx)(ProjectRowItem, {
								group,
								t,
								onToggle: () => {
									if (group.expanded) setExpandedSessionGroups((keys) => keys.filter((key) => key !== group.key));
									setGroupExpanded(group.key, !group.expanded);
								},
								onCreate: () => {
									if (group.workspaceId !== void 0) {
										setGroupExpanded(group.key, true);
										startSession(group.workspaceId);
									}
								},
								drag: workspaceDragProps,
								actions: group.workspaceId === void 0 ? void 0 : {
									rename: () => {
										/* v8 ignore next -- narrowing guard: the actions object exists only for real-workspace groups. */
										if (group.workspaceId !== void 0) onRenameRequest(group.workspaceId, group.label);
									},
									delete: () => {
										/* v8 ignore next -- narrowing guard: the actions object exists only for real-workspace groups. */
										if (group.workspaceId !== void 0) onDeleteRequest(group.workspaceId, group.label);
									}
								}
							}),
							(expandedSessionGroups.includes(group.key) ? group.sessions : group.sessions.slice(0, COLLAPSED_SESSION_LIMIT)).map((node) => {
								const sameGroupDrag = drag !== null && drag.accountKey === group.key;
								return (0, react_jsx_runtime.jsx)(SessionNodeItem, {
									node,
									currentId: current,
									now,
									onOpen: open,
									onRename: onSessionRename,
									onFork: (sessionId) => {
										Promise.resolve(forkSession(sessionId)).catch((reason) => {
											showArchivedToast(formatForkError(reason, t));
										});
									},
									onArchive: onSessionArchive,
									onUnarchive: onSessionUnarchive,
									onCopySessionId,
									onDeleteSession: onSessionDelete,
									drag: {
										start: () => {
											sessionDropCommitted.current = false;
											setDrag({
												accountKey: group.key,
												sessionId: node.id,
												over: null
											});
										},
										active: drag !== null,
										marker: sameGroupDrag && drag.over?.id === node.id ? drag.over.half : null,
										hover: (half) => {
											/* v8 ignore next -- narrowing guard: Rows gates hover on `active`, which is false while the drag state is null. */
											setDrag((d) => d === null ? d : {
												...d,
												over: {
													id: node.id,
													half
												}
											});
										},
										drop: (half) => {
											/* v8 ignore next -- narrowing guard: Rows gates drop on `active`, which is false while the drag state is null. */
											if (drag === null) return;
											commitSessionDrag(drag, {
												id: node.id,
												half
											});
										},
										end: () => {
											if (drag?.over !== null && drag?.over !== void 0) commitSessionDrag(drag, drag.over);
											else setDrag(null);
											sessionDropCommitted.current = false;
										}
									},
									t
								}, node.id);
							}),
							group.sessions.length > COLLAPSED_SESSION_LIMIT && (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: WorkspaceBrowser_module_css_default.sessionOverflowButton,
								"aria-expanded": expandedSessionGroups.includes(group.key),
								onClick: () => {
									setExpandedSessionGroups((keys) => toggled(keys, group.key));
								},
								children: expandedSessionGroups.includes(group.key) ? t("sessions.collapse") : t("sessions.expand", { n: group.sessions.length - COLLAPSED_SESSION_LIMIT })
							})
						]
					}, group.key);
				})]
			}),
			(0, react_jsx_runtime.jsx)("span", { className: WorkspaceBrowser_module_css_default.fade })
		]
	});
}
/** The flat "In one list" body: every session is one draggable top-level row. */
function FlatList({ useSessions, open, forkSession, onSessionRename, onSessionArchive, onSessionUnarchive, onCopySessionId, onSessionDelete, archivedSessionIds, showArchived, orderBy, sessionOrderByAccount, sessionUpdatedAtByAccount, syncSessionOrderAccount, setSessionOrder, t }) {
	const list = useSessions((s) => s);
	const baseRows = (0, react.useMemo)(() => deriveFlat(list, archivedSessionIds, showArchived), [list, archivedSessionIds, showArchived]);
	const sessionIds = (0, react.useMemo)(() => baseRows.map((row) => row.id), [baseRows]);
	const previousOrderBy = (0, react.useRef)(orderBy);
	(0, react.useEffect)(() => {
		if (list.phase !== "ready") return;
		const previousOrder = sessionOrderByAccount[FLAT_SESSION_ORDER_KEY];
		const previousUpdatedAt = sessionUpdatedAtByAccount[FLAT_SESSION_ORDER_KEY] ?? {};
		const switchedToUpdated = previousOrderBy.current !== "updated" && orderBy === "updated";
		previousOrderBy.current = orderBy;
		const next = nextSessionOrderAccount({
			sessionIds,
			previousOrder,
			previousUpdatedAt,
			list,
			orderBy,
			sortByRecency: orderBy === "updated" && (previousOrder === void 0 || switchedToUpdated)
		});
		if (next.changed) syncSessionOrderAccount(FLAT_SESSION_ORDER_KEY, next.order.map((id) => id), next.updatedAt);
	}, [
		list,
		orderBy,
		sessionOrderByAccount,
		sessionUpdatedAtByAccount,
		sessionIds,
		syncSessionOrderAccount
	]);
	const rows = (0, react.useMemo)(() => {
		const byId = new Map(baseRows.map((row) => [row.id, row]));
		return reconciledSessionOrder(sessionIds, sessionOrderByAccount[FLAT_SESSION_ORDER_KEY]).flatMap((id) => {
			const row = byId.get(id);
			return row === void 0 ? [] : [row];
		});
	}, [
		baseRows,
		sessionOrderByAccount,
		sessionIds
	]);
	const [drag, setDrag] = (0, react.useState)(null);
	const dropCommitted = (0, react.useRef)(false);
	useNativeDragAcceptance(drag !== null);
	const commitDrag = (activeDrag, over) => {
		if (dropCommitted.current) return;
		dropCommitted.current = true;
		setDrag(null);
		const targetIndex = rows.findIndex((row) => row.id === over.id);
		if (targetIndex === -1) return;
		const anchor = over.half === "before" ? over.id : rows[targetIndex + 1]?.id;
		if (anchor === activeDrag.sessionId) return;
		const sourceIndex = rows.findIndex((row) => row.id === activeDrag.sessionId);
		const anchorIndex = anchor === void 0 ? rows.length : rows.findIndex((row) => row.id === anchor);
		if (sourceIndex !== -1 && (anchorIndex === sourceIndex || anchorIndex === sourceIndex + 1)) return;
		const nextOrder = rows.map((row) => row.id).filter((id) => id !== activeDrag.sessionId);
		const insertAt = anchor === void 0 ? nextOrder.length : nextOrder.indexOf(anchor);
		nextOrder.splice(insertAt === -1 ? nextOrder.length : insertAt, 0, activeDrag.sessionId);
		setSessionOrder(FLAT_SESSION_ORDER_KEY, nextOrder.map((id) => id));
	};
	const now = Date.now();
	return (0, react_jsx_runtime.jsxs)("div", {
		className: clsx(WorkspaceBrowser_module_css_default.treeBody, WorkspaceBrowser_module_css_default.wide),
		children: [(0, react_jsx_runtime.jsxs)("div", {
			className: clsx(WorkspaceBrowser_module_css_default.list, WorkspaceBrowser_module_css_default.flatList),
			role: "tree",
			"aria-label": t("section.sessions"),
			children: [rows.length === 0 && (0, react_jsx_runtime.jsx)("div", {
				className: WorkspaceBrowser_module_css_default.empty,
				children: t("empty.none")
			}), rows.map((node) => {
				const active = drag !== null;
				return (0, react_jsx_runtime.jsx)(SessionNodeItem, {
					node,
					currentId: list.current,
					now,
					onOpen: open,
					onRename: onSessionRename,
					onFork: (sessionId) => {
						Promise.resolve(forkSession(sessionId)).catch((reason) => {
							showArchivedToast(formatForkError(reason, t));
						});
					},
					onArchive: onSessionArchive,
					onUnarchive: onSessionUnarchive,
					onCopySessionId,
					onDeleteSession: onSessionDelete,
					flat: true,
					drag: {
						start: () => {
							dropCommitted.current = false;
							setDrag({
								accountKey: FLAT_SESSION_ORDER_KEY,
								sessionId: node.id,
								over: null
							});
						},
						active,
						marker: active && drag.over?.id === node.id ? drag.over.half : null,
						hover: (half) => {
							setDrag((current) => current === null ? current : {
								...current,
								over: {
									id: node.id,
									half
								}
							});
						},
						drop: (half) => {
							if (drag !== null) commitDrag(drag, {
								id: node.id,
								half
							});
						},
						end: () => {
							if (drag?.over !== null && drag?.over !== void 0) commitDrag(drag, drag.over);
							else setDrag(null);
							dropCommitted.current = false;
						}
					},
					t
				}, node.id);
			})]
		}), (0, react_jsx_runtime.jsx)("span", { className: WorkspaceBrowser_module_css_default.fade })]
	});
}
/** Flat search body: local metadata matches plus the current Host result page. */
function SearchResults({ useSessions, open, workspaces, archivedSessionIds, showArchived, query, remote, resultLimit, t }) {
	const list = useSessions((s) => s);
	const currentRemote = remote.query === query ? remote : {
		query,
		status: "loading",
		items: [],
		hasMore: false
	};
	const results = (0, react.useMemo)(() => deriveSearchResults(list, workspaces, query, archivedSessionIds, currentRemote, resultLimit, showArchived), [
		list,
		workspaces,
		query,
		archivedSessionIds,
		currentRemote,
		resultLimit,
		showArchived
	]);
	const pending = currentRemote.status === "loading";
	const failed = currentRemote.status === "error";
	return (0, react_jsx_runtime.jsxs)("div", {
		className: clsx(WorkspaceBrowser_module_css_default.treeBody, WorkspaceBrowser_module_css_default.wide),
		children: [(0, react_jsx_runtime.jsxs)("div", {
			className: WorkspaceBrowser_module_css_default.list,
			children: [
				(0, react_jsx_runtime.jsx)("div", {
					className: WorkspaceBrowser_module_css_default.searchTree,
					role: "tree",
					"aria-label": t("search.results.aria"),
					children: results.items.map((result) => (0, react_jsx_runtime.jsx)(SearchResultItem, {
						result,
						currentId: list.current,
						onOpen: open,
						t
					}, result.id))
				}),
				pending && (0, react_jsx_runtime.jsx)("div", {
					className: WorkspaceBrowser_module_css_default.searchStatus,
					role: "status",
					children: t("search.pending")
				}),
				failed && (0, react_jsx_runtime.jsx)("div", {
					className: WorkspaceBrowser_module_css_default.searchWarning,
					role: "status",
					children: t("search.unavailable")
				}),
				!pending && results.items.length === 0 && (0, react_jsx_runtime.jsx)("div", {
					className: WorkspaceBrowser_module_css_default.empty,
					children: t("search.noMatches")
				}),
				results.hasMore && (0, react_jsx_runtime.jsx)("div", {
					className: WorkspaceBrowser_module_css_default.searchStatus,
					children: t("search.hasMore", { n: resultLimit })
				})
			]
		}), (0, react_jsx_runtime.jsx)("span", { className: WorkspaceBrowser_module_css_default.fade })]
	});
}
/**
* Render the browsing region.
* @param props - composed slot props (shell owner share + store + injected actions).
* @returns the region element tree.
*/
function WorkspaceBrowser({ wide, expandSidebar, useSessions, useWorkspaces, useStore, actions, startSession, open, renameSession, forkSession, renameWorkspace, deleteWorkspace, insertWorkspaceBefore, archiveSession, unarchiveSession, deleteSession, moveSession, insertSessionBefore, createWorkspace, searchSessions, searchResultLimit, useDirectoryFlow, renderSlot, t }) {
	const workspaces = useWorkspaces((state) => state.items);
	const workspacePhase = useWorkspaces((state) => state.phase);
	const archivedSessionIds = useWorkspaces((state) => state.archivedSessionIds);
	const sessionSnapshot = useSessions((s) => s);
	const directoryFlowAvailable = useDirectoryFlow((occupied) => occupied);
	const groupBy = useStore((s) => s.groupBy);
	const orderBy = useStore((s) => s.orderBy);
	const showArchived = useStore((s) => s.showArchived) === true;
	const groupExpansion = useStore((s) => s.groupExpansion);
	const sessionOrderByAccount = useStore((s) => s.sessionOrderByAccount);
	const sessionUpdatedAtByAccount = useStore((s) => s.sessionUpdatedAtByAccount);
	const archivedSet = (0, react.useMemo)(() => new Set(archivedSessionIds), [archivedSessionIds]);
	const [archivedToast, setArchivedToast] = (0, react.useState)(null);
	const archivedToastSeq = (0, react.useRef)(0);
	const showArchivedToast = (text) => {
		archivedToastSeq.current += 1;
		setArchivedToast({
			text,
			seq: archivedToastSeq.current
		});
	};
	const [copiedToast, setCopiedToast] = (0, react.useState)(null);
	const copiedToastSeq = (0, react.useRef)(0);
	const showCopiedToast = (text) => {
		copiedToastSeq.current += 1;
		setCopiedToast({
			text,
			seq: copiedToastSeq.current
		});
	};
	/** 复制会话 id 到剪贴板并给出结果反馈。 */
	const onCopySessionId = (sessionId) => {
		Promise.resolve(_deepseek_ai_dsh_client_ui_primitives.writeClipboard(sessionId)).then((ok) => {
			showCopiedToast(ok ? t("menu.copySessionIdCopied") : t("menu.copySessionIdFailed"));
		});
	};
	/** Open a session, unless it is archived (show the archived hint instead). */
	const guardedOpen = (sessionId) => {
		if (archivedSet.has(sessionId)) {
			showArchivedToast(t("archived.notOpenable"));
			return;
		}
		open(sessionId);
	};
	(0, react.useEffect)(() => {
		if (workspacePhase !== "ready") return;
		actions.retainAccountKeys([
			"",
			FLAT_SESSION_ORDER_KEY,
			...workspaces.map((workspace) => workspace.workspaceId)
		]);
	}, [
		actions.retainAccountKeys,
		workspacePhase,
		workspaces
	]);
	const [query, setQuery] = (0, react.useState)("");
	const [searchExpanded, setSearchExpanded] = (0, react.useState)(false);
	const normalizedQuery = sanitizeSearchQuery(query).trim();
	const [remoteSearch, setRemoteSearch] = (0, react.useState)({
		query: "",
		status: "idle",
		items: [],
		hasMore: false
	});
	const searchRoot = (0, react.useRef)(null);
	const searchInput = (0, react.useRef)(null);
	const [wsPickerOpen, setWsPickerOpen] = (0, react.useState)(false);
	const wsPlusRef = (0, react.useRef)(null);
	const composingRef = (0, react.useRef)(false);
	const [searchOnExpand, setSearchOnExpand] = (0, react.useState)(false);
	(0, react.useEffect)(() => {
		if (wide && searchOnExpand) {
			const timer = window.setTimeout(() => {
				searchInput.current?.focus({ preventScroll: true });
				setSearchOnExpand(false);
			}, EXPAND_SLIDE_MS);
			return () => {
				window.clearTimeout(timer);
			};
		}
	}, [wide, searchOnExpand]);
	(0, react.useEffect)(() => {
		if (!wide || !searchExpanded || searchOnExpand) return;
		searchInput.current?.focus({ preventScroll: true });
	}, [
		wide,
		searchExpanded,
		searchOnExpand
	]);
	(0, react.useEffect)(() => {
		if (!wide || !searchExpanded) return;
		const onClick = (event) => {
			if (!(event.target instanceof Node) || searchRoot.current?.contains(event.target) === true) return;
			searchInput.current?.blur();
			if (normalizedQuery !== "") return;
			setSearchExpanded(false);
		};
		document.addEventListener("click", onClick);
		return () => {
			document.removeEventListener("click", onClick);
		};
	}, [
		normalizedQuery,
		wide,
		searchExpanded
	]);
	(0, react.useEffect)(() => {
		if (normalizedQuery === "") {
			setRemoteSearch({
				query: "",
				status: "idle",
				items: [],
				hasMore: false
			});
			return;
		}
		const controller = new AbortController();
		setRemoteSearch({
			query: normalizedQuery,
			status: "loading",
			items: [],
			hasMore: false
		});
		const timer = window.setTimeout(() => {
			searchSessions(normalizedQuery, controller.signal).then((result) => {
				if (controller.signal.aborted) return;
				setRemoteSearch({
					query: normalizedQuery,
					status: "ready",
					items: result.items,
					hasMore: result.hasMore
				});
			}).catch(() => {
				if (controller.signal.aborted) return;
				setRemoteSearch({
					query: normalizedQuery,
					status: "error",
					items: [],
					hasMore: false
				});
			});
		}, SEARCH_DEBOUNCE_MS);
		return () => {
			window.clearTimeout(timer);
			controller.abort();
		};
	}, [normalizedQuery, searchSessions]);
	const [renameTarget, setRenameTarget] = (0, react.useState)(null);
	const [renameDraft, setRenameDraft] = (0, react.useState)("");
	const [renaming, setRenaming] = (0, react.useState)(false);
	const [renameError, setRenameError] = (0, react.useState)(null);
	const renameTrimmed = renameDraft.trim();
	const renameDuplicate = renameTarget !== null && renameTrimmed !== "" && renameTrimmed !== renameTarget.currentTitle && workspaces.some((w) => w.title === renameTrimmed);
	const renameBlocked = renaming || renameTrimmed === "" || renameTarget === null || renameTrimmed === renameTarget.currentTitle || renameDuplicate;
	const closeRename = () => {
		if (renaming) return;
		setRenameTarget(null);
		setRenameError(null);
	};
	const confirmRename = () => {
		if (renameBlocked) return;
		setRenaming(true);
		setRenameError(null);
		renameWorkspace(renameTarget.workspaceId, renameTrimmed).then(() => {
			setRenaming(false);
			setRenameTarget(null);
		}).catch((reason) => {
			setRenaming(false);
			setRenameError(reason instanceof Error ? reason.message : String(reason));
		});
	};
	const [sessionRenameTarget, setSessionRenameTarget] = (0, react.useState)(null);
	const [sessionRenameDraft, setSessionRenameDraft] = (0, react.useState)("");
	const [sessionRenaming, setSessionRenaming] = (0, react.useState)(false);
	const [sessionRenameError, setSessionRenameError] = (0, react.useState)(null);
	const sessionRenameTrimmed = sessionRenameDraft.trim();
	const sessionRenameBlocked = sessionRenaming || sessionRenameTrimmed === "" || sessionRenameTarget === null;
	const closeSessionRename = () => {
		if (sessionRenaming) return;
		setSessionRenameTarget(null);
		setSessionRenameError(null);
	};
	const confirmSessionRename = () => {
		if (sessionRenameBlocked) return;
		setSessionRenaming(true);
		setSessionRenameError(null);
		renameSession(sessionRenameTarget.sessionId, sessionRenameTrimmed).then(() => {
			setSessionRenaming(false);
			setSessionRenameTarget(null);
		}).catch((reason) => {
			setSessionRenaming(false);
			setSessionRenameError(reason instanceof Error ? reason.message : String(reason));
		});
	};
	const onSessionRename = (sessionId, currentTitle) => {
		setSessionRenameTarget({
			sessionId,
			currentTitle
		});
		setSessionRenameDraft(currentTitle);
		setSessionRenameError(null);
	};
	const onSessionArchive = (sessionId) => {
		archiveSession(sessionId).catch((reason) => {
			showArchivedToast(formatArchiveError(reason, t));
		});
	};
	const [deleteTarget, setDeleteTarget] = (0, react.useState)(null);
	const [deleting, setDeleting] = (0, react.useState)(false);
	const [deleteCommittedId, setDeleteCommittedId] = (0, react.useState)(null);
	const [deleteError, setDeleteError] = (0, react.useState)(null);
	(0, react.useEffect)(() => {
		if (deleteCommittedId === null || workspaces.some((workspace) => workspace.workspaceId === deleteCommittedId)) return;
		setDeleting(false);
		setDeleteCommittedId(null);
		setDeleteTarget(null);
	}, [deleteCommittedId, workspaces]);
	const closeDelete = () => {
		if (deleting) return;
		setDeleteTarget(null);
		setDeleteError(null);
	};
	const confirmDelete = () => {
		/* v8 ignore next -- the Modal is absent without a target and its button is disabled while deleting. */
		if (deleting || deleteTarget === null) return;
		setDeleting(true);
		setDeleteCommittedId(null);
		setDeleteError(null);
		deleteWorkspace(deleteTarget.workspaceId).then(() => {
			setDeleteCommittedId(deleteTarget.workspaceId);
		}).catch((reason) => {
			setDeleting(false);
			setDeleteError(reason instanceof Error ? reason.message : String(reason));
		});
	};
	const onSessionUnarchive = (sessionId) => {
		unarchiveSession(sessionId).catch((reason) => {
			showArchivedToast(formatUnarchiveError(reason, t));
		});
	};
	const [deleteSessionTarget, setDeleteSessionTarget] = (0, react.useState)(null);
	const [deletingSession, setDeletingSession] = (0, react.useState)(false);
	const [deleteSessionCommittedId, setDeleteSessionCommittedId] = (0, react.useState)(null);
	const [deleteSessionError, setDeleteSessionError] = (0, react.useState)(null);
	(0, react.useEffect)(() => {
		if (deleteSessionCommittedId === null || archivedSet.has(deleteSessionCommittedId) || workspaces.some((workspace) => workspace.sessionIds.includes(deleteSessionCommittedId))) return;
		setDeletingSession(false);
		setDeleteSessionCommittedId(null);
		setDeleteSessionTarget(null);
	}, [deleteSessionCommittedId, archivedSet, workspaces]);
	const closeDeleteSession = () => {
		if (deletingSession) return;
		setDeleteSessionTarget(null);
		setDeleteSessionError(null);
	};
	const confirmDeleteSession = () => {
		/* v8 ignore next -- the Modal is absent without a target and its button is disabled while deleting. */
		if (deletingSession || deleteSessionTarget === null) return;
		setDeletingSession(true);
		setDeleteSessionError(null);
		const rootId = deleteSessionTarget.sessionId;
		(async () => {
			await deleteSession(rootId);
		})().then(() => {
			setDeletingSession(false);
			setDeleteSessionTarget(null);
			setDeleteSessionCommittedId(rootId);
		}).catch((reason) => {
			setDeletingSession(false);
			setDeleteSessionError(formatDeleteError(reason, t));
		});
	};
	return (0, react_jsx_runtime.jsxs)("div", {
		className: clsx(WorkspaceBrowser_module_css_default.root, !wide && WorkspaceBrowser_module_css_default.rail),
		children: [
			(0, react_jsx_runtime.jsxs)("div", {
				className: WorkspaceBrowser_module_css_default.sectionHeader,
				children: [
					wide && (0, react_jsx_runtime.jsx)("span", {
						className: clsx(WorkspaceBrowser_module_css_default.sectionLabel, WorkspaceBrowser_module_css_default.wide, searchExpanded && WorkspaceBrowser_module_css_default.sectionLabelHidden),
						children: groupBy === "flat" ? t("section.sessions") : t("section.workspaces")
					}),
					wide && (0, react_jsx_runtime.jsx)("div", {
						className: clsx(WorkspaceBrowser_module_css_default.searchSlot, searchExpanded && WorkspaceBrowser_module_css_default.searchSlotExpanded),
						children: (0, react_jsx_runtime.jsxs)("div", {
							ref: searchRoot,
							className: clsx(WorkspaceBrowser_module_css_default.search, searchExpanded && WorkspaceBrowser_module_css_default.searchExpanded),
							onClick: () => {
								setWsPickerOpen(false);
								setSearchExpanded(true);
								searchInput.current?.focus();
							},
							children: [
								(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
									label: t("search"),
									side: "bottom",
									delayMs: 500,
									disabled: searchExpanded,
									children: (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: WorkspaceBrowser_module_css_default.searchButton,
										"aria-label": t("search.sessions.aria"),
										"aria-expanded": searchExpanded,
										onClick: () => {
											setWsPickerOpen(false);
											setSearchExpanded(true);
										},
										children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSearchOutline16, { size: searchExpanded ? 11 : 14 })
									})
								}),
								(0, react_jsx_runtime.jsx)("input", {
									ref: searchInput,
									className: WorkspaceBrowser_module_css_default.searchInput,
									type: "text",
									placeholder: t("search.placeholder"),
									maxLength: SEARCH_QUERY_MAX_CODE_UNITS,
									value: query,
									tabIndex: searchExpanded ? 0 : -1,
									onChange: (e) => {
										setQuery(sanitizeSearchQuery(e.target.value));
									},
									onKeyDown: (e) => {
										if (e.key !== "Escape") return;
										setQuery("");
										setSearchExpanded(false);
									}
								}),
								searchExpanded && (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: WorkspaceBrowser_module_css_default.clearButton,
									"aria-label": t("search.clear"),
									onClick: (e) => {
										e.stopPropagation();
										setQuery("");
										setSearchExpanded(false);
									},
									children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseFill14, {})
								})
							]
						})
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: clsx(WorkspaceBrowser_module_css_default.headerActions, wide && searchExpanded && WorkspaceBrowser_module_css_default.headerActionsHidden),
						children: [wide && (0, react_jsx_runtime.jsx)(ViewOptionsMenu, {
							groupBy,
							orderBy,
							onGroupPick: (mode) => {
								actions.setGroupBy(mode);
							},
							onOrderPick: (mode) => {
								actions.setOrderBy(mode);
							},
							t
						}), directoryFlowAvailable && (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
							label: t("workspace.add"),
							side: "bottom",
							delayMs: 500,
							children: (0, react_jsx_runtime.jsx)("button", {
								ref: wsPlusRef,
								type: "button",
								className: WorkspaceBrowser_module_css_default.iconButton,
								"aria-label": t("workspace.add"),
								onClick: () => {
									setWsPickerOpen((v) => !v);
								},
								children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconProjectAddOutline16, { size: wide ? 16 : 18 })
							})
						})]
					}),
					(0, react_jsx_runtime.jsx)(WorkspacePickFlow, {
						t,
						open: wsPickerOpen,
						anchorRef: wsPlusRef,
						useWorkspaces,
						createWorkspace,
						useDirectoryFlow,
						renderDirectoryFlow: (owner) => renderSlot("sidebar.workspaces.directoryFlow", owner),
						addOnly: true,
						side: "right",
						onPick: (workspaceId) => {
							setWsPickerOpen(false);
							startSession(workspaceId);
						},
						onClose: () => {
							setWsPickerOpen(false);
						}
					})
				]
			}),
			!wide && (0, react_jsx_runtime.jsx)("div", {
				className: WorkspaceBrowser_module_css_default.search,
				children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
					label: t("search"),
					children: (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: WorkspaceBrowser_module_css_default.searchButton,
						"aria-label": t("search.sessions.aria"),
						onClick: () => {
							setSearchExpanded(true);
							setSearchOnExpand(true);
							expandSidebar();
						},
						children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSearchOutline16, { size: 18 })
					})
				})
			}),
			(0, react_jsx_runtime.jsx)("div", {
				className: WorkspaceBrowser_module_css_default.listArea,
				children: wide && (normalizedQuery !== "" ? (0, react_jsx_runtime.jsx)(SearchResults, {
					useSessions,
					open: guardedOpen,
					workspaces,
					archivedSessionIds,
					showArchived,
					query: normalizedQuery,
					remote: remoteSearch,
					resultLimit: searchResultLimit,
					t
				}) : groupBy === "flat" ? (0, react_jsx_runtime.jsx)(FlatList, {
					useSessions,
					open: guardedOpen,
					forkSession,
					onSessionRename,
					onSessionArchive,
					onSessionUnarchive,
					onCopySessionId,
					onSessionDelete: (sessionId, title) => {
						setDeleteSessionTarget({ sessionId, title });
						setDeleteSessionError(null);
					},
					archivedSessionIds,
					showArchived,
					orderBy,
					sessionOrderByAccount,
					sessionUpdatedAtByAccount,
					syncSessionOrderAccount: actions.syncSessionOrderAccount,
					setSessionOrder: actions.setSessionOrder,
					t
				}) : (0, react_jsx_runtime.jsx)(SessionTree, {
					useSessions,
					onSessionRename,
					onSessionArchive,
					onSessionUnarchive,
					onCopySessionId,
					onSessionDelete: (sessionId, title) => {
						setDeleteSessionTarget({ sessionId, title });
						setDeleteSessionError(null);
					},
					onMoveSession: moveSession,
					forkSession,
					workspaces,
					groupExpansion,
					setGroupExpanded: actions.setGroupExpanded,
					sessionOrderByAccount,
					sessionUpdatedAtByAccount,
					syncSessionOrderAccount: actions.syncSessionOrderAccount,
					setSessionOrder: actions.setSessionOrder,
					archivedSessionIds,
					showArchived,
					startSession,
					open: guardedOpen,
					insertWorkspaceBefore,
					insertSessionBefore,
					orderBy,
					t,
					onRenameRequest: (workspaceId, currentTitle) => {
						setRenameTarget({
							workspaceId,
							currentTitle
						});
						setRenameDraft(currentTitle);
						setRenameError(null);
					},
					onDeleteRequest: (workspaceId, title) => {
						setDeleteTarget({
							workspaceId,
							title
						});
						setDeleteError(null);
					}
				}))
			}),
			(0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open: renameTarget !== null,
				onClose: closeRename,
				closeLabel: t("close"),
				title: t("rename.workspace.title"),
				footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, {
					children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "outline",
						disabled: renaming,
						onClick: closeRename,
						children: t("cancel")
					}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "primary",
						disabled: renameBlocked,
						onClick: confirmRename,
						children: t("rename")
					})]
				}),
				children: [
					(0, react_jsx_runtime.jsx)("input", {
						className: WorkspaceBrowser_module_css_default.renameInput,
						value: renameDraft,
						"aria-label": t("field.workspaceName"),
						autoFocus: true,
						disabled: renaming,
						onFocus: (e) => {
							e.target.select();
						},
						onChange: (e) => {
							setRenameDraft(e.target.value);
							setRenameError(null);
						},
						onCompositionStart: () => {
							composingRef.current = true;
						},
						onCompositionEnd: () => {
							composingRef.current = false;
						},
						onKeyDown: (e) => {
							if (e.key === "Enter" && !composingRef.current) {
								e.preventDefault();
								confirmRename();
							}
						}
					}),
					renameDuplicate && (0, react_jsx_runtime.jsx)("div", {
						className: WorkspaceBrowser_module_css_default.renameError,
						role: "alert",
						children: t("conflict.named", { name: renameTrimmed })
					}),
					renameError !== null && (0, react_jsx_runtime.jsx)("div", {
						className: WorkspaceBrowser_module_css_default.renameError,
						role: "alert",
						children: renameError
					})
				]
			}),
			(0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open: sessionRenameTarget !== null,
				onClose: closeSessionRename,
				closeLabel: t("close"),
				title: t("rename.session.title"),
				footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, {
					children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "outline",
						disabled: sessionRenaming,
						onClick: closeSessionRename,
						children: t("cancel")
					}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "primary",
						disabled: sessionRenameBlocked,
						onClick: confirmSessionRename,
						children: t("rename")
					})]
				}),
				children: [(0, react_jsx_runtime.jsx)("input", {
					className: WorkspaceBrowser_module_css_default.renameInput,
					value: sessionRenameDraft,
					"aria-label": t("field.sessionName"),
					autoFocus: true,
					disabled: sessionRenaming,
					onFocus: (e) => {
						e.target.select();
					},
					onChange: (e) => {
						setSessionRenameDraft(e.target.value);
						setSessionRenameError(null);
					},
					onCompositionStart: () => {
						composingRef.current = true;
					},
					onCompositionEnd: () => {
						composingRef.current = false;
					},
					onKeyDown: (e) => {
						if (e.key === "Enter" && !composingRef.current) {
							e.preventDefault();
							confirmSessionRename();
						}
					}
				}), sessionRenameError !== null && (0, react_jsx_runtime.jsx)("div", {
					className: WorkspaceBrowser_module_css_default.renameError,
					role: "alert",
					children: sessionRenameError
				})]
			}),
			(0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open: deleteTarget !== null,
				onClose: closeDelete,
				closeLabel: t("close"),
				title: t("delete.workspace"),
				...deleteTarget === null ? {} : { description: t("delete.desc", { name: deleteTarget.title }) },
				footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, {
					children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "outline",
						disabled: deleting,
						onClick: closeDelete,
						children: t("cancel")
					}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "outline",
						className: WorkspaceBrowser_module_css_default.deleteAction,
						disabled: deleting,
						onClick: confirmDelete,
						children: t("delete.workspace")
					})]
				}),
				children: [deleting && (0, react_jsx_runtime.jsx)("div", {
					className: WorkspaceBrowser_module_css_default.deleteStatus,
					role: "status",
					children: t("delete.pending")
				}), deleteError !== null && (0, react_jsx_runtime.jsx)("div", {
					className: WorkspaceBrowser_module_css_default.renameError,
					role: "alert",
					children: deleteError
				})]
			}),
			(0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open: deleteSessionTarget !== null,
				onClose: closeDeleteSession,
				closeLabel: t("close"),
				title: t("deleteSession.title"),
				...deleteSessionTarget === null ? {} : { description: t("deleteSession.desc", { name: deleteSessionTarget.title }) },
				footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, {
					children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "outline",
						disabled: deletingSession,
						onClick: closeDeleteSession,
						children: t("cancel")
					}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
						variant: "outline",
						className: WorkspaceBrowser_module_css_default.deleteAction,
						disabled: deletingSession,
						onClick: confirmDeleteSession,
						children: t("deleteSession.title")
					})]
				}),
				children: [deletingSession && (0, react_jsx_runtime.jsx)("div", {
					className: WorkspaceBrowser_module_css_default.deleteStatus,
					role: "status",
					children: t("deleteSession.pending")
				}), deleteSessionError !== null && (0, react_jsx_runtime.jsx)("div", {
					className: WorkspaceBrowser_module_css_default.renameError,
					role: "alert",
					children: deleteSessionError
				})]
			}),
			archivedToast !== null && (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Toast, {
				key: archivedToast.seq,
				text: archivedToast.text,
				onDone: () => {
					setArchivedToast(null);
				}
			}),
			copiedToast !== null && (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Toast, {
				key: copiedToast.seq,
				text: copiedToast.text,
				onDone: () => {
					setCopiedToast(null);
				}
			})
		]
	});
}

export { WorkspaceBrowser };