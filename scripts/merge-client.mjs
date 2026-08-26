// 合并脚本：把 dsh-message-edit 的客户端 bundle 内联进 dsh-session-enhance
// 的客户端 bundle，生成单一 `window.__ModuleLoader__.load({ id: "dsh-session-enhance" })`
// 注册，apply 依次执行两个插件的注册逻辑，inject 取并集。
//
// 用法：node scripts/merge-client.mjs [--message-edit-client <path>]
// 默认从仓库同级目录 ../dsh-message-edit/client.js 读取 message-edit bundle。
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const args = process.argv.slice(2);
const messageEditFlag = args.indexOf("--message-edit-client");
const messageEditClient = messageEditFlag === -1
	? resolve(root, "..", "dsh-message-edit", "client.js")
	: resolve(args[messageEditFlag + 1] ?? "");
const sessionEnhanceClient = resolve(root, "lib", "client.js");

/** 提取 `factory: (require) => { ... }` 的函数体（含尾部工厂闭合 `}`）。 */
function extractFactoryBody(text, label) {
	const marker = "factory: (require) => {";
	const start = text.indexOf(marker);
	if (start === -1) throw new Error(`${label}: no factory marker found`);
	const end = text.lastIndexOf("});");
	if (end <= start + marker.length) throw new Error(`${label}: no closing "});" found`);
	return text.slice(start + marker.length, end);
}

/** 去掉函数体末尾的工厂闭合 `}`（由调用方自行包裹）。 */
function stripClosingBrace(body, label) {
	const trimmed = body.replace(/\s+$/, "");
	if (!trimmed.endsWith("}")) throw new Error(`${label}: factory body does not end with "}"`);
	return trimmed.slice(0, -1);
}

const meText = await readFile(messageEditClient, "utf8");
const seText = await readFile(sessionEnhanceClient, "utf8");

// 防呆：lib/client.js 必须是原始 session-enhance bundle（未合并过），
// 否则提取会二次包裹。误跑时用 `git checkout -- lib/client.js` 恢复。
if (seText.includes("__messageEdit")) {
	throw new Error("session-enhance client is already merged; restore the pristine bundle first (git checkout -- lib/client.js)");
}

let meBody = stripClosingBrace(extractFactoryBody(meText, "message-edit"), "message-edit");
let seBody = extractFactoryBody(seText, "session-enhance");

// 品牌归一：清掉曾用名（dsh-archive-manager）在浏览器 bundle 中的残留。
// - `dsham_*` CSS 类名 / `dshamNavIconPatched` dataset / `dsham-sort-filter` id
//   （dsh-archive-manager 缩写）→ `dshse_*`（dsh-session-enhance 缩写）；
// - `ARCHIVE_MANAGER_REMOTE` 常量 → `SESSION_ENHANCE_REMOTE`。
seBody = seBody.replaceAll("dsham", "dshse").replaceAll("ARCHIVE_MANAGER_REMOTE", "SESSION_ENHANCE_REMOTE");

// session-enhance 尾部的导出块替换为合并后的 apply/inject。
const tailPattern = /\t\texports\.apply = apply;\r?\n\t\texports\.inject = inject;\r?\n\t\treturn module\.exports;/;
const mergedTail = `\t\t// ===== merged apply / inject (dsh-session-enhance + dsh-message-edit) =====
		exports.apply = async (ctx) => {
			const __seDisposer = await apply(ctx);
			__messageEdit.apply(ctx);
			return async () => {
				if (typeof __seDisposer === "function") await __seDisposer();
			};
		};
		exports.inject = Array.from(new Set([...inject, ...__messageEdit.inject]));
		return module.exports;`;
if (!tailPattern.test(seBody)) throw new Error("session-enhance: unexpected exports tail");
seBody = stripClosingBrace(seBody.replace(tailPattern, mergedTail), "session-enhance");

const combined = `window.__ModuleLoader__.load({
	id: "dsh-session-enhance",
	factory: (require) => {
		// ===== dsh-message-edit client bundle (merged) =====
		const __messageEdit = ((require) => {
${meBody}
		})(require);
		// ===== dsh-session-enhance client bundle (original) =====
${seBody}
	}
});
`;

await writeFile(sessionEnhanceClient, combined, "utf8");
console.log(`merged client written: ${sessionEnhanceClient} (${combined.length} bytes)`);
