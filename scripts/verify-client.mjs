// 校验 src/client → bundle 的导出面（apply/inject/__test），不触发渲染。
// 用 vm 在无 DOM 环境下执行生成的 DSH factory，断言导出形状正确。
import { build } from "esbuild";
import vm from "node:vm";

const result = await build({
	entryPoints: ["src/client/index.js"],
	bundle: true,
	format: "cjs",
	platform: "browser",
	external: ["react", "react/*", "@deepseek-ai/*"],
	write: false,
	logLevel: "silent"
});

const body = result.outputFiles[0].text;
const wrapper =
	'window.__ModuleLoader__.load({id:"dsh-session-enhance",factory:(require)=>{var module={exports:{}};var exports=module.exports;Object.defineProperty(exports,Symbol.toStringTag,{value:"Module"});' +
	body +
	"return module.exports;}});";

const script =
	"var captured;" +
	"var window={__ModuleLoader__:{load:function(x){captured=x;}}};" +
	wrapper +
	"var result=captured.factory(function(){return {};});" +
	"result;";

const exportsObj = vm.runInNewContext(script);

console.log("apply:", typeof exportsObj.apply);
console.log("inject:", JSON.stringify(exportsObj.inject));
console.log("__test keys:", Object.keys(exportsObj.__test).sort().join(", "));
