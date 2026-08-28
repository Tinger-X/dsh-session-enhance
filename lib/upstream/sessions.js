/**
 * 会话存储（SessionStore）隔离层。
 *
 * 收敛对上游 SessionStore 内部 API（liveEntryFor / detachEntered / enter /
 * announce）的访问。上游升级只需改这里，业务代码不再直接触碰内部结构。
 */

/** 取实时会话（不存在返回 undefined）。 */
export function getLiveSession(ctx, id) {
	const sessions = ctx.get("sessions");
	return sessions?.get(id);
}

/** 持久化屏障：flush 实时会话，保证没有未落盘的转录写入。 */
export async function flushLiveSession(ctx, live) {
	await ctx.get("sessions").flush(live);
}

/** 从存储分离实时会话（session/disposed 同步触发）。 */
export function detachLiveSession(ctx, live) {
	const sessions = ctx.get("sessions");
	const entry = sessions.liveEntryFor(live);
	sessions.detachEntered(entry);
}

/** 列举实时会话；存储缺失时返回空数组。 */
export function listLiveSessions(ctx) {
	const sessions = ctx.get("sessions");
	if (sessions === void 0 || typeof sessions.list !== "function") return [];
	return sessions.list();
}

/**
 * 为未处于实时状态的持久化会话发布一次移除事件（冷移除广播）。
 * 依赖 persistence.prepare + sessions.enter/announce 的内部接线。
 */
export async function announceColdSessionRemoval(ctx, sessionId) {
	const persistence = ctx.get("sessionPersistence");
	if (persistence === void 0 || typeof persistence.prepare !== "function") return;
	const sessions = ctx.get("sessions");
	if (sessions === void 0) return;
	try {
		const preparation = await persistence.prepare(sessionId);
		const detach = sessions.enter(preparation.session);
		try {
			sessions.announce(preparation.session);
		} finally {
			detach();
			preparation[Symbol.dispose]();
		}
	} catch (error) {
		ctx.logger.warn(`dsh-session-enhance: could not publish removal for stored session "${sessionId}": ${String(error)}`);
	}
}
