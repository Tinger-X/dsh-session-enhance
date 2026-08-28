/**
 * Spill 存储隔离层。
 *
 * 收敛对 spillStore.root 的访问，避免业务代码直接触碰上游 spill 服务结构。
 */

/** 取 spill 根目录（服务缺失时返回 undefined）。 */
export function getSpillRoot(ctx) {
	const spill = ctx.get("spillStore");
	return spill?.root;
}
