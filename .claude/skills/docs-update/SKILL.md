---
name: docs-update
description: Keeps the workspace root CLAUDE.md, README.md and docs/workspace.md in sync with reality. Use proactively, without being asked, right after finishing any change that alters how this workspace is set up or worked in - repos added, removed or renamed in repos.json; BMAD installed, updated, reconfigured or customized (_bmad/, _bmad/custom/); root scripts, skills, agents or settings added or changed; .gitignore include-list changed; workflow, branching or commit conventions changed; a planning milestone finalized (PRD, architecture, epics, sprint plan); or a project repo's role, stack or build commands changed. Skip for routine code changes inside a project repo, questions, and edits that are only to these docs.
user-invocable: false
---

# Docs update

Keep the workspace's root documentation accurate after an important change. Edits are small and targeted;
this is maintenance, not a rewrite.

## Which file owns what

| File | Audience | Owns |
|---|---|---|
| `CLAUDE.md` | Claude | How to work here: BMAD routing, rules, repo table, key commands. Must stay short — it loads into every session. |
| `README.md` | Humans | What the workspace is, setup, layout, repo list, how to start work. |
| `docs/workspace.md` | BMAD workflows | Multi-repo rules for specs, VCS, commits. Loaded as a persistent fact by the `_bmad/custom/*.toml` overrides. |

Project repos keep their own `CLAUDE.md` / `README.md`; only touch those if the change was inside that repo
and its own conventions call for it.

## Steps

1. **Name the change** in one sentence (what changed, where). If it does not affect anything a reader of
   the files above relies on, stop — no update needed.
2. **Check the facts on disk** instead of trusting memory:
   - Repos: `repos.json`, and which repo folders actually exist at the root.
   - BMAD: `_bmad/_config/manifest.yaml` (version, modules), `_bmad/custom/` (overrides).
   - Skills / scripts: `ls .claude/skills scripts`.
   - Planning state: `ls _bmad-output/planning-artifacts _bmad-output/implementation-artifacts`.
3. **Find the stale lines** in each file from the table above. Grep for the old name, path, version or
   command rather than rereading everything.
4. **Edit minimally.** Change only stale or missing lines. Keep each file's existing structure, tone and
   section order. Never duplicate content across files — link instead (README → CLAUDE.md →
   docs/workspace.md). Keep `CLAUDE.md` terse; move long explanations to `docs/`.
5. **Keep tables in sync:** the repo table in `CLAUDE.md` and the repo list in `README.md` must match
   `repos.json` (dir, purpose, stack).
6. **Report** in one line which files were updated and why. Do not commit; root commits happen only when
   the user asks.
