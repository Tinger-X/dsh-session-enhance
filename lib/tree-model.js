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

/** 解析 JSONL 文本为 { header, events }；events 的 seq 归一化为数组下标。 */
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

/** 把一个分支的 turns（深度从 startDepth 起）追加进 nodes，返回 { lastId, lastDepth }。 */
function appendBranchTurns(nodes, turns, branchId, startDepth, active, parentOfFirst) {
	let lastId = parentOfFirst ?? null;
	let depth = startDepth;
	for (const turn of turns) {
		const parent = depth === 1 ? null : lastId;
		const id = pushNode(nodes, nodeId(branchId, depth), parent, depth, turn.userText, branchId, active);
		lastId = id;
		depth += 1;
	}
	return { lastId, lastDepth: depth - 1 };
}

/**
 * 投影树：主干事件（活动分支）+ sidecar（游离分支）。
 * 返回：
 * - nodes: [{ id, parentId, depth, userText, branchId, active }]
 * - activePath: 从根到活动叶子节点的 id 序列
 * - branches: sidecar 分支元数据（附 forkNodeId）
 * - forks: { [nodeId]: [{ branchId, name }] } 每个分叉节点的子分支列表
 */
export function buildTree(events, sidecar) {
	sidecar = normalizeSidecar(sidecar, sidecar?.sessionId ?? "");
	const nodes = [];
	const byId = new Map();

	const activeTurns = closedTurns(events);
	const activeBranch = sidecar.activeBranchId;
	const activeResult = appendBranchTurns(nodes, activeTurns, activeBranch, 1, true, null);

	// 活动分支自身的链路即当前路径。
	const activePath = [];
	{
		let cursor = activeResult.lastId;
		while (cursor !== null) {
			activePath.unshift(cursor);
			const node = nodes.find((n) => n.id === cursor);
			cursor = node ? node.parentId : null;
		}
	}

	for (const item of sidecar.detached ?? []) {
		const branchId = typeof item.branchId === "string" ? item.branchId : "";
		const branch = (sidecar.branches ?? []).find((b) => b.id === branchId);
		const forkDepth = Number.isSafeInteger(branch?.forkDepth) ? branch.forkDepth : 0;
		const parentBranchId = branch?.parentBranchId ?? activeBranch;
		const forkNodeId = forkDepth === 0 ? null : nodeId(parentBranchId, forkDepth);
		const turns = closedTurns(Array.isArray(item.events) ? item.events : []);
		appendBranchTurns(nodes, turns, branchId, forkDepth + 1, false, forkNodeId);
	}

	for (const node of nodes) byId.set(node.id, node);

	const branchesById = new Map((sidecar.branches ?? []).map((b) => [b.id, b]));
	const branchOrder = new Map((sidecar.branches ?? []).map((b, index) => [b.id, index]));

	// 直接子节点按父节点归组，用于计算每个节点的可选分支。
	const childrenByParent = new Map();
	for (const node of nodes) {
		if (node.parentId === null) continue;
		if (!childrenByParent.has(node.parentId)) childrenByParent.set(node.parentId, []);
		childrenByParent.get(node.parentId).push(node);
	}

	// 每个分叉节点：可选分支列表 + 当前分支下标。
	const branchPoints = {};
	const activeIndexById = new Map(activePath.map((id, index) => [id, index]));
	for (const node of nodes) {
		const children = childrenByParent.get(node.id) ?? [];
		const branchIds = [...new Set(children.map((child) => child.branchId))];
		if (branchIds.length <= 1) continue;
		const selfIndex = activeIndexById.get(node.id);
		const nextActive = selfIndex === void 0 ? void 0 : activePath[selfIndex + 1];
		const activeBranchAt = nextActive === void 0 ? node.branchId : (byId.get(nextActive)?.branchId ?? node.branchId);
		const options = branchIds
			.map((branchId) => ({
				branchId,
				name: branchesById.get(branchId)?.name ?? branchId,
				active: branchId === activeBranchAt
			}))
			.sort((a, b) => (branchOrder.get(a.branchId) ?? 0) - (branchOrder.get(b.branchId) ?? 0));
		branchPoints[node.id] = {
			options,
			current: Math.max(0, options.findIndex((option) => option.active))
		};
	}

	return {
		nodes,
		activePath,
		branches: (sidecar.branches ?? []).map((b) => ({
			...b,
			forkNodeId: b.forkDepth === 0 ? null : nodeId(b.parentBranchId ?? activeBranch, b.forkDepth)
		})),
		activeBranchId: activeBranch,
		branchPoints
	};
}
