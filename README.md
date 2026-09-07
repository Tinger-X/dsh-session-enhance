# ⚡ DSH Session Enhance

**Conversation enhancement for DeepSeek Harness Web.** Manage sessions like a real tool, not a list of JSON files: archive and restore chats, guarantee physical deletion, drag sessions between workspaces, branch any conversation and switch freely, and get notified the moment a background conversation needs you.

![License](https://img.shields.io/badge/license-Apache--2.0-blue) ![DSH](https://img.shields.io/badge/DSH-0.1.1--rc.2-green) ![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-339933) ![Type](https://img.shields.io/badge/type-ESM-4B32C3)

[简体中文](README.zh-CN.md)

---

## What it is

`dsh-session-enhance` is a conversation-enhance plugin for **DeepSeek Harness (DSH) Web**. It exists to make every conversation in DSH easier to find, organise, clean up and come back to — so you spend less time wrestling the session list and more time talking.

At its core it treats the session list as a *view over the files on disk*, not as an authority of its own. Every operation below is a real, verified filesystem change — with rollback on failure — so the sidebar and the transcripts can never silently disagree again. Deleting a chat removes its files for good; dragging a chat between workspaces actually relocates its transcript; switching branches happens inside the same conversation without losing a single reply.

## Features

### 🗂️ Archive & restore
Archive any conversation from the session menu; archived rows get a clear badge and stay out of the way until you need them, then unarchive in one click. Archive state is orthogonal to workspace membership, so an archived chat keeps its place.

- Archive / unarchive per session, from the sidebar menu.
- **Archive Manager** (设置 → 对话增强 → 归档管理): search, sort by last-updated / created / name, filter by project, restore one / batch-restore (all, per project, or ungrouped).
- **Preview chat** — open any archived conversation read-only: turn-by-turn user / assistant / system view, tool calls and results, Markdown and inlined images.

### 🗑️ Guaranteed physical delete
"Delete" really deletes. The plugin removes everything and then proves it:

- Flushes and detaches a running session, then releases the agent that still holds it.
- Removes the transcript directory (with retries for Windows handle release) and cascades to its subagent children.
- Sweeps every trace of the session out of `~/storages/*.json`, the projection cache, the archive set and the workspace records.
- Verifies after deletion that nothing is left — and, if anything is, tells you.
- Tombstones the deleted id so a stale session list can never resurrect a ghost; a same-id *new* conversation is still recognised correctly.

Deletion confirmations spell out exactly what will be lost (conversation, child agents including running ones, caches). Delete a single session, or batch-delete every archived chat — all, one project, or the ungrouped set.

### 📦 Move between workspaces — by drag
Drag a session row onto another workspace group and its transcript **physically moves** to that project's folder. The session file's `cwd` header is rewritten (zstd-aware: header stays its own frame, layout is verified, rollback on any failure), the projection cache is re-homed so the title survives, and stale agents are released. If the dragged chat is the one you have open, it reopens automatically and stays usable. Moving to *Ungrouped* simply unassigns it. Reorder chats inside a workspace by dragging too.

### 🔔 Conversation notifications
Run a conversation, switch away — when it **finishes** or when it **needs your input** (approval, plan review, a question), a system notification pops up while the page isn't focused. Enable/disable under 基础设置.

### 📋 Copy session ID
One click in the session menu — works on archived sessions too.

### 🌳 Conversation tree
Every conversation is a **tree, not a line**. Each of your turns is a node; whenever you regenerate or edit an answer, a *new branch* forks off — the old replies are kept, not thrown away, and you can switch back at any time.

- A tree overview draws along the conversation: colour-coded branches, dots for each turn, lines that connect them; hover a dot to inspect a turn, click it to jump there.
- **Regenerate** — at any finished reply, rewind and regenerate from that turn (a "重新生成" button under the answer).
- **Edit & regenerate** — open any of your previous messages, change it, and let DSH continue from the new wording.
- **Switch branches** — at any fork point use the `‹ n/m ›` control to flip between alternate continuations of the same conversation.
- Safe by construction: if a deeper branch would be rewritten, the dangerous action is refused (and the button hidden) rather than risking orphaned content. Branch operations issued while an answer is still streaming are queued and replayed automatically when it finishes.

### 🔁 Records sync & self-healing
Because the session index can drift after manual edits or another DSH instance writing files:

- **同步记录** reconciles the stored records against the real transcripts: ghost entries purged, mis-assigned sessions moved to their real project, missing sessions re-accounted, projection-cache ghosts removed and identities re-homed.
- On startup the plugin re-aligns moved sessions' cached identities to their physical headers, so titles don't degrade to a workspace name after a restart.

### 🧹 Workspace & disk hygiene
- Manage workspaces from the sidebar: create one by picking an existing folder, rename, delete (sessions fall back to *Ungrouped*, files kept), and add a session inside a project.
- In the Archive Manager, deleting a project also removes its archived chats and, once empty, its on-disk folder.
- Empty workspace directories left behind on disk are listed and deletable.

### ⚙️ Settings
**设置 → 对话增强** has two tabs:
- **基础设置** — the `.dsh` home directory the plugin reads `storages` / `sessions` / `attachments` from (default `~/.dsh`, pick a folder or restore default), and the **对话通知** toggle.
- **归档管理** — everything described under archive above.

## Screenshots

![Settings](img/session-settings.png)

Basic settings under 设置 → 对话增强 → 基础设置.

![Archive manager](img/session-archive-manage.png)

Manage archived chats under 设置 → 对话增强 → 归档管理: search, sort, filter by project, 同步记录, restore and delete.

![Session preview](img/session-preview.png)

Preview archived chats under 设置 → 对话增强 → 归档管理.

![Sidebar session menu](img/session-menu.png)

Session actions in the workspace sidebar (archive, copy ID, delete, …).

![Conversation tree](img/session-tree.png)

The conversation tree of a branched session: every turn is a colour-coded node on the left rail, each finished answer can be **重新生成** (regenerate), any of your earlier messages can be **修改** (edited and regenerated), and at a fork point the `‹ n/m ›` control switches between alternate continuations of the same conversation.

![Conversation finished](img/session-end-notice.png)

Notification when a background conversation finishes.

![Conversation needs you](img/session-operate-notice.png)

Notification when a background conversation needs your input.

## Install

Requires a working DeepSeek Harness **Web** setup (`dsh` on PATH, `web` profile initialised) and Node.js `^22.19.0 || >=24.0.0`.

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

Restart DSH Web and hard-refresh (Ctrl+F5). The **对话增强** entry appears in Settings.

> Conversation-tree capabilities track the development branch. If you install the npm stable build and don't see the tree, update to the latest commit above.

## Quick start

- **Browse** — search, group by workspace (or a single list), sort by recency or manually, spot live status on each row.
- **Archive** — session menu → *Archive*; manage later in 设置 → 对话增强 → 归档管理.
- **Preview** — eye icon on an archived chat.
- **Delete** — session menu → *Delete session* (always confirmed). Batch: 归档管理 → per-group *Delete all*.
- **Move** — drag a session row onto another workspace group; drag to reorder inside a workspace.
- **Copy ID** — session menu → *Copy ID*.
- **Notify** — start a conversation and switch away.
- **Branch** — open a conversation: use *重新生成* under an answer or the edit button on one of your messages to fork a branch, and `‹ ›` at a fork point to switch.

## Roadmap

Ideas and work in progress, in no particular order:

- Open a workspace folder on disk.
- Scheduled archiving — automatically archive conversations that have been idle for a while.
- Batch archive / delete across the workspace, straight from the session list.
- Star conversations — pin them to the top of their workspace and exempt them from auto-archive.
- Conversation sharing — export / import a conversation tree (`.dshse-share`) and keep talking on the imported copy.
- Delete individual tree nodes / branches.
- Deeper conversation-tree controls, performance and stability.
- Conversation rollback that rewinds files changed mid-turn.
- More session ergonomics as they come up.

## License

Apache-2.0.
