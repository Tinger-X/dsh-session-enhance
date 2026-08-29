/**
 * dsh-session-enhance 空工作区目录清扫层。
 *
 * 会话转录根目录（`~/sessions`）下的第一层子目录按 `projectKey(cwd)` 命名，
 * 对应一个工作区；删除该工作区的最后一个会话后，会话子目录会被移除，但外层
 * 的 projectKey 目录会残留为空目录（如 `sessions/--D-tmp--`）。本模块只负责
 * 枚举并删除这些**空**目录，绝不递归删除任何含内容的目录，避免误删仍在用的
 * 工作区转录数据。
 */
import { readdir, rmdir } from "node:fs/promises";
import { join } from "node:path";

/** 判断目录是否为空（不存在视为非空，交由调用方决定是否报错）。 */
async function isDirectoryEmpty(dir) {
	try {
		return (await readdir(dir)).length === 0;
	} catch (error) {
		if (error?.code === "ENOENT") return false;
		throw error;
	}
}
/**
 * 枚举 `sessions` 根目录下所有为空的直接子目录（即空工作区目录残留）。
 * 根目录不存在时返回空数组；其他枚举失败向上抛出。
 * @param {string} root - `sessions` 目录绝对路径。
 * @returns 目录项数组，每项含 `{ name, path }`，按名称排序。
 */
export async function listEmptyWorkspaceDirectories(root) {
	let entries;
	try {
		entries = await readdir(root, { withFileTypes: true });
	} catch (error) {
		if (error?.code === "ENOENT") return [];
		throw error;
	}
	const directories = [];
	for (const entry of entries) {
		if (!entry.isDirectory()) continue;
		const path = join(root, entry.name);
		if (await isDirectoryEmpty(path)) directories.push({ name: entry.name, path });
	}
	directories.sort((left, right) => left.name.localeCompare(right.name, void 0, { numeric: true, sensitivity: "base" }));
	return directories;
}
/**
 * 删除一个空的直接子目录。
 * 只接受 `sessions` 根目录的直接子目录名（不含路径分隔符），并校验目录确为空，
 * 防止路径穿越与误删非空目录。
 * @param {string} root - `sessions` 目录绝对路径。
 * @param {string} name - 目标子目录名（basename）。
 * @param {{ info: (msg: string) => void }} logger - 日志句柄。
 * @returns `{ deleted: true, name }`。
 */
export async function deleteEmptyWorkspaceDirectory(root, name, logger) {
	if (typeof name !== "string" || name.length === 0 || name === "." || name === ".." || name.includes("/") || name.includes("\\")) {
		throw new Error(`invalid workspace directory name "${name}"`);
	}
	const path = join(root, name);
	if (!await isDirectoryEmpty(path)) {
		throw new Error(`workspace directory "${name}" is not empty`);
	}
	await rmdir(path);
	logger.info(`dsh-session-enhance: removed empty workspace directory "${path}"`);
	return { deleted: true, name };
}
