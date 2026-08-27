/**
 * 会话 header 到「日志身份」字段的投影（与投影缓存的 identity 语义一致）。
 * cwd 缺失统一归一为 null，避免一侧带键一侧不带键时的比较歧义。
 * @param {object} header - 会话 header。
 * @returns {{ createdAt: number, cwd: string | null }}
 */
export function headerIdentity(header) {
	return {
		createdAt: header.createdAt,
		cwd: header.cwd ?? null
	};
}
