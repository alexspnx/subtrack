# subtrack workspace

This folder is the **workspace root** for the subtrack project. It is a small git repo for planning and
coordination (BMAD, docs, scripts). The project code lives in separate git repos, cloned as sibling
folders by `node scripts/clone-repos.mjs` from `repos.json`. The root `.gitignore` is an include-list,
so project repos are never tracked here.

## Only for MacOS
Prefer the built-in Read, Grep, and Glob tools over Bash commands for searching and reading files. Avoid dynamic shell paths, wildcards, and variable expansions in Bash when possible to minimize permission prompts.

## Repos

| Folder | Purpose | Stack |
|---|---|---|
| _none registered yet. Add them to `repos.json` and run the clone script._ | | |

Each project repo has its own `CLAUDE.md` / `AGENTS.md`. Read it before changing that repo; its rules win
for code inside it.

## Hard rules

- **Git is per repo.** Git commands at the root affect only root files. For a project repo use
  `git -C <repo> …`. Never stage or commit project-repo files from the root, and never push, open PRs, or
  change remotes unless the user asks.
- **Run tooling inside the repo** it belongs to (build, test, lint, package installs).
- **Planning artifacts live at the root** in `_bmad-output/`, never inside a project repo.
- **Multi-repo rules for BMAD** (spec paths prefixed with the repo folder, per-repo baselines, branches
  and commits) are in `docs/workspace.md`. The BMAD overrides in `_bmad/custom/` load it automatically.
- When a root-level file or folder should be versioned, add a `!/<name>` line to `.gitignore`.

## Routing: BMAD or direct

Decide first whether the request needs BMAD. BMAD workflows are thorough and costly in tokens; use them
for real work, not for questions or chores.

**Do it directly (no BMAD):**
- Questions, explanations, code lookups, "where/how does X work".
- Running commands, builds, tests; checking status; git operations the user asks for.
- Trivial or mechanical edits: typos, renames, formatting, config/ignore-file tweaks, dependency bumps,
  one-line fixes whose cause is obvious.
- Edits the user dictates line by line.

**Use BMAD** (invoke the skill with the Skill tool, then follow it exactly):

| Request | Skill |
|---|---|
| Bug fix, feature, story, or any meaningful code change (one or many repos) | `bmad-build` |
| Vague idea that needs pressure-testing | `bmad-forge-idea` |
| Small/medium initiative that needs a written spec before building | `bmad-spec`, then `bmad-build` |
| New product or large multi-epic initiative | full track below |
| Research (market, technical, competitor, "help me choose") | `bmad-deep-recon` |
| User says "review" a diff/PR/branch | `bmad-code-review` |
| User says "review" a document (PRD, spec, architecture) | `bmad-review` |
| Big change of direction mid-sprint | `bmad-correct-course` |
| "Where are we / what next" on the sprint | `bmad-sprint-planning` (status) |
| Generate API/E2E tests for built features | `bmad-qa-generate-e2e-tests` |
| Walk the user through a change for human review | `bmad-walkthrough` |
| Epic finished | `bmad-retrospective` |
| Change how a BMAD skill behaves | `bmad-customize` |
| Unsure which BMAD step fits | `bmad-help` |

**Full planning track** (only for new products or large initiatives):
`bmad-product-brief` (or `bmad-prfaq`) → `bmad-prd` → `bmad-ux` (if UI) → `bmad-architecture` →
`bmad-create-epics-and-stories` → `bmad-sprint-planning` → `bmad-build` per story → `bmad-retrospective`
per epic. Check `_bmad-output/planning-artifacts/` first and resume from the first missing step instead of
starting over.

**Picking between `bmad-build`, `bmad-spec` and the full track:** if the request is a single user-facing
goal (even across backend + clients), go straight to `bmad-build`; it chooses its own quick or full route.
If it holds several independently shippable goals or open product decisions, use `bmad-spec` (which can
split into stories). Use the full track only when there is no PRD/architecture yet for a sizable product
area.

**Not by default:** persona agents (`bmad-agent-analyst`/`pm`/`architect`/`ux-designer`/`dev`), and
`bmad-party-mode`, only when the user names them. `bmad-build-auto` and `bmad-project-context` only when
invoked by name.

## Working with BMAD

- When a BMAD step says **HALT**, stop and wait for the user. Do not answer its questions yourself.
- BMAD skills render through `uv` (`_bmad/scripts/render_skill.py`); if `uv` is missing, tell the user.
- Planning output: `_bmad-output/planning-artifacts/`; specs and sprint status:
  `_bmad-output/implementation-artifacts/`; long-term knowledge: `docs/`.
- For cross-repo features from the root: one spec covering all affected repos, contract side (usually
  backend) first, then client repos in parallel subagents, one per repo (see `docs/workspace.md`).
- Recommend a fresh session (`/clear`) between major BMAD phases to keep context small.
- Never edit `_bmad/` (except `_bmad/custom/`) or the `bmad-*` skills in `.claude/skills/`; the installer
  overwrites them. Customize through `_bmad/custom/*.toml` (use `bmad-customize`).
- Update BMAD: `npx bmad-method@<version> install --directory . --action update` (pin a version).

## Keeping docs current

After any change that affects how this workspace is set up or used (repos, BMAD config, scripts,
conventions, planning milestones), use the `docs-update` skill to refresh `CLAUDE.md`, `README.md` and
`docs/workspace.md`.

## Commands

```bash
node scripts/clone-repos.mjs            # clone repos missing from the workspace
node scripts/clone-repos.mjs --pull     # also fast-forward clean existing repos
node scripts/clone-repos.mjs --status   # branch / dirty / ahead-behind per repo
```
