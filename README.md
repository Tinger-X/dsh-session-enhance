# ⚡ DSH Session Enhance

**Session management with receipts. Archive, physically delete, and drag sessions between workspaces in DeepSeek Harness Web. Every action touches real files, and the sidebar always tells the truth.**

![License](https://img.shields.io/badge/license-Apache--2.0-blue) ![DSH](https://img.shields.io/badge/DSH-0.1.1--rc.2-green) ![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-339933) ![Type](https://img.shields.io/badge/type-ESM-4B32C3)

[简体中文](README.zh-CN.md)

---

## The problem

DeepSeek Harness Web keeps your session list in two places: the sidebar reads `~/storages/*.json`, while the conversations themselves live as transcript files on disk. The moment those two drift apart, you get sessions that vanish from the sidebar, deleted conversations that come back as ghosts, titles that show the workspace name instead of the conversation, and moves you can't resume.

**DSH Session Enhance closes that gap.** Every operation is a real filesystem change — verified against the disk, rolled back on failure — so the sidebar and the files can no longer disagree.

## What it fixes

| You hit this… | …this plugin does that |
|---|---|
| Deleted sessions resurrect as ghosts | The real transcript directory is removed (3 retries for Windows handle release), `~/storages/*.json` is swept directly, and a post-delete check reports any leftover. Tombstones stop stale lists from resurrecting them. |
| A dragged session disappears from the sidebar | The files physically move — the transcript's header `cwd` is rewritten (zstd-frame-aware), verified, and auto-rolled-back on failure. Subagent children cascade; the projection cache is rehomed so the title survives. |
| Restart shows the workspace name, not the title | Projection identities are reconciled against physical headers at startup, and uncached titles are warmed in the background. |
| A moved session can't continue the conversation | Running sessions are flushed and detached first, the stale agent holding the detached session is released, and a currently-open session reopens automatically. |
| Manual file edits leave records out of sync | **同步记录** reconciles `~/storages/*.json` against the files on disk: ghosts purged, attribution fixed, missing entries restored. |
| `session.list` 500s from mixed artifacts | Opposite-encoding artifacts (plaintext vs zstd written by another instance) are cleaned up after moves and during sync. |

## ✨ On top of that

- 🗂️ **Archive management** — archive from the sidebar menu; search, sort, filter, restore and batch-delete in **设置 → 对话增强 → 归档管理**.
- 🔔 **Conversation notifications** — a background conversation finishing or needing your input pops a system notification while you're elsewhere.
- 📋 **Copy session ID** — one click in the sidebar menu, also on archived sessions.
- ⚙️ **Conversation Enhance settings** — `.dsh` home directory and the notification toggle, in **设置 → 对话增强 → 基础设置**.

## 📸 Screenshots

![Manage archived sessions](assets/screenshots/archived-sessions.png)

Manage archived sessions in **设置 → 对话增强 → 归档管理**: search, sort, filter by workspace, **同步记录**, restore and delete.

![Archive from the sidebar menu](assets/screenshots/archive-session-menu.png)

Archive any session straight from the sidebar session menu.

## 🚀 Install

Requires a working DeepSeek Harness **Web** setup (`dsh` on PATH, `web` profile initialized) and Node.js `^22.19.0 || >=24.0.0`.

```powershell
# From GitHub (latest commit)
dsh plugin --profile web add github:Tinger-X/dsh-session-enhance

# From npm (stable release)
dsh plugin --profile web add dsh-session-enhance

# From source (development)
git clone https://github.com/Tinger-X/dsh-session-enhance.git
cd dsh-session-enhance; pnpm install
dsh plugin --profile web add .

dsh --profile web --dump-config
```

Restart DSH Web and hard-refresh (Ctrl+F5). **对话增强** appears in Settings right after **Connectors**.

## 🎮 Quick start

- **Archive** — sidebar session menu → *Archive session*.
- **Manage** — 设置 → 对话增强 → 归档管理: search, sort, filter, restore, batch delete.
- **Sync** — hit **同步记录** after touching files or `storages/*.json`.
- **Move** — drag a session row onto another workspace group, or onto **未分组** to detach it.
- **Delete** — per-session / per-project / all, always confirmed.

## 📄 License

Apache-2.0.
