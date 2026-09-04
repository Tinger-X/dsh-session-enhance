/**
 * dsh-session-enhance 空工作区目录清理域：把注册表的会话根解析接到磁盘清扫层。
 */
import { deleteEmptyWorkspaceDirectory as deleteUnderRoot, listEmptyWorkspaceDirectories as listUnderRoot } from "../workspace-sweep.js";

export async function listEmptyWorkspaceDirectories(registry) {
	return { directories: await listUnderRoot(await registry.sessionsRoot()) };
}

export async function deleteEmptyWorkspaceDirectory(registry, name) {
	return deleteUnderRoot(await registry.sessionsRoot(), name, registry.ctx.logger);
}
