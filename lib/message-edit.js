//#region lib/types/message-edit.js
/**
 * dsh-session-enhance 消息编辑宿主半边（合并自 dsh-message-edit）。
 *
 * 提供回合原子分支（edit / retry / reroll）与结构可逆版本：
 * - `POST /message-edit`：执行一次版本操作，创建携带
 *   `message-edit/version` 种子事件的子会话（同一祖先边界，可逆）；
 * - `GET /message-edit?sessionId=...`：返回完整版本树时间线投影
 *   （可编辑消息块、可重试回合、版本列表、undo/redo 栈）。
 *
 * 路由注册在 `~/...` 宿主 webServer 上，路径与 dsh-message-edit 保持
 * 一致（`/message-edit`），浏览器半区（lib/client.js 中的合并 bundle）
 * 与既有数据（会话日志中的 `message-edit/version` 事件）完全兼容。
 *
 * 安全/一致性约定：
 * - 会话不存在时返回 404（而非 409）：浏览器半区把 not-found 视为终态，
 *   不再重试；
 * - 版本读取对已消失的分支容错（被 dsh-session-enhance 删除的派生会话
 *   不会拖垮父会话自己的时间线）；
 * - 修复/回滚全部走会话日志事件，不落任何插件私有状态。
 */
/** Same-origin endpoint owned by the message-edit host row. */
const MESSAGE_EDIT_PATH = "/message-edit";
/** Current durable event schema for structurally paired version effects. */
const MESSAGE_EDIT_VERSION_SCHEMA = 2;
/** Stable Cordis plugin name (row display name). */
const name = "message-edit";
/** Public services used by the branch transaction and timeline projection. */
const inject = [
	"sessions",
	"agents",
	"sessionPersistence",
	"sessionQuery",
	"workspaceRegistry",
	"webServer"
];
/**
 * 结构性配对版本效果：正向效果（effect）与逆（inverse）同时生成，
 * 逆引用源会话，恢复版本即回溯到源会话。
 */
function pairVersionEffect(sourceSessionId, effect) {
	return {
		schemaVersion: MESSAGE_EDIT_VERSION_SCHEMA,
		effect: { ...effect, id: crypto.randomUUID() },
		inverse: { kind: "restore-version", sessionId: sourceSessionId }
	};
}
/** 仅文本块（text / reasoning）可被编辑替换。 */
function isTextualBlock(block) {
	return block?.type === "text" || block?.type === "reasoning";
}
/** 用户消息的全部文本块拼接。 */
function userText(message) {
	return message.content
		.filter((block) => block.type === "text")
		.map((block) => block.text)
		.join("\n");
}
/** 克隆用户消息：新 id、冻结、可选新内容。 */
function cloneUser(message, content = structuredClone(message.content)) {
	return Object.freeze({
		id: crypto.randomUUID(),
		role: "user",
		content: Object.freeze(content),
		source: Object.freeze({ kind: "user" })
	});
}
/** 替换指定文本块，其余块深拷贝。 */
function replaceTextBlock(content, blockIndex, text) {
	const block = content[blockIndex];
	if (!isTextualBlock(block)) throw new Error("所选内容块不是可编辑文本。");
	return content.map((candidate, index) => index === blockIndex
		? { ...candidate, text }
		: structuredClone(candidate));
}
/** 折叠完整回合括号；开放尾部刻意缺席。 */
function closedTurns(events) {
	const result = [];
	let current;
	for (const event of events) {
		if (event.type === "turn/start") {
			current = {
				turn: event.data.turn,
				startSeq: event.seq,
				assistants: []
			};
			continue;
		}
		if (current === undefined) continue;
		if (event.type === "user/message"
			&& current.user === undefined
			&& event.data.source.kind === "user") {
			current.user = event;
			continue;
		}
		if (event.type === "assistant/message" && event.data.turn === current.turn) {
			current.assistants.push(event);
			continue;
		}
		if (event.type === "turn/end" && event.data.turn === current.turn) {
			result.push({ ...current, endSeq: event.seq });
			current = undefined;
		}
	}
	return result;
}
/** 可编辑消息块（用户文本块 + 助手文本/思考块）。 */
function editableMessages(turns) {
	const result = [];
	for (const turn of turns) {
		if (turn.user !== undefined) {
			for (const [blockIndex, block] of turn.user.data.content.entries()) {
				if (block.type !== "text") continue;
				result.push({
					key: `${String(turn.user.seq)}:${String(blockIndex)}`,
					turn: turn.turn,
					eventSeq: turn.user.seq,
					blockIndex,
					kind: "user",
					text: block.text,
					time: turn.user.time
				});
			}
		}
		for (const event of turn.assistants) {
			for (const [blockIndex, block] of event.data.message.content.entries()) {
				if (!isTextualBlock(block)) continue;
				result.push({
					key: `${String(event.seq)}:${String(blockIndex)}`,
					turn: turn.turn,
					eventSeq: event.seq,
					blockIndex,
					kind: block.type === "reasoning" ? "assistant.reasoning" : "assistant.response",
					text: block.text,
					time: event.time
				});
			}
		}
	}
	return result;
}
/** 可重放回合（有用户输入且已落定）。 */
function retryableTurns(turns) {
	return turns.flatMap((turn) => turn.user === undefined ? [] : [{
		turn: turn.turn,
		userEventSeq: turn.user.seq,
		preview: userText(turn.user.data),
		time: turn.user.time
	}]);
}
/** 目标回合之后的下游用户消息（preserve 级联用）。 */
function downstreamUsers(turns, start) {
	return turns.slice(start).flatMap((turn) => turn.user === undefined
		? []
		: [cloneUser(turn.user.data)]);
}
/** 助手消息替换：替换指定块后仅保留文本/思考块。 */
function assistantReplacement(event, blockIndex, text) {
	const replaced = replaceTextBlock(event.data.message.content, blockIndex, text)
		.filter((block) => block.type === "text" || block.type === "reasoning");
	return Object.freeze({
		id: crypto.randomUUID(),
		role: "assistant",
		content: Object.freeze(replaced),
		source: Object.freeze({
			kind: "model",
			provider: event.data.message.source.provider,
			model: event.data.message.source.model
		})
	});
}
/** 一次编辑操作的执行计划。 */
function editPlan(operation, turns) {
	const turnIndex = turns.findIndex((turn) => operation.eventSeq > turn.startSeq && operation.eventSeq < turn.endSeq);
	const turn = turns[turnIndex];
	if (turn === undefined) throw new Error("所选消息不属于已落定回合。");
	const event = turn.user?.seq === operation.eventSeq
		? turn.user
		: turn.assistants.find((candidate) => candidate.seq === operation.eventSeq);
	if (event === undefined) throw new Error("所选消息不存在或不可编辑。");

	if (event.type === "user/message") {
		const before = event.data.content[operation.blockIndex];
		if (before?.type !== "text") throw new Error("所选用户消息块不是文本。");
		const edited = cloneUser(event.data, replaceTextBlock(event.data.content, operation.blockIndex, operation.text));
		const later = operation.cascade === "preserve" ? downstreamUsers(turns, turnIndex + 1) : [];
		return {
			boundary: turn.startSeq - 1,
			version: pairVersionEffect(operation.sessionId, {
				operation: "edit",
				cascade: operation.cascade,
				targetTurn: turn.turn,
				targetEventSeq: event.seq,
				targetBlockIndex: operation.blockIndex,
				blockKind: "user",
				before: before.text,
				after: operation.text
			}),
			queuedUsers: [edited, ...later]
		};
	}

	const before = event.data.message.content[operation.blockIndex];
	if (!isTextualBlock(before)) throw new Error("所选助手消息块不是文本或思考。");
	const blockKind = before.type === "reasoning"
		? "assistant.reasoning"
		: "assistant.response";
	if (turn.user === undefined) throw new Error("所选助手消息没有可重建的用户输入。");
	return {
		boundary: turn.startSeq - 1,
		version: pairVersionEffect(operation.sessionId, {
			operation: "edit",
			cascade: operation.cascade,
			targetTurn: turn.turn,
			targetEventSeq: event.seq,
			targetBlockIndex: operation.blockIndex,
			blockKind,
			before: before.text,
			after: operation.text
		}),
		manualTurn: {
			turn: turn.turn,
			user: cloneUser(turn.user.data),
			assistant: assistantReplacement(event, operation.blockIndex, operation.text)
		},
		queuedUsers: operation.cascade === "preserve"
			? downstreamUsers(turns, turnIndex + 1)
			: []
	};
}
/** 重试计划：重放目标回合的用户输入。 */
function retryPlan(sessionId, turnNumber, cascade, turns) {
	const turnIndex = turns.findIndex((turn) => turn.turn === turnNumber);
	const turn = turns[turnIndex];
	if (turn?.user === undefined) throw new Error("所选回合没有可重放的用户输入。");
	return {
		boundary: turn.startSeq - 1,
		version: pairVersionEffect(sessionId, {
			operation: "retry",
			cascade,
			targetTurn: turn.turn,
			targetEventSeq: turn.user.seq
		}),
		queuedUsers: cascade === "preserve"
			? downstreamUsers(turns, turnIndex)
			: [cloneUser(turn.user.data)]
	};
}
/** 重新生成计划：最后一个含文本回复的回合。 */
function rerollPlan(sessionId, turns) {
	for (let index = turns.length - 1; index >= 0; index -= 1) {
		const turn = turns[index];
		if (turn?.user === undefined) continue;
		const target = turn.assistants.findLast((event) => event.data.message.content.some(isTextualBlock));
		if (target === undefined) continue;
		return {
			boundary: turn.startSeq - 1,
			version: pairVersionEffect(sessionId, {
				operation: "reroll",
				cascade: "truncate",
				targetTurn: turn.turn,
				targetEventSeq: target.seq
			}),
			queuedUsers: [cloneUser(turn.user.data)]
		};
	}
	throw new Error("当前会话没有可重生成的已落定助手回复。");
}
/** 按操作类型分发执行计划。 */
function planOperation(operation, events) {
	const turns = closedTurns(events);
	switch (operation.action) {
		case "edit":
			return editPlan(operation, turns);
		case "reroll":
			return rerollPlan(operation.sessionId, turns);
		case "retry":
			return retryPlan(operation.sessionId, operation.turn, operation.cascade, turns);
	}
}
/** 从会话历史解析模型路由（provider/model/maxTokens）。 */
function agentOptions(events, fallback) {
	const config = events.findLast((event) => event.type === "request/header")?.data.header.config;
	const provider = config?.provider ?? fallback?.provider;
	const model = config?.model ?? fallback?.model;
	if (provider === undefined || provider.length === 0 || model === undefined || model.length === 0) {
		throw new Error("无法从会话历史解析模型路由。");
	}
	const maxTokens = config?.maxTokens ?? fallback?.maxTokens;
	return {
		provider,
		model,
		...maxTokens === undefined ? {} : { maxTokens }
	};
}
/** 在源会话的 agent 上执行维护操作（可恢复已存在的 agent）。 */
async function withSourceAgent(ctx, sessionId, operation) {
	let handle;
	let agent = ctx.agents.get(sessionId);
	if (agent === undefined) {
		const snapshot = await ctx.sessionQuery.readSession(sessionId);
		handle = await ctx.agents.resume({
			resumeSessionId: sessionId,
			agentOptions: agentOptions(snapshot.events)
		});
		agent = handle.agent;
	}
	try {
		return await agent.runMaintenance(async () => operation(agent));
	} finally {
		await handle?.dispose();
	}
}
/** 继承种子：边界（含）之前的事件。 */
function inheritedSeed(source, boundary) {
	if (boundary === -1) return [];
	const boundaryEvent = source.events[boundary];
	if (boundary < 0 || boundaryEvent === undefined || boundaryEvent.seq !== boundary) {
		throw new Error("分支边界不是连续会话事件。");
	}
	return source.events.slice(0, boundary + 1);
}
/** 本地构建日志种子事件；插件自有事件必须带 ignorable 标记，
 * 否则持久化读路径会在重启后拒绝整个日志。 */
function appendLogSeedEvent(events, type, data) {
	events.push({
		type,
		seq: events.length,
		time: Date.now(),
		data,
		...type.startsWith("message-edit/") ? { ignorable: true } : {}
	});
}
/** 本地构建表面种子事件（携带 surfaceOp 意图）。 */
function appendSurfaceSeedEvent(events, type, data, intent) {
	events.push({
		type,
		seq: events.length,
		time: Date.now(),
		data,
		surfaceOp: intent.surfaceOp,
		...intent.sourceEventSeqs === undefined ? {} : { sourceEventSeqs: intent.sourceEventSeqs }
	});
}
/** 手动回合种子：turn/start + user + step + assistant + turn/end。 */
function appendManualTurn(events, manual) {
	const { turn, user, assistant } = manual;
	appendLogSeedEvent(events, "turn/start", { turn });
	appendSurfaceSeedEvent(events, "user/message", user, { surfaceOp: "append" });
	appendLogSeedEvent(events, "step/start", { turn, step: 1 });
	appendSurfaceSeedEvent(events, "assistant/message", { turn, step: 1, message: assistant }, {
		surfaceOp: "append",
		sourceEventSeqs: []
	});
	appendLogSeedEvent(events, "step/end", { turn, step: 1 });
	appendLogSeedEvent(events, "turn/end", { turn, reason: { kind: "completed" } });
}
/** 版本种子：继承 + version 事件 + 可选手动回合。 */
function versionSeed(source, plan) {
	const events = inheritedSeed(source, plan.boundary);
	const inheritedLength = events.length;
	appendLogSeedEvent(events, "message-edit/version", plan.version);
	if (plan.manualTurn !== undefined) appendManualTurn(events, plan.manualTurn);
	return { events, inheritedLength };
}
/** 源会话最近一次选择的 agent preset。 */
function sessionPreset(session) {
	for (let index = session.events.length - 1; index >= 0; index -= 1) {
		const event = session.events[index];
		if (event?.type === "agent-preset/selected") return event.data.agentPreset;
	}
	return session.header.agentPreset;
}
/** 创建版本子会话（种子 + 可选 preset 挂载），落盘失败时回收。 */
async function createVersionAgent(ctx, source, childId, plan, options) {
	const seed = versionSeed(source, plan);
	const presets = ctx.get("agentPresets");
	const presetId = sessionPreset(source);
	let agentPreset;
	let setup;
	if (presets !== undefined && presetId !== undefined) {
		const resolved = (await presets.resolve(presetId)).id;
		agentPreset = resolved;
		setup = async (agentCtx) => { await presets.mount(agentCtx, resolved); };
	}
	const child = await ctx.agents.create({
		sessionId: childId,
		seed: seed.events,
		meta: {
			...source.header.cwd === undefined ? {} : { cwd: source.header.cwd },
			parentSession: source.id,
			seedLength: seed.inheritedLength,
			...agentPreset === undefined ? {} : { agentPreset }
		},
		agentOptions: options,
		...setup === undefined ? {} : { setup }
	});
	try {
		await ctx.sessions.flush(child.agent.session);
		return child;
	} catch (error) {
		await child.dispose();
		throw error;
	}
}
/** 源会话所属工作区（若有）。 */
function sourceWorkspace(ctx, sessionId) {
	return ctx.workspaceRegistry.list().find((workspace) => workspace.sessionIds.includes(sessionId));
}
/** 逆操作回滚（逆序执行，全部失败才聚合抛出）。 */
async function recoverOperation(inverses) {
	const failures = [];
	for (const inverse of inverses.reverse()) {
		try {
			await inverse();
		} catch (error) {
			failures.push(error);
		}
	}
	if (failures.length > 0) throw new AggregateError(failures, "版本操作恢复失败。");
}
/** 执行一次版本操作：创建子会话、可选挂载工作区、入队下游用户消息。 */
async function runOperation(ctx, operation) {
	const sourceId = sessionIdOf(operation.sessionId);
	return withSourceAgent(ctx, sourceId, async (source) => {
		const childId = sessionIdOf(`session-${crypto.randomUUID()}`);
		const inverses = [];
		try {
			const events = source.session.events;
			const plan = planOperation(operation, events);
			const options = agentOptions(events, source.options);
			const child = await createVersionAgent(ctx, source.session, childId, plan, options);
			inverses.push(() => child.dispose());

			const workspace = sourceWorkspace(ctx, sourceId);
			if (workspace !== undefined) {
				await workspace.attachSession(childId);
				inverses.push(() => workspace.detachSession(childId));
			}
			for (const message of plan.queuedUsers) child.agent.followup(message);

			inverses.length = 0;
			return { sessionId: childId, queuedTurns: plan.queuedUsers.length };
		} catch (error) {
			try {
				await recoverOperation(inverses);
			} catch (recoveryError) {
				throw new AggregateError([error, recoveryError], "版本操作及其恢复均失败。");
			}
			throw error;
		}
	});
}
/** 会话自身的版本效果投影（含旧格式兼容）。 */
function ownVersionEvent(header, events) {
	const inherited = header.seedLength ?? 0;
	const ownEvents = events.filter((event) => (
		event.type === "message-edit/version" && event.seq >= inherited
	));
	if (ownEvents.length === 0) return undefined;
	if (ownEvents.length > 1) {
		throw new Error(`会话 ${header.id} 包含多个自身版本效果。`);
	}
	const event = ownEvents[0];
	if (event === undefined) return undefined;
	const parent = header.parentSession;
	if ("schemaVersion" in event.data) {
		const version = event.data;
		if (version.schemaVersion !== MESSAGE_EDIT_VERSION_SCHEMA) {
			throw new Error(`会话 ${header.id} 使用不支持的版本效果结构。`);
		}
		if (version.inverse.kind !== "restore-version"
			|| parent === undefined
			|| version.inverse.sessionId !== parent) {
			throw new Error(`会话 ${header.id} 的版本效果与逆不匹配。`);
		}
		return { effect: version.effect, inverseSessionId: version.inverse.sessionId, time: event.time };
	}

	const legacy = event.data;
	if (parent === undefined || legacy.sourceSessionId !== parent) {
		throw new Error(`会话 ${header.id} 的旧版恢复目标与父版本不匹配。`);
	}
	return {
		effect: {
			id: `legacy:${header.id}:${String(event.seq)}`,
			operation: legacy.operation,
			cascade: legacy.cascade,
			targetTurn: legacy.targetTurn,
			targetEventSeq: legacy.targetEventSeq,
			...legacy.targetBlockIndex === undefined ? {} : { targetBlockIndex: legacy.targetBlockIndex },
			...legacy.blockKind === undefined ? {} : { blockKind: legacy.blockKind },
			...legacy.before === undefined ? {} : { before: legacy.before },
			...legacy.after === undefined ? {} : { after: legacy.after }
		},
		inverseSessionId: legacy.sourceSessionId,
		time: event.time
	};
}
/** 谱系扁平化（创建时间 + id 稳定排序）。 */
function flattenLineage(root, descendants) {
	const result = [{ record: root, depth: 0 }];
	const visit = (nodes, depth) => {
		const ordered = [...nodes].sort((left, right) => (
			left.session.header.createdAt - right.session.header.createdAt
			|| String(left.session.header.id).localeCompare(String(right.session.header.id))
		));
		for (const node of ordered) {
			result.push({ record: node.session, depth });
			visit(node.descendants, depth + 1);
		}
	};
	visit(descendants, 1);
	return result;
}
/** 并行谱系读取并发上限。 */
const TIMELINE_READ_CONCURRENCY = 4;
/** 有界并行映射。 */
async function mapConcurrent(items, worker) {
	const results = new Array(items.length);
	let cursor = 0;
	const run = async () => {
		for (;;) {
			const index = cursor;
			cursor += 1;
			if (index >= items.length) return;
			results[index] = await worker(items[index]);
		}
	};
	const workers = Math.min(TIMELINE_READ_CONCURRENCY, items.length);
	await Promise.all(Array.from({ length: workers }, () => run()));
	return results;
}
/** 目标会话完整日志：实时借用 → 持久化 inspect → 查询回退。 */
async function readCurrentLog(ctx, sessionId) {
	const live = ctx.sessions.get(sessionId);
	if (live !== undefined) return live.events;
	const persistence = ctx.get("sessionPersistence");
	if (persistence !== undefined) return (await persistence.inspect(sessionId)).events;
	return (await ctx.sessionQuery.readSession(sessionId)).events;
}
/** 谱系节点自身的版本日志（从种子边界起读）。 */
async function versionLog(ctx, record) {
	const inherited = record.header.seedLength ?? 0;
	const live = ctx.sessions.get(record.header.id);
	if (live !== undefined) return live.events.slice(inherited);
	const persistence = ctx.get("sessionPersistence");
	if (persistence !== undefined) return (await persistence.readFrom(record.header.id, inherited)).events;
	return (await ctx.sessionQuery.readSession(record.header.id)).events.slice(inherited);
}
/** 完整版本树时间线投影。 */
async function timeline(ctx, sessionId) {
	const targetTrace = await ctx.sessionQuery.traceSession(sessionId);
	const rootId = targetTrace.complete
		? targetTrace.root.header.id
		: targetTrace.ancestors.at(-1)?.header.id ?? sessionId;
	const rootTrace = rootId === sessionId ? targetTrace : await ctx.sessionQuery.traceSession(rootId);
	const lineage = flattenLineage(rootTrace.target, rootTrace.descendants);
	const logs = await mapConcurrent(lineage, async ({ record }) => {
		if (record.header.id === sessionId) return readCurrentLog(ctx, sessionId);
		if (record.header.parentSession === undefined) return [];
		try {
			return await versionLog(ctx, record);
		} catch {
			// 谱系扫描与读取之间分支被删除（或由其他工具移除）：
			// 不能因此拖垮存活会话自己的时间线。
			return [];
		}
	});
	const recordsById = new Map(lineage.map(({ record }) => [record.header.id, record]));
	const currentPath = new Set();
	let pathId = sessionId;
	while (pathId !== undefined && !currentPath.has(pathId)) {
		currentPath.add(pathId);
		pathId = recordsById.get(pathId)?.header.parentSession;
	}

	const versions = lineage.map(({ record, depth }, index) => {
		const version = ownVersionEvent(record.header, logs[index] ?? []);
		return {
			sessionId: record.header.id,
			...record.header.parentSession === undefined ? {} : { parentSessionId: record.header.parentSession },
			...version === undefined ? {} : {
				effectId: version.effect.id,
				inverseSessionId: version.inverseSessionId
			},
			createdAt: version?.time ?? record.header.createdAt,
			depth,
			current: record.header.id === sessionId,
			onCurrentEffectPath: currentPath.has(record.header.id),
			...version === undefined ? {} : {
				operation: version.effect.operation,
				cascade: version.effect.cascade,
				targetTurn: version.effect.targetTurn,
				...version.effect.blockKind === undefined ? {} : { blockKind: version.effect.blockKind },
				...version.effect.before === undefined ? {} : { before: version.effect.before },
				...version.effect.after === undefined ? {} : { after: version.effect.after }
			}
		};
	});
	const effectIds = new Set();
	for (const version of versions) {
		if (version.effectId === undefined) continue;
		if (effectIds.has(version.effectId)) throw new Error(`版本效果 ${version.effectId} 重复。`);
		effectIds.add(version.effectId);
	}

	const versionsById = new Map(versions.map((version) => [version.sessionId, version]));
	const undoStack = [];
	let undoCursor = versionsById.get(sessionId);
	while (undoCursor?.inverseSessionId !== undefined) {
		const inverseId = undoCursor.inverseSessionId;
		if (undoStack.includes(inverseId)) throw new Error("版本效果逆链包含循环。");
		if (!versionsById.has(inverseId)) throw new Error(`恢复目标 ${inverseId} 不在可见版本树中。`);
		undoStack.push(inverseId);
		undoCursor = versionsById.get(inverseId);
	}
	const redoSessionIds = versions
		.filter((version) => version.inverseSessionId === sessionId)
		.map((version) => version.sessionId);

	const currentIndex = versions.findIndex((version) => version.current);
	const currentLog = logs[currentIndex];
	if (currentIndex < 0 || currentLog === undefined) throw new Error("当前版本不在版本树中。");
	const turns = closedTurns(currentLog);
	return {
		sessionId,
		messages: editableMessages(turns),
		retryableTurns: retryableTurns(turns),
		versions,
		undoStack,
		redoSessionIds
	};
}
/** 请求体必须是 JSON 对象。 */
function objectValue(value) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		throw new TypeError("请求体必须是 JSON 对象。");
	}
	return value;
}
/** sessionId 必须是非空字符串。 */
function sessionIdOf(value) {
	if (typeof value !== "string" || value.length === 0) throw new TypeError("sessionId 必须是非空字符串。");
	return value;
}
/** 非负安全整数。 */
function integerOf(value, field) {
	if (!Number.isSafeInteger(value) || value < 0) {
		throw new TypeError(`${field} 必须是非负安全整数。`);
	}
	return value;
}
/** cascade 必须是 truncate 或 preserve。 */
function cascadeOf(value) {
	if (value !== "truncate" && value !== "preserve") throw new TypeError("cascade 必须是 truncate 或 preserve。");
	return value;
}
/** 解码并校验一次版本操作。 */
function decodeOperation(value) {
	const record = objectValue(value);
	const sessionId = sessionIdOf(record["sessionId"]);
	switch (record["action"]) {
		case "edit":
			if (typeof record["text"] !== "string") throw new TypeError("text 必须是字符串。");
			return {
				action: "edit",
				sessionId,
				eventSeq: integerOf(record["eventSeq"], "eventSeq"),
				blockIndex: integerOf(record["blockIndex"], "blockIndex"),
				text: record["text"],
				cascade: cascadeOf(record["cascade"])
			};
		case "reroll":
			return { action: "reroll", sessionId };
		case "retry":
			return {
				action: "retry",
				sessionId,
				turn: integerOf(record["turn"], "turn"),
				cascade: cascadeOf(record["cascade"])
			};
		default:
			throw new TypeError("action 必须是 edit、reroll 或 retry。");
	}
}
/** 读取请求体 JSON。 */
function requestJson(request) {
	return new Promise((resolve, reject) => {
		const decoder = new TextDecoder();
		let text = "";
		request.on("data", (chunk) => {
			text += typeof chunk === "string" ? chunk : decoder.decode(chunk, { stream: true });
		});
		request.on("end", () => {
			try {
				text += decoder.decode();
				resolve(JSON.parse(text));
			} catch (error) {
				reject(error);
			}
		});
		request.on("error", reject);
	});
}
/** JSON 响应（no-store）。 */
function respondJson(response, status, value) {
	response.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-store"
	});
	response.end(JSON.stringify(value));
}
/** 路由处理器：GET 时间线 / POST 版本操作。 */
async function handleRoute(ctx, request, response) {
	try {
		if (request.method === "GET") {
			const url = new URL(request.url ?? MESSAGE_EDIT_PATH, "http://message-edit.local");
			const sessionId = sessionIdOf(url.searchParams.get("sessionId"));
			respondJson(response, 200, await timeline(ctx, sessionId));
			return;
		}
		if (request.method === "POST") {
			respondJson(response, 200, await runOperation(ctx, decodeOperation(await requestJson(request))));
			return;
		}
		response.writeHead(405);
		response.end();
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		// 会话不存在是 404 而非状态冲突：浏览器半区把 not-found 视为终态，
		// 停止重试，避免已删除会话反复刷控制台错误。
		const status = error instanceof TypeError ? 400 : /not found/i.test(message) ? 404 : 409;
		respondJson(response, status, { error: message });
	}
}
/** 注册 /message-edit 路由贡献。 */
function apply(ctx) {
	ctx.effect(() => ctx.webServer.register({
		kind: "exact",
		path: MESSAGE_EDIT_PATH,
		handler: (request, response) => handleRoute(ctx, request, response)
	}), "message-edit: HTTP route");
}
/** 纯函数测试面。 */
const __test = {
	closedTurns,
	editableMessages,
	retryableTurns,
	downstreamUsers,
	editPlan,
	retryPlan,
	rerollPlan,
	planOperation,
	decodeOperation,
	agentOptions,
	ownVersionEvent,
	versionSeed,
	inheritedSeed,
	MESSAGE_EDIT_PATH,
	MESSAGE_EDIT_VERSION_SCHEMA
};
//#endregion
export { MESSAGE_EDIT_PATH, MESSAGE_EDIT_VERSION_SCHEMA, __test, apply, inject, name };
