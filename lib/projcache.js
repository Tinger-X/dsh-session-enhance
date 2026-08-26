import { Service } from "@deepseek-ai/cordis";
import { SessionProjectionCache } from "@deepseek-ai/dsh-session-projection-cache";
import { trackTombstone } from "./tombstone.js";
//#region lib/types/index.js
/**
 * dsh-session-enhance projcache 半边。
 *
 * `SessionEnhanceProjectionCache` 继承上游 `SessionProjectionCache`
 * （服务名 `sessionProjectionCache`，同域、同 fail-soft 写路径），
 * 为会话管理的 `deleteSession` 增加三处守护：
 *
 * - `delete(id)` - 永久移除一个会话的缓存投影行
 *   （`session_projcache` 域上的 `table.delete`），写入前先登记墓碑。
 * - `whenIdle()` - 全部在途公开写入落定后 resolve。
 * - 墓碑挡住已删除会话的写入：迟到的写入要么被直接拦截，要么在
 *   落定后补删自己的残留行，不会复活已删除的缓存条目。守护覆盖
 *   `write()`（dispose 写后路径）与 `putSoft()`（`coldSnapshot` 的
 *   冷读写回路径），两条落盘路径都纳入 `whenIdle` 跟踪。
 *
 * 另外在服务就绪后做一次**后台预热**：对所有已持久化但无缓存行的会话
 * 触发冷读写回，使其标题投影在重启后的首个冷列表即可用（否则
 * `cachedSnapshot` 无行、`session.list` 缺标题，侧栏回退显示工作区名，
 * 直到会话被点开触发冷读重建）。典型来源是在 `dsh web` 之外（CLI/TUI）
 * 创建、从未被 web 投影缓存检查点过的会话。预热非阻塞、并发受限、逐会话
 * fail-soft，不影响启动与正常读写。
 *
 * 默认导出是 Service 子类（与上游 `@deepseek-ai/dsh-session-projection-cache`
 * 包同形），profile 补丁可直接替换 `session-projection-cache` 服务行，
 * 无需其他接线改动。
 */
var SessionEnhanceProjectionCache = class extends SessionProjectionCache {
	/** 已永久删除的会话：其投影缓存行不再允许写入。 */
	deletedSessionIds = /* @__PURE__ */ new Set();
	/** 墓碑插入顺序，用于在上限处淘汰最旧项。 */
	deletedSessionOrder = [];
	deletedSessionTombstoneLimit = 4096;
	/** 在途写入的队尾（只含已落定的 promise）。 */
	writeTail = Promise.resolve();
	/** 后台预热并发上限：避免启动时对磁盘日志的冷读风暴。 */
	warmConcurrency = 4;
	/** 后台预热任务句柄（供测试与 dispose 观察；不纳入 whenIdle——其写回经 putSoft 已被跟踪）。 */
	warmTail;
	constructor(ctx, config) {
		super(ctx, config);
	}
	/** 上游 init 建域装写路径后，启动一次非阻塞的后台预热。 */
	async [Service.init]() {
		await super[Service.init]();
		this.warmTail = this.warmUncachedProjections();
	}
	/**
	 * 后台预热所有「已持久化但无缓存行」的会话：逐个走 `coldSnapshot` 的
	 * 冷读写回，把标题等投影折叠回缓存行，使重启后的首个冷列表即可显示
	 * 正确标题，而不必等用户点开每个会话。
	 *
	 * 已有缓存行、实时会话、已删除墓碑的会话都跳过；并发受 {@link warmConcurrency}
	 * 限制；单会话冷读失败仅告警（最坏回到点开即恢复）。整体 fail-soft，
	 * 绝不抛出——init 只 fire-and-forget 本方法，不得让其未处理拒绝逃逸。
	 * @returns 预热完成的 resolution（本方法自身从不 reject）。
	 */
	async warmUncachedProjections() {
		try {
			const persistence = this.ctx.sessionPersistence;
			if (persistence === void 0 || typeof persistence.list !== "function") return;
			const table = this.requireTable();
			const sessions = this.ctx.get("sessions");
			const pending = [];
			for (const header of await persistence.list()) {
				if (this.deletedSessionIds.has(header.id)) continue;
				if (table.get(header.id) !== void 0) continue;
				if (sessions?.get(header.id) !== void 0) continue;
				pending.push(header.id);
			}
			if (pending.length === 0) return;
			this.ctx.logger.info(`dsh-session-enhance projcache: warming ${pending.length} uncached session projection(s) in the background`);
			let warmed = 0;
			let cursor = 0;
			const worker = async () => {
				for (;;) {
					const index = cursor++;
					if (index >= pending.length) return;
					const id = pending[index];
					try {
						await this.coldSnapshot(id);
						warmed += 1;
					} catch (error) {
						this.ctx.logger.warn(`dsh-session-enhance projcache: warm cold-read for "${id}" failed (title falls back until reopened): ${String(error)}`);
					}
				}
			};
			await Promise.all(Array.from({ length: Math.min(this.warmConcurrency, pending.length) }, () => worker()));
			this.ctx.logger.info(`dsh-session-enhance projcache: background projection warm complete (${warmed}/${pending.length} sessions cached)`);
		} catch (error) {
			this.ctx.logger.warn(`dsh-session-enhance projcache: background projection warm failed: ${String(error)}`);
		}
	}
	/** 跟踪公开写入路径，避免依赖上游私有 `flushSoft` 的实现细节。 */
	write(session) {
		const task = this.writeCore(session);
		this.writeTail = Promise.allSettled([this.writeTail, task]).then(() => void 0);
		return task;
	}
	/**
	 * 墓碑正确性依赖：super.write(session) 一次整体写入，返回后不再有后续异步落盘。
	 * 若上游改成多阶段异步，(C) 补删会漏掉后续写入，deletedSessionIds 挡不住复活。
	 */
	async writeCore(session) {
		if (this.deletedSessionIds.has(session.id)) return;
		await super.write(session);
		if (this.deletedSessionIds.has(session.id)) await this.requireTable().delete(session.id);
	}
	/**
	 * 冷读写回路径（上游 `coldSnapshot` 经 `putSoft` 落盘）与 `write` 同守：
	 * 已删除直接放弃；删除落在写回进行中则在其落定后补删残留行。
	 * 同样纳入 `whenIdle` 跟踪。
	 */
	async putSoft(id, identity, rows, what) {
		if (this.deletedSessionIds.has(id)) return;
		const task = this.putSoftCore(id, identity, rows, what);
		this.writeTail = Promise.allSettled([this.writeTail, task]).then(() => void 0);
		return task;
	}
	async putSoftCore(id, identity, rows, what) {
		await super.putSoft(id, identity, rows, what);
		try {
			if (this.deletedSessionIds.has(id)) await this.requireTable().delete(id);
		} catch (error) {
			this.ctx.logger.warn(`dsh-session-enhance projcache: cold-read write-back cleanup for "${id}" failed: ${String(error)}`);
		}
	}
	/**
	 * 全部被跟踪的在途写入落定后 resolve（含失败）。空闲缓存上调用立即返回。
	 * @returns 跟踪写入落定后的 resolution。
	 */
	whenIdle() {
		return this.writeTail;
	}
	/**
	 * 永久移除一个会话的缓存投影行。
	 * @param id - 要删除缓存行的会话。
	 * @returns 行删除完成后的 resolution。
	 */
	async delete(id) {
		trackTombstone(this.deletedSessionIds, this.deletedSessionOrder, id, this.deletedSessionTombstoneLimit);
		await this.requireTable().delete(id);
	}
	/**
	 * 物理移动后改写一个会话缓存行的日志身份（createdAt/cwd）。
	 *
	 * 移动只改变 cwd——转录目录整体搬移、日志内容不变，行内投影值仍然有效；
	 * 把身份更新为新 cwd 后，`session.list` 的 `cachedSnapshot` 身份校验
	 * （identityMatches）重新通过，会话标题等投影恢复服务，侧栏不再回退
	 * 显示目标工作区名。无缓存行时为空操作（后续冷读会用新身份重建）。
	 * 写入失败 fail-soft（缓存语义：至多回到标题回退，绝不产生错误值）。
	 * 写入纳入 `writeTail` 跟踪，调用方可先 `whenIdle()` 再改写，避免
	 * detach 时刻的在途旧身份写入落定后覆盖新身份。
	 * @param id - 被移动的会话。
	 * @param identity - 新日志身份（新 cwd；createdAt 不变）。
	 */
	async rehome(id, identity) {
		const record = this.requireTable().get(id);
		if (record === void 0) return;
		const task = this.requireTable().put(id, { identity, rows: record.rows });
		this.writeTail = Promise.allSettled([this.writeTail, task]).then(() => void 0);
		await task;
	}
	/** 撤销墓碑（供测试与同 id 新生命周期复用路径使用）。 */
	clearTombstone(id) {
		this.deletedSessionIds.delete(id);
		const idx = this.deletedSessionOrder.indexOf(id);
		if (idx !== -1) this.deletedSessionOrder.splice(idx, 1);
	}
};
//#endregion
export { SessionEnhanceProjectionCache, SessionEnhanceProjectionCache as default };
