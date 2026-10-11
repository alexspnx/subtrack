# subtrack workspace

The root folder for the subtrack project. It gathers every project repo (backend, web app, iOS app,
Android app) in one place, so you can plan and build features across them with Claude Code and the
[BMAD Method](https://docs.bmad-method.org/).

This folder is its own small git repo. It holds only planning and coordination files. Each project repo
is cloned next to them and stays fully independent: git commands at the root never touch the project
repos.

## Prerequisites

- Git, with access to the project repos
- Node.js 20+ (clone script, BMAD installer)
- [uv](https://docs.astral.sh/uv/) (BMAD skills use it to render their workflows)
- [Claude Code](https://claude.com/claude-code)

## Getting started

```bash
git clone <this-workspace-repo-url> subtrack
cd subtrack
node scripts/clone-repos.mjs
claude
```

Then describe what you want in plain language. `CLAUDE.md` tells Claude when to use a BMAD workflow
(features, bug fixes, planning, reviews) and when to just answer or make the edit directly (questions,
small chores).

## Layout

```
subtrack/
├── CLAUDE.md               # instructions for Claude: BMAD routing, rules, repo table
├── README.md
├── repos.json              # project repos to clone (dir, url, optional branch)
├── scripts/
│   └── clone-repos.mjs     # clones / updates / reports on the project repos
├── docs/
│   └── workspace.md        # multi-repo rules that BMAD workflows follow
├── _bmad/                  # BMAD install (managed by the installer); overrides in _bmad/custom/
├── _bmad-output/           # BMAD artifacts: planning-artifacts/, implementation-artifacts/
├── .claude/skills/         # BMAD skills (bmad-*) and workspace skills (docs-update)
└── <project repos>/        # cloned from repos.json, ignored by this repo
```

## Project repos

None registered yet. Add an entry to `repos.json` for each repo, then run the clone script:

```json
{
  "repos": [
    { "dir": "backend", "url": "git@github.com:<org>/<repo>.git", "branch": "main" }
  ]
}
```

| Command | What it does |
|---|---|
| `node scripts/clone-repos.mjs` | Clones repos that are missing; leaves existing ones alone |
| `node scripts/clone-repos.mjs --pull` | Also fast-forwards existing repos that have no local changes |
| `node scripts/clone-repos.mjs --status` | Shows branch, clean/dirty and ahead/behind for each repo |
| `... --only backend,web` | Limits any of the above to some repos |

## Git

- The root `.gitignore` is an **include-list**: everything is ignored except the workspace files listed in
  it. Project repos are never committed here. To version a new root-level file, add a `!/<name>` line.
- For a project repo, run git inside it (`cd backend`, or `git -C backend …`), or ask Claude to.
- Feature work that spans repos uses the same branch name in each affected repo, with one local commit
  per repo. Claude never pushes unless asked. Details are in [`docs/workspace.md`](docs/workspace.md).

## BMAD

BMAD Method v6.12.1 (modules: core, bmm) is installed for Claude Code. Its workflows are exposed as
`bmad-*` skills in `.claude/skills/`. You normally don't call them yourself; Claude picks one when
the request calls for it. You can still name one ("run bmad-help", "use bmad-prd").

- Planning output goes to `_bmad-output/planning-artifacts/`; specs and sprint status go to
  `_bmad-output/implementation-artifacts/`.
- Team-wide BMAD customizations live in `_bmad/custom/*.toml` (committed). Personal ones go in
  `*.user.toml` (ignored).
- Update BMAD: `npx bmad-method@<version> install --directory . --action update`.
