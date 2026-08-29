import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { deleteEmptyWorkspaceDirectory, listEmptyWorkspaceDirectories } from "../lib/workspace-sweep.js";

function quietLogger() {
	return { info() {}, warn() {} };
}

test("listEmptyWorkspaceDirectories: returns only empty direct child dirs, sorted", async () => {
	const root = await mkdtemp(join(tmpdir(), "sm-wsweep-"));
	try {
		await mkdir(join(root, "b-empty"));
		await mkdir(join(root, "a-empty"));
		await mkdir(join(root, "non-empty"));
		await writeFile(join(root, "non-empty", "session.txt"), "x");
		await writeFile(join(root, "readme.txt"), "not a dir");

		const directories = await listEmptyWorkspaceDirectories(root);
		assert.deepEqual(directories.map((d) => d.name), ["a-empty", "b-empty"]);
		assert.deepEqual(directories.map((d) => d.path), [join(root, "a-empty"), join(root, "b-empty")]);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});

test("listEmptyWorkspaceDirectories: missing root returns empty list", async () => {
	const root = join(tmpdir(), "sm-wsweep-missing-" + Date.now());
	assert.deepEqual(await listEmptyWorkspaceDirectories(root), []);
});

test("deleteEmptyWorkspaceDirectory: removes an empty dir and refuses non-empty/traversal", async () => {
	const root = await mkdtemp(join(tmpdir(), "sm-wsweep-"));
	try {
		await mkdir(join(root, "empty"));
		assert.deepEqual(await deleteEmptyWorkspaceDirectory(root, "empty", quietLogger()), { deleted: true, name: "empty" });
		assert.deepEqual(await readdir(root), []);

		await mkdir(join(root, "non-empty"));
		await writeFile(join(root, "non-empty", "file.txt"), "x");
		await assert.rejects(() => deleteEmptyWorkspaceDirectory(root, "non-empty", quietLogger()), /not empty/);

		await assert.rejects(() => deleteEmptyWorkspaceDirectory(root, "..", quietLogger()), /invalid/);
		await assert.rejects(() => deleteEmptyWorkspaceDirectory(root, "a/b", quietLogger()), /invalid/);
	} finally {
		await rm(root, { recursive: true, force: true });
	}
});
