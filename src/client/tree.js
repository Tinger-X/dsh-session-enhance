/**
 * dsh-session-enhance 对话树客户端面板。
 *
 * 锚点（官方 shell 语义属性，见皮肤中心 semantic-attrs/v1）：
 * - 会话中栏：`[data-pane="conversation"]`（回退 `[data-slot="conversation"]`）
 * - 会话头：`[data-slot="conversation.session.header"] > header`（回退 scrollport 的前一个 `<header>`）
 * - 滚动口：`[data-conversation-scroll]`
 * - 输入区：`[data-slot="conversation.composer"]`（回退 `[data-composer-card]` / `[data-composer-seat]`）
 *
 * 面板挂在会话中栏内（absolute），顶部对齐 header 底、底部对齐输入区顶、贴左缘。
 * 默认仅渲染节点（圆点），悬浮显示文本概览；节点按深度竖直、按分支横向错位，并用
 * SVG 连线呈现树结构。重新生成 / 编辑重生成注入到聊天区消息操作栏。
 */

const CSS_ID = "dsh-session-enhance/tree.module.css";
const CSS = [
	".dshct_panel{position:fixed;z-index:2000;display:flex;flex-direction:column;overflow:hidden;pointer-events:none}",
	".dshct_scroll{position:relative;flex:1 1 auto;overflow-y:auto;overflow-x:hidden;pointer-events:auto;scrollbar-width:none}",
	".dshct_scroll::-webkit-scrollbar{display:none}",
	".dshct_content{position:relative}",
	".dshct_edges{position:absolute;left:0;top:0;overflow:visible;pointer-events:none}",
	".dshct_edge{fill:none;stroke:var(--dsw-alias-label-caption,#c9cdd4);stroke-width:1.4;opacity:.55}",
	".dshct_node{position:absolute;display:flex;align-items:center;gap:4px;white-space:nowrap;cursor:pointer}",
	".dshct_dot{width:10px;height:10px;border-radius:50%;background:var(--dsw-alias-label-caption,#c0c4cc);border:2px solid transparent;box-sizing:border-box;transition:transform .12s,background .12s,box-shadow .12s,border-color .12s}",
	".dshct_node:hover .dshct_dot{transform:scale(1.35)}",
	".dshct_node[data-active] .dshct_dot{background:var(--dsw-alias-brand-primary,#3b82f6);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary,#3b82f6) 22%,transparent)}",
	".dshct_node[data-faded] .dshct_dot{opacity:.45}",
	".dshct_node[data-fork] .dshct_dot{border-color:var(--dsw-alias-label-secondary,#61666b)}",
	".dshct_branch{display:inline-flex;align-items:center;gap:3px;font-size:11px;color:var(--dsw-alias-label-secondary,#61666b);background:var(--dsw-alias-bg-layer-2,#fff);border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:7px;padding:1px 3px;box-shadow:var(--dsw-shadow-lv1,0 2px 8px rgba(0,0,0,.08))}",
	".dshct_branch button{background:none;border:none;color:inherit;cursor:pointer;border-radius:5px;padding:0 5px;height:18px;line-height:16px}",
	".dshct_branch button:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.06))}",
	".dshct_tooltip{position:fixed;z-index:10001;max-width:340px;background:var(--dsw-alias-bg-layer-2,#fff);border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.1));border-radius:10px;box-shadow:var(--dsw-shadow-lv2,0 16px 36px rgba(0,0,0,.15));padding:10px 12px;font-size:13px;color:var(--dsw-alias-label-primary,#0f1115);pointer-events:none}",
	".dshct_tooltip_title{overflow-wrap:anywhere;white-space:pre-wrap;line-height:1.45}",
	".dshct_action_tip{position:fixed;z-index:10002;border-radius:6px;padding:3px 8px;font-size:12px;line-height:18px;white-space:nowrap;pointer-events:none;box-shadow:0 2px 8px rgba(0,0,0,.18)}",
	".dshct_inline{position:relative;box-sizing:border-box;width:100%;margin:8px 0;padding:8px 12px 36px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.12));border-radius:12px;background:var(--dsw-specific-input-major,#fff);display:flex;flex-direction:column}",
	".dshct_inline textarea{box-sizing:border-box;width:100%;min-height:22px;max-height:132px;overflow-y:auto;resize:none;font:inherit;line-height:1.6;border:none;outline:none;background:transparent;color:inherit;padding:0}",
	".dshct_inline_actions{position:absolute;right:8px;bottom:6px;display:flex;gap:2px;align-items:center}",
	".dshct_inline_actions button{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;cursor:pointer;border:none;background:transparent;border-radius:8px;color:var(--dsw-alias-label-secondary,#61666b);padding:0}",
	".dshct_inline_actions button:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.06));color:var(--dsw-alias-label-primary,#0f1115)}",
	".dshct_inline_actions button[data-primary]{color:var(--dsw-alias-brand-primary,#3b82f6)}"
].join("\n");

const ROW_GAP = 28;
const COLUMN_GAP = 20;
const PAD_LEFT = 10;
const PAD_TOP = 10;
const DOT_SIZE = 10;
const DOT_R = DOT_SIZE / 2;

const EDIT_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11.3 2.3a1.8 1.8 0 0 1 2.6 2.6L6.3 12.5 2.8 13.2l.7-3.5 7.8-7.4z"/></svg>';
const REGEN_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>';
const CANCEL_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>';
const SEND_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>';

function injectStyles() {
	if (typeof document === "undefined") return;
	if (document.querySelector(`style[data-plugin-css="${CSS_ID}"]`)) return;
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-session-enhance";
	tag.dataset.pluginCss = CSS_ID;
	tag.textContent = CSS;
	document.head.appendChild(tag);
}

function findButtonByLabel(container, labels) {
	if (container === null || container === void 0) return null;
	for (const btn of Array.from(container.querySelectorAll("button"))) {
		const label = `${btn.getAttribute("aria-label") || ""} ${btn.getAttribute("title") || ""} ${btn.textContent || ""}`;
		if (labels.some((item) => label.toLowerCase().includes(item.toLowerCase()))) return btn;
	}
	return null;
}

/**
 * 安装对话树面板。返回 disposer。
 * @param ctx - client root context。
 * @param api - { readTree, regenerate, editAndRegenerate, switchBranch, t }。
 */
export function installConversationTree(ctx, api) {
	if (typeof document === "undefined") return () => {};
	injectStyles();

	const t = (key, params) => {
		try {
			return api.t(key, params);
		} catch {
			return key;
		}
	};

	let panel = null;
	let scrollEl = null;
	let contentEl = null;
	let tooltip = null;
	let tree = null;
	let loading = false;
	let debounce = null;
	let disposed = false;
	let conversation = null;
	let actionTip = null;

	function showActionTip(text, anchor) {
		hideActionTip();
		actionTip = document.createElement("div");
		actionTip.setAttribute("role", "tooltip");
		actionTip.className = "dshct_action_tip";
		actionTip.textContent = text;
		actionTip.style.background = "var(--dsw-alias-tooltip-bg, rgba(28,28,30,.96))";
		actionTip.style.color = "var(--dsw-alias-tooltip-fg, #f5f5f7)";
		document.body.appendChild(actionTip);
		const rect = anchor.getBoundingClientRect();
		actionTip.style.left = `${Math.max(12, rect.left + rect.width / 2)}px`;
		actionTip.style.top = `${Math.max(12, rect.bottom + 8)}px`;
		actionTip.style.transform = "translateX(-50%)";
	}

	function hideActionTip() {
		if (actionTip !== null) actionTip.remove();
		actionTip = null;
	}

	function iconButton(sibling, svg, ariaLabel, onClick) {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = sibling.className;
		btn.setAttribute("aria-label", ariaLabel);
		btn.innerHTML = svg;
		btn.addEventListener("click", onClick);
		btn.addEventListener("mouseenter", () => showActionTip(ariaLabel, btn));
		btn.addEventListener("mouseleave", hideActionTip);
		btn.addEventListener("focus", () => showActionTip(ariaLabel, btn));
		btn.addEventListener("blur", hideActionTip);
		return btn;
	}

	function currentSessionId() {
		try {
			return ctx.sessions?.list?.getSnapshot?.()?.current ?? null;
		} catch {
			return null;
		}
	}

	/** 定位会话中栏及 header / scrollport / composer（官方 shell 语义属性）。 */
	function findAnchors() {
		const conv = document.querySelector('[data-pane="conversation"]') ?? document.querySelector('[data-slot="conversation"]');
		const scrollport = document.querySelector("[data-conversation-scroll]")
			?? (conv !== null ? conv.querySelector("[data-conversation-scroll]") : null);
		let header = document.querySelector('[data-slot="conversation.session.header"] > header')
			?? document.querySelector('[data-slot="conversation.session.header"]');
		if (header === null && scrollport !== null) {
			const prev = scrollport.previousElementSibling;
			if (prev !== null && prev.tagName === "HEADER") header = prev;
		}
		const composer = document.querySelector('[data-slot="conversation.composer"]')
			?? document.querySelector("[data-composer-card]")
			?? document.querySelector("[data-composer-seat]");
		return { conv, scrollport, header, composer };
	}

	/** 收集当前会话用户轮次对应的 DOM 元素（仅在会话中栏内）。 */
	function collectUserItems() {
		const conv = conversation ?? findAnchors()?.conv ?? document;
		const byKind = Array.from(conv.querySelectorAll('[data-chat-flow-kind="user"]'));
		if (byKind.length > 0) return byKind;
		return Array.from(conv.querySelectorAll('[data-chat-flow-kind]')).filter((item) => item.getAttribute("data-chat-flow-kind") === "user");
	}

	/** 活动分支节点按深度排序（与 DOM 用户轮次一一对应）。 */
	function activeNodesByDepth() {
		if (tree === null) return [];
		const active = new Set(tree.activePath ?? []);
		return (tree.nodes ?? []).filter((node) => active.has(node.id)).sort((a, b) => a.depth - b.depth);
	}

	function layoutPanel() {
		if (panel === null || !panel.isConnected) return;
		const anchors = findAnchors();
		const { conv, scrollport, header, composer } = anchors;
		let left = 0;
		let top = 0;
		let bottom = 0;
		if (scrollport !== null) {
			const rect = scrollport.getBoundingClientRect();
			left = rect.left + 6;
			top = rect.top;
			bottom = Math.max(0, window.innerHeight - rect.bottom);
		} else if (header !== null && composer !== null) {
			left = (conv !== null ? conv.getBoundingClientRect().left : header.getBoundingClientRect().left) + 6;
			top = header.getBoundingClientRect().bottom + 4;
			bottom = Math.max(0, window.innerHeight - composer.getBoundingClientRect().top + 4);
		} else if (conv !== null) {
			const rect = conv.getBoundingClientRect();
			left = rect.left + 6;
			top = rect.top;
			bottom = 0;
		} else {
			return;
		}
		panel.style.position = "fixed";
		panel.style.left = `${left}px`;
		panel.style.top = `${top}px`;
		panel.style.bottom = `${bottom}px`;
		panel.style.width = "auto";
	}

	function removePanel() {
		if (panel !== null && panel.isConnected) panel.remove();
		panel = null;
		scrollEl = null;
		contentEl = null;
		tree = null;
		hideTooltip();
		hideActionTip();
	}

	function hideTooltip() {
		if (tooltip !== null) tooltip.remove();
		tooltip = null;
	}

	function showTooltip(node, anchor) {
		hideTooltip();
		tooltip = document.createElement("div");
		tooltip.className = "dshct_tooltip";
		const title = document.createElement("div");
		title.className = "dshct_tooltip_title";
		title.textContent = node.userText || "";
		tooltip.appendChild(title);
		document.body.appendChild(tooltip);
		const rect = anchor.getBoundingClientRect();
		tooltip.style.left = `${Math.max(12, rect.right + 10)}px`;
		tooltip.style.top = `${Math.max(12, rect.top)}px`;
	}

	function computeColumns(tree) {
		const columns = new Map();
		const active = tree.activeBranchId ?? "root";
		columns.set(active, 0);
		let next = 1;
		for (const branch of tree.branches ?? []) {
			if (branch.id === active) continue;
			if (!columns.has(branch.id)) columns.set(branch.id, next++);
		}
		return columns;
	}

	/** 计算每个节点圆点中心坐标 + 面板尺寸。 */
	function layoutNodes(tree) {
		const columns = computeColumns(tree);
		const positions = new Map();
		let maxDepth = 0;
		let maxColumn = 0;
		for (const node of tree.nodes ?? []) {
			const column = columns.get(node.branchId) ?? 0;
			const x = PAD_LEFT + column * COLUMN_GAP + DOT_R;
			const y = PAD_TOP + (node.depth - 1) * ROW_GAP + DOT_R;
			positions.set(node.id, { x, y });
			maxDepth = Math.max(maxDepth, node.depth);
			maxColumn = Math.max(maxColumn, column);
		}
		const width = PAD_LEFT + (maxColumn + 1) * COLUMN_GAP + DOT_R + 20;
		const height = PAD_TOP + maxDepth * ROW_GAP + DOT_R + 12;
		return { columns, positions, width, height, maxDepth };
	}

	/** 生成节点连线（同列竖直；跨列用直角肘）。 */
	function buildEdges(tree, positions) {
		const byId = new Map((tree.nodes ?? []).map((node) => [node.id, node]));
		const edges = [];
		for (const node of tree.nodes ?? []) {
			if (node.parentId === null || node.parentId === void 0) continue;
			const parent = byId.get(node.parentId);
			if (parent === void 0) continue;
			const from = positions.get(parent.id);
			const to = positions.get(node.id);
			if (from === void 0 || to === void 0) continue;
			let path;
			if (from.x === to.x) {
				path = `M ${from.x} ${from.y + DOT_R} L ${to.x} ${to.y - DOT_R}`;
			} else {
				const midY = to.y - ROW_GAP / 2;
				path = `M ${from.x} ${from.y + DOT_R} L ${from.x} ${midY} L ${to.x} ${midY} L ${to.x} ${to.y - DOT_R}`;
			}
			edges.push(path);
		}
		return edges;
	}

	function nodeRow(node, column, bp, isActive, position) {
		const row = document.createElement("div");
		row.className = "dshct_node";
		if (isActive) row.setAttribute("data-active", "");
		else row.setAttribute("data-faded", "");
		if (bp !== void 0) row.setAttribute("data-fork", "");
		row.dataset.nodeId = node.id;
		row.dataset.branchId = node.branchId;
		row.style.left = `${position.x - DOT_R}px`;
		row.style.top = `${position.y - DOT_R}px`;

		const dot = document.createElement("span");
		dot.className = "dshct_dot";
		row.appendChild(dot);

		row.addEventListener("mouseenter", () => showTooltip(node, row));
		row.addEventListener("mouseleave", hideTooltip);
		row.addEventListener("click", () => {
			if (isActive) scrollToTurn(node.depth);
			else switchTo(node.branchId);
		});

		return row;
	}

	function render() {
		if (panel === null || scrollEl === null) return;
		scrollEl.innerHTML = "";
		contentEl = null;
		if (tree === null || !Array.isArray(tree.nodes) || tree.nodes.length === 0) return;

		const layout = layoutNodes(tree);
		contentEl = document.createElement("div");
		contentEl.className = "dshct_content";
		contentEl.style.width = `${layout.width}px`;
		contentEl.style.height = `${layout.height}px`;
		scrollEl.appendChild(contentEl);
		panel.style.width = `${Math.min(layout.width, 220)}px`;

		const edges = buildEdges(tree, layout.positions);
		if (edges.length > 0) {
			const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			svg.setAttribute("class", "dshct_edges");
			svg.setAttribute("width", layout.width);
			svg.setAttribute("height", layout.height);
			svg.style.width = `${layout.width}px`;
			svg.style.height = `${layout.height}px`;
			for (const path of edges) {
				const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
				p.setAttribute("d", path);
				p.setAttribute("class", "dshct_edge");
				svg.appendChild(p);
			}
			contentEl.appendChild(svg);
		}

		const active = new Set(tree.activePath ?? []);
		const bpByNode = tree.branchPoints ?? {};
		for (const node of tree.nodes) {
			const column = layout.columns.get(node.branchId) ?? 0;
			const position = layout.positions.get(node.id);
			if (position === void 0) continue;
			contentEl.appendChild(nodeRow(node, column, bpByNode[node.id], active.has(node.id), position));
		}
	}

	function ensurePanel() {
		const anchors = findAnchors();
		if (anchors.conv === null && anchors.scrollport === null) {
			removePanel();
			return;
		}
		conversation = anchors.conv;
		if (panel !== null && panel.isConnected) {
			layoutPanel();
			return;
		}
		panel = document.createElement("div");
		panel.className = "dshct_panel";
		scrollEl = document.createElement("div");
		scrollEl.className = "dshct_scroll";
		panel.appendChild(scrollEl);
		document.body.appendChild(panel);
		layoutPanel();
	}

	function treeSignature(value) {
		if (value === null) return "";
		const nodes = (value.nodes ?? []).map((n) => `${n.id}:${n.depth}:${n.branchId}:${n.active ? 1 : 0}:${(n.userText || "").length}`).join("|");
		const activePath = (value.activePath ?? []).join(",");
		const points = Object.entries(value.branchPoints ?? {}).map(([k, v]) => `${k}:${(v.options ?? []).map((o) => `${o.branchId}${o.active ? "!" : ""}`).join(",")}:${v.current}`).join("|");
		return `${value.activeBranchId}#${nodes}#${activePath}#${points}`;
	}

	async function load() {
		if (disposed || loading) return;
		const sid = currentSessionId();
		if (sid === null) {
			removePanel();
			return;
		}
		ensurePanel();
		layoutPanel();
		loading = true;
		try {
			const next = await api.readTree(sid);
			if (treeSignature(next) !== treeSignature(tree)) {
				tree = next;
				render();
			} else {
				tree = next;
			}
			injectReplyActions();
			injectUserActions();
		} catch (error) {
			if (tree === null) {
				tree = { nodes: [], activePath: [], branches: [], branchPoints: {}, activeBranchId: "root" };
				render();
			}
		} finally {
			loading = false;
		}
	}

	/** 定位某轮次的用户消息行（优先 data-turn-tail 反查，其次按 DOM 顺序）。 */
	function userRowForTurn(depth) {
		const conv = conversation ?? findAnchors()?.conv ?? document;
		const tail = Array.from(conv.querySelectorAll("[data-turn-tail]")).find((el) => Number(el.getAttribute("data-turn-tail")) === depth);
		if (tail !== void 0) {
			let node = tail.previousElementSibling;
			while (node !== null) {
				if (node.getAttribute?.("data-chat-flow-kind") === "user") return node;
				node = node.previousElementSibling;
			}
		}
		return collectUserItems()[depth - 1] ?? null;
	}

	function scrollToTop(el, scrollport, offset) {
		const top = el.getBoundingClientRect().top - scrollport.getBoundingClientRect().top + scrollport.scrollTop - offset;
		scrollport.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
	}

	/** 滚动到某轮次：命中已渲染行则精确滚动；未命中（虚拟化）则按比例逼近后精修。 */
	async function scrollToTurn(depth) {
		const anchors = findAnchors();
		if (anchors === null || anchors.scrollport === null) return false;
		const { scrollport, header } = anchors;
		const offset = header !== null ? header.getBoundingClientRect().height + 8 : 8;

		const direct = userRowForTurn(depth);
		if (direct !== null) {
			scrollToTop(direct, scrollport, offset);
			return true;
		}

		const total = activeNodesByDepth().length;
		if (total > 1) {
			const maxScroll = scrollport.scrollHeight - scrollport.clientHeight;
			scrollport.scrollTop = Math.min(maxScroll, ((depth - 1) / (total - 1)) * maxScroll);
		}
		for (let attempt = 0; attempt < 8; attempt += 1) {
			await new Promise((resolve) => setTimeout(resolve, 110));
			const target = userRowForTurn(depth);
			if (target !== null) {
				scrollToTop(target, scrollport, offset);
				return true;
			}
		}
		return total > 1;
	}

	/** LLM 底部（turn-tail）：在「分支」按钮后注入「重新生成」。 */
	function injectReplyActions() {
		if (tree === null) return;
		const conv = conversation ?? findAnchors()?.conv ?? document;
		const activeBranch = tree.activeBranchId ?? "root";
		const tails = Array.from(conv.querySelectorAll("[data-turn-tail]"));
		const activeNodes = activeNodesByDepth();
		for (let index = 0; index < tails.length; index += 1) {
			const tail = tails[index];
			if (tail.querySelector(".dshct_replyRegen")) continue;
			const branchBtn = findButtonByLabel(tail, ["分支", "branch", "fork"]);
			if (branchBtn === null) continue;
			const node = activeNodes[index] ?? { id: `${activeBranch}:${index + 1}`, depth: index + 1, branchId: activeBranch, active: true, userText: "" };
			const btn = iconButton(branchBtn, REGEN_ICON, t("tree.regenerate"), () => doRegenerate(node));
			btn.classList.add("dshct_replyRegen");
			branchBtn.after(btn);
		}
	}

	/** 分支切换控件：‹ 当前/总数 ›（用于对话区用户消息下方的分叉节点）。 */
	function branchControl(bp) {
		const wrap = document.createElement("span");
		wrap.className = "dshct_branch";
		const prev = document.createElement("button");
		prev.type = "button";
		prev.textContent = "‹";
		prev.addEventListener("click", (event) => {
			event.stopPropagation();
			cycleBranch(bp, -1);
		});
		const count = document.createElement("span");
		count.textContent = `${bp.current + 1}/${bp.options.length}`;
		const next = document.createElement("button");
		next.type = "button";
		next.textContent = "›";
		next.addEventListener("click", (event) => {
			event.stopPropagation();
			cycleBranch(bp, 1);
		});
		wrap.appendChild(prev);
		wrap.appendChild(count);
		wrap.appendChild(next);
		return wrap;
	}

	/** 用户消息：在「复制」按钮后注入「修改并重新生成」，分叉节点再在其后注入分支切换。 */
	function injectUserActions() {
		if (tree === null) return;
		const items = collectUserItems();
		const activeNodes = activeNodesByDepth();
		const bpByNode = tree.branchPoints ?? {};
		for (let index = 0; index < items.length; index += 1) {
			const item = items[index];
			const copyBtn = findButtonByLabel(item, ["复制", "copy"]);
			if (copyBtn === null) continue;
			const node = activeNodes[index] ?? null;
			if (node === null) continue;

			let editBtn = item.querySelector(".dshct_userEdit");
			if (editBtn === null) {
				editBtn = iconButton(copyBtn, EDIT_ICON, t("tree.edit"), () => startInlineEdit(item, node));
				editBtn.classList.add("dshct_userEdit");
				copyBtn.after(editBtn);
			}

			// 仅有分支的节点显示切换；按投影签名增量更新，避免每次 load 反复重建触发观察器。
			const bp = bpByNode[node.id];
			const signature = bp === void 0 ? "" : `${bp.current}:${(bp.options ?? []).map((o) => `${o.branchId}${o.active ? "!" : ""}`).join(",")}`;
			const existing = item.querySelector(".dshct_userBranch");
			if (bp === void 0 || (bp.options?.length ?? 0) <= 1) {
				if (existing !== null) existing.remove();
				continue;
			}
			if (existing !== null && existing.dataset.signature === signature) continue;
			if (existing !== null) existing.remove();
			const control = branchControl(bp);
			control.classList.add("dshct_userBranch");
			control.dataset.signature = signature;
			editBtn.after(control);
		}
	}

	/** 把用户气泡改为输入框，含取消 / 发送。 */
	function startInlineEdit(userItem, node) {
		const bubble = userItem.querySelector('[class*="bubble"]') ?? userItem.querySelector('[class*="userStack"]');
		if (bubble === null) return;
		const row = bubble.closest('[class*="userRow"]') ?? bubble.parentElement;
		row.style.display = "none";
		const editor = document.createElement("div");
		editor.className = "dshct_inline";
		const textarea = document.createElement("textarea");
		textarea.value = node.userText ?? "";
		const autoGrow = () => {
			textarea.style.height = "auto";
			textarea.style.height = `${Math.min(textarea.scrollHeight, 132)}px`;
		};
		textarea.addEventListener("input", autoGrow);
		textarea.addEventListener("keydown", (event) => {
			if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
				event.preventDefault();
				send();
			}
		});
		const actions = document.createElement("div");
		actions.className = "dshct_inline_actions";
		const cancel = document.createElement("button");
		cancel.type = "button";
		cancel.setAttribute("aria-label", t("tree.editCancel"));
		cancel.innerHTML = CANCEL_ICON;
		cancel.addEventListener("click", restore);
		const sendBtn = document.createElement("button");
		sendBtn.type = "button";
		sendBtn.setAttribute("data-primary", "");
		sendBtn.setAttribute("aria-label", t("tree.editSend"));
		sendBtn.innerHTML = SEND_ICON;
		sendBtn.addEventListener("click", send);
		actions.appendChild(cancel);
		actions.appendChild(sendBtn);
		editor.appendChild(textarea);
		editor.appendChild(actions);
		userItem.appendChild(editor);
		autoGrow();

		function restore() {
			editor.remove();
			row.style.display = "";
		}
		function send() {
			const sid = currentSessionId();
			if (sid === null) return;
			api.editAndRegenerate(sid, node.id, textarea.value).then(() => {
				tree = null;
				load();
				resync(sid);
			}).catch((error) => {
				console.warn("[dsh-session-enhance] editAndRegenerate failed:", error);
			});
		}
	}

	async function switchTo(branchId) {
		const sid = currentSessionId();
		if (sid === null) return;
		try {
			await api.switchBranch(sid, branchId);
			tree = null;
			await load();
			resync(sid);
		} catch (error) {
			console.warn("[dsh-session-enhance] switchBranch failed:", error);
		}
	}

	async function doRegenerate(node) {
		const sid = currentSessionId();
		if (sid === null) return;
		try {
			await api.regenerate(sid, node.id);
			tree = null;
			await load();
			resync(sid);
		} catch (error) {
			console.warn("[dsh-session-enhance] regenerate failed:", error);
		}
	}

	/** 分支操作会改写主干并 detach live 会话，这里尽力重新打开让聊天区刷新。 */
	function resync(sid) {
		try {
			ctx.sessions?.open?.(sid);
		} catch (error) {
			console.warn("[dsh-session-enhance] reopen after branch operation failed:", error);
		}
	}

	async function cycleBranch(bp, direction) {
		const options = bp.options ?? [];
		if (options.length <= 1) return;
		const next = (bp.current + direction + options.length) % options.length;
		await switchTo(options[next].branchId);
	}

	function scheduleLoad() {
		if (debounce !== null) return;
		debounce = setTimeout(() => {
			debounce = null;
			load();
		}, 200);
	}

	let currentSid = null;
	let unsubList = null;
	let unsubInst = null;

	/** 订阅 live 会话实例通知（用户发送 / LLM 结束 / 事件追加），去抖后重拉。 */
	function watchSessionInstance(sid) {
		if (typeof unsubInst === "function") {
			unsubInst();
			unsubInst = null;
		}
		if (sid === null) return;
		try {
			const inst = ctx.sessions?.binding?.(sid)?.session;
			if (inst !== void 0 && typeof inst.subscribe === "function") {
				unsubInst = inst.subscribe(() => scheduleLoad());
			}
		} catch {
			// ignore
		}
	}

	const onSessionListChange = () => {
		const sid = currentSessionId();
		if (sid !== currentSid) {
			currentSid = sid;
			tree = null;
			watchSessionInstance(sid);
		}
		scheduleLoad();
	};

	try {
		unsubList = ctx.sessions?.list?.subscribe?.(onSessionListChange);
	} catch {
		// ignore
	}
	currentSid = currentSessionId();
	watchSessionInstance(currentSid);

	window.addEventListener("resize", layoutPanel, { passive: true });
	// 仅观察结构性变化（新增消息行 / turn-tail 出现），用于「发送消息」「LLM 回复完成」；
	// 不观察 characterData，避免流式输出期间高频触发。
	const observer = new MutationObserver(() => {
		layoutPanel();
		scheduleLoad();
	});
	observer.observe(document.body, { childList: true, subtree: true });
	load();

	return () => {
		disposed = true;
		if (debounce !== null) window.clearTimeout(debounce);
		if (typeof unsubList === "function") unsubList();
		if (typeof unsubInst === "function") unsubInst();
		window.removeEventListener("resize", layoutPanel);
		observer.disconnect();
		removePanel();
	};
}
