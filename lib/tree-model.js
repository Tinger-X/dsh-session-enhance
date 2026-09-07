/**
 * dsh-session-enhance 对话树纯函数层。
 *
 * 无 I/O、无 ctx：负责把事件流解析为闭合轮次（turn），并把「主干事件 + sidecar
 * 分支索引」投影为树（节点/边/当前路径）。sidecar 以纯 JSON 对象进出，落盘由
 * 上层（lib/domains/tree.js）负责。
 *
 * 模型约定：
 * - 节点 = 一个用户轮次（turn/start..turn/end 中的 user 消息与其 LLM 回复），
 *   不单独成节点；LLM 回复并入所属用户节点。
 * - 节点 id = `${branchId}:${depth}`，其中 depth 为从根算起的绝对轮次序号（1 起）。
 *   分支 id 稳定，因此节点 id 在分支切换 / 重生成后依旧稳定。
 * - 主干 `session.jsonl.zstd` 始终是当前活动分支的合法线性日志；sidecar 只保存
 *   非活动分支的游离事件段（detached）与分支元数据，现有线性解析器完全忽略。
 */

import { randomUUID } from "node:crypto";

/** 解析 `${branchId}:${depth}`。 */
function parseNodeIdStr(nodeId) {
	const index = String(nodeId).lastIndexOf(":");
	if (index <= 0) throw new Error(`invalid node id "${nodeId}"`);
	const depth = Number.parseInt(String(nodeId).slice(index + 1), 10);
	if (!Number.isSafeInteger(depth) || depth < 1) throw new Error(`invalid node id "${nodeId}"`);
	return { branchId: String(nodeId).slice(0, index), depth };
}

/** 主干中 depth 之前的闭合边界（seq）。返回 -1 表示仅保留 header。 */
function boundaryBefore(turns, depth) {
	if (depth <= 1) {
		const first = turns[0];
		return first === void 0 ? -1 : first.startSeq - 1;
	}
	const prev = turns[depth - 2];
	return prev === void 0 || prev.endSeq === void 0 ? -1 : prev.endSeq;
}

/**
 * 解析 JSONL 文本为 { header, events }；events 的 seq 归一化为数组下标。 */
export function parseLog(text) {
	const lines = String(text).split(/\r?\n/).filter((line) => line.trim().length > 0);
	if (lines.length === 0) throw new Error("empty session log");
	const header = JSON.parse(lines[0]);
	const events = lines.slice(1).map((line) => JSON.parse(line));
	events.forEach((event, index) => {
		event.seq = index;
	});
	return { header, events };
}

/** 把 { header, events } 序列化回 JSONL 文本（seq 已在 events 上）。 */
export function serializeLog(header, events) {
	const parts = [JSON.stringify(header)];
	for (const event of events) parts.push(JSON.stringify(event));
	return parts.join("\n") + "\n";
}

/** 取消息（user/message 或 assistant/message）的纯文本内容。 */
export function messageText(message) {
	const content = message?.content;
	if (!Array.isArray(content)) return "";
	return content.filter((block) => block?.type === "text").map((block) => block.text ?? "").join("");
}

/**
 * 把事件流解析为闭合轮次。返回 { turn, startSeq, endSeq, userEventSeq, userText, closed }。
 * 只有 user/message（source.kind === "user"）才作为用户消息；system 注入的
 * user/message（runtime context 等）不视为用户消息。
 */
export function closedTurns(events) {
	const turns = [];
	let current = null;
	for (const event of events) {
		if (event.type === "turn/start") {
			current = {
				turn: event.data?.turn,
				startSeq: event.seq,
				endSeq: void 0,
				userEventSeq: void 0,
				userText: "",
				closed: false
			};
			continue;
		}
		if (current === null) continue;
		if (event.type === "user/message" && event.data?.source?.kind === "user" && current.userEventSeq === void 0) {
			current.userEventSeq = event.seq;
			current.userText = messageText(event.data);
			continue;
		}
		if (event.type === "turn/end" && event.data?.turn === current.turn) {
			current.endSeq = event.seq;
			current.closed = true;
			turns.push(current);
			current = null;
		}
	}
	if (current !== null) turns.push(current);
	return turns;
}

/** 是否正在生成：最近一轮尚未 turn/end 闭合（open turn）。读取 events 即可判定，无需宿主 API。 */
export function isGenerating(events) {
	const turns = closedTurns(events);
	return turns.length > 0 && turns[turns.length - 1].closed === false;
}

/** 新建空 sidecar。 */
export function emptySidecar(sessionId) {
	return {
		version: 1,
		sessionId,
		activeBranchId: "root",
		branches: [
			{ id: "root", parentBranchId: null, forkDepth: 0, name: "主分支", createdAt: 0 }
		],
		detached: []
	};
}

/** 归一化 sidecar：缺字段回退，兼容损坏/空值。 */
export function normalizeSidecar(sidecar, sessionId) {
	if (sidecar === null || sidecar === void 0 || typeof sidecar !== "object") return emptySidecar(sessionId);
	const branches = Array.isArray(sidecar.branches) ? sidecar.branches : [];
	const detached = Array.isArray(sidecar.detached) ? sidecar.detached : [];
	return {
		version: 1,
		sessionId,
		activeBranchId: typeof sidecar.activeBranchId === "string" ? sidecar.activeBranchId : "root",
		branches: branches.length > 0 ? branches : emptySidecar(sessionId).branches,
		detached
	};
}

function nodeId(branchId, depth) {
	return `${branchId}:${depth}`;
}

function pushNode(nodes, id, parentId, depth, userText, branchId, active) {
	nodes.push({
		id,
		parentId,
		depth,
		userText: userText ?? "",
		branchId,
		active: active === true
	});
	return id;
}

/** 把一个分支的 turns（深度从 startDepth 起）追加进 nodes，返回 { lastId, lastDepth }。
 *  existingIds 用于跨段去重：已存在的 node id 跳过创建，但 lastId 仍前进，保证后续 parent 链正确。 */
function appendBranchTurns(nodes, turns, branchId, startDepth, active, parentOfFirst, existingIds) {
	let lastId = parentOfFirst ?? null;
	let depth = startDepth;
	for (const turn of turns) {
		const parent = depth === 1 ? null : lastId;
		const id = nodeId(branchId, depth);
		if (existingIds === void 0 || !existingIds.has(id)) {
			pushNode(nodes, id, parent, depth, turn.userText, branchId, active);
			if (existingIds !== void 0) existingIds.add(id);
		}
		lastId = id;
		depth += 1;
	}
	return { lastId, lastDepth: depth - 1 };
}

/** 活动分支的祖先链（根 → … → 活动），用于按「创建分支」归属活动主干的前缀轮次。 */
function ancestorChain(activeBranchId, branches) {
	const byId = new Map((branches ?? []).map((b) => [b.id, b]));
	const chain = [];
	let cursor = activeBranchId;
	let guard = 0;
	while (cursor !== null && cursor !== void 0 && guard < 1000) {
		const branch = byId.get(cursor);
		if (branch === void 0) break;
		chain.unshift(branch);
		cursor = branch.parentBranchId ?? null;
		guard += 1;
	}
	return chain;
}

/** 给定绝对深度，返回该轮次的「创建分支」（祖先链上 forkDepth 区间命中的分支）。 */
function owningBranchForDepth(depth, chain, totalTurns) {
	for (let index = 0; index < chain.length; index += 1) {
		const start = (chain[index].forkDepth ?? 0) + 1;
		const end = index + 1 < chain.length ? (chain[index + 1].forkDepth ?? 0) : totalTurns;
		if (depth >= start && depth <= end) return chain[index];
	}
	return chain[chain.length - 1];
}

/**
 * 投影树：主干事件（活动分支）+ sidecar（游离分支）。
 * 节点 id = `${branchId}:${depth}`，其中 branchId 是「创建该轮次的分支」——活动主干
 * 的前缀轮次归属祖先分支（而非活动分支），故分支切换后节点 id 与树结构稳定不变，
 * 仅高亮（activePath）随活动分支移动。返回：
 * - nodes: [{ id, parentId, depth, userText, branchId, active }]
 * - activePath: 从根到活动叶子节点的 id 序列
 * - branches: sidecar 分支元数据（附 forkNodeId）
 * - branchPoints: { [nodeId]: { options, current } } 每个分叉子节点的分支列表
 */
export function buildTree(events, sidecar) {
	sidecar = normalizeSidecar(sidecar, sidecar?.sessionId ?? "");
	const branches = sidecar.branches ?? [];
	const nodes = [];
	const existingIds = new Set();

	const activeTurns = closedTurns(events);
	const activeBranch = sidecar.activeBranchId;
	const chain = ancestorChain(activeBranch, branches);
	if (chain.length === 0) chain.push({ id: activeBranch, parentBranchId: null, forkDepth: 0 });
	const totalTurns = activeTurns.length;

	// 活动主干按「创建分支」分段投影，跨段去重；段间 parent 链接（前段末节点 = 后段首父）。
	let activeTrunkLastId = null;
	let segStart = 0;
	while (segStart < activeTurns.length) {
		const owner = owningBranchForDepth(segStart + 1, chain, totalTurns);
		let segEnd = segStart;
		while (segEnd < activeTurns.length && owningBranchForDepth(segEnd + 1, chain, totalTurns).id === owner.id) segEnd += 1;
		const res = appendBranchTurns(nodes, activeTurns.slice(segStart, segEnd), owner.id, segStart + 1, false, segStart === 0 ? null : activeTrunkLastId, existingIds);
		activeTrunkLastId = res.lastId;
		segStart = segEnd;
	}

	// 活动分支自身的链路即当前路径。
	const activePath = [];
	{
		let cursor = activeTrunkLastId;
		while (cursor !== null && cursor !== void 0) {
			activePath.unshift(cursor);
			const node = nodes.find((n) => n.id === cursor);
			cursor = node ? node.parentId : null;
		}
	}

	// 活动路径上的节点（含来自游离段的共享前缀节点）标记 active。
	const activeSet = new Set(activePath);
	for (const node of nodes) node.active = activeSet.has(node.id);

	for (const item of sidecar.detached ?? []) {
		const branchId = typeof item.branchId === "string" ? item.branchId : "";
		const branch = branches.find((b) => b.id === branchId);
		const forkDepth = Number.isSafeInteger(branch?.forkDepth) ? branch.forkDepth : 0;
		const parentBranchId = branch?.parentBranchId ?? activeBranch;
		const forkNodeId = forkDepth === 0 ? null : nodeId(parentBranchId, forkDepth);
		const turns = closedTurns(Array.isArray(item.events) ? item.events : []);
		appendBranchTurns(nodes, turns, branchId, forkDepth + 1, false, forkNodeId, existingIds);
	}

	const branchesById = new Map(branches.map((b) => [b.id, b]));
	const branchOrder = new Map(branches.map((b, index) => [b.id, index]));

	// 直接子节点按父节点归组，用于计算每个节点的可选分支。
	const childrenByParent = new Map();
	for (const node of nodes) {
		if (node.parentId === null) continue;
		if (!childrenByParent.has(node.parentId)) childrenByParent.set(node.parentId, []);
		childrenByParent.get(node.parentId).push(node);
	}

	// 每个分叉节点：可选分支列表 + 当前分支下标。
	// 分支切换控件应出现在「分叉的实际节点」（depth = forkDepth + 1）而非分叉父节点，
	// 故以每个分叉子节点为键：同一分叉下每个分支各一条，current 即该子节点在分支列表中的下标。
	const branchPoints = {};
	for (const node of nodes) {
		const children = childrenByParent.get(node.id) ?? [];
		const branchIds = [...new Set(children.map((child) => child.branchId))];
		if (branchIds.length <= 1) continue;
		const options = branchIds
			.map((branchId) => ({
				branchId,
				name: branchesById.get(branchId)?.name ?? branchId
			}))
			.sort((a, b) => (branchOrder.get(a.branchId) ?? 0) - (branchOrder.get(b.branchId) ?? 0));
		for (const child of children) {
			branchPoints[child.id] = {
				options: options.map((option) => ({ ...option, active: option.branchId === child.branchId })),
				current: Math.max(0, options.findIndex((option) => option.branchId === child.branchId))
			};
		}
	}

	return {
		nodes,
		activePath,
		branches: branches.map((b) => ({
			...b,
			forkNodeId: b.forkDepth === 0 ? null : nodeId(b.parentBranchId ?? activeBranch, b.forkDepth)
		})),
		activeBranchId: activeBranch,
		branchPoints
	};
}

/**
 * 自愈分支链接：把每条非 root 分支的 parentBranchId 改为「声明祖先链上、实际发射出
 * forkDepth 节点」的最近分支。分支元数据若指向了根本不存在对应深度节点的分支（如深分支
 * 在更早轮次重生成后产生的不可达链，或父分支内容被移走），会在投影中形成悬空孤儿——
 * 这里以 buildTree 实际存在的节点为基准重连，不改 forkDepth、不动 detached 内容。
 * 幂等；输入不被修改，返回归一化后的新 sidecar。 */
export function healBranchLinks(sidecar, events) {
	sidecar = normalizeSidecar(sidecar, sidecar?.sessionId ?? "");
	const branches = sidecar.branches ?? [];
	const byId = new Map(branches.map((b) => [b.id, b]));
	const projected = buildTree(events, sidecar);
	const emit = new Set(projected.nodes.map((n) => n.id));

	const healed = branches.map((branch) => {
		const original = branch.parentBranchId ?? null;
		if (original === null) return { ...branch };
		let target = null;
		let cursor = original;
		let guard = 0;
		while (cursor !== null && cursor !== void 0 && guard < 1000) {
			if (emit.has(`${cursor}:${branch.forkDepth}`)) {
				target = cursor;
				break;
			}
			const meta = byId.get(cursor);
			cursor = meta ? (meta.parentBranchId ?? null) : null;
			guard += 1;
		}
		// 声明祖先链断裂到顶仍无归属时，回退到 root（只要 root 确实拥有该深度）。
		if (target === null && branch.forkDepth >= 1 && emit.has(`root:${branch.forkDepth}`)) target = "root";
		return target !== null && target !== original ? { ...branch, parentBranchId: target } : { ...branch };
	});

	return {
		version: 1,
		sessionId: sidecar.sessionId,
		activeBranchId: sidecar.activeBranchId,
		branches: healed,
		detached: sidecar.detached
	};
}

/**
 * 重生成的纯记账：在活动分支上重新生成深度 depth 的节点，返回截断后的主干事件与新 sidecar。
 *
 * 安全边界：仅当被重生成节点**下方没有任何已分叉的子分支**（无需折入/改写任何既有分支，
 * 即旧延续在旧主干尾部内、可整段平移给新分支）时才执行；否则抛错拒绝，绝不产生悬空或丢内容。
 * 新分支挂到「拥有 depth-1 轮次」的分支（稳定 owner 语义），并清除该 owner 改挂活动时残留的
 * detached（避免活动分支同时拥有 detached 的重复态——那正是切换分支丢分支的直接根因）。
 * 返回 { keptEvents, boundary, branchId, sidecar }。 */
export function planRegenerate(events, sidecar, nodeId) {
	const { branchId: ownerId, depth } = parseNodeIdStr(nodeId);
	const turns = closedTurns(events);
	const totalTurns = turns.length;
	const turn = turns[depth - 1];
	if (turn === void 0 || turn.userEventSeq === void 0) throw new Error(`node "${nodeId}" is not a regenerable user turn`);
	if (depth > totalTurns) throw new Error(`node "${nodeId}" is not on the active branch`);

	const oldActive = sidecar.activeBranchId;
	const chain = ancestorChain(oldActive, sidecar.branches ?? []);
	const owner = owningBranchForDepth(depth, chain, totalTurns).id; // 拥有该轮次的稳定分支
	if (ownerId !== owner) throw new Error(`node "${nodeId}" is not owned by its branch in the active lineage`);
	const forkDepth = Math.max(0, depth - 1);
	const parentOwner = forkDepth === 0 ? null : owningBranchForDepth(depth - 1, chain, totalTurns).id;
	const boundary = boundaryBefore(turns, depth);
	const keptEvents = events.slice(0, boundary + 1);
	const tail = events.slice(boundary + 1);

	const branches = (sidecar.branches ?? []).map((b) => ({ ...b }));
	const branchId = randomUUID();
	branches.push({ id: branchId, parentBranchId: parentOwner, forkDepth, name: `分支 ${branches.length + 1}`, createdAt: Date.now() });
	// 需要折入的既有分支：fork 落在被回退区域、父为 owner（或其下被溶分支）。
	// 安全策略：一旦存在就拒绝——说明重生成会在带深层子分支的历史上改写，本模型无法无损重接。
	for (const b of branches) {
		if (b.id !== branchId && b.parentBranchId === owner && b.forkDepth >= depth) {
			throw new Error(`cannot regenerate "${nodeId}": child branches fork below it (unsafe subtree rewrite)`);
		}
	}
	const detached = (sidecar.detached ?? [])
		.filter((d) => d.branchId !== owner) // owner 将成为活动分支，不得再保留 detached
		.map((d) => ({ ...d, events: d.events }));
	detached.push({ branchId, events: tail, createdAt: Date.now() });

	const next = {
		version: 1,
		sessionId: sidecar.sessionId,
		activeBranchId: owner,
		branches,
		detached
	};
	return { keptEvents, boundary, branchId, sidecar: next };
}
