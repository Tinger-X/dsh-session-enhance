# 📦 DSH Session Manager

**Full-control session management for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web — archive, permanently delete, drag sessions between workspaces, and keep your records in sync with reality.**

![License](https://img.shields.io/badge/license-Apache--2.0-blue) ![DSH](https://img.shields.io/badge/DSH-0.1.1--rc.2-green) ![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-339933) ![Type](https://img.shields.io/badge/type-ESM-4B32C3)

[简体中文](README.zh-CN.md)

---

A community plugin, derived from [@michengai/dsh-archive-manager](https://github.com/MichengAI/dsh-archive-manager) (Apache-2.0) and hardened into a **session management toolkit**: every action is a real filesystem operation, every deletion is verifiable, and every record in `~/storages/*.json` is guaranteed to match the physical session files on disk.

## ✨ Highlights

| | Feature | What you get |
|---|---|---|
| 🗂️ | **Archive management** | Archive from the sidebar session menu; manage everything in **Settings → 归档管理**: search, sort by time/title, filter by workspace, unarchive, restore per project / all, batch delete with confirmation. |
| 🗑️ | **True physical deletion** | Deletes the actual transcript directory (with retry against Windows handle delays), cascades SUBAGENT children, cleans spill, **and directly sweeps `~/storages/*.json`** so no ghost record survives — then *verifies* the disk and warns about leftovers. |
| 🖱️ | **Drag & drop reassignment** | Drag a session onto another workspace group (or *ungrouped*) in the sidebar. The **transcript files physically move** to the target workspace's session directory, and the artifact header's `cwd` is rewritten — accounting-only moves that silently drop sessions from the sidebar are impossible. |
| 🔄 | **Record sync** | One click reconciles `~/storages/*.json` against the physical session files: ghosts are purged, misattributed sessions are corrected, missing accounting is restored. Immune to manual file edits or deletions. |

## 🧩 Why not the stock archive manager?

| Capability | Stock DSH / basic archive plugins | **dsh-session-manager** |
|---|---|---|
| Archive / unarchive / batch restore | ✅ | ✅ (same semantics) |
| Delete removes the transcript directory | ⚠️ single `rm`, no retry | ✅ **3 retry attempts** (Windows handle release) |
| `~/storages/*.json` consistency after delete | ⚠️ relies on the async service write chain | ✅ **direct disk sweep**: recursive trace removal (`archivedSessionIds`, workspace `sessionIds`, projection-cache rows), atomic tmp+rename, untouched when unchanged |
| Post-delete verification | ❌ | ✅ `verifyDeleted` remote + logged leftover paths |
| Drag a session to another workspace | ❌ accounting only → **session disappears from the sidebar** | ✅ **files move too**: transcript dir relocated, artifact header `cwd` rewritten (zstd frame-aware via `node:zlib`), verified with automatic rollback |
| Protect against manual file edits/deletions | ❌ | ✅ **Sync records**: ghosts purged, attribution fixed, missing accounting restored |
| Stale-list resurrection protection | ❌ | ✅ deletion tombstones + cold-reuse identity probes |

## 🚀 Installation

### Prerequisites

- A working DeepSeek Harness **Web** installation (`dsh` on PATH, `web` profile initialized)
- Node.js `^22.19.0 || >=24.0.0`, pnpm

### 1️⃣ From GitHub (default — always the latest commit)

```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
dsh plugin --profile web add github:Tinger-X/dsh-session-manager
dsh --profile web --dump-config
```

Installs straight from the repository — no registry involved, always the latest commit.

### 2️⃣ From npm (stable releases)

```powershell
dsh plugin --profile web add dsh-session-manager
dsh --profile web --dump-config
```

### 3️⃣ From source (development / local changes)

```powershell
git clone https://github.com/Tinger-X/dsh-session-manager.git
Set-Location dsh-session-manager
pnpm install
dsh plugin --profile web add .
dsh --profile web --dump-config
```

`dsh plugin add` runs `pnpm add` and automatically appends packages that declare `dsh.bundle.patch` to the profile's `dsh.profile.bundles`.

> **Verify** — `--dump-config` should list three service rows:
> `workspace-dsh-session-manager`, `session-projection-cache-dsh-session-manager`, `ui-workspace-dsh-session-manager`

Restart DSH Web and hard-refresh the browser (Ctrl+F5). The **归档管理** entry appears in Settings, right after **Connectors**, with a dedicated archive-box icon.

### ⚠️ Registry notes for source installs

This repository pins every `@deepseek-ai/*` peer **exactly** (`0.1.1-rc.2`, matching the current host) and ships a project-level `.npmrc` pointing at the official registry, plus a `pnpm.overrides` entry forcing `@deepseek-ai/dsh-invariants` → `0.1.1-rc.2`.

Why? Range resolution can pull newer release candidates whose transitive dependencies reference a **nonexistent** `dsh-invariants@^0.1.1` (unsatisfiable on any registry), and the npmmirror mirror's prerelease metadata for `@deepseek-ai/*` is stale. If `pnpm install` fails on `@deepseek-ai` packages, run it again with `--registry=https://registry.npmjs.org/`.

## 🎮 Usage

1. **Archive** — sidebar session menu → *Archive session*.
2. **Manage** — Settings → **归档管理**: search, sort (updated / created / alphabetical), filter by project, restore, delete (always confirmed).
3. **Sync records** — hit **同步记录** after manually touching files or `storages/*.json`: ghosts are purged, wrong workspace memberships are fixed, missing accounting is restored, and the header index is rebuilt. A summary toast reports `scanned / added / removed`.
4. **Move by drag & drop** — drag a session row onto another workspace group header (or a session row inside another group), or onto **未分组** to detach it from all workspaces:
   - The transcript directory is physically relocated and the artifact header's `cwd` is rewritten; the change lands in `~/storages/workspace.json`.
   - Dragging to *ungrouped* keeps files in place (there is no target path).
   - A **running** session is flushed and detached first (write path and file handles released), then moved; reopen it afterwards.
   - Same-group drags keep the original reorder behavior.
5. **Delete** — per-session / per-project / delete-all, always confirmed:
   `flush → detach → bookkeeping cleanup → projection-cache row removal → SUBAGENT cascade → spill cleanup → transcript dir removal (retried) → storages JSON sweep → disk verification`

## 🏗 Architecture

```
lib/index.js          Host entry (ui-workspace-dsh-session-manager)
lib/workspace.js      Workspace registry service: archive semantics, physical
                      deletion, moveSession (physical move), syncRecords
lib/projcache.js      Projection-cache service (tombstone-guarded writes)
lib/session-move.js   Physical move core: transcript relocation + zstd-aware
                      artifact header.cwd rewrite (frame layout preserved,
                      first-frame validated, automatic rollback)
lib/storage-sweep.js  Direct disk sweep of ~/storages/*.json (recursive trace
                      removal, atomic writes, no-op when unchanged)
lib/tombstone.js      Shared FIFO tombstone bookkeeping
lib/client.js         Browser bundle: sidebar menu, 归档管理 settings page,
                      drag & drop, nav icon
```

### Programmatic API (Typert Remotes on `workspaceRegistry`)

| Method | Purpose |
|---|---|
| `archiveSession` / `unarchiveSession(sessionId)` | archive state (base registry) / restore one |
| `unarchiveSessions(target)` | restore all / per workspace / ungrouped |
| `deleteSession(sessionId)` | **physical delete** with full trace cleanup + verification |
| `deleteArchivedSessions(target)` | batch delete with per-session failure report |
| `moveSession(sessionId, targetWorkspaceId)` | reassign workspace **with physical file move** (`null` = ungrouped) |
| `syncRecords()` | reconcile storages against physical session files |
| `verifyDeleted(sessionId)` | post-delete diagnostics (transcript + storage traces) |
| `archivedSessionMetadata()` | creation-time metadata for the settings page |

## 🛡 Data safety & integrity

- **Deletion always requires confirmation** and cannot be undone.
- **Live sessions are flushed before any cleanup** — no truncated transcripts, no open-handle races.
- **Atomic writes everywhere**: storages sweeps and artifact header rewrites use tmp + rename; the move verifies the rewritten header and **rolls back** (original header + directory) on failure.
- **Tombstones** (FIFO, capped at 4096) block stale `list()` results from resurrecting deleted sessions; a same-id session rebuilt by another process with a different identity (`createdAt`/`cwd`) clears the tombstone via a cold-reuse probe.
- **Sync is conservative**: sessions whose `cwd` cannot be resolved are left untouched; projection-cache ghosts are removed without tombstones so a later file restoration can rebuild them.
- Sessions are **at most** accounted in one workspace (duplicate accounting is defended against); archived state is orthogonal to workspace membership — moving never changes the archive marker.

## 🧑‍💻 Development

```powershell
pnpm build    # package structure validation
pnpm test     # node --test (storage-sweep + session-move suites)
```

Test coverage:

- `test/storage-sweep.test.mjs` — recursive trace removal, atomic rewrite, malformed/missing file tolerance, whole-directory sweep
- `test/session-move.test.mjs` — relocation + header rewrite, real-backend `readRaw` shape (`{ meta, content }`), idempotent no-ops, **failure rollback with strict frame readability**, plaintext artifacts, loud refusal without raw-artifact support

## ⚙️ Compatibility

| Component | Version |
|---|---|
| DeepSeek Harness | `>=0.1.0-rc.5 <0.2.0` (developed against `0.1.1-rc.2`) |
| `@deepseek-ai/cordis` | `4.0.1` |
| Node.js | `^22.19.0 \|\| >=24.0.0` (requires `node:zlib` zstd) |
| Package manager | pnpm (workspace uses `pnpm@11.21.0`) |

## ❓ FAQ

**Does it ever touch my conversation files?**
Only when you delete, move, or sync — and every operation is atomic, verified, and logged.

**What happens if I drag a session that is currently running?**
It is flushed and detached first (like deletion), then physically moved; the conversation closes and can be reopened from its new workspace.

**Can I undo a move?**
Yes — drag it back. Moves are not transactional with the registry by design, but they are idempotent and safe to retry.

**The gear icon next to my section in Settings?**
The settings shell maps nav icons by section id and falls back to a gear for unknown ids; this plugin swaps in a proper archive-box glyph at runtime.

## 📄 License

Apache-2.0 — derived from [@michengai/dsh-archive-manager](https://github.com/MichengAI/dsh-archive-manager); its LICENSE is retained.

---

**Made for DeepSeek Harness users who like their data exactly where they put it.**
