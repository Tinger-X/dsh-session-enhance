import * as react from "react";
import * as react_jsx_runtime from "react/jsx-runtime";
import * as _deepseek_ai_dsh_client_ui_primitives from "@deepseek-ai/dsh-client-ui-primitives";
import { formatDeleteError, formatUnarchiveError } from "./derive.js";
import { displayTitle, archiveTimeLabel } from "./rows.js";
import { zh, en } from "./locales.js";

/** 与后端一致的 projectKey：路径分隔符/冒号 → `-`，整体包 `--...--`（把工作区 cwd 映射回会话目录名）。 */
function projectKey(cwd) {
	if (!cwd) return "_no-cwd";
	let readable = "";
	let separatorRun = false;
	for (const ch of cwd) {
		if (ch === "/" || ch === "\\" || ch === ":") {
			if (!separatorRun) readable += "-";
			separatorRun = true;
		} else {
			readable += ch;
			separatorRun = false;
		}
	}
	return `--${(readable.replace(/^-+/, "") || "root").slice(0, 251)}--`;
}
/** 空目录名回退显示：去掉 `--...--` 包裹后取最后一级路径（如 `--D-tmp--` → `tmp`）。 */
function emptyDirLabel(name) {
	if (typeof name !== "string") return name;
	const core = name.replace(/^--/, "").replace(/--$/, "");
	const last = core.split("-").filter(Boolean).pop();
	return last || name;
}
/** 预览对话：眼睛图标（primitive 未提供，hand-authored，16 网格）。 */
function EyeIcon() {
	return (0, react_jsx_runtime.jsxs)("svg", {
		width: 16,
		height: 16,
		viewBox: "0 0 16 16",
		fill: "none",
		"aria-hidden": true,
		children: [(0, react_jsx_runtime.jsx)("path", {
			d: "M1.5 8S4.2 3.5 8 3.5 14.5 8 14.5 8 11.8 12.5 8 12.5 1.5 8 1.5 8Z",
			stroke: "currentColor",
			strokeWidth: "1.3",
			strokeLinecap: "round",
			strokeLinejoin: "round"
		}), (0, react_jsx_runtime.jsx)("circle", {
			cx: "8",
			cy: "8",
			r: "1.8",
			stroke: "currentColor",
			strokeWidth: "1.3"
		})]
	});
}
/** 取消归档：单条恢复（撤销箭头）图标（primitive 未提供）。 */
function RestoreIcon() {
	return (0, react_jsx_runtime.jsxs)("svg", {
		width: 16,
		height: 16,
		viewBox: "0 0 16 16",
		fill: "none",
		"aria-hidden": true,
		children: [(0, react_jsx_runtime.jsx)("path", {
			d: "M6 10.5 2.5 7 6 3.5",
			stroke: "currentColor",
			strokeWidth: "1.3",
			strokeLinecap: "round",
			strokeLinejoin: "round"
		}), (0, react_jsx_runtime.jsx)("path", {
			d: "M2.5 7h6.5a4 4 0 0 1 0 8H7",
			stroke: "currentColor",
			strokeWidth: "1.3",
			strokeLinecap: "round",
			strokeLinejoin: "round"
		})]
	});
}
/** 全部恢复：双撤销箭头图标，与单条「恢复」图标区分（primitive 未提供）。 */
function RestoreAllIcon() {
	return (0, react_jsx_runtime.jsxs)("svg", {
		width: 16,
		height: 16,
		viewBox: "0 0 16 16",
		fill: "none",
		"aria-hidden": true,
		children: [(0, react_jsx_runtime.jsx)("path", {
			d: "M5.5 8.5 2.5 5.5 5.5 2.5",
			stroke: "currentColor",
			strokeWidth: "1.3",
			strokeLinecap: "round",
			strokeLinejoin: "round"
		}), (0, react_jsx_runtime.jsx)("path", {
			d: "M2.5 5.5h5.5a3.5 3.5 0 0 1 0 7",
			stroke: "currentColor",
			strokeWidth: "1.3",
			strokeLinecap: "round",
			strokeLinejoin: "round"
		}), (0, react_jsx_runtime.jsx)("path", {
			d: "M10 13 7 10l3-3",
			stroke: "currentColor",
			strokeWidth: "1.3",
			strokeLinecap: "round",
			strokeLinejoin: "round"
		}), (0, react_jsx_runtime.jsx)("path", {
			d: "M7 10h5.5a3.5 3.5 0 0 1 0 7",
			stroke: "currentColor",
			strokeWidth: "1.3",
			strokeLinecap: "round",
			strokeLinejoin: "round"
		})]
	});
}
/** 系统消息的标签文案：优先用后端给出的 label，其次按 tag/name 组合。 */
function systemMessageLabel(message, t) {
	if (message.label !== void 0) return message.label;
	if (message.tag === "tool-call") return message.name !== void 0 ? t("archives.previewToolCallName", { name: message.name }) : t("archives.previewToolCall");
	if (message.tag === "tool") return message.name !== void 0 ? t("archives.previewToolResultName", { name: message.name }) : t("archives.previewToolResult");
	return t("archives.previewContext");
}
/** 按「回合」分组：每个用户消息开启一回合，其后的 LLM/系统消息归属该回合。 */
function groupPreviewTurns(messages) {
	const turns = [];
	let current = null;
	for (const message of messages) {
		if (message.kind === "user") {
			current = { user: message, items: [message] };
			turns.push(current);
		} else if (current !== null) {
			current.items.push(message);
		} else {
			current = { user: null, items: [message] };
			turns.push(current);
		}
	}
	return turns;
}
/** 把一回合内的消息整理为渲染块：连续 system 合并为一行，并记录其对齐（跟随前一条 user/LLM）。 */
function buildTurnBlocks(items) {
	const blocks = [];
	for (const message of items) {
		if (message.kind === "system") {
			const last = blocks[blocks.length - 1];
			if (last !== void 0 && last.kind === "system-group") {
				last.messages.push(message);
			} else {
				const previous = last;
				blocks.push({ kind: "system-group", messages: [message], align: previous !== void 0 && previous.kind === "user" ? "right" : "left" });
			}
		} else {
			blocks.push({ kind: message.kind, message });
		}
	}
	return blocks;
}
/** 用户头像：圆形底 + 人形剪影（SVG，随主题着色）。 */
function UserAvatarIcon({ className }) {
	return (0, react_jsx_runtime.jsxs)("svg", {
		width: 22,
		height: 22,
		viewBox: "0 0 22 22",
		className,
		"aria-hidden": true,
		children: [(0, react_jsx_runtime.jsx)("circle", { cx: "11", cy: "11", r: "11", fill: "currentColor", opacity: "0.16" }), (0, react_jsx_runtime.jsx)("circle", { cx: "11", cy: "8.6", r: "3", fill: "currentColor" }), (0, react_jsx_runtime.jsx)("path", { d: "M4.4 19.2c.9-3.1 3.4-4.8 6.6-4.8s5.7 1.7 6.6 4.8", fill: "none", stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round" })]
	});
}
/** LLM 头像：DeepSeek 鲸鱼 logo（圆形底 + FishLogo，随主题着色）。 */
function AssistantAvatarIcon({ className }) {
	return (0, react_jsx_runtime.jsx)("span", {
		className,
		"aria-hidden": true,
		children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.FishLogo, { size: 16 })
	});
}
/** 以 Markdown 渲染一段文本（静态预览，非流式；代码块复制按钮使用本地化标签）。 */
function previewMarkdown(text, t) {
	return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.MarkdownText, {
		text,
		codeLabels: { copyLabel: t("copy"), copiedLabel: t("hover.copied") }
	});
}
/** 把消息文本渲染为 Markdown；耐久图片（后端内联的 `data:image/…`）单独渲染为 <img>，其余（含 http(s) 外链图）交给 MarkdownText 原生渲染。 */
function previewContentNodes(text, t) {
	if (typeof text !== "string") return text;
	const pattern = /!\[([^\]]*)\]\(([^)\s]+)\)/g;
	const nodes = [];
	let cursor = 0;
	let match;
	let found = false;
	while ((match = pattern.exec(text)) !== null) {
		const src = match[2];
		if (src.startsWith("data:image/")) {
			found = true;
			if (match.index > cursor) nodes.push(previewMarkdown(text.slice(cursor, match.index), t));
			nodes.push((0, react_jsx_runtime.jsx)("img", {
				className: "dshse_previewImage",
				src,
				alt: match[1] || "",
				loading: "lazy",
				referrerPolicy: "no-referrer"
			}, `img-${match.index}`));
			cursor = match.index + match[0].length;
		}
	}
	if (!found) return previewMarkdown(text, t);
	if (cursor < text.length) nodes.push(previewMarkdown(text.slice(cursor), t));
	return nodes;
}
/** 用户/助手单条消息：头像与气泡同行，时间置于气泡底部并随消息对齐；收起按钮置于头像与气泡之间。 */
function PreviewMessageLine({ message, isUser, toggle, collapsed, t }) {
	const timeLabel = typeof message.time === "number" ? archiveTimeLabel(message.time, t) : null;
	const bubble = (0, react_jsx_runtime.jsx)("div", {
		className: isUser && collapsed ? "dshse_previewBubble dshse_previewBubbleCollapsed" : "dshse_previewBubble",
		children: collapsed ? (0, react_jsx_runtime.jsx)("div", {
			className: "dshse_previewText",
			children: (0, _deepseek_ai_dsh_client_ui_primitives.extractMarkdownPlainText)(message.text)
		}) : (0, react_jsx_runtime.jsx)("div", {
			className: "dshse_previewMarkdown",
			children: previewContentNodes(message.text, t)
		})
	});
	const avatarEl = isUser ? (0, react_jsx_runtime.jsx)(UserAvatarIcon, { className: "dshse_previewAvatarUser" }) : (0, react_jsx_runtime.jsx)(AssistantAvatarIcon, { className: "dshse_previewAvatarAssistant" });
	const lineChildren = isUser ? [bubble, toggle, avatarEl] : [avatarEl, bubble];
	return (0, react_jsx_runtime.jsxs)("div", {
		className: isUser ? "dshse_previewMsg dshse_previewMsgUser" : "dshse_previewMsg dshse_previewMsgAssistant",
		children: [(0, react_jsx_runtime.jsx)("div", { className: "dshse_previewMsgLine", children: lineChildren }), timeLabel !== null ? (0, react_jsx_runtime.jsx)("div", { className: "dshse_previewMsgTime", children: timeLabel }) : null]
	});
}
/** 一行连续的系统消息（标签不换行）。 */
function PreviewSystemRow({ messages, align, t }) {
	return (0, react_jsx_runtime.jsx)("div", {
		className: align === "right" ? "dshse_previewSystem dshse_previewSystemRight" : "dshse_previewSystem dshse_previewSystemLeft",
		children: messages.map((message, index) => (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
			label: message.text,
			side: "bottom",
			maxWidth: 360,
			children: (0, react_jsx_runtime.jsxs)("span", {
				className: "dshse_previewTag",
				children: [(0, react_jsx_runtime.jsx)("span", { className: "dshse_previewTagDot" }), (0, react_jsx_runtime.jsx)("span", { className: "dshse_previewTagLabel", children: systemMessageLabel(message, t) })]
			})
		}, index))
	});
}
/** 一个对话回合：仅在用户消息处提供收起/展开，收起时把用户消息截断为单行并隐藏其后的回复。 */
function PreviewTurn({ turn, t }) {
	const [collapsed, setCollapsed] = (0, react.useState)(false);
	const [bodyHeight, setBodyHeight] = (0, react.useState)(null);
	const bodyRef = (0, react.useRef)(null);
	const blocks = (0, react.useMemo)(() => buildTurnBlocks(turn.items), [turn.items]);
	const canCollapse = turn.user !== null;
	const userBlock = blocks.find((block) => block.kind === "user");
	const restBlocks = blocks.filter((block) => block.kind !== "user");
	// 用实测高度驱动收起/展开（max-height 过渡），规避 grid-template-rows 的 fr 单位动画在部分
	// 浏览器上不支持而出现的「瞬间塌陷」突变感；内容变化或窗口缩放时重新测量。
	(0, react.useEffect)(() => {
		const el = bodyRef.current;
		if (el === null) return;
		const measure = () => setBodyHeight(el.scrollHeight);
		measure();
		window.addEventListener("resize", measure);
		return () => window.removeEventListener("resize", measure);
	}, [turn.items]);
	const toggle = canCollapse ? (0, react_jsx_runtime.jsx)("button", {
		type: "button",
		className: "dshse_previewToggle",
		"aria-expanded": !collapsed,
		"aria-label": collapsed ? t("archives.expandTurn") : t("archives.collapseTurn"),
		onClick: () => setCollapsed((current) => !current),
		children: (0, react_jsx_runtime.jsx)("span", {
			className: collapsed ? "dshse_previewToggleIcon dshse_previewToggleIconCollapsed" : "dshse_previewToggleIcon",
			children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, {})
		})
	}) : null;
	const bodyStyle = collapsed ? { maxHeight: 0, opacity: 0 } : bodyHeight === null ? void 0 : { maxHeight: bodyHeight, opacity: 1 };
	return (0, react_jsx_runtime.jsxs)("div", {
		className: "dshse_previewTurn",
		children: [userBlock !== void 0 ? (0, react_jsx_runtime.jsx)(PreviewMessageLine, { message: userBlock.message, isUser: true, toggle, collapsed, t }) : null, restBlocks.length > 0 ? (0, react_jsx_runtime.jsx)("div", {
			ref: bodyRef,
			className: "dshse_previewTurnBody",
			style: bodyStyle,
			children: (0, react_jsx_runtime.jsx)("div", {
				className: "dshse_previewTurnBodyInner",
				children: restBlocks.map((block, index) => block.kind === "system-group" ? (0, react_jsx_runtime.jsx)(PreviewSystemRow, { messages: block.messages, align: block.align, t }, index) : (0, react_jsx_runtime.jsx)(PreviewMessageLine, { message: block.message, isUser: false, t }, index))
			})
		}) : null]
	});
}

const ARCHIVE_SETTINGS_CSS = ".dshse_settings{box-sizing:border-box;width:min(100%,760px);margin:0 auto;padding:0 0 32px;color:var(--dsw-alias-label-primary)}.dshse_settingsHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:12px}.dshse_settings h2{margin:0;font-size:20px;font-weight:650;letter-spacing:-.2px;line-height:28px}.dshse_settingsIntro{margin:4px 0 0;max-width:42em;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}.dshse_settingsDanger{display:inline-flex;align-items:center;gap:6px;min-height:32px;padding:0 12px;color:var(--dsw-alias-state-error-primary);background:transparent;border:1px solid var(--dsw-alias-state-error-primary);border-radius:8px;cursor:pointer;font:inherit;font-size:13px;font-weight:500}.dshse_settingsDanger:hover{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 20%,transparent)}.dshse_settingsToolbar{display:flex;gap:8px;margin-bottom:16px}.dshse_settingsSearch{display:flex;align-items:center;gap:8px;min-width:0;flex:1;height:32px;padding:0 12px;color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-button-elevated-fill));border:1px solid var(--dsw-alias-border-l2);border-radius:8px}.dshse_settingsSearch:focus-within{border-color:var(--dsw-alias-label-tertiary)}.dshse_settingsSearch input{width:100%;min-width:0;padding:0;color:var(--dsw-alias-label-primary);background:transparent;border:0;outline:0;font:inherit;font-size:12px}.dshse_settingsSearch input::placeholder{color:var(--dsw-alias-label-tertiary)}.dshse_settingsFilter{position:relative;min-width:168px;flex:none}.dshse_selectTrigger{box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:32px;padding:0 10px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-button-elevated-fill));border:1px solid var(--dsw-alias-border-l2);border-radius:8px;cursor:pointer;font:inherit;font-size:13px;line-height:20px;text-align:left}.dshse_selectTrigger:hover{background:var(--dsw-alias-interactive-bg-hover)}.dshse_selectTrigger:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.dshse_selectTrigger[aria-expanded='true']{border-color:var(--dsw-alias-label-primary)}.dshse_selectValue{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dshse_selectCaret{flex:none;width:12px;height:12px;color:var(--dsw-alias-label-tertiary)}.dshse_selectMenu{position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:30;box-sizing:border-box;min-width:100%;max-height:280px;overflow:auto;padding:4px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-specific-menu,var(--dsw-alias-bg-layer-2));box-shadow:var(--dsw-shadow-lv3)}.dshse_selectOption{box-sizing:border-box;display:flex;align-items:center;width:100%;min-height:32px;padding:0 10px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:20px;text-align:left;cursor:pointer}.dshse_selectOption:hover,.dshse_selectOption[data-active='true']{background:var(--dsw-alias-interactive-bg-hover)}.dshse_selectOption[aria-selected='true']{color:var(--dsw-alias-label-primary)}.dshse_settingsGroup{margin:0 0 20px}.dshse_settingsGroupHeading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 14px}.dshse_settingsGroupTitle{display:flex;align-items:center;gap:8px;min-width:0;margin:0;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600}.dshse_settingsGroupTitle svg{flex:none;color:var(--dsw-alias-label-secondary)}.dshse_settingsCount{flex:none;color:var(--dsw-alias-label-tertiary);font-size:12px}.dshse_settingsList{overflow:hidden;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-button-elevated-fill))}.dshse_settingsRow{display:flex;align-items:center;gap:12px;min-height:60px;padding:10px 16px;border-bottom:1px solid var(--dsw-alias-border-l2)}.dshse_settingsRow:last-child{border-bottom:0}.dshse_settingsContent{min-width:0;flex:1}.dshse_settingsTitle{overflow:hidden;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600;line-height:18px;text-overflow:ellipsis;white-space:nowrap}.dshse_settingsMeta{margin-top:2px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:16px}.dshse_settingsActions{display:flex;align-items:center;gap:8px}.dshse_settingsAction{min-height:32px;padding:0 12px;color:var(--dsw-alias-label-primary);background:transparent;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;cursor:pointer;font:inherit;font-size:13px;font-weight:500}.dshse_settingsAction:hover{filter:brightness(1.12)}.dshse_settingsDelete{display:flex;align-items:center;justify-content:center;width:28px;height:28px;color:var(--dsw-alias-label-tertiary);background:transparent;border:0;border-radius:8px;cursor:pointer}.dshse_settingsDelete:hover{color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-interactive-bg-hover)}.dshse_settingsEmpty{padding:28px 8px;color:var(--dsw-alias-label-secondary);text-align:center}.dshse_settingsError{margin-top:10px;color:var(--dsw-alias-state-error-primary);font-size:12px}@media(max-width:720px){.dshse_settings{width:100%;margin:28px auto 48px;padding:0 16px}.dshse_settingsHeader{margin-bottom:28px}.dshse_settingsToolbar{flex-wrap:wrap;margin-bottom:28px}.dshse_settingsSearch{flex-basis:100%}.dshse_settingsFilter{flex:1;min-width:0}.dshse_settingsGroup{margin-bottom:32px}.dshse_settingsRow{padding:10px 12px}.dshse_settingsActions{gap:4px}}";
const ARCHIVE_SETTINGS_BATCH_CSS = ".dshse_settingsHeaderActions,.dshse_settingsGroupMeta{display:flex;align-items:center;gap:8px;flex:none}.dshse_settingsRestoreAll{display:inline-flex;align-items:center;min-height:32px;padding:0 12px;color:var(--dsw-alias-label-primary);background:transparent;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;cursor:pointer;font:inherit;font-size:13px;font-weight:500}.dshse_settingsRestoreAll:hover{background:var(--dsw-alias-interactive-bg-hover)}.dshse_settingsRestoreAll:disabled,.dshse_settingsDanger:disabled,.dshse_settingsGroupMenu:disabled{cursor:not-allowed;opacity:.5}.dshse_settingsGroupMenu{display:flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;color:var(--dsw-alias-label-tertiary);background:transparent;border:0;border-radius:8px;cursor:pointer}.dshse_settingsGroupMenu:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}.dshse_settingsStatus{margin-top:10px;color:var(--dsw-alias-label-secondary);font-size:12px}@media(max-width:720px){.dshse_settingsHeader{flex-direction:column}.dshse_settingsHeaderActions{align-self:flex-end}}";
const ARCHIVE_PREVIEW_CSS = ".dshse_settingsIconButton{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;padding:0;color:var(--dsw-alias-label-tertiary);background:transparent;border:0;border-radius:8px;cursor:pointer}.dshse_settingsIconButton:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}.dshse_settingsIconButton:disabled{cursor:not-allowed;opacity:.5}.dshse_redIcon{color:var(--dsw-alias-state-error-primary)}.dshse_previewModal{width:min(760px,100%)!important}.dshse_previewBody{box-sizing:border-box;max-height:min(66vh,600px);overflow:auto;padding:12px 4px;display:flex;flex-direction:column;gap:14px}.dshse_previewTurn{display:flex;flex-direction:column;gap:8px}.dshse_previewTurnBody{overflow:hidden;opacity:1;transition:max-height .18s ease,opacity .18s ease}.dshse_previewTurnBodyInner{display:flex;flex-direction:column;gap:8px}.dshse_previewToggle{display:inline-flex;align-items:center;justify-content:center;flex:none;width:20px;height:20px;margin-top:2px;padding:0;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-button-elevated-fill));color:var(--dsw-alias-label-primary);cursor:pointer}.dshse_previewToggle:hover{background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-label-dimmed)}.dshse_previewToggleIcon{display:inline-flex;transition:transform .18s ease}.dshse_previewToggleIconCollapsed{transform:rotate(-90deg)}.dshse_previewMsg{display:flex;flex-direction:column;gap:4px;max-width:82%;min-width:0}.dshse_previewMsgUser{align-self:flex-end;align-items:flex-end}.dshse_previewMsgAssistant{align-self:flex-start;align-items:flex-start}.dshse_previewMsgLine{display:flex;align-items:flex-start;gap:8px;min-width:0}.dshse_previewAvatarUser{flex:none;display:block;color:var(--dsw-alias-state-business-primary)}.dshse_previewAvatarAssistant{flex:none;display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:color-mix(in srgb,var(--dsw-alias-label-primary) 14%,transparent);color:var(--dsw-alias-label-primary)}.dshse_previewBubble{box-sizing:border-box;min-width:0;padding:10px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-button-elevated-fill))}.dshse_previewMsgUser .dshse_previewBubble{background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 10%,var(--dsw-alias-bg-layer-2,transparent));border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary) 28%,var(--dsw-alias-border-l2))}.dshse_previewMarkdown{min-width:0}.dshse_previewText{white-space:pre-wrap;word-break:break-word;color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.6}.dshse_previewBubbleCollapsed .dshse_previewText{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:1;overflow:hidden;text-overflow:ellipsis}.dshse_previewImage{display:block;max-width:100%;max-height:240px;margin:6px 0;border-radius:8px;object-fit:contain}.dshse_previewMsgTime{color:var(--dsw-alias-label-tertiary);font-size:11px}.dshse_previewSystem{display:flex;flex-wrap:nowrap;gap:6px;padding:2px 0;max-width:100%;overflow-x:auto}.dshse_previewSystemLeft{justify-content:flex-start}.dshse_previewSystemRight{justify-content:flex-end}.dshse_previewTag{display:inline-flex;align-items:center;gap:5px;flex:none;max-width:240px;min-height:20px;padding:1px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary);font-size:11px;line-height:16px;cursor:default}.dshse_previewTag:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-label-dimmed)}.dshse_previewTagDot{flex:none;width:4px;height:4px;border-radius:50%;background:var(--dsw-alias-label-tertiary)}.dshse_previewTag:hover .dshse_previewTagDot{background:var(--dsw-alias-label-primary)}.dshse_previewTagLabel{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dshse_previewEmpty{padding:24px 8px;color:var(--dsw-alias-label-secondary);text-align:center}";
const ARCHIVE_SETTINGS_LAYOUT_OVERRIDE = ".dshse_settings{margin:0 auto!important}@media(max-width:720px){.dshse_settings{margin:0 auto!important}}";
if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify("dsh-session-enhance/ArchiveSettings.layout.css") + "]") === null) {
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-session-enhance";
	tag.dataset.pluginCss = "dsh-session-enhance/ArchiveSettings.layout.css";
	tag.textContent = ARCHIVE_SETTINGS_LAYOUT_OVERRIDE;
	document.head.appendChild(tag);
}
/** PLUS：设置壳（dsh-client-ui-settings-general）的 navIcon 只按 section id 映射
* models/agent-presets/plugins，未知 id（含本插件的 conversation-enhance）一律回退到
* 齿轮图标（IconSettingsOutline16），注册时的 icon 字段不被读取。这里把本分区
* 导航项上的齿轮替换为「星光/增强」图标（四角星几何，20×20 网格，象征「对话增强」
* 的增强语义）：按导航项文本匹配，MutationObserver 跟随设置弹窗的开合重建；
* 替换幂等且只作用于本插件分区。 */
const ENHANCE_NAV_SPARKLE_PATH = "M10 2L11.697 8.303L18 10L11.697 11.697L10 18L8.303 11.697L2 10L8.303 8.303ZM15.5 13L16.03 14.97L18 15.5L16.03 16.03L15.5 18L14.97 16.03L13 15.5L14.97 14.97Z";
/** 安装设置导航图标替换；返回卸载函数（断开观察器）。 */
function installEnhanceNavIconSwap() {
	if (typeof document === "undefined") return () => { };
	const labels = new Set([zh["settings.manageTitle"], en["settings.manageTitle"]].filter(Boolean));
	const apply = () => {
		for (const button of document.querySelectorAll("button")) {
			if (button.dataset.dshseNavIconPatched === "1") continue;
			if (button.querySelector(":scope > span") === null || button.querySelector(":scope > svg") === null) continue;
			if (!labels.has(button.textContent.replace(/\s+/g, " ").trim())) continue;
			const svg = button.querySelector(":scope > svg");
			const replacement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			replacement.setAttribute("width", svg.getAttribute("width") ?? "16");
			replacement.setAttribute("height", svg.getAttribute("height") ?? "16");
			replacement.setAttribute("viewBox", "0 0 20 20");
			replacement.setAttribute("fill", "none");
			replacement.setAttribute("xmlns", "http://www.w3.org/2000/svg");
			const className = svg.getAttribute("class");
			if (className !== null) replacement.setAttribute("class", className);
			replacement.innerHTML = `<path fill="currentColor" d="${ENHANCE_NAV_SPARKLE_PATH}"/>`;
			svg.replaceWith(replacement);
			button.dataset.dshseNavIconPatched = "1";
		}
	};
	apply();
	const observer = new MutationObserver(apply);
	observer.observe(document.body, { childList: true, subtree: true });
	return () => observer.disconnect();
}
/** 设置页筛选/排序：自定义菜单，避免原生 select 弹出系统浅色下拉。 */
function ArchiveProjectSelect({ id, value, options, onChange, "aria-label": ariaLabel }) {
	const [open, setOpen] = (0, react.useState)(false);
	const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
	const [active, setActive] = (0, react.useState)(selectedIndex);
	const rootRef = (0, react.useRef)(null);
	const triggerRef = (0, react.useRef)(null);
	const listRef = (0, react.useRef)(null);
	const wasOpen = (0, react.useRef)(false);
	const selected = options[selectedIndex];
	(0, react.useEffect)(() => {
		if (!open) return;
		setActive(selectedIndex);
		const onPointerDown = (event) => {
			const target = event.target;
			if (target instanceof Node && rootRef.current?.contains(target) === true) return;
			setOpen(false);
		};
		document.addEventListener("pointerdown", onPointerDown);
		return () => document.removeEventListener("pointerdown", onPointerDown);
	}, [open, selectedIndex]);
	(0, react.useEffect)(() => {
		if (open) {
			listRef.current?.focus();
			wasOpen.current = true;
			return;
		}
		if (wasOpen.current) {
			triggerRef.current?.focus();
			wasOpen.current = false;
		}
	}, [open]);
	(0, react.useEffect)(() => {
		if (!open) return;
		document.getElementById(id + "-opt-" + String(active))?.scrollIntoView({ block: "nearest" });
	}, [active, open, id]);
	const choose = (next) => {
		onChange(next);
		setOpen(false);
	};
	const move = (next) => {
		if (options.length === 0) return;
		setActive(Math.min(options.length - 1, Math.max(0, next)));
	};
	return (0, react_jsx_runtime.jsxs)("div", {
		className: "dshse_settingsFilter",
		ref: rootRef,
		children: [(0, react_jsx_runtime.jsxs)("button", {
			id,
			ref: triggerRef,
			type: "button",
			className: "dshse_selectTrigger",
			"aria-label": ariaLabel,
			"aria-haspopup": "listbox",
			"aria-expanded": open,
			"aria-controls": id + "-list",
			onClick: () => setOpen((current) => !current),
			onKeyDown: (event) => {
				if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					setOpen(true);
				}
			},
			children: [(0, react_jsx_runtime.jsx)("span", { className: "dshse_selectValue", children: selected === void 0 ? "" : selected.label }), (0, react_jsx_runtime.jsx)("svg", {
				className: "dshse_selectCaret",
				viewBox: "0 0 12 12",
				"aria-hidden": true,
				focusable: false,
				children: (0, react_jsx_runtime.jsx)("path", {
					d: "M2.5 4.5L6 8l3.5-3.5",
					fill: "none",
					stroke: "currentColor",
					strokeWidth: "1.5",
					strokeLinecap: "round",
					strokeLinejoin: "round"
				})
			})]
		}), open ? (0, react_jsx_runtime.jsx)("div", {
			id: id + "-list",
			ref: listRef,
			className: "dshse_selectMenu",
			role: "listbox",
			tabIndex: 0,
			"aria-activedescendant": id + "-opt-" + String(active),
			onKeyDown: (event) => {
				if (event.key === "ArrowDown") {
					event.preventDefault();
					move(active + 1);
					return;
				}
				if (event.key === "ArrowUp") {
					event.preventDefault();
					move(active - 1);
					return;
				}
				if (event.key === "Home") {
					event.preventDefault();
					move(0);
					return;
				}
				if (event.key === "End") {
					event.preventDefault();
					move(options.length - 1);
					return;
				}
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					const option = options[active];
					if (option !== void 0) choose(option.value);
					return;
				}
				if (event.key === "Escape" || event.key === "Tab") {
					event.preventDefault();
					event.stopPropagation();
					if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
					setOpen(false);
				}
			},
			children: options.map((option, index) => (0, react_jsx_runtime.jsx)("button", {
				id: id + "-opt-" + String(index),
				type: "button",
				role: "option",
				className: "dshse_selectOption",
				"aria-selected": option.value === value,
				"data-active": index === active,
				onMouseEnter: () => setActive(index),
				onClick: () => choose(option.value),
				children: option.label
			}, option.value === "all" ? "all" : option.value))
		}) : null]
	});
}
/** 项目标题右侧的批量恢复/删除菜单，复用宿主菜单组件的键盘和焦点行为。 */
function ArchivedGroupActions({ group, busy, allArchived, onRestore, onDelete, onDeleteWorkspace, t }) {
	const [open, setOpen] = (0, react.useState)(false);
	const ungrouped = group.key === ARCHIVE_UNGROUPED_KEY;
	const items = [{
		id: "restore",
		label: t(ungrouped ? "archives.restoreUngrouped" : "archives.restoreProject"),
		icon: (0, react_jsx_runtime.jsx)(RestoreAllIcon, {})
	}, {
		id: "delete",
		label: t(ungrouped ? "archives.deleteUngrouped" : "archives.deleteProject"),
		icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {}),
		danger: true
	}];
	if (!ungrouped && allArchived) {
		items.push({
			type: "separator",
			id: "delete-workspace-separator"
		}, {
			id: "deleteWorkspace",
			label: t("delete.workspace"),
			icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseFill14, { className: "dshse_redIcon" }),
			danger: true
		});
	}
	return (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Menu, {
		open,
		onClose: () => setOpen(false),
		items,
		onSelect: (id) => {
			setOpen(false);
			if (id === "restore") onRestore();
			else if (id === "delete") onDelete();
			else if (id === "deleteWorkspace") onDeleteWorkspace();
		},
		portal: true,
		anchor: (0, react_jsx_runtime.jsx)("button", {
			type: "button",
			className: "dshse_settingsGroupMenu",
			disabled: busy,
			"aria-label": t(ungrouped ? "archives.ungroupedActions" : "archives.projectActions", { name: group.title }),
			onClick: () => setOpen((current) => !current),
			children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconEllipsisOutline16, {})
		})
	});
}
/** 设置页“未分组”桶的稳定 key（workspaceId 均为非空 uuid，不会冲突）。 */
const ARCHIVE_UNGROUPED_KEY = "__ungrouped__";
function archivedBatchTargetForGroup(groupKey) {
	return groupKey === ARCHIVE_UNGROUPED_KEY ? { scope: "ungrouped" } : { scope: "workspace", workspaceId: groupKey };
}
/** 客户端只用此派生显示权威批次计数；宿主会用自己的持久状态重新解析。 */
function deriveArchivedBatchIds(archivedSessionIds, items, target) {
	const ids = [...new Set((archivedSessionIds ?? []).filter((id) => typeof id === "string" && id.length > 0))];
	if (target.scope === "all") return ids;
	if (target.scope === "workspace") {
		const accounted = new Set(items.find((workspace) => workspace.workspaceId === target.workspaceId)?.sessionIds ?? []);
		return ids.filter((id) => accounted.has(id));
	}
	const accounted = new Set(items.flatMap((workspace) => workspace.sessionIds));
	return ids.filter((id) => !accounted.has(id));
}
/**
* 设置页归档分组派生：按工作区分组，组 key 用 workspaceId（上游允许
* 不同路径的工作区同名，title 不能作 React key / 筛选 value），未归入
* 任何工作区的归档会话进“未分组”桶；隐藏 subagent（其删除由服务端级联）。
* @param byId - 会话摘要表（缺失摘要的归档会话不进列表）。
* @param items - 工作区列表（Host 顺序，含唯一 workspaceId）。
* @param archivedSessionIds - 注册表全局归档集合。
* @param ungroupedLabel - “未分组”显示文案。
* @returns 分组数组（仅含有会话的组），每项含 key / title / sessions。
*/
function deriveArchivedGroups(byId, items, archivedSessionIds, ungroupedLabel) {
	const byWorkspace = items.map((workspace) => ({
		key: workspace.workspaceId,
		title: workspace.title,
		ids: new Set(workspace.sessionIds),
		sessions: []
	}));
	const ungrouped = [];
	for (const id of archivedSessionIds) {
		const session = byId[id];
		if (session === void 0 || session.origin === "subagent") continue;
		const group = byWorkspace.find((workspace) => workspace.ids.has(id));
		(group === void 0 ? ungrouped : group.sessions).push(session);
	}
	const result = byWorkspace.filter((group) => group.sessions.length > 0);
	if (ungrouped.length > 0) result.push({ key: ARCHIVE_UNGROUPED_KEY, title: ungroupedLabel, sessions: ungrouped });
	return result;
}
/**
* 归档设置页排序：时间排序同时按每组首条会话排列项目，字母排序则
* 同时排列项目名和组内标题；所有输入均复制后排序，不改写 store 快照。
*/
function sortArchivedGroups(groups, sortBy, createdAtById, t) {
	const compareText = (left, right) => String(left).localeCompare(String(right), void 0, { numeric: true, sensitivity: "base" });
	const timestampOf = (session) => {
		const value = sortBy === "created" ? createdAtById[session.id] : session.updatedAt;
		return typeof value === "number" && Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY;
	};
	const compareSessions = (left, right) => {
		if (sortBy !== "alphabetical") {
			const byTime = timestampOf(right) - timestampOf(left);
			if (Number.isFinite(byTime) && byTime !== 0) return byTime;
		}
		return compareText(displayTitle(left, t), displayTitle(right, t)) || compareText(left.id, right.id);
	};
	const result = groups.map((group) => ({ ...group, sessions: [...group.sessions].sort(compareSessions) }));
	return result.sort((left, right) => {
		if (sortBy !== "alphabetical") {
			const byTime = timestampOf(right.sessions[0]) - timestampOf(left.sessions[0]);
			if (Number.isFinite(byTime) && byTime !== 0) return byTime;
		}
		return compareText(left.title, right.title) || compareText(left.key, right.key);
	});
}
/** 管理设置页中的归档会话，数据直接订阅 DSH 的会话与工作区投影。 */
function ArchivedSessionsSection({ sessionStore, workspaceStore, unarchiveSession, deleteSession, deleteWorkspace, unarchiveSessions, deleteArchivedSessions, archivedSessionMetadata, previewSession, syncRecords, listEmptyWorkspaceDirectories, deleteEmptyWorkspaceDirectory, t }) {
	const sessions = (0, react.useSyncExternalStore)(sessionStore.subscribe, sessionStore.getSnapshot);
	const workspaceState = (0, react.useSyncExternalStore)(workspaceStore.subscribe, workspaceStore.getSnapshot);
	const [deleteTarget, setDeleteTarget] = (0, react.useState)(null);
	const [preview, setPreview] = (0, react.useState)(null);
	const [busy, setBusy] = (0, react.useState)(false);
	const [error, setError] = (0, react.useState)(null);
	const [notice, setNotice] = (0, react.useState)(null);
	const [query, setQuery] = (0, react.useState)("");
	const [project, setProject] = (0, react.useState)("all");
	const [sortBy, setSortBy] = (0, react.useState)("updated");
	const [createdAtById, setCreatedAtById] = (0, react.useState)({});
	const [emptyDirs, setEmptyDirs] = (0, react.useState)([]);
	const emptyDirsLoadingRef = (0, react.useRef)(false);
	const archivedSet = (0, react.useMemo)(() => new Set(workspaceState.archivedSessionIds), [workspaceState.archivedSessionIds]);
	// 空目录名（projectKey 编码，大小写不敏感）→ 工作区信息，用于显示重命名后的标题及删除时同步移除工作区记录。
	const workspaceByDirName = (0, react.useMemo)(() => {
		const map = new Map();
		for (const item of workspaceState.items) map.set(projectKey(item.path).toLowerCase(), { workspaceId: item.workspaceId, title: item.title });
		return map;
	}, [workspaceState.items]);
	const groups = (0, react.useMemo)(() => deriveArchivedGroups(sessions.byId, workspaceState.items, workspaceState.archivedSessionIds, t("group.ungrouped")), [sessions.byId, workspaceState, t]);
	const sortedGroups = (0, react.useMemo)(() => sortArchivedGroups(groups, sortBy, createdAtById, t), [groups, sortBy, createdAtById, t]);
	(0, react.useEffect)(() => {
		let cancelled = false;
		archivedSessionMetadata().then((result) => {
			if (cancelled) return;
			setCreatedAtById(Object.fromEntries(result.items.map((item) => [item.sessionId, item.createdAt])));
		}).catch(() => {
			if (!cancelled) setCreatedAtById({});
		});
		return () => {
			cancelled = true;
		};
	}, [archivedSessionMetadata, workspaceState.archivedSessionIds]);
	const refreshEmptyDirectories = (0, react.useCallback)(async () => {
		if (emptyDirsLoadingRef.current) return;
		emptyDirsLoadingRef.current = true;
		try {
			const result = await listEmptyWorkspaceDirectories();
			setEmptyDirs(result.directories);
		} catch (reason) {
			console.warn("listEmptyWorkspaceDirectories failed:", reason);
		} finally {
			emptyDirsLoadingRef.current = false;
		}
	}, [listEmptyWorkspaceDirectories]);
	(0, react.useEffect)(() => {
		refreshEmptyDirectories();
	}, [refreshEmptyDirectories]);
	(0, react.useEffect)(() => {
		// 选中的分组消失（如最后一个归档会话被取消归档）时回退到
		// “所有项目”，避免筛选值停留在失效 key 上把列表过滤为空。
		if (project === "all") return;
		if (groups.some((group) => group.key === project)) return;
		setProject("all");
	}, [groups, project]);
	const filteredGroups = (0, react.useMemo)(() => {
		const normalizedQuery = query.trim().toLocaleLowerCase();
		return sortedGroups.filter((group) => project === "all" || project === group.key).map((group) => ({
			...group,
			sessions: group.sessions.filter((session) => normalizedQuery === "" || displayTitle(session, t).toLocaleLowerCase().includes(normalizedQuery))
		})).filter((group) => group.sessions.length > 0);
	}, [sortedGroups, project, query, t]);
	const allBatchTarget = { scope: "all" };
	const allBatchSessionIds = (0, react.useMemo)(() => deriveArchivedBatchIds(workspaceState.archivedSessionIds, workspaceState.items, allBatchTarget), [workspaceState.archivedSessionIds, workspaceState.items]);
	const onUnarchive = (sessionId) => {
		setError(null);
		setNotice(null);
		unarchiveSession(sessionId).catch((reason) => {
			setError(formatUnarchiveError(reason, t));
		});
	};
	/** PLUS：打开归档对话预览弹窗（读取转录消息，只读）。 */
	const onPreview = (session) => {
		setError(null);
		setNotice(null);
		setPreview({ session, messages: null, loading: true });
		previewSession(session.id).then((result) => {
			setPreview((current) => current !== null && current.session.id === session.id ? { session, messages: result.messages, loading: false } : current);
		}).catch((reason) => {
			setPreview((current) => current !== null && current.session.id === session.id ? { session, messages: null, loading: false, error: reason instanceof Error ? reason.message : String(reason) } : current);
		});
	};
	const closePreview = () => setPreview(null);
	const previewTurns = (0, react.useMemo)(() => preview !== null && Array.isArray(preview.messages) ? groupPreviewTurns(preview.messages) : [], [preview]);
	const onBatchUnarchive = async (target) => {
		if (busy) return;
		setBusy(true);
		setError(null);
		setNotice(null);
		try {
			const result = await unarchiveSessions(target);
			setNotice(t("archives.restoreSuccess", { n: result.unarchivedSessionIds.length }));
		} catch (reason) {
			setError(t("archives.restoreBatchFailed", { detail: reason instanceof Error ? reason.message : String(reason) }));
		} finally {
			setBusy(false);
		}
	};
	/** PLUS：按物理 session 文件同步 storages 记录（清理幽灵/修正归属/补记漏记）。 */
	const onSync = async () => {
		if (busy) return;
		setBusy(true);
		setError(null);
		setNotice(null);
		try {
			const result = await syncRecords();
			const removed = result.archivedRemoved.length + result.workspaceRemoved.length + result.projcacheRemoved.length;
			setNotice(t("archives.syncResult", { scanned: result.scanned, added: result.workspaceAdded.length, removed }));
		} catch (reason) {
			setError(t("archives.syncFailed", { detail: reason instanceof Error ? reason.message : String(reason) }));
		} finally {
			setBusy(false);
		}
	};
	const closeDelete = () => {
		if (!busy) setDeleteTarget(null);
	};
	(0, react.useEffect)(() => {
		if (deleteTarget === null) return;
		const onKeyDown = (event) => {
			if (event.key !== "Escape") return;
			event.preventDefault();
			event.stopPropagation();
			if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
			if (!busy) setDeleteTarget(null);
		};
		window.addEventListener("keydown", onKeyDown, true);
		return () => window.removeEventListener("keydown", onKeyDown, true);
	}, [deleteTarget, busy]);
	const confirmDelete = async () => {
		if (busy || deleteTarget === null) return;
		setBusy(true);
		setError(null);
		setNotice(null);
		try {
			if (deleteTarget.kind === "batch") {
				const result = await deleteArchivedSessions(deleteTarget.target);
				const completed = result.deletedSessionIds.length + result.skippedSessionIds.length;
				if (result.failures.length > 0) {
					setError(t("archives.deletePartial", { done: completed, failed: result.failures.length, detail: result.failures[0].message }));
				} else {
					setNotice(t("archives.deleteSuccess", { n: completed }));
				}
				await refreshEmptyDirectories();
			} else if (deleteTarget.kind === "workspace") {
				// 归档管理中的「删除工作区」：先删除该工作区的全部归档对话，再移除工作区记录与空目录。
				const result = await deleteArchivedSessions({ scope: "workspace", workspaceId: deleteTarget.workspaceId });
				await deleteWorkspace(deleteTarget.workspaceId);
				if (typeof deleteTarget.dirName === "string" && deleteTarget.dirName.length > 0) {
					await deleteEmptyWorkspaceDirectory(deleteTarget.dirName);
				}
				if (result.failures.length > 0) {
					const done = result.deletedSessionIds.length + result.skippedSessionIds.length;
					setError(t("archives.deletePartial", { done, failed: result.failures.length, detail: result.failures[0].message }));
				} else {
					setNotice(t("archives.deleteWorkspaceDone", { name: deleteTarget.title }));
				}
				await refreshEmptyDirectories();
			} else if (deleteTarget.kind === "workspaceDir") {
				// 空工作区目录：若仍对应一个工作区记录，先移除记录以同步 sidebar，再删空目录。
				if (typeof deleteTarget.workspaceId === "string" && deleteTarget.workspaceId.length > 0) {
					await deleteWorkspace(deleteTarget.workspaceId);
				}
				await deleteEmptyWorkspaceDirectory(deleteTarget.name);
				setNotice(t("archives.emptyDirDeleted", { name: deleteTarget.name }));
				await refreshEmptyDirectories();
			} else {
				await deleteSession(deleteTarget.session.id);
				await refreshEmptyDirectories();
			}
			setDeleteTarget(null);
		} catch (reason) {
			const detail = reason instanceof Error ? reason.message : String(reason);
			if (deleteTarget?.kind === "workspace") setError(t("archives.deleteWorkspaceFailed", { detail }));
			else if (deleteTarget?.kind === "workspaceDir") setError(t("archives.emptyDirDeleteFailed", { detail }));
			else setError(formatDeleteError(reason, t));
		} finally {
			setBusy(false);
		}
	};
	const isWorkspaceDelete = deleteTarget?.kind === "workspace";
	const isWorkspaceDirDelete = deleteTarget?.kind === "workspaceDir";
	const batchScope = deleteTarget?.kind === "batch" ? deleteTarget.target.scope : null;
	const deleteDialogTitle = isWorkspaceDelete ? t("delete.workspace") : isWorkspaceDirDelete ? t("archives.emptyDirDeleteTitle") : batchScope === "all" ? t("archives.deleteAllTitle") : batchScope === "ungrouped" ? t("archives.deleteUngroupedTitle") : batchScope === "workspace" ? t("archives.deleteProjectTitle", { name: deleteTarget.title }) : t("deleteSession.title");
	const deleteDialogDescription = deleteTarget === null ? void 0 : isWorkspaceDelete ? t("archives.deleteWorkspaceDesc", { name: deleteTarget.title }) : isWorkspaceDirDelete ? t("archives.emptyDirDeleteDesc", { name: deleteTarget.name }) : batchScope === "all" ? t("archives.deleteAllDesc", { n: deleteTarget.count }) : batchScope === "ungrouped" ? t("archives.deleteUngroupedDesc", { n: deleteTarget.count }) : batchScope === "workspace" ? t("archives.deleteProjectDesc", { name: deleteTarget.title, n: deleteTarget.count }) : t("deleteSession.desc", { name: displayTitle(deleteTarget.session, t) });
	const deleteConfirmLabel = isWorkspaceDelete ? t("delete.workspace") : isWorkspaceDirDelete ? t("archives.emptyDirDeleteConfirm") : batchScope === "all" ? t("archives.deleteAll") : batchScope === "ungrouped" ? t("archives.deleteUngroupedConfirm") : batchScope === "workspace" ? t("archives.deleteProjectConfirm") : t("deleteSession.title");
	return (0, react_jsx_runtime.jsxs)("section", {
		className: "dshse_settings",
		"aria-label": t("archives.title"),
		children: [(0, react_jsx_runtime.jsx)("style", { children: ARCHIVE_SETTINGS_CSS + ARCHIVE_SETTINGS_BATCH_CSS + ARCHIVE_PREVIEW_CSS }), (0, react_jsx_runtime.jsxs)("header", { className: "dshse_settingsHeader", children: [(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("h2", { children: t("archives.title") }), (0, react_jsx_runtime.jsx)("p", { className: "dshse_settingsIntro", children: t("archives.description") })] }), (0, react_jsx_runtime.jsxs)("div", { className: "dshse_settingsHeaderActions", children: [(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dshse_settingsRestoreAll", disabled: busy, onClick: onSync, children: t("archives.sync") }), (0, react_jsx_runtime.jsx)("button", { type: "button", className: "dshse_settingsRestoreAll", disabled: busy || allBatchSessionIds.length === 0, onClick: () => onBatchUnarchive(allBatchTarget), children: t("archives.restoreAll") }), (0, react_jsx_runtime.jsxs)("button", { type: "button", className: "dshse_settingsDanger", disabled: busy || allBatchSessionIds.length === 0, onClick: () => setDeleteTarget({ kind: "batch", target: allBatchTarget, title: t("archives.allProjects"), count: allBatchSessionIds.length }), children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {}), t("archives.deleteAll")] })] })] }), (0, react_jsx_runtime.jsxs)("div", { className: "dshse_settingsToolbar", children: [(0, react_jsx_runtime.jsxs)("label", { className: "dshse_settingsSearch", children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconSearchOutline16, {}), (0, react_jsx_runtime.jsx)("input", { type: "search", value: query, onChange: (event) => setQuery(event.target.value), placeholder: t("archives.searchPlaceholder"), "aria-label": t("archives.searchPlaceholder") })] }), (0, react_jsx_runtime.jsx)(ArchiveProjectSelect, { id: "dshse-sort-filter", value: sortBy, options: [{ value: "updated", label: t("archives.sortUpdated") }, { value: "created", label: t("archives.sortCreated") }, { value: "alphabetical", label: t("archives.sortAlphabetical") }], onChange: setSortBy, "aria-label": t("archives.sortBy") }), (0, react_jsx_runtime.jsx)(ArchiveProjectSelect, { id: "dshse-project-filter", value: project, options: [{ value: "all", label: t("archives.allProjects") }, ...sortedGroups.map((group) => ({ value: group.key, label: group.title }))], onChange: setProject, "aria-label": t("archives.projectFilter") })] }), groups.length === 0 ? emptyDirs.length === 0 ? (0, react_jsx_runtime.jsx)("div", { className: "dshse_settingsEmpty", children: t("archives.empty") }) : null : filteredGroups.length === 0 ? (0, react_jsx_runtime.jsx)("div", { className: "dshse_settingsEmpty", children: t("archives.emptyFiltered") }) : filteredGroups.map((group) => {
			const target = archivedBatchTargetForGroup(group.key);
			const count = deriveArchivedBatchIds(workspaceState.archivedSessionIds, workspaceState.items, target).length;
			const workspace = group.key === ARCHIVE_UNGROUPED_KEY ? void 0 : workspaceState.items.find((item) => item.workspaceId === group.key);
			const allArchived = workspace !== void 0 && workspace.sessionIds.length > 0 && workspace.sessionIds.every((id) => archivedSet.has(id));
			return (0, react_jsx_runtime.jsxs)("section", {
				className: "dshse_settingsGroup",
				children: [(0, react_jsx_runtime.jsxs)("div", { className: "dshse_settingsGroupHeading", children: [(0, react_jsx_runtime.jsxs)("h3", { className: "dshse_settingsGroupTitle", children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderOpenOutline16, {}), group.title] }), (0, react_jsx_runtime.jsxs)("div", { className: "dshse_settingsGroupMeta", children: [(0, react_jsx_runtime.jsx)("span", { className: "dshse_settingsCount", children: t("archives.sessionCount", { n: count }) }), (0, react_jsx_runtime.jsx)(ArchivedGroupActions, { group, busy, allArchived, onRestore: () => onBatchUnarchive(target), onDelete: () => setDeleteTarget({ kind: "batch", target, title: group.title, count }), onDeleteWorkspace: () => setDeleteTarget({ kind: "workspace", workspaceId: group.key, title: group.title, dirName: workspace !== void 0 ? projectKey(workspace.path) : void 0 }), t })] })] }), (0, react_jsx_runtime.jsx)("div", {
					className: "dshse_settingsList",
					children: group.sessions.map((session) => (0, react_jsx_runtime.jsxs)("article", {
						className: "dshse_settingsRow",
						children: [(0, react_jsx_runtime.jsxs)("div", { className: "dshse_settingsContent", children: [(0, react_jsx_runtime.jsx)("div", { className: "dshse_settingsTitle", children: displayTitle(session, t) }), (0, react_jsx_runtime.jsx)("div", { className: "dshse_settingsMeta", children: archiveTimeLabel(session.updatedAt, t) })] }), (0, react_jsx_runtime.jsxs)("div", {
							className: "dshse_settingsActions",
							children: [(0, react_jsx_runtime.jsx)("button", { type: "button", className: "dshse_settingsIconButton", disabled: busy, "aria-label": t("archives.previewSession"), title: t("archives.previewSession"), onClick: () => onPreview(session), children: (0, react_jsx_runtime.jsx)(EyeIcon, {}) }), (0, react_jsx_runtime.jsx)("button", { type: "button", className: "dshse_settingsIconButton", disabled: busy, "aria-label": t("menu.unarchive"), title: t("menu.unarchive"), onClick: () => onUnarchive(session.id), children: (0, react_jsx_runtime.jsx)(RestoreIcon, {}) }), (0, react_jsx_runtime.jsx)("button", { type: "button", className: "dshse_settingsDelete", disabled: busy, "aria-label": t("menu.deleteSession"), onClick: () => setDeleteTarget({ kind: "session", session }), children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {}) })]
						})]
					}, session.id))
				})]
			}, group.key);
		}), emptyDirs.map((dir) => (0, react_jsx_runtime.jsxs)("section", {
			className: "dshse_settingsGroup",
			children: [(0, react_jsx_runtime.jsxs)("div", {
				className: "dshse_settingsGroupHeading",
				children: [(0, react_jsx_runtime.jsxs)("h3", {
					className: "dshse_settingsGroupTitle",
					children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderOpenOutline16, {}), workspaceByDirName.get(dir.name.toLowerCase())?.title ?? emptyDirLabel(dir.name)]
				}), (0, react_jsx_runtime.jsxs)("div", {
					className: "dshse_settingsGroupMeta",
					children: [(0, react_jsx_runtime.jsx)("span", { className: "dshse_settingsCount", children: t("archives.sessionCount", { n: 0 }) }), (0, react_jsx_runtime.jsx)("button", { type: "button", className: "dshse_settingsDelete", disabled: busy, "aria-label": t("archives.emptyDirDelete"), onClick: () => setDeleteTarget({ kind: "workspaceDir", name: dir.name, path: dir.path, workspaceId: workspaceByDirName.get(dir.name.toLowerCase())?.workspaceId }), children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutline16, {}) })]
				})]
			})]
		}, dir.name)), error !== null && (0, react_jsx_runtime.jsx)("div", { className: "dshse_settingsError", role: "alert", children: error }), notice !== null && (0, react_jsx_runtime.jsx)("div", { className: "dshse_settingsStatus", role: "status", children: notice }), (0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
			open: deleteTarget !== null,
			onClose: closeDelete,
			closeLabel: t("close"),
			title: deleteDialogTitle,
			...deleteDialogDescription === void 0 ? {} : { description: deleteDialogDescription },
			footer: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, { variant: "outline", disabled: busy, onClick: closeDelete, children: t("cancel") }), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, { variant: "outline", disabled: busy, onClick: confirmDelete, children: deleteConfirmLabel })] }),
			children: busy && (0, react_jsx_runtime.jsx)("div", { role: "status", children: deleteTarget?.kind === "workspace" ? t("delete.pending") : deleteTarget?.kind === "workspaceDir" ? t("archives.emptyDirDeletePending") : deleteTarget?.kind === "batch" ? t("archives.deleteBatchPending") : t("deleteSession.pending") })
		}), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
			open: preview !== null,
			onClose: closePreview,
			closeLabel: t("close"),
			title: preview === null ? "" : displayTitle(preview.session, t),
			className: "dshse_previewModal",
			children: (0, react_jsx_runtime.jsx)("div", {
				className: "dshse_previewBody",
				children: preview === null ? null : preview.loading ? (0, react_jsx_runtime.jsx)("div", { className: "dshse_previewEmpty", role: "status", children: t("archives.previewLoading") }) : preview.error !== void 0 ? (0, react_jsx_runtime.jsx)("div", { className: "dshse_settingsError", role: "alert", children: t("archives.previewFailed", { detail: preview.error }) }) : previewTurns.length === 0 ? (0, react_jsx_runtime.jsx)("div", { className: "dshse_previewEmpty", children: t("archives.previewEmpty") }) : previewTurns.map((turn, index) => (0, react_jsx_runtime.jsx)(PreviewTurn, { turn, t }, index))
			})
		})]
	});
}
/** 对话增强分区下的二级页签样式（参考「插件」分区的 tab 排版）。 */
const ENHANCE_TABS_CSS = ".dshse_enhance{box-sizing:border-box;width:min(100%,760px);margin:0 auto;padding:0 0 32px}.dshse_enhanceTabs{display:flex;gap:2px;margin-bottom:20px;border-bottom:1px solid var(--dsw-alias-border-l2)}.dshse_enhanceTab{display:inline-flex;align-items:center;min-height:36px;padding:0 14px;color:var(--dsw-alias-label-tertiary);background:transparent;border:0;border-bottom:2px solid transparent;border-radius:8px 8px 0 0;cursor:pointer;font:inherit;font-size:13px;font-weight:500}.dshse_enhanceTab:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}.dshse_enhanceTabActive{color:var(--dsw-alias-label-primary);border-bottom-color:var(--dsw-alias-label-primary)}";
/** 基础设置表单样式（家目录输入 + 对话通知开关）。 */
const BASIC_SETTINGS_CSS = ".dshse_settings{box-sizing:border-box;width:min(100%,760px);margin:0 auto;padding:0 0 32px;color:var(--dsw-alias-label-primary)}.dshse_settingsHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:12px}.dshse_settings h2{margin:0;font-size:20px;font-weight:650;letter-spacing:-.2px;line-height:28px}.dshse_settingsIntro{margin:4px 0 0;max-width:42em;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:1.5}.dshse_settingsError{margin-top:10px;color:var(--dsw-alias-state-error-primary);font-size:12px}.dshse_settingsStatus{margin-top:10px;color:var(--dsw-alias-label-secondary);font-size:12px}.dshse_settingsCategory{box-sizing:border-box;margin:0 0 14px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-button-elevated-fill));overflow:hidden}.dshse_settingsCategoryHeader{box-sizing:border-box;display:flex;align-items:center;gap:8px;width:100%;min-height:44px;padding:0 14px;color:var(--dsw-alias-label-primary);background:transparent;border:0;cursor:pointer;font:inherit;font-size:13px;font-weight:600;line-height:20px;text-align:left}.dshse_settingsCategoryHeader:hover{background:var(--dsw-alias-interactive-bg-hover)}.dshse_settingsCategoryHeader:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}.dshse_settingsCategoryChevron{flex:none;color:var(--dsw-alias-label-tertiary)}.dshse_settingsCategoryTitle{flex:1;min-width:0}.dshse_settingsCategoryBody{box-sizing:border-box;border-top:1px solid var(--dsw-alias-border-l2);padding:14px}.dshse_settingsField{margin:0 0 18px}.dshse_settingsField:last-child{margin-bottom:0}.dshse_settingsFieldLabel{display:block;margin-bottom:6px;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:600;line-height:18px}.dshse_settingsFieldHint{margin:0 0 10px;max-width:42em;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:16px}.dshse_settingsFieldRow{display:flex;align-items:center;gap:8px;max-width:560px}.dshse_settingsInputWrap{position:relative;display:flex;align-items:center;flex:1;min-width:0}.dshse_settingsInput{box-sizing:border-box;width:100%;min-width:0;height:34px;padding:0 34px 0 12px;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-3,var(--dsw-alias-button-elevated-fill));border:1px solid var(--dsw-alias-border-l2);border-radius:8px;outline:0;font:inherit;font-size:13px;cursor:pointer;text-overflow:ellipsis}.dshse_settingsInput:hover{border-color:var(--dsw-alias-label-dimmed)}.dshse_settingsInputIcon{position:absolute;right:10px;color:var(--dsw-alias-label-tertiary);pointer-events:none;display:inline-flex}.dshse_settingsPrimary{box-sizing:border-box;flex:none;display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:0 16px;color:var(--dsw-alias-label-primary-foreground);background:var(--dsw-alias-label-primary);border:0;border-radius:8px;cursor:pointer;font:inherit;font-size:13px;font-weight:500;line-height:20px}.dshse_settingsPrimary:hover:not(:disabled){filter:brightness(1.12)}.dshse_settingsPrimary:disabled{cursor:default;opacity:.45}.dshse_settingsPrimary:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.dshse_settingsRestore{box-sizing:border-box;flex:none;display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:0 16px;color:var(--dsw-alias-label-primary);background:transparent;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;cursor:pointer;font:inherit;font-size:13px;font-weight:500;line-height:20px}.dshse_settingsRestore:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}.dshse_settingsRestore:disabled{cursor:default;opacity:.45}.dshse_settingsRestore:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}.dshse_featureRow{display:flex;align-items:center;gap:12px;min-height:44px}.dshse_featureMain{display:flex;align-items:center;gap:10px;flex:1;min-width:0}.dshse_featureIcon{display:inline-flex;align-items:center;justify-content:center;flex:none;color:var(--dsw-alias-label-secondary)}.dshse_featureTitle{min-width:0;color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;line-height:18px}.dshse_featureActions{display:flex;align-items:center;gap:10px;flex:none}.dshse_featureInfo{position:relative;display:inline-flex;align-items:center;color:var(--dsw-alias-label-tertiary)}.dshse_featureInfo:hover{color:var(--dsw-alias-label-secondary)}.dshse_featureInfoTip{position:absolute;bottom:calc(100% + 8px);right:0;z-index:20;box-sizing:border-box;width:max-content;max-width:260px;padding:8px 10px;color:var(--dsw-alias-label-primary);background:var(--dsw-specific-menu,var(--dsw-alias-bg-layer-2));border:1px solid var(--dsw-alias-border-l2);border-radius:8px;box-shadow:var(--dsw-shadow-lv3);font-size:12px;line-height:16px;font-weight:400;white-space:normal;opacity:0;visibility:hidden;pointer-events:none;transform:translateY(2px);transition:opacity .12s,transform .12s,visibility .12s}.dshse_featureInfo:hover .dshse_featureInfoTip{opacity:1;visibility:visible;transform:translateY(0)}.dshse_featureSwitch{position:relative;box-sizing:border-box;flex:none;width:34px;height:20px;padding:0;background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l2);border-radius:10px;cursor:pointer;transition:background .2s,border-color .2s}.dshse_featureSwitch:after{content:\"\";position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--dsw-alias-label-primary-foreground,#fff);transition:transform .2s}.dshse_featureSwitch[aria-checked=true]{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary)}.dshse_featureSwitch[aria-checked=true]:after{transform:translateX(14px)}.dshse_featureSwitch:disabled{cursor:not-allowed;opacity:.5}.dshse_featureSwitch:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}";
/** 可收缩类别容器：头部（折叠箭头 + 标题）与可折叠主体。 */
function SettingsCategory({ title, defaultOpen, children }) {
	const [open, setOpen] = (0, react.useState)(defaultOpen !== false);
	return (0, react_jsx_runtime.jsxs)("section", {
		className: "dshse_settingsCategory",
		children: [(0, react_jsx_runtime.jsxs)("button", {
			type: "button",
			className: "dshse_settingsCategoryHeader",
			"aria-expanded": open,
			onClick: () => setOpen(!open),
			children: [(0, react_jsx_runtime.jsx)(open ? _deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14 : _deepseek_ai_dsh_client_ui_primitives.IconChevronRightOutline14, { className: "dshse_settingsCategoryChevron" }), (0, react_jsx_runtime.jsx)("span", { className: "dshse_settingsCategoryTitle", children: title })]
		}), open ? (0, react_jsx_runtime.jsx)("div", { className: "dshse_settingsCategoryBody", children }) : null]
	});
}
/** 功能项：单行「图标 + 标题 | info 悬浮描述 + 启用/关闭开关」。 */
function FeatureRow({ icon, title, description, enabled, disabled, onToggle }) {
	return (0, react_jsx_runtime.jsxs)("div", {
		className: "dshse_featureRow",
		children: [(0, react_jsx_runtime.jsxs)("div", { className: "dshse_featureMain", children: [(0, react_jsx_runtime.jsx)("span", { className: "dshse_featureIcon", children: icon }), (0, react_jsx_runtime.jsx)("span", { className: "dshse_featureTitle", children: title })] }), (0, react_jsx_runtime.jsxs)("div", {
			className: "dshse_featureActions",
			children: [description ? (0, react_jsx_runtime.jsxs)("span", { className: "dshse_featureInfo", children: [(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconQuestionOutline14, {}), (0, react_jsx_runtime.jsx)("span", { className: "dshse_featureInfoTip", role: "tooltip", children: description })] }) : null, (0, react_jsx_runtime.jsx)("button", { type: "button", role: "switch", "aria-checked": enabled, className: "dshse_featureSwitch", disabled, onClick: () => onToggle(!enabled), "aria-label": title })]
		})]
	});
}
/** 基础设置：可收缩类别（基础设置 / 功能设置）。 */
function BasicSettings({ getSettings, setSettings, pickDirectory, t }) {
	const [settings, setLocalSettings] = (0, react.useState)(null);
	const [homeDirDraft, setHomeDirDraft] = (0, react.useState)("");
	const [saving, setSaving] = (0, react.useState)(false);
	const [error, setError] = (0, react.useState)(null);
	const [notice, setNotice] = (0, react.useState)(null);
	const noticeSeq = (0, react.useRef)(0);
	const showNoticeToast = (text) => {
		noticeSeq.current += 1;
		setNotice({ text, seq: noticeSeq.current });
	};
	(0, react.useEffect)(() => {
		let cancelled = false;
		getSettings().then((value) => {
			if (cancelled) return;
			setLocalSettings(value);
			setHomeDirDraft(value.homeDir);
		}).catch((reason) => {
			if (!cancelled) setError(t("settings.loadFailed", { detail: reason instanceof Error ? reason.message : String(reason) }));
		});
		return () => {
			cancelled = true;
		};
	}, [getSettings, t]);
	const saveHomeDir = async () => {
		if (saving) return;
		setSaving(true);
		setError(null);
		setNotice(null);
		try {
			const next = await setSettings({ homeDir: homeDirDraft });
			setLocalSettings(next);
			showNoticeToast(t("settings.saved"));
		} catch (reason) {
			setError(t("settings.saveFailed", { detail: reason instanceof Error ? reason.message : String(reason) }));
		} finally {
			setSaving(false);
		}
	};
	const pickHomeDir = async () => {
		if (saving || typeof pickDirectory !== "function") return;
		setError(null);
		setNotice(null);
		try {
			const path = await pickDirectory();
			if (path !== null && path !== void 0) setHomeDirDraft(path);
		} catch (reason) {
			setError(t("settings.pickFailed", { detail: reason instanceof Error ? reason.message : String(reason) }));
		}
	};
	const setNotify = async (enabled) => {
		if (saving || settings === null) return;
		setSaving(true);
		setError(null);
		setNotice(null);
		try {
			const next = await setSettings({ notifyEnabled: enabled });
			setLocalSettings(next);
		} catch (reason) {
			setError(t("settings.saveFailed", { detail: reason instanceof Error ? reason.message : String(reason) }));
		} finally {
			setSaving(false);
		}
	};
	const DEFAULT_HOME_DIR = "~/.dsh";
	const homeDirChanged = settings !== null && homeDirDraft !== settings.homeDir;
	const homeDirIsDefault = settings !== null && settings.homeDir === DEFAULT_HOME_DIR;
	const restoreDefaultHomeDir = async () => {
		if (saving || settings === null) return;
		setSaving(true);
		setError(null);
		setNotice(null);
		try {
			const next = await setSettings({ homeDir: DEFAULT_HOME_DIR });
			setLocalSettings(next);
			setHomeDirDraft(next.homeDir);
			showNoticeToast(t("settings.saved"));
		} catch (reason) {
			setError(t("settings.saveFailed", { detail: reason instanceof Error ? reason.message : String(reason) }));
		} finally {
			setSaving(false);
		}
	};
	return (0, react_jsx_runtime.jsxs)("section", {
		className: "dshse_settings",
		"aria-label": t("settings.basicTab"),
		children: [(0, react_jsx_runtime.jsx)("style", { children: BASIC_SETTINGS_CSS }), (0, react_jsx_runtime.jsxs)("header", { className: "dshse_settingsHeader", children: [(0, react_jsx_runtime.jsxs)("div", { children: [(0, react_jsx_runtime.jsx)("h2", { children: t("settings.basicTab") }), (0, react_jsx_runtime.jsx)("p", { className: "dshse_settingsIntro", children: t("settings.description") })] })] }), error !== null && (0, react_jsx_runtime.jsx)("div", { className: "dshse_settingsError", role: "alert", children: error }), notice !== null && (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Toast, { key: notice.seq, text: notice.text, onDone: () => setNotice(null) }), (0, react_jsx_runtime.jsxs)(SettingsCategory, {
			title: t("settings.categoryBasic"),
			children: [(0, react_jsx_runtime.jsx)("div", { className: "dshse_settingsField", children: [(0, react_jsx_runtime.jsx)("label", { className: "dshse_settingsFieldLabel", htmlFor: "dshse-home-dir", children: t("settings.homeDir") }), (0, react_jsx_runtime.jsx)("p", { className: "dshse_settingsFieldHint", children: t("settings.homeDirHint") }), (0, react_jsx_runtime.jsxs)("div", { className: "dshse_settingsFieldRow", children: [(0, react_jsx_runtime.jsxs)("div", { className: "dshse_settingsInputWrap", children: [(0, react_jsx_runtime.jsx)("input", { id: "dshse-home-dir", type: "text", className: "dshse_settingsInput", value: homeDirDraft, readOnly: true, onClick: pickHomeDir, placeholder: "~/.dsh", spellCheck: false, "aria-label": t("settings.homeDir"), title: t("settings.pickDirectory") }), (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconFolderClose16, { className: "dshse_settingsInputIcon" })] }), (0, react_jsx_runtime.jsx)("button", { type: "button", className: "dshse_settingsPrimary", disabled: saving || settings === null || !homeDirChanged, onClick: saveHomeDir, children: t("settings.changeDirectory") }), (0, react_jsx_runtime.jsx)("button", { type: "button", className: "dshse_settingsRestore", disabled: saving || settings === null || homeDirIsDefault, onClick: restoreDefaultHomeDir, children: t("settings.restoreDefault") })] })] })]
		}), (0, react_jsx_runtime.jsxs)(SettingsCategory, {
			title: t("settings.categoryFeatures"),
			children: [(0, react_jsx_runtime.jsx)(FeatureRow, {
				icon: (0, react_jsx_runtime.jsx)("svg", { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true, children: (0, react_jsx_runtime.jsx)("path", { fill: "currentColor", d: "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" }) }),
				title: t("settings.notify"),
				description: t("settings.notifyHint"),
				enabled: settings === null ? true : settings.notifyEnabled,
				disabled: saving || settings === null,
				onToggle: setNotify
			})]
		})]
	});
}
/** 对话增强设置分区：二级页签在「基础设置」与「归档管理」间切换。 */
function EnhancementSection(props) {
	const [tab, setTab] = (0, react.useState)("basic");
	const { getSettings, setSettings, pickDirectory, t } = props;
	return (0, react_jsx_runtime.jsxs)("section", {
		className: "dshse_enhance",
		children: [(0, react_jsx_runtime.jsx)("style", { children: ENHANCE_TABS_CSS }), (0, react_jsx_runtime.jsx)("nav", { className: "dshse_enhanceTabs", role: "tablist", "aria-label": t("settings.manageTitle"), children: [(0, react_jsx_runtime.jsx)("button", { type: "button", role: "tab", "aria-selected": tab === "basic", className: tab === "basic" ? "dshse_enhanceTab dshse_enhanceTabActive" : "dshse_enhanceTab", onClick: () => setTab("basic"), children: t("settings.basicTab") }), (0, react_jsx_runtime.jsx)("button", { type: "button", role: "tab", "aria-selected": tab === "archive", className: tab === "archive" ? "dshse_enhanceTab dshse_enhanceTabActive" : "dshse_enhanceTab", onClick: () => setTab("archive"), children: t("archives.manageTitle") })] }), tab === "basic" ? (0, react_jsx_runtime.jsx)(BasicSettings, { getSettings, setSettings, pickDirectory, t }) : (0, react_jsx_runtime.jsx)(ArchivedSessionsSection, props)]
	});
}
/** 对话通知：对话结束或需要用户操作时，未聚焦且启用通知时弹出系统提示。 */
function installConversationNotifier(ctx, getSettings, t) {
	if (typeof window === "undefined" || typeof Notification === "undefined") return () => { };
	const seen = new Map();
	const show = (title, body) => {
		if (Notification.permission === "granted") {
			new Notification(title, { body });
		} else if (Notification.permission === "default") {
			Notification.requestPermission();
		}
	};
	return ctx.sessions.list.subscribe(() => {
		const state = ctx.sessions.list.getSnapshot();
		const current = state.current;
		const pageFocused = typeof document === "undefined" || document.hasFocus();
		for (const summary of Object.values(state.byId)) {
			const prev = seen.get(summary.id);
			if (prev === void 0) {
				seen.set(summary.id, { running: summary.running, pending: summary.pendingInteraction });
				continue;
			}
			const finished = prev.running === true && summary.running === false;
			const needsAction = prev.pending === void 0 && summary.pendingInteraction !== void 0;
			seen.set(summary.id, { running: summary.running, pending: summary.pendingInteraction });
			if ((finished || needsAction) && (summary.id !== current || !pageFocused)) {
				const title = summary.displayTitle || summary.id;
				const body = needsAction ? t("notify.needsAction") : t("notify.finished");
				getSettings().then((settings) => {
					if (settings.notifyEnabled) show(title, body);
				}).catch(() => { });
			}
		}
	});
}

export { EnhancementSection, installEnhanceNavIconSwap, installConversationNotifier, deriveArchivedGroups, sortArchivedGroups, deriveArchivedBatchIds };