// 客户端 bundle 构建：把 src/client/index.js 打包为 DSH Web 可加载的
// `lib/client.js`（window.__ModuleLoader__.load 包裹的 CommonJS factory）。
//
// 外部依赖（react / react/* / @deepseek-ai/*）由 DSH 浏览器运行时的模块加载器
// 在运行时注入，因此标记为 external；其余（插件自有代码 + vendored 组件）打进
// bundle。
import { build } from "esbuild";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

const externalPlugin = {
	name: "dsh-external",
	setup(ctx) {
		ctx.onResolve({ filter: /^react($|\/)/ }, (args) => ({ path: args.path, external: true }));
		ctx.onResolve({ filter: /^@deepseek-ai\// }, (args) => ({ path: args.path, external: true }));
	}
};

const result = await build({
	entryPoints: [resolve(root, "src/client/index.js")],
	bundle: true,
	format: "cjs",
	platform: "browser",
	target: "es2020",
	plugins: [externalPlugin],
	logLevel: "silent",
	write: false
});

const body = result.outputFiles[0].text.replace(/\n$/, "");

const wrapper = `window.__ModuleLoader__.load({
\tid: "dsh-session-enhance",
\tfactory: (require) => {
\t\tvar module = { exports: {} };
\t\tvar exports = module.exports;
\t\tObject.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
${body.split("\n").map((line) => `\t\t${line}`).join("\n")}
\t\treturn module.exports;
\t}
});
`;

await writeFile(resolve(root, "lib/client.js"), wrapper, "utf8");
console.log("built lib/client.js");
