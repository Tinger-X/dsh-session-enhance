// 轻量发布预检：校验 DSH 加载器与 npm 包依赖的单包结构。
// 宿主侧（lib/*）为纯 ESM 无需构建；客户端（lib/client.js）由
// scripts/build-client.mjs 从 src/client 生成，`pnpm build` 会先构建再校验。
import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));

const required = [
  "package.json",
  "lib/index.js",
  "cordis.patch.yml",
  "lib/workspace.js",
  "lib/projcache.js",
  "lib/session-move.js",
  "lib/settings.js",
  "lib/client.js",
  "LICENSE",
  "README.md"
];

let failed = false;
for (const rel of required) {
  try {
    await access(resolve(root, rel));
    console.log(`ok: ${rel}`);
  } catch {
    console.error(`missing: ${rel}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log("package structure OK");
