/**
 * dsh-session-enhance 宿主侧「基础设置」持久化。
 *
 * 「对话增强」设置分区下的「基础设置」暴露两处可配置项：
 *
 * - `homeDir`：`.dsh` 家目录（默认 `~/.dsh`）。用户可覆盖为任意路径；
 *   宿主侧 `storagesRoot()` 据此解析 `storages` 目录，替代 `$DSH_HOME`/默认
 *   家目录，供物理删除后的磁盘清扫使用。
 * - `notifyEnabled`：是否启用「对话通知」（默认启用）。由浏览器端读取，
 *   控制「对话需要用户操作或结束时」是否弹出系统提示。
 *
 * 本模块保持纯 Node（无 @deepseek-ai/* 依赖），便于单测；配置文件路径由
 * 调用方（workspace.js）用 `@deepseek-ai/dsh-home-paths` 解析后传入。读取对
 * 缺失/损坏的配置文件宽容：一律回退默认值；写入失败则向上抛出。
 */
import { mkdir, readFile, writeFile, rename, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";

/** 默认基础设置（读取失败或字段缺失时的回退值）。 */
const DEFAULT_SETTINGS = Object.freeze({ homeDir: "~/.dsh", notifyEnabled: true });
/** 展开 `~` / `~/` / `~\` 前缀（与 `@deepseek-ai/dsh-home-paths` 语义一致）。 */
function expandHomePath(path) {
	if (path === "~") return homedir();
	if (path.startsWith("~/") || path.startsWith("~\\")) return join(homedir(), path.slice(2));
	return path;
}
/** 归一化并补齐字段：非法/缺失字段回退默认值，homeDir 去除首尾空白。 */
function normalizeSettings(raw) {
	const homeDir = typeof raw?.homeDir === "string" && raw.homeDir.trim().length > 0 ? raw.homeDir.trim() : DEFAULT_SETTINGS.homeDir;
	const notifyEnabled = typeof raw?.notifyEnabled === "boolean" ? raw.notifyEnabled : DEFAULT_SETTINGS.notifyEnabled;
	return { homeDir, notifyEnabled };
}
/**
 * 读取基础设置。文件缺失或 JSON 损坏时静默回退默认值（设置是低风险偏好，
 * 不值得为坏配置阻断物理删除等核心路径）。
 * @param path - 配置文件绝对路径。
 * @returns 归一化后的 `{ homeDir, notifyEnabled }`。
 */
async function readSettings(path) {
	let raw;
	try {
		raw = await readFile(path, "utf8");
	} catch (error) {
		if (error?.code === "ENOENT") return { ...DEFAULT_SETTINGS };
		throw error;
	}
	try {
		return normalizeSettings(JSON.parse(raw));
	} catch {
		return { ...DEFAULT_SETTINGS };
	}
}
/**
 * 原子写入基础设置（临时文件 + rename）。
 * @param settings - 待写入的 `{ homeDir?, notifyEnabled? }`。
 * @param path - 配置文件绝对路径。
 * @returns 归一化后实际写入的设置。
 */
async function writeSettings(settings, path) {
	const normalized = normalizeSettings(settings);
	const serialized = `${JSON.stringify(normalized, null, 2)}\n`;
	const tmp = `${path}.tmp-${process.pid}-${Date.now()}`;
	try {
		await mkdir(dirname(path), { recursive: true });
		await writeFile(tmp, serialized, "utf8");
		await rename(tmp, path);
	} catch (error) {
		await rm(tmp, { force: true }).catch(() => {});
		throw error;
	}
	return normalized;
}
/**
 * 解析指定家目录下的 `storages` 目录（与 `dshHomePath("storages")` 语义一致，
 * 但以用户配置的 homeDir 为根）。支持 `~` / `~/` / `~\` 前缀展开。
 * @param homeDir - 配置的家目录（如 `~/.dsh`）。
 * @returns `storages` 目录绝对路径。
 */
function storagesRootFor(homeDir) {
	return join(resolve(expandHomePath(homeDir)), "storages");
}
export { DEFAULT_SETTINGS, normalizeSettings, readSettings, storagesRootFor, writeSettings };
