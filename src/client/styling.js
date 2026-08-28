/** Archived-session row presentation classes (theme-token driven). */
const ARCHIVED_CLASSES = {
	row: "dshse_archivedRow",
	title: "dshse_archivedTitle",
	badge: "dshse_archivedBadge",
	content: "dshse_archiveCardContent",
	meta: "dshse_archiveCardMeta",
	actions: "dshse_archiveCardActions",
	unarchive: "dshse_archiveCardUnarchive",
	delete: "dshse_archiveCardDelete"
};
const ARCHIVED_CSS = ".YDXeBa_sessionRow.dshse_archivedRow{box-sizing:border-box;cursor:default;min-height:64px;height:auto;background:var(--dsw-alias-button-elevated-fill);border:1px solid var(--dsw-alias-border-l2);border-radius:16px;gap:12px;margin:8px 0;padding:10px 16px}.YDXeBa_sessionRow.dshse_archivedRow:hover{background:var(--dsw-alias-button-elevated-fill);border-color:var(--dsw-alias-border-l3)}.YDXeBa_searchResultRow.dshse_archivedRow{background:var(--dsw-alias-button-elevated-fill);border:1px solid var(--dsw-alias-border-l2);border-radius:16px;margin:8px 0;padding:10px 16px}.dshse_archivedTitle{color:var(--dsw-alias-label-primary);font-weight:600}.dshse_archivedBadge{display:none}.dshse_archiveCardContent{min-width:0;flex:1;flex-direction:column;gap:2px;display:flex}.dshse_archiveCardMeta{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}.YDXeBa_sessionRow.dshse_archivedRow>.YDXeBa_time,.YDXeBa_sessionRow.dshse_archivedRow>.YDXeBa_rowActions{display:none}.dshse_archiveCardActions{align-items:center;gap:12px;display:inline-flex}.dshse_archiveCardActions button{cursor:pointer;border:none;flex:none}.dshse_archiveCardDelete{width:28px;height:28px;color:var(--dsw-alias-label-tertiary);background:transparent;border-radius:8px;align-items:center;justify-content:center;display:inline-flex}.dshse_archiveCardDelete:hover{color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-interactive-bg-hover)}.dshse_archiveCardUnarchive{height:32px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-button-elevated-fill);border:1px solid var(--dsw-alias-border-l2)!important;border-radius:10px;padding:0 12px;font-size:13px;font-weight:600;line-height:20px}.dshse_archiveCardUnarchive:hover{background:var(--dsw-alias-interactive-bg-hover)}";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify("dsh-session-enhance/Archived.module.css") + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-session-enhance";
	tag.dataset.pluginCss = "dsh-session-enhance/Archived.module.css";
	tag.textContent = ARCHIVED_CSS;
	document.head.appendChild(tag);
}
/** PLUS：拖拽修改归属的投放高亮样式（会话拖到别的分组头部时）。 */
const DND_CSS = ".dshse_sessionDropTarget{outline:2px dashed var(--dsw-alias-accent-strong);outline-offset:2px;border-radius:12px;background:var(--dsw-alias-interactive-bg-hover)}";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify("dsh-session-enhance/dnd.module.css") + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-session-enhance";
	tag.dataset.pluginCss = "dsh-session-enhance/dnd.module.css";
	tag.textContent = DND_CSS;
	document.head.appendChild(tag);
}

export { ARCHIVED_CLASSES };