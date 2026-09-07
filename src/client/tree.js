/**
 * dsh-session-enhance 对话树客户端面板。
 *
 * 锚点（官方 shell 语义属性，见皮肤中心 semantic-attrs/v1）：
 * - 会话中栏：`[data-pane="conversation"]`（回退 `[data-slot="conversation"]`）
 * - 会话头：`[data-slot="conversation.session.header"] > header`（回退 scrollport 的前一个 `<header>`）
 * - 滚动口：`[data-conversation-scroll]`
 * - 输入区：`[data-slot="conversation.composer"]`（回退 `[data-composer-card]` / `[data-composer-seat]`）
 *
 * 面板挂在会话中栏内（fixed），贴中栏左缘，顶部对齐 header 底、底部对齐输入区顶。
 * 节点图以单个 <canvas> 绘制（整数超采样 ≥2 抗锯齿）：采用「叶中位」tidy 布局，每个叶
 * 独占一列、内部节点取子树叶区间中点——兄弟子树区间互斥连续，连线只在相邻两层扇出且
 * 不越出本子树区间，因此新旧分支永不交叉。整簇在固定宽度透明树列内水平居中（单链=一
 * 列圆点竖在列正中），贝塞尔曲线连线按分支着色（跨列渐变）。布局只由拓扑与分支序决定，
 * 切分支/点选只改高亮不改布局。悬浮/点击/切分支由 canvas 命中检测驱动。
 */

const CSS_ID = "dsh-session-enhance/tree.module.css";
const CSS = [
	// 面板级分支调色板：前三个取主题 accent（跟随明暗主题），其余为明暗底均可见的中饱和度固定色。
	".dshct_panel{position:fixed;z-index:200;display:flex;flex-direction:column;overflow:hidden;pointer-events:none;--dshct-palette-0:var(--dsw-alias-brand-primary,#4e7cff);--dshct-palette-1:var(--dsw-alias-state-business-primary,#10b981);--dshct-palette-2:var(--dsw-alias-accent-strong,#8b5cf6);--dshct-palette-3:#f59e0b;--dshct-palette-4:#ec4899;--dshct-palette-5:#14b8a6}",
	".dshct_scroll{position:relative;flex:1 1 auto;overflow-y:auto;overflow-x:hidden;pointer-events:auto;scrollbar-width:none}",
	".dshct_scroll::-webkit-scrollbar{display:none}",
	".dshct_content{position:relative}",
	".dshct_canvas{display:block;touch-action:manipulation}",
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
const PAD_TOP = 10;
const DOT_SIZE = 10;
const DOT_R = DOT_SIZE / 2;
const DOT_LW = 2;
// 虚拟头节点：画在首轮上方，把所有 depth1 顶层根并入同一棵视觉树（重生成第1条不再出现两棵树）。
const HEAD_GAP = 26;
const HEAD_R = 4;
// 树列宽：单链/窄树即固定 BASE（一条约 96px 的透明列，图簇在其中水平居中）；
// 分叉展开超过 BASE 内容时列随图簇加宽，两侧保留 TREE_INSET 对称留白；上限 TREE_MAX_WIDTH。
const TREE_RAIL_BASE = 96;
const TREE_INSET = 16;
const TREE_MAX_WIDTH = 220;
// canvas 命中半径（大于视觉半径，便于点击/悬浮）。
const HIT_RADIUS = 14;

/** 分支调色板：与 .dshct_panel 上的 --dshct-palette-N 变量一一对应，按分支列序循环取色。 */
const BRANCH_COLOR_VARS = ["--dshct-palette-0", "--dshct-palette-1", "--dshct-palette-2", "--dshct-palette-3", "--dshct-palette-4", "--dshct-palette-5"];
const BRANCH_COLOR_FALLBACK = ["#4e7cff", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#14b8a6"];

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
	let resizeObserver = null;
	let observedTargets = null;
	let paletteCache = null;
	// canvas 渲染状态。
	let canvasEl = null;
	let drawColors = null;
	let renderNodes = []; // { id, node, x, y, column, color, active, fork }
	let renderEdges = []; // { from, to, fromColor, toColor, active }
	let lastLayout = null;
	let hoverId = null;
	let themeObserver = null;
	let themeDarkMedia = null;
	let themeDarkCb = null;
	let themeRedrawTimer = null;
	// 生成中排队的分支操作：等待当前回答完成后自动重放。
	let pendingOp = null;
	let pendingTipShown = false;

	/** 解析面板上的分支调色板（alias 变量在面板上下文中求值，跟随主题）。 */
	function branchPalette() {
		if (paletteCache !== null) return paletteCache;
		const cs = panel !== null && panel.isConnected ? window.getComputedStyle(panel) : null;
		paletteCache = BRANCH_COLOR_VARS.map((name, index) => {
			const value = cs !== null ? (cs.getPropertyValue(name) || "").trim() : "";
			return value !== "" ? value : BRANCH_COLOR_FALLBACK[index];
		});
		return paletteCache;
	}

	function colorForColumn(column) {
		const palette = branchPalette();
		return palette[column % palette.length];
	}

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

	/** 当前可见的会话中栏；仅「对话」视图（chat）存在且可见时返回。
	 *  「轨迹」等其它视图虽共享同一会话中栏，但不渲染 `[data-chat-flow]`，据此排除。 */
	function conversationPane() {
		const conv = document.querySelector('[data-pane="conversation"]') ?? document.querySelector('[data-slot="conversation"]');
		if (conv === null || !conv.isConnected) return null;
		const style = window.getComputedStyle(conv);
		if (style.display === "none" || style.visibility === "hidden") return null;
		if (conv.querySelector("[data-chat-flow]") === null && document.querySelector("[data-chat-flow]") === null) return null;
		return conv;
	}

	/** 定位会话中栏及 header / scrollport / composer（官方 shell 语义属性）。 */
	function findAnchors() {
		const conv = conversationPane();
		const scrollport = (conv !== null ? conv.querySelector("[data-conversation-scroll]") : null)
			?? document.querySelector("[data-conversation-scroll]");
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

	/** 该轮次能否安全重新生成：下方不得有在其旧延续上分叉的子分支（与 model 守卫一致）。
	 *  有则隐藏按钮，避免触发会把子树改写的危险操作。 */
	function isRegenNodeSafe(node) {
		if (tree === null) return false;
		const branches = tree.branches ?? [];
		return !branches.some((b) => b.parentBranchId === node.branchId && b.forkDepth >= node.depth);
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
		// 面板贴会话中栏左缘；宽度由 render 依内容设置，这里不覆盖。
		panel.style.position = "fixed";
		panel.style.left = `${left}px`;
		panel.style.top = `${top}px`;
		panel.style.bottom = `${bottom}px`;
	}

	function removePanel() {
		if (resizeObserver !== null) {
			resizeObserver.disconnect();
			resizeObserver = null;
		}
		observedTargets = null;
		if (panel !== null && panel.isConnected) panel.remove();
		panel = null;
		scrollEl = null;
		contentEl = null;
		paletteCache = null;
		canvasEl = null;
		drawColors = null;
		renderNodes = [];
		renderEdges = [];
		lastLayout = null;
		hoverId = null;
		// 保留 tree 缓存：切回「对话」视图时可立即渲染，无需等 debounced load。
		hideTooltip();
		hideActionTip();
	}

	/** 布局尺寸变化（如侧栏收起/展开）时重排面板。ResizeObserver 在布局结算后触发，
	 *  弥补 window resize 不覆盖侧栏折叠、以及 MutationObserver 先于布局结算的时序。 */
	function watchLayoutResize() {
		if (typeof ResizeObserver === "undefined") return;
		const anchors = findAnchors();
		const targets = [anchors.conv, anchors.scrollport].filter((el) => el !== null && el.isConnected);
		// 目标元素未变化时无需重建观察器，避免每次 MutationObserver 触发都反复 disconnect/observe。
		if (observedTargets !== null
			&& observedTargets.length === targets.length
			&& observedTargets.every((el, index) => el === targets[index])) {
			return;
		}
		observedTargets = targets;
		if (resizeObserver !== null) {
			resizeObserver.disconnect();
			resizeObserver = null;
		}
		if (targets.length === 0) return;
		resizeObserver = new ResizeObserver(() => relayoutCanvas());
		for (const target of targets) resizeObserver.observe(target);
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

	/** 分支稳定序号：按分支创建顺序（root 优先）。切换活动分支时不变；此处仅用于着色与子节点排序。 */
	function computeColumns(tree) {
		const columns = new Map();
		let next = 0;
		for (const branch of tree.branches ?? []) {
			if (!columns.has(branch.id)) columns.set(branch.id, next++);
		}
		return columns;
	}

	/**
	 * 计算每个节点圆点中心坐标 + 面板尺寸（叶中位 tidy 布局，无交叉）。
	 *
	 * 每棵树至多一个根；每个叶子节点独占一列（序号沿 DFS 递增），内部节点取
	 * 子树叶区间的中点 → 兄弟子树占据互斥、连续的叶区间，且任意一条边只跨越相邻
	 * 两个深度、水平范围落在本子树区间内，因此新旧分支的任何两条连线都不相交。
	 *
	 * 子节点次序与活动分支无关（同分支续接优先、其余按分支创建序），布局只由拓扑
	 * 决定：切分支/点选只改高亮，不重排；仅分叉使叶增多时才整体重排居中。
	 */
	function layoutNodes(tree) {
		const branchIndex = computeColumns(tree);
		const childrenOf = new Map();
		for (const n of tree.nodes ?? []) {
			if (n.parentId === null || n.parentId === void 0) continue;
			const list = childrenOf.get(n.parentId) ?? [];
			list.push(n);
			childrenOf.set(n.parentId, list);
		}

		// DFS：叶子依次编号；内部节点取子树叶区间中点的列号（可为 .5 步长）。
		let leafCursor = 0;
		const leafCenter = new Map();
		const place = (node) => {
			const kids = childrenOf.get(node.id) ?? [];
			if (kids.length === 0) {
				leafCenter.set(node.id, leafCursor);
				leafCursor += 1;
				return;
			}
			kids.sort((a, b) => {
				const ka = (a.branchId === node.branchId ? -1 : branchIndex.get(a.branchId) ?? 0);
				const kb = (b.branchId === node.branchId ? -1 : branchIndex.get(b.branchId) ?? 0);
				if (ka !== kb) return ka - kb;
				return (branchIndex.get(a.branchId) ?? 0) - (branchIndex.get(b.branchId) ?? 0);
			});
			let lo = Infinity;
			let hi = -Infinity;
			for (const kid of kids) {
				place(kid);
				const c = leafCenter.get(kid.id);
				if (c < lo) lo = c;
				if (c > hi) hi = c;
			}
			leafCenter.set(node.id, (lo + hi) / 2);
		};
		const roots = (tree.nodes ?? []).filter((n) => n.parentId === null || n.parentId === void 0);
		roots.sort((a, b) => (branchIndex.get(a.branchId) ?? 0) - (branchIndex.get(b.branchId) ?? 0));
		for (const root of roots) place(root);

		const positions = new Map();
		let maxDepth = 0;
		let minX = Infinity;
		let maxX = -Infinity;
		for (const node of tree.nodes ?? []) {
			const c = leafCenter.get(node.id);
			if (c === void 0) continue;
			maxDepth = Math.max(maxDepth, node.depth);
			const x = c * COLUMN_GAP;
			const y = PAD_TOP + HEAD_GAP + (node.depth - 1) * ROW_GAP + DOT_R;
			positions.set(node.id, { x, y });
			if (x < minX) minX = x;
			if (x > maxX) maxX = x;
		}
		const figureW = maxX - minX + DOT_SIZE;
		// 树列宽：窄树取固定 BASE，图簇两侧留对称留白；过宽时整体居中后裁剪上限 MAX。
		const railW = Math.max(TREE_RAIL_BASE, figureW + 2 * TREE_INSET);
		const width = Math.min(railW, TREE_MAX_WIDTH);
		// 把图簇水平中心对齐树列中心。
		const shift = width / 2 - (minX + maxX) / 2;
		for (const point of positions.values()) point.x += shift;
		// 高度包含头部预留行（虚拟头）。
		const height = PAD_TOP + HEAD_GAP + maxDepth * ROW_GAP + DOT_R + 12;
		return { columns: branchIndex, positions, width, height, maxDepth };
	}

	/** 生成连线几何：同列竖直直线；跨列用三次贝塞尔曲线平滑过渡。
	 *  颜色取子/父分支列（跨列渐变由父色过渡到子色），并标记是否整条在活动路径上。 */
	function buildEdgeGeom(tree, layout, activeSet) {
		const byId = new Map((tree.nodes ?? []).map((node) => [node.id, node]));
		const edges = [];
		for (const node of tree.nodes ?? []) {
			if (node.parentId === null || node.parentId === void 0) continue;
			const parent = byId.get(node.parentId);
			if (parent === void 0) continue;
			const from = layout.positions.get(parent.id);
			const to = layout.positions.get(node.id);
			if (from === void 0 || to === void 0) continue;
			edges.push({
				from,
				to,
				fromColor: colorForColumn(layout.columns.get(parent.branchId) ?? 0),
				toColor: colorForColumn(layout.columns.get(node.branchId) ?? 0),
				active: activeSet.has(parent.id) && activeSet.has(node.id)
			});
		}
		return edges;
	}

	/** 解析绘制颜色（canvas 不能用 CSS var）。occlude 为圆点底遮，盖住从圆心穿过的连线。 */
	function resolveDrawColors() {
		const cs = panel !== null && panel.isConnected ? window.getComputedStyle(panel) : null;
		const read = (name, fallback) => {
			const value = cs !== null ? (cs.getPropertyValue(name) || "").trim() : "";
			return value !== "" ? value : fallback;
		};
		branchPalette();
		return {
			occlude: read("--dsw-alias-bg-layer-2", "#ffffff"),
			neutral: read("--dsw-alias-label-tertiary", "#9aa1ab")
		};
	}

	/** 渲染超采样比例：取 ≥2 的整数（devicePixelRatio 兜底），避免亚像素取整造成的锯齿。 */
	function renderScale() {
		const dpr = (typeof window !== "undefined" && window.devicePixelRatio) || 1;
		return Math.max(2, Math.round(dpr));
	}

	/** 按当前比例同步 canvas 后备缓冲（CSS 尺寸不变；缓冲变小时即清空重绘）。 */
	function syncCanvasResolution() {
		if (canvasEl === null || lastLayout === null) return;
		const scale = renderScale();
		const w = Math.round(lastLayout.width * scale);
		const h = Math.round(lastLayout.height * scale);
		if (canvasEl.width !== w || canvasEl.height !== h) {
			canvasEl.width = w;
			canvasEl.height = h;
		}
		canvasEl.style.width = `${lastLayout.width}px`;
		canvasEl.style.height = `${lastLayout.height}px`;
	}

	/** 布局/窗口尺寸或 DPR 变化时：重定位 + 重设缓冲 + 重绘（仅几何位移，节点坐标不变）。 */
	function relayoutCanvas() {
		layoutPanel();
		if (canvasEl === null || lastLayout === null) return;
		syncCanvasResolution();
		drawScene();
	}

	/** 描一条边：同列直线；跨列贝塞尔（控制点取纵向中点）。 */
	function traceEdge(ctx, edge) {
		const { from, to } = edge;
		ctx.beginPath();
		ctx.moveTo(from.x, from.y + DOT_R);
		if (from.x === to.x) {
			ctx.lineTo(to.x, to.y - DOT_R);
		} else {
			const midY = (from.y + to.y) / 2;
			ctx.bezierCurveTo(from.x, midY, to.x, midY, to.x, to.y - DOT_R);
		}
	}

	/** 画一个节点圆点：先底色遮线，再实心（活动）或空心描边（非活动），分叉点带柔和光环。 */
	function drawNodeMarker(ctx, marker) {
		const scale = hoverId === marker.id ? 1.35 : 1;
		const r = DOT_R * scale;
		const color = marker.color;
		const isActive = marker.active;
		ctx.save();

		// 底遮：用面板底色盖住从圆心穿过的连线。
		ctx.beginPath();
		ctx.arc(marker.x, marker.y, r + DOT_LW / 2 + 0.5, 0, Math.PI * 2);
		ctx.fillStyle = drawColors.occlude;
		ctx.fill();

		if (isActive) {
			// 实心活动点 + 双层外圈光晕。
			ctx.beginPath();
			ctx.arc(marker.x, marker.y, r, 0, Math.PI * 2);
			ctx.fillStyle = color;
			ctx.fill();
			ctx.globalAlpha = 0.16;
			ctx.beginPath();
			ctx.arc(marker.x, marker.y, r + 3.4, 0, Math.PI * 2);
			ctx.lineWidth = 4;
			ctx.strokeStyle = color;
			ctx.stroke();
			ctx.globalAlpha = 0.3;
			ctx.beginPath();
			ctx.arc(marker.x, marker.y, r + 1.6, 0, Math.PI * 2);
			ctx.lineWidth = 2.4;
			ctx.stroke();
		} else {
			if (marker.fork) {
				// 分叉点：柔和光环。
				ctx.beginPath();
				ctx.arc(marker.x, marker.y, r + 3.6, 0, Math.PI * 2);
				ctx.lineWidth = 3;
				ctx.strokeStyle = color;
				ctx.globalAlpha = 0.2;
				ctx.stroke();
			}
			ctx.globalAlpha = 0.55;
			ctx.beginPath();
			ctx.arc(marker.x, marker.y, r, 0, Math.PI * 2);
			ctx.lineWidth = DOT_LW;
			ctx.strokeStyle = color;
			ctx.stroke();
		}
		ctx.restore();
	}

	function drawScene() {
		if (canvasEl === null || lastLayout === null) return;
		if (drawColors === null) drawColors = resolveDrawColors();
		const ctx = canvasEl.getContext("2d");
		syncCanvasResolution();
		const sx = lastLayout.width > 0 ? canvasEl.width / lastLayout.width : 1;
		const sy = lastLayout.height > 0 ? canvasEl.height / lastLayout.height : 1;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
		ctx.setTransform(sx, 0, 0, sy, 0, 0);
		ctx.lineCap = "round";

		// 0) 虚拟头：把所有顶层(depth1、parent=null)节点连到同一个头部圆点 → 视觉恒为单棵树。
		const tops = renderNodes.filter((m) => m.node !== void 0 && (m.node.parentId === null || m.node.parentId === void 0));
		let headX = 0;
		if (tops.length > 0) {
			let lo = Infinity;
			let hi = -Infinity;
			for (const m of tops) {
				if (m.x < lo) lo = m.x;
				if (m.x > hi) hi = m.x;
			}
			headX = (lo + hi) / 2;
			const headY = PAD_TOP + DOT_R;
			ctx.strokeStyle = drawColors.neutral;
			ctx.globalAlpha = 0.45;
			ctx.lineWidth = 1.4;
			for (const m of tops) {
				const from = { x: headX, y: headY + HEAD_R };
				const to = { x: m.x, y: m.y - DOT_R };
				const midY = (from.y + to.y) / 2;
				ctx.beginPath();
				ctx.moveTo(from.x, from.y);
				ctx.bezierCurveTo(from.x, midY, to.x, midY, to.x, to.y);
				ctx.stroke();
			}
			ctx.globalAlpha = 1;
		}

		// 1) 连线（圆点下层）。活动路径加粗高亮，非活动弱化。
		for (const edge of renderEdges) {
			ctx.globalAlpha = edge.active ? 0.95 : 0.34;
			ctx.lineWidth = edge.active ? 2.2 : 1.4;
			let stroke = edge.fromColor;
			if (edge.fromColor !== edge.toColor) {
				const gradient = ctx.createLinearGradient(edge.from.x, edge.from.y, edge.to.x, edge.to.y);
				gradient.addColorStop(0, edge.fromColor);
				gradient.addColorStop(1, edge.toColor);
				stroke = gradient;
			}
			ctx.strokeStyle = stroke;
			traceEdge(ctx, edge);
			ctx.stroke();
		}

		// 2) 节点圆点（上层）。先复位 alpha，避免上一条边的透明度漏进圆点底色。
		ctx.globalAlpha = 1;
		for (const marker of renderNodes) drawNodeMarker(ctx, marker);

		// 3) 虚拟头圆点（中性、小、淡；无交互）。
		if (tops.length > 0) {
			ctx.beginPath();
			ctx.arc(headX, PAD_TOP + DOT_R, HEAD_R, 0, Math.PI * 2);
			ctx.fillStyle = drawColors.neutral;
			ctx.globalAlpha = 0.85;
			ctx.fill();
		}
		ctx.globalAlpha = 1;
	}

	/** 命中检测：canvas 逻辑坐标（CSS px）内最近的圆点，超 HIT_RADIUS 返回 null。 */
	function hitAt(x, y) {
		let best = null;
		let bestDist = HIT_RADIUS * HIT_RADIUS;
		for (const marker of renderNodes) {
			const dx = x - marker.x;
			const dy = y - marker.y;
			const d2 = dx * dx + dy * dy;
			if (d2 <= bestDist) {
				bestDist = d2;
				best = marker;
			}
		}
		return best;
	}

	/** 为圆点合成一个锚点矩形，供 showTooltip 定位。 */
	function anchorForNode(marker) {
		const rect = canvasEl !== null ? canvasEl.getBoundingClientRect() : null;
		return {
			getBoundingClientRect: () => {
				if (rect === null) return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
				return {
					left: rect.left + marker.x - DOT_R,
					top: rect.top + marker.y - DOT_R,
					width: DOT_SIZE,
					height: DOT_SIZE,
					right: rect.left + marker.x + DOT_R,
					bottom: rect.top + marker.y + DOT_R
				};
			}
		};
	}

	function onCanvasPointerMove(event) {
		if (canvasEl === null) return;
		const marker = hitAt(event.offsetX, event.offsetY);
		canvasEl.style.cursor = marker !== null ? "pointer" : "default";
		const id = marker !== null ? marker.id : null;
		if (id === hoverId) return;
		hoverId = id;
		drawScene();
		if (marker !== null) showTooltip(marker.node, anchorForNode(marker));
		else hideTooltip();
	}

	function onCanvasPointerLeave() {
		if (hoverId !== null) {
			hoverId = null;
			drawScene();
		}
		hideTooltip();
	}

	function onCanvasClick(event) {
		const marker = hitAt(event.offsetX, event.offsetY);
		if (marker === null) return;
		if (marker.active) scrollToTurn(marker.node.depth);
		else switchTo(marker.node.branchId);
	}

	function render() {
		if (panel === null || scrollEl === null) return;
		scrollEl.innerHTML = "";
		contentEl = null;
		canvasEl = null;
		hoverId = null;
		lastLayout = null;
		drawColors = null;
		renderNodes = [];
		renderEdges = [];
		hideTooltip();
		if (tree === null || !Array.isArray(tree.nodes) || tree.nodes.length === 0) {
			panel.style.width = "0px";
			return;
		}

		const layout = layoutNodes(tree);
		const active = new Set(tree.activePath ?? []);
		const bpSet = new Set(Object.keys(tree.branchPoints ?? {}));
		drawColors = resolveDrawColors();
		renderNodes = [];
		for (const node of tree.nodes) {
			const position = layout.positions.get(node.id);
			if (position === void 0) continue;
			const column = layout.columns.get(node.branchId) ?? 0;
			renderNodes.push({
				id: node.id,
				node,
				x: position.x,
				y: position.y,
				column,
				color: colorForColumn(column),
				active: active.has(node.id),
				fork: bpSet.has(node.id)
			});
		}
		renderEdges = buildEdgeGeom(tree, layout, active);
		lastLayout = layout;

		contentEl = document.createElement("div");
		contentEl.className = "dshct_content";
		contentEl.style.width = `${layout.width}px`;
		contentEl.style.height = `${layout.height}px`;
		canvasEl = document.createElement("canvas");
		canvasEl.className = "dshct_canvas";
		canvasEl.style.cursor = "default";
		contentEl.appendChild(canvasEl);
		scrollEl.appendChild(contentEl);
		syncCanvasResolution();
		panel.style.width = `${layout.width}px`;

		canvasEl.addEventListener("pointermove", onCanvasPointerMove, { passive: true });
		canvasEl.addEventListener("pointerleave", onCanvasPointerLeave, { passive: true });
		canvasEl.addEventListener("click", onCanvasClick);
		drawScene();
	}

	function ensurePanel() {
		const conv = conversationPane();
		if (conv === null) {
			removePanel();
			return;
		}
		const anchors = findAnchors();
		conversation = conv;
		watchLayoutResize();
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
		if (tree !== null) render();
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
		if (panel === null) return;
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
			// 生成结束（idle）且有待执行的分支操作 → 自动重放（挂起期间回答已完整归档回原分支）。
			if (pendingOp !== null && next && next.generating === false) drainPendingOp();
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
			const existing = tail.querySelector(".dshct_replyRegen");
			const branchBtn = findButtonByLabel(tail, ["分支", "branch", "fork"]);
			if (branchBtn === null) continue;
			const node = activeNodes[index] ?? { id: `${activeBranch}:${index + 1}`, depth: index + 1, branchId: activeBranch, active: true, userText: "" };
			if (!isRegenNodeSafe(node)) {
				if (existing !== null) existing.remove();
				continue;
			}
			if (existing !== null) continue;
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
			const safe = isRegenNodeSafe(node);
			if (!safe) {
				if (editBtn !== null) editBtn.remove();
				editBtn = null;
			} else if (editBtn === null) {
				editBtn = iconButton(copyBtn, EDIT_ICON, t("tree.edit"), () => startInlineEdit(item, node));
				editBtn.classList.add("dshct_userEdit");
				copyBtn.after(editBtn);
			}

			// 仅有分支的节点显示切换；按投影签名增量更新，避免每次 load 反复重建触发观察器。
			const bp = bpByNode[node.id];
			const signature = bp === void 0 ? "" : `${bp.current}:${(bp.options ?? []).map((o) => `${o.branchId}${o.active ? "!" : ""}`).join(",")}`;
			const existing = item.querySelector(".dshct_userBranch");
			const controlAnchor = editBtn !== null ? editBtn : copyBtn;
			if (bp === void 0 || (bp.options?.length ?? 0) <= 1) {
				if (existing !== null) existing.remove();
				continue;
			}
			if (existing !== null && existing.dataset.signature === signature) continue;
			if (existing !== null) existing.remove();
			const control = branchControl(bp);
			control.classList.add("dshct_userBranch");
			control.dataset.signature = signature;
			controlAnchor.after(control);
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
			void applyBranchOp({ kind: "regen", nodeId: node.id, text: textarea.value, edit: true });
		}
	}

	/** 生成中：把分支操作挂起，等当前回答结束自动重放；给出轻提示。 */
	function pendingAnchor() {
		const rect = (canvasEl !== null && canvasEl.isConnected) ? canvasEl.getBoundingClientRect() : { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
		return { getBoundingClientRect: () => rect };
	}
	function setPendingOp(op) {
		pendingOp = op;
		if (!pendingTipShown) {
			pendingTipShown = true;
			const text = op.kind === "switch" ? "正在生成，完成后将自动切换…" : "正在生成，完成后将自动重新生成…";
			showActionTip(text, pendingAnchor());
		}
	}

	/** 执行一次分支操作；遇 busy 则挂起待生成结束重放。 */
	async function applyBranchOp(op) {
		const sid = currentSessionId();
		if (sid === null) return;
		try {
			let result;
			if (op.kind === "switch") result = await api.switchBranch(sid, op.branchId);
			else if (op.edit) result = await api.editAndRegenerate(sid, op.nodeId, op.text);
			else result = await api.regenerate(sid, op.nodeId);
			if (result !== null && result !== void 0 && result.busy) {
				setPendingOp(op);
				return;
			}
			tree = null;
			await load();
			await resync(sid);
		} catch (error) {
			console.warn("[dsh-session-enhance] branch operation failed:", error);
		}
	}

	/** 会话空闲时把挂起的操作重放掉。 */
	function drainPendingOp() {
		const op = pendingOp;
		if (op === null) return;
		pendingOp = null;
		pendingTipShown = false;
		hideActionTip();
		void applyBranchOp(op);
	}

	function switchTo(branchId) {
		void applyBranchOp({ kind: "switch", branchId });
	}

	function doRegenerate(node) {
		void applyBranchOp({ kind: "regen", nodeId: node.id });
	}

	/** 分支操作改写了主干工件与宿主实时会话 log，但客户端会话镜像
	 *  （dsh-client-runtime 的 Session）持有各自拉取的旧窗口事件，且不会被
	 *  通知重拉——`ctx.sessions.open(sid)` 对已当前的会话是 no-op（select 不重拉
	 *  窗口）。直接调用客户端镜像的 `resync()`：重置窗口并重拉历史，让聊天区
	 *  呈现新分支内容。`binding(sid).session` 与本文件 watchSessionInstance 同一
	 *  访问路径；resync 不可用时回退到 open。 */
	async function resync(sid) {
		try {
			const inst = ctx.sessions?.binding?.(sid)?.session;
			if (inst !== void 0 && typeof inst.resync === "function") {
				await inst.resync();
				return;
			}
		} catch (error) {
			console.warn("[dsh-session-enhance] resync session window after branch operation failed:", error);
		}
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

	/** 主题/accent 变化后需重新解析 CSS var（canvas 不能直接用 var）。去抖后失效缓存并重绘。 */
	function scheduleThemeRedraw() {
		if (themeRedrawTimer !== null) return;
		themeRedrawTimer = setTimeout(() => {
			themeRedrawTimer = null;
			paletteCache = null;
			drawColors = null;
			if (canvasEl !== null && lastLayout !== null) drawScene();
		}, 120);
	}

	/** 轻量监听根/body 的 class/style/data-theme 变化与系统配色切换，驱动重绘。 */
	function startThemeWatch() {
		try {
			if (typeof MutationObserver !== "undefined" && document.documentElement !== null) {
				themeObserver = new MutationObserver(scheduleThemeRedraw);
				const options = { attributes: true, attributeFilter: ["class", "style", "data-theme", "data-color-scheme", "color-scheme"] };
				themeObserver.observe(document.documentElement, options);
				if (document.body !== null) themeObserver.observe(document.body, options);
			}
		} catch {
			// ignore
		}
		try {
			if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
				themeDarkMedia = window.matchMedia("(prefers-color-scheme: dark)");
				themeDarkCb = () => scheduleThemeRedraw();
				if (typeof themeDarkMedia.addEventListener === "function") themeDarkMedia.addEventListener("change", themeDarkCb);
				else if (typeof themeDarkMedia.addListener === "function") themeDarkMedia.addListener(themeDarkCb);
			}
		} catch {
			// ignore
		}
	}

	function stopThemeWatch() {
		if (themeObserver !== null) {
			themeObserver.disconnect();
			themeObserver = null;
		}
		if (themeDarkMedia !== null && themeDarkCb !== null) {
			if (typeof themeDarkMedia.removeEventListener === "function") themeDarkMedia.removeEventListener("change", themeDarkCb);
			else if (typeof themeDarkMedia.removeListener === "function") themeDarkMedia.removeListener(themeDarkCb);
		}
		themeDarkMedia = null;
		themeDarkCb = null;
		if (themeRedrawTimer !== null) {
			window.clearTimeout(themeRedrawTimer);
			themeRedrawTimer = null;
		}
	}

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
			pendingOp = null;
			pendingTipShown = false;
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

	window.addEventListener("resize", relayoutCanvas, { passive: true });
	// 仅观察结构性变化（新增消息行 / turn-tail 出现），用于「发送消息」「LLM 回复完成」；
	// 不观察 characterData，避免流式输出期间高频触发。
	const observer = new MutationObserver(() => {
		ensurePanel();
		scheduleLoad();
	});
	observer.observe(document.body, { childList: true, subtree: true });
	startThemeWatch();
	load();

	return () => {
		disposed = true;
		if (debounce !== null) window.clearTimeout(debounce);
		if (typeof unsubList === "function") unsubList();
		if (typeof unsubInst === "function") unsubInst();
		window.removeEventListener("resize", relayoutCanvas);
		observer.disconnect();
		stopThemeWatch();
		removePanel();
	};
}
