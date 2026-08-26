import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir, homedir } from "node:os";
import { DEFAULT_SETTINGS, normalizeSettings, readSettings, storagesRootFor, writeSettings } from "../lib/settings.js";

test("normalizeSettings: fills defaults and trims homeDir", () => {
	assert.deepEqual(normalizeSettings(undefined), { ...DEFAULT_SETTINGS });
	assert.deepEqual(normalizeSettings({}), { ...DEFAULT_SETTINGS });
	assert.deepEqual(normalizeSettings({ homeDir: "  /tmp/dsh  ", notifyEnabled: false }), { homeDir: "/tmp/dsh", notifyEnabled: false });
	// 非法类型回退默认值。
	assert.deepEqual(normalizeSettings({ homeDir: "", notifyEnabled: "yes" }), { ...DEFAULT_SETTINGS });
	assert.deepEqual(normalizeSettings({ homeDir: 42, notifyEnabled: 1 }), { ...DEFAULT_SETTINGS });
});

test("storagesRootFor: expands tilde and joins storages", () => {
	assert.equal(storagesRootFor("~/.dsh"), join(homedir(), ".dsh", "storages"));
	assert.equal(storagesRootFor("~"), join(homedir(), "storages"));
	// 绝对路径按平台规则解析后追加 storages（Windows 会补上盘符）。
	assert.ok(storagesRootFor("/opt/dsh").endsWith(join("dsh", "storages")));
});

test("readSettings: missing and corrupted files fall back to defaults", async () => {
	const dir = await mkdtemp(join(tmpdir(), "sm-settings-"));
	try {
		const missing = join(dir, "nope.json");
		assert.deepEqual(await readSettings(missing), { ...DEFAULT_SETTINGS });
		const broken = join(dir, "broken.json");
		await writeFile(broken, "{ not json !!!");
		assert.deepEqual(await readSettings(broken), { ...DEFAULT_SETTINGS });
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
});

test("writeSettings/readSettings: round-trips normalized values", async () => {
	const dir = await mkdtemp(join(tmpdir(), "sm-settings-"));
	try {
		const file = join(dir, "settings.json");
		const written = await writeSettings({ homeDir: "/custom/dsh", notifyEnabled: false }, file);
		assert.deepEqual(written, { homeDir: "/custom/dsh", notifyEnabled: false });
		assert.deepEqual(await readSettings(file), { homeDir: "/custom/dsh", notifyEnabled: false });
		// 序列化格式与 storages/*.json 一致：2 空格缩进 + 结尾换行。
		assert.equal((await readFile(file, "utf8")).endsWith("\n"), true);
	} finally {
		await rm(dir, { recursive: true, force: true });
	}
});
