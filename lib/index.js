//#region lib/types/index.js
/**
 * dsh-session-enhance 根宿主入口。
 *
 * 发布包是单个 DSH 插件。三个运行时模块通过根包子路径导出：
 *
 * - `./workspace`：宿主工作区服务（物理删除增强 + moveSession 归属修改）。
 * - `./projcache`：宿主投影缓存服务。
 * - `./client`：会话管理浏览器客户端 bundle（含拖拽修改归属）。
 *
 * 根入口对应 `ui-workspace-dsh-session-enhance` 服务行。浏览器端由
 * package.json 的 `dsh.client` 声明发现，因此该宿主入口无需额外行为。
 */
function apply() {}
//#endregion
export { apply };
