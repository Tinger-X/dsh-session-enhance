import * as react from "react";
import * as react_jsx_runtime from "react/jsx-runtime";
import * as _deepseek_ai_dsh_client_ui_primitives from "@deepseek-ai/dsh-client-ui-primitives";
import { clsx } from "./clsx.js";
import { ARCHIVED_CLASSES } from "./styling.js";
import { relativeTime } from "./derive.js";

const css$2 = ".YDXeBa_projectRow,.YDXeBa_sessionRow{cursor:pointer;user-select:none;color:var(--dsw-alias-label-primary);border-radius:8px;align-items:center;gap:6px;padding:0 8px;display:flex}.YDXeBa_projectRow:hover,.YDXeBa_sessionRow:hover,.YDXeBa_sessionRow.YDXeBa_selected{background:var(--dsw-alias-interactive-bg-hover)}.YDXeBa_searchResultRow{box-sizing:border-box;cursor:pointer;text-align:left;width:100%;min-height:48px;color:var(--dsw-alias-label-primary);background:0 0;border:none;border-radius:8px;flex-direction:column;align-items:stretch;padding:4px 8px;display:flex}.YDXeBa_searchResultRow:hover,.YDXeBa_searchResultRow.YDXeBa_selected{background:var(--dsw-alias-interactive-bg-hover)}.YDXeBa_searchResultHeading{align-items:center;min-width:0;display:flex}.YDXeBa_searchResultTitle{text-overflow:ellipsis;white-space:nowrap;min-width:0;margin-left:4px;font-size:14px;line-height:20px;overflow:hidden}.YDXeBa_searchResultMeta{align-items:center;gap:6px;min-width:0;margin-left:20px;display:flex}.YDXeBa_searchResultWorkspace,.YDXeBa_searchResultSnippet{text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:17px;overflow:hidden}.YDXeBa_searchResultWorkspace{max-width:40%;color:var(--dsw-alias-label-tertiary);flex:none}.YDXeBa_searchResultSnippet{min-width:0;color:var(--dsw-alias-label-secondary);flex:1}.YDXeBa_projectRow{box-sizing:border-box;align-items:center;height:34px}.YDXeBa_projectRow .YDXeBa_rowActions{height:20px}.YDXeBa_sessionRow{height:32px;animation:YDXeBa_row-in .15s var(--ds-ease-in-out);gap:0}.YDXeBa_sessionRow .YDXeBa_title{margin:0 6px 0 4px}.YDXeBa_flatSessionRowWithoutStatus .YDXeBa_title{margin-left:0}@keyframes YDXeBa_row-in{0%{opacity:0}}.YDXeBa_slot{width:16px;height:20px;color:var(--dsw-alias-label-tertiary);flex:none;justify-content:center;align-items:center;display:inline-flex}.YDXeBa_visuallyHidden{clip:rect(0 0 0 0);white-space:nowrap;width:1px;height:1px;position:absolute;overflow:hidden}.YDXeBa_folderActive{color:var(--dsw-alias-state-business-primary)}.YDXeBa_projectRow .YDXeBa_chevron{display:none}.YDXeBa_projectRow:hover .YDXeBa_chevron{display:inline-flex}.YDXeBa_projectRow:hover .YDXeBa_folder{display:none}.YDXeBa_arrow{transition:transform .15s var(--ds-ease-in-out)}.YDXeBa_arrowOpen{transform:rotate(90deg)}.YDXeBa_projectText{flex-direction:column;flex:1;gap:2px;min-width:0;display:flex}.YDXeBa_title{text-overflow:ellipsis;white-space:nowrap;min-width:0;font-size:14px;line-height:20px;overflow:hidden}.YDXeBa_renameInput{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-button-elevated-fill);min-width:0;color:inherit;border-radius:4px;outline:none;padding:0 2px;font-size:14px;line-height:20px}.YDXeBa_sessionRow .YDXeBa_title{flex:1}.YDXeBa_meta{text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:20px;overflow:hidden}.YDXeBa_time{color:var(--dsw-alias-label-tertiary);flex:none;font-size:12px;line-height:20px}.YDXeBa_dot{flex:none}.YDXeBa_rowActions{flex:none;align-items:center;gap:12px;display:none}.YDXeBa_projectRow:hover .YDXeBa_rowActions,.YDXeBa_sessionRow:hover .YDXeBa_rowActions,.YDXeBa_projectRow.YDXeBa_menuOpen .YDXeBa_rowActions,.YDXeBa_sessionRow.YDXeBa_menuOpen .YDXeBa_rowActions{display:inline-flex}.YDXeBa_sessionRow:hover .YDXeBa_time,.YDXeBa_sessionRow.YDXeBa_menuOpen .YDXeBa_time{display:none}.YDXeBa_projectRow.YDXeBa_menuOpen,.YDXeBa_sessionRow.YDXeBa_menuOpen{background:var(--dsw-alias-interactive-bg-hover)}.YDXeBa_sessionRow.YDXeBa_dropBefore,.YDXeBa_sessionRow.YDXeBa_dropAfter{position:relative}.YDXeBa_sessionRow.YDXeBa_dropBefore:before,.YDXeBa_sessionRow.YDXeBa_dropAfter:after{content:\"\";z-index:1;background:linear-gradient(55deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 0 / 5px 7px no-repeat, linear-gradient(125deg, transparent calc(50% - 1px), var(--dsw-alias-state-business-primary) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) 0 5px / 5px 7px no-repeat, linear-gradient(var(--dsw-alias-state-business-primary) 0 0) 4px 5px / calc(100% - 4px) 2px no-repeat;pointer-events:none;height:12px;position:absolute;left:0;right:4px}.YDXeBa_sessionRow.YDXeBa_dropBefore:before{top:-7px}.YDXeBa_sessionRow.YDXeBa_dropAfter:after{bottom:-7px}.YDXeBa_hoverContent{flex-direction:column;gap:8px;display:flex}.YDXeBa_hoverTitle{color:#fff;overflow-wrap:break-word;font-size:14px;line-height:20px}.YDXeBa_hoverPath{color:#cfd3d6;word-break:break-all;font-size:12px;line-height:16px}.YDXeBa_hoverTime{color:#cfd3d6;font-size:12px;line-height:16px}.YDXeBa_hoverStatus{color:#adb2b8;align-items:center;gap:8px;font-size:12px;line-height:20px;display:flex}.YDXeBa_iconButton{cursor:pointer;width:16px;height:16px;color:var(--dsw-alias-label-tertiary);background:0 0;border:none;border-radius:4px;flex:none;justify-content:center;align-items:center;padding:0;display:inline-flex}.YDXeBa_iconButton:hover{color:var(--dsw-alias-label-primary)}.YDXeBa_chevron{color:var(--dsw-alias-label-caption)}@media (prefers-reduced-motion:reduce){.YDXeBa_sessionRow,.YDXeBa_arrow{transition:none;animation:none}}";
const tagId$2 = "@deepseek-ai/dsh-client-ui-workspace/Rows.module.css";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-session-enhance";
	tag.dataset.pluginCss = tagId$2;
	tag.textContent = css$2;
	document.head.appendChild(tag);
}
var Rows_module_css_default = {
	"hoverTitle": "YDXeBa_hoverTitle",
	"title": "YDXeBa_title",
	"hoverContent": "YDXeBa_hoverContent",
	"dropAfter": "YDXeBa_dropAfter",
	"renameInput": "YDXeBa_renameInput",
	"dot": "YDXeBa_dot",
	"hoverTime": "YDXeBa_hoverTime",
	"iconButton": "YDXeBa_iconButton",
	"flatSessionRowWithoutStatus": "YDXeBa_flatSessionRowWithoutStatus",
	"row-in": "YDXeBa_row-in",
	"folder": "YDXeBa_folder",
	"menuOpen": "YDXeBa_menuOpen",
	"selected": "YDXeBa_selected",
	"searchResultHeading": "YDXeBa_searchResultHeading",
	"searchResultWorkspace": "YDXeBa_searchResultWorkspace",
	"visuallyHidden": "YDXeBa_visuallyHidden",
	"projectRow": "YDXeBa_projectRow",
	"hoverStatus": "YDXeBa_hoverStatus",
	"arrowOpen": "YDXeBa_arrowOpen",
	"rowActions": "YDXeBa_rowActions",
	"chevron": "YDXeBa_chevron",
	"arrow": "YDXeBa_arrow",
	"searchResultTitle": "YDXeBa_searchResultTitle",
	"searchResultMeta": "YDXeBa_searchResultMeta",
	"slot": "YDXeBa_slot",
	"folderActive": "YDXeBa_folderActive",
	"time": "YDXeBa_time",
	"sessionRow": "YDXeBa_sessionRow",
	"meta": "YDXeBa_meta",
	"dropBefore": "YDXeBa_dropBefore",
	"searchResultSnippet": "YDXeBa_searchResultSnippet",
	"projectText": "YDXeBa_projectText",
	"hoverPath": "YDXeBa_hoverPath",
	"searchResultRow": "YDXeBa_searchResultRow"
};
/**
* Workspace browser tree row components (figma Cell set 14:3080): pure presentational —
* all data and callbacks arrive via props. Hover swaps (folder->chevron,
* time->ellipsis, action buttons) are CSS-only. Row ... menus are visual-only
* except workspace Rename/Delete and session Rename/Fork/Archive; the session
* and workspace hover cards are suppressed while a menu is open.
*/
/** Row display title: blank rows show the localized New Session label. */
function displayTitle(node, t) {
	return node.blank ? t("session.new") : node.title ?? node.displayTitle ?? "";
}
/** Localized compact relative time ("刚刚"/"5分钟" in zh, "now"/"5min" in en). */
function timeLabel(updatedAt, now, t) {
	const { unit, n } = relativeTime(updatedAt, now);
	return unit === "now" ? t("time.now") : t(`time.${unit}`, { n });
}
/** 归档页使用绝对时间，方便在历史记录中准确辨识会话。 */
function archiveTimeLabel(updatedAt, t) {
	const date = new Date(updatedAt);
	const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
	return t("archives.timestamp", { date: t("date.ymd", { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate() }), time });
}
/** Hover-card variant: distances wrap in the ago template; the now bucket stays bare (no "now ago"). */
function hoverTimeLabel(updatedAt, now, t) {
	const { unit, n } = relativeTime(updatedAt, now);
	return unit === "now" ? t("time.now") : t("time.ago", { t: t(`time.${unit}`, { n }) });
}
/**
* Absolute creation time through the dictionary's date template (the message
* clock pattern): `toLocaleString` would follow the browser language, not the
* app locale, and produce mixed-language text after a switch.
*/
function createdLabel(createdAt, t) {
	const d = new Date(createdAt);
	const pad2 = (v) => String(v).padStart(2, "0");
	return t("hover.created", {
		time: `${t("date.ymd", {
			y: d.getFullYear(),
			m: d.getMonth() + 1,
			d: d.getDate()
		})} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`
	});
}
/** Hover-card body: workspace title, full directory path, absolute creation time. */
function WorkspaceHoverContent({ label, cwd, createdAt, t }) {
	return (0, react_jsx_runtime.jsxs)("div", {
		className: Rows_module_css_default.hoverContent,
		children: [
			(0, react_jsx_runtime.jsx)("div", {
				className: Rows_module_css_default.hoverTitle,
				children: label
			}),
			(0, react_jsx_runtime.jsx)("div", {
				className: Rows_module_css_default.hoverPath,
				children: cwd
			}),
			(0, react_jsx_runtime.jsx)("div", {
				className: Rows_module_css_default.hoverTime,
				children: createdLabel(createdAt, t)
			})
		]
	});
}
/** Pointer-position half of a row (insert line above or below). */
function rowHalf(e) {
	const rect = e.currentTarget.getBoundingClientRect();
	return e.clientY < rect.top + rect.height / 2 ? "before" : "after";
}
/**
* Project (workspace) header row: folder + title;
* hover reveals the chevron and create button, and dwelling on a real
* Workspace shows its hover card (the ungrouped bucket has none).
* `containsCurrent` arrives on the node (derivation fact, no renderer scan).
* @param props.group - derived group node.
* @param props.onToggle - expand/collapse the group.
* @param props.onCreate - start a frontend Session inside this Workspace.
* @param props.drag - optional workspace-row drag wiring.
* @param props.t - the browser root's locale seat.
* @returns the row element.
*/
function ProjectRowItem({ group, onToggle, onCreate, actions, drag, t }) {
	const row = group;
	const label = row.workspaceId === void 0 ? t("group.ungrouped") : row.label;
	const active = group.expanded && group.containsCurrent;
	const [menuOpen, setMenuOpen] = (0, react.useState)(false);
	const workspaceMenuItems = [{
		id: "rename",
		label: t("rename"),
		icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEditOutline16, {})
	}, {
		id: "delete",
		label: t("delete.workspace"),
		icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {}),
		danger: true
	}];
	const ownRow = (0, react_jsx_runtime.jsxs)("div", {
		className: clsx(Rows_module_css_default.projectRow, menuOpen && Rows_module_css_default.menuOpen),
		role: "treeitem",
		"aria-expanded": row.expanded,
		onClick: onToggle,
		draggable: drag !== void 0,
		onDragStart: drag === void 0 ? void 0 : (e) => {
			e.dataTransfer.effectAllowed = "move";
			e.dataTransfer.setData("text/plain", row.key);
			drag.start();
		},
		onDragEnd: drag?.end,
		children: [
			(0, react_jsx_runtime.jsx)("span", {
				className: clsx(Rows_module_css_default.slot, Rows_module_css_default.folder, active && Rows_module_css_default.folderActive),
				children: row.expanded ? (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderOpen16, {}) : (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderClose16, {})
			}),
			(0, react_jsx_runtime.jsx)("span", {
				className: clsx(Rows_module_css_default.slot, Rows_module_css_default.chevron),
				children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTriangleRightFill14, { className: clsx(Rows_module_css_default.arrow, row.expanded && Rows_module_css_default.arrowOpen) })
			}),
			(0, react_jsx_runtime.jsx)("span", {
				className: Rows_module_css_default.projectText,
				children: (0, react_jsx_runtime.jsx)("span", {
					className: Rows_module_css_default.title,
					children: label
				})
			}),
			(0, react_jsx_runtime.jsxs)("span", {
				className: Rows_module_css_default.rowActions,
				children: [actions !== void 0 && (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
					open: menuOpen,
					onClose: () => {
						setMenuOpen(false);
					},
					items: workspaceMenuItems,
					onSelect: (id) => {
						setMenuOpen(false);
						/* v8 ignore next -- workspaceMenuItems carries exactly these two rows today. */
						if (id !== "rename" && id !== "delete") return;
						if (id === "rename") actions.rename();
						else actions.delete();
					},
					portal: true,
					closeOnPointerLeave: true,
					anchor: (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: Rows_module_css_default.iconButton,
						"aria-label": t("actions.workspace.aria", { name: label }),
						onClick: (e) => {
							e.stopPropagation();
							setMenuOpen((v) => !v);
						},
						children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEllipsisOutline16, {})
					})
				}), (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: Rows_module_css_default.iconButton,
					"aria-label": t("actions.newSession.aria", { name: label }),
					onClick: (e) => {
						e.stopPropagation();
						onCreate();
					},
					children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPlusOutline16, {})
				})]
			})
		]
	});
	if (row.createdAt === void 0) return ownRow;
	return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.HoverCard, {
		anchor: ownRow,
		content: (0, react_jsx_runtime.jsx)(WorkspaceHoverContent, {
			label: row.label,
			cwd: row.cwd,
			createdAt: row.createdAt,
			t
		}),
		disabled: menuOpen,
		copyText: row.cwd,
		copyLabel: t("copy"),
		copiedLabel: t("hover.copied")
	});
}
/* v8 ignore next 3 -- closed-union backstop; only reached if the status is forged */
function assertNever(value) {
	throw new Error(`unknown pending interaction: ${String(value)}`);
}
/**
* Session status presentation; pending interaction is primary and live activity
* outranks completion reminders.
*/
function sessionStatuses(node, t) {
	const subagents = node.runningSubagentCount === 0 ? void 0 : {
		state: "ongoing",
		label: t(node.runningSubagentCount === 1 ? "status.subagentsRunning.one" : "status.subagentsRunning.other", { n: node.runningSubagentCount })
	};
	let pending;
	switch (node.pendingInteraction) {
		case "approval":
			pending = {
				state: "warning",
				label: t("status.waitingApproval")
			};
			break;
		case "plan-review":
			pending = {
				state: "warning",
				label: t("status.planReview")
			};
			break;
		case "question":
			pending = {
				state: "warning",
				label: t("status.waitingAnswer")
			};
			break;
		case void 0: break;
		/* v8 ignore next -- closed PendingInteractionStatus union */
		default: return assertNever(node.pendingInteraction);
	}
	if (pending !== void 0) return subagents === void 0 ? [pending] : [pending, subagents];
	if (node.running) {
		const primary = {
			state: "ongoing",
			label: t("status.running")
		};
		return subagents === void 0 ? [primary] : [primary, subagents];
	}
	if (subagents !== void 0) return [subagents];
	if (node.completed) return [{
		state: "done",
		label: t("status.completed")
	}];
	return [{
		state: "done",
		label: t("status.idle")
	}];
}
/** Primary status dot plus every status's screen-reader label, shared by the search and session rows. */
function SessionStatusDots({ statuses }) {
	return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, {
		children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: statuses[0].state }), statuses.map((status) => (0, react_jsx_runtime.jsx)("span", {
			className: Rows_module_css_default.visuallyHidden,
			children: status.label
		}, status.label))]
	});
}
/** Hover-card body: full title, relative time, and every relevant live status. */
function SessionHoverContent({ node, now, t }) {
	const statuses = sessionStatuses(node, t);
	return (0, react_jsx_runtime.jsxs)("div", {
		className: Rows_module_css_default.hoverContent,
		children: [
			(0, react_jsx_runtime.jsx)("div", {
				className: Rows_module_css_default.hoverTitle,
				children: displayTitle(node, t)
			}),
			!node.blank && (0, react_jsx_runtime.jsx)("div", {
				className: Rows_module_css_default.hoverTime,
				children: hoverTimeLabel(node.updatedAt, now, t)
			}),
			statuses.map((status) => (0, react_jsx_runtime.jsxs)("div", {
				className: Rows_module_css_default.hoverStatus,
				children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.StateDot, { state: status.state }), (0, react_jsx_runtime.jsx)("span", { children: status.label })]
			}, status.label))
		]
	});
}
/**
* One flat search result: title, Workspace context, and optional content
* excerpt. Search navigation opens the session only; it does not address an
* event inside the conversation. Archived results render with the archived
* treatment; the browser-level open guard keeps them from opening.
* @param props.result - merged local/content search row.
* @param props.currentId - selected session id.
* @param props.onOpen - open the selected session.
* @param props.t - Workspace-browser translation seat.
* @returns the result button.
*/
function SearchResultItem({ result, currentId, onOpen, t }) {
	const selected = result.id === currentId;
	const statuses = sessionStatuses(result, t);
	const primaryStatus = statuses[0];
	return (0, react_jsx_runtime.jsxs)("button", {
		type: "button",
		className: clsx(Rows_module_css_default.searchResultRow, selected && Rows_module_css_default.selected, result.archived === true && ARCHIVED_CLASSES.row),
		role: "treeitem",
		"aria-selected": selected,
		onClick: () => {
			onOpen(result.id);
		},
		children: [(0, react_jsx_runtime.jsxs)("span", {
			className: Rows_module_css_default.searchResultHeading,
			children: [(0, react_jsx_runtime.jsx)("span", {
				className: Rows_module_css_default.slot,
				children: (primaryStatus.state !== "done" || result.completed) && (0, react_jsx_runtime.jsx)(SessionStatusDots, { statuses })
			}), result.archived === true && (0, react_jsx_runtime.jsx)("span", {
				className: ARCHIVED_CLASSES.badge,
				children: t("archived.badge")
			}), (0, react_jsx_runtime.jsx)("span", {
				className: clsx(Rows_module_css_default.searchResultTitle, result.archived === true && ARCHIVED_CLASSES.title),
				children: result.title
			})]
		}), (0, react_jsx_runtime.jsxs)("span", {
			className: Rows_module_css_default.searchResultMeta,
			children: [(0, react_jsx_runtime.jsx)("span", {
				className: Rows_module_css_default.searchResultWorkspace,
				children: result.workspace
			}), result.snippet !== void 0 && (0, react_jsx_runtime.jsx)("span", {
				className: Rows_module_css_default.searchResultSnippet,
				children: result.snippet
			})]
		})]
	});
}
/**
* One top-level 34px session row: status dot (pending user interaction outranks
* own or descendant activity), title, relative time, and the row actions menu.
* Archived rows get the archived treatment (red title + tinted background +
* "Archived" badge), never open on click, and their menu is only
* [Unarchive, Delete session].
* @param props.node - derived session node.
* @param props.currentId - selected session id (row highlight).
* @param props.now - epoch ms for relative-time formatting.
* @param props.onOpen - open a session by id.
* @param props.onRename - open the session rename dialog (id + current title).
* @param props.onFork - fork a session at its last completed turn.
* @param props.onArchive - archive a session by id.
* @param props.onUnarchive - unarchive a session by id.
* @param props.onDeleteSession - request the delete-session confirmation.
* @param props.drag - optional draggable-row wiring.
* @param props.flat - omit the empty status slot in the hierarchy-free flat list.
* @param props.t - the browser root's locale seat.
* @returns the session row.
*/
function SessionNodeItem({ node, currentId, now, onOpen, onRename, onFork, onArchive, onUnarchive, onCopySessionId, onDeleteSession, drag, flat = false, t }) {
	const row = node;
	const title = displayTitle(node, t);
	const selected = node.id === currentId;
	const archived = row.archived === true;
	const statuses = sessionStatuses(node, t);
	const showStatus = statuses[0].state !== "done" || row.completed;
	const [menuOpen, setMenuOpen] = (0, react.useState)(false);
	const sessionMenuItems = archived ? [
		{
			id: "unarchive",
			label: t("menu.unarchive"),
			icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconArchiveOutline20, { size: 16 })
		},
		{
			id: "copy-id",
			label: t("menu.copySessionId"),
			icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCopyOutline16, {})
		},
		{
			id: "delete-session",
			label: t("menu.deleteSession"),
			icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {}),
			danger: true
		}
	] : [
		{
			id: "rename",
			label: t("rename"),
			icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEditOutline16, {})
		},
		{
			id: "fork",
			label: t("menu.fork"),
			icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconBranchOutline16, {})
		},
		{
			id: "archive",
			label: t("menu.archiveSession"),
			icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconArchiveOutline20, { size: 16 })
		},
		{
			id: "copy-id",
			label: t("menu.copySessionId"),
			icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCopyOutline16, {})
		},
		{
			id: "delete-session",
			label: t("menu.deleteSession"),
			icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {}),
			danger: true
		}
	];
	return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.HoverCard, {
		anchor: (0, react_jsx_runtime.jsxs)("div", {
			className: clsx(Rows_module_css_default.sessionRow, selected && Rows_module_css_default.selected, menuOpen && Rows_module_css_default.menuOpen, flat && !showStatus && Rows_module_css_default.flatSessionRowWithoutStatus, archived && ARCHIVED_CLASSES.row, drag?.marker === "before" && Rows_module_css_default.dropBefore, drag?.marker === "after" && Rows_module_css_default.dropAfter),
			role: "treeitem",
			"aria-selected": selected,
			onClick: () => {
				if (archived) return;
				onOpen(node.id);
			},
			draggable: drag !== void 0,
			onDragStart: drag === void 0 ? void 0 : (e) => {
				e.dataTransfer.effectAllowed = "move";
				e.dataTransfer.setData("text/plain", node.id);
				drag.start();
			},
			onDragEnd: drag?.end,
			onDragOver: drag === void 0 ? void 0 : (e) => {
				if (!drag.active) return;
				e.preventDefault();
				e.dataTransfer.dropEffect = "move";
				drag.hover(rowHalf(e));
			},
			onDrop: drag === void 0 ? void 0 : (e) => {
				if (!drag.active) return;
				e.preventDefault();
				drag.drop(rowHalf(e));
			},
			children: [
				(!flat || showStatus) && (0, react_jsx_runtime.jsx)("span", {
					className: Rows_module_css_default.slot,
					children: showStatus && (0, react_jsx_runtime.jsx)(SessionStatusDots, { statuses })
				}),
				archived && (0, react_jsx_runtime.jsx)("span", {
					className: ARCHIVED_CLASSES.badge,
					children: t("archived.badge")
				}),
				archived ? (0, react_jsx_runtime.jsxs)("span", {
					className: ARCHIVED_CLASSES.content,
					children: [(0, react_jsx_runtime.jsx)("span", {
						className: clsx(Rows_module_css_default.title, ARCHIVED_CLASSES.title),
						children: title
					}), !row.blank && (0, react_jsx_runtime.jsx)("span", {
						className: ARCHIVED_CLASSES.meta,
						children: timeLabel(row.updatedAt, now, t)
					})]
				}) : (0, react_jsx_runtime.jsx)("span", {
					className: Rows_module_css_default.title,
					children: title
				}),
				!row.blank && (0, react_jsx_runtime.jsx)("span", {
					className: Rows_module_css_default.time,
					children: timeLabel(row.updatedAt, now, t)
				}),
				archived && !row.blank && (0, react_jsx_runtime.jsxs)("span", {
					className: ARCHIVED_CLASSES.actions,
					onClick: (e) => {
						e.stopPropagation();
					},
					children: [(0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: ARCHIVED_CLASSES.delete,
						"aria-label": t("menu.deleteSession"),
						onClick: () => onDeleteSession(node.id, row.title),
						children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {})
					}), (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: ARCHIVED_CLASSES.unarchive,
						onClick: () => onUnarchive(node.id),
						children: t("menu.unarchive")
					})]
				}),
				!row.blank && (0, react_jsx_runtime.jsx)("span", {
					className: Rows_module_css_default.rowActions,
					children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
						open: menuOpen,
						onClose: () => {
							setMenuOpen(false);
						},
						items: sessionMenuItems,
						onSelect: (id) => {
							setMenuOpen(false);
							if (id === "rename") onRename(node.id, row.title);
							if (id === "fork") onFork(node.id);
							if (id === "archive") onArchive(node.id);
							if (id === "unarchive") onUnarchive(node.id);
							if (id === "copy-id") onCopySessionId(node.id);
							if (id === "delete-session") onDeleteSession(node.id, row.title);
						},
						portal: true,
						closeOnPointerLeave: true,
						anchor: (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: Rows_module_css_default.iconButton,
							"aria-label": t("actions.session.aria", { name: title }),
							onClick: (e) => {
								e.stopPropagation();
								setMenuOpen((v) => !v);
							},
							children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEllipsisOutline16, {})
						})
					})
				})
			]
		}),
		content: (0, react_jsx_runtime.jsx)(SessionHoverContent, {
			node,
			now,
			t
		}),
		disabled: menuOpen || drag?.active === true,
		copyText: row.blank ? void 0 : row.title,
		copyLabel: t("copy"),
		copiedLabel: t("hover.copied")
	});
}

export { displayTitle, timeLabel, archiveTimeLabel, hoverTimeLabel, createdLabel, WorkspaceHoverContent, rowHalf, ProjectRowItem, assertNever, sessionStatuses, SessionStatusDots, SessionHoverContent, SearchResultItem, SessionNodeItem };