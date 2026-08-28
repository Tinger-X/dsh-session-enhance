/**
 * Agent 注册表隔离层。
 *
 * 收敛释放「已脱离/已删除会话」残留 agent 的试错式访问（agents.store /
 * agents.detachEntered / agent.cancel / agent.whenIdle / agent.scope.dispose）。
 * 上游 AgentRegistry 内部结构变化只需改这里。
 */

export async function disposeStaleAgent(ctx, sessionId) {
	const agents = ctx.get("agents");
	if (agents === void 0) return;
	// AgentRegistry.get() 返回 ReactLoopAgent（无 dispose）；正确的释放路径是
	// registry 的 store（实例字段）+ 公开 detachEntered。
	const entry = agents.store?.get(sessionId);
	ctx.logger.warn(`dsh-session-enhance: disposeStaleAgent("${sessionId}"): store=${typeof agents.store}, entry=${entry === void 0 ? "none" : "found"}, detachEntered=${typeof agents.detachEntered}`);
	if (entry !== void 0 && typeof agents.detachEntered === "function") {
		try {
			// 尽力停掉残留 driver 并卸载作用域（失败不影响 detach）。
			const agent = entry.agent;
			try {
				agent.cancel?.({ kind: "disposed" });
			} catch {}
			try {
				await agent.whenIdle?.();
			} catch {}
			try {
				await agent.scope?.dispose();
			} catch {}
		} catch (error) {
			ctx.logger.warn(`dsh-session-enhance: stale agent teardown for session "${sessionId}" partially failed: ${String(error)}`);
		}
		agents.detachEntered(entry);
		ctx.logger.warn(`dsh-session-enhance: disposeStaleAgent("${sessionId}"): detached stale agent from the registry`);
		return;
	}
	// 兜底：handle 形态（旧版本/自定义 agent）直接 dispose。
	const agent = agents.get?.(sessionId);
	if (agent === void 0 || typeof agent.dispose !== "function") return;
	try {
		await agent.dispose();
	} catch (error) {
		ctx.logger.warn(`dsh-session-enhance: could not dispose stale agent for session "${sessionId}": ${String(error)}`);
	}
}
