# Multi-repo workspace rules

These rules apply to every BMAD workflow run from this workspace. They are loaded as persistent facts
through the overrides in `_bmad/custom/`, and they win over any step that assumes a single repository.

## Layout

- The workspace root (`subtrack/`) is its own git repo. It holds planning and coordination only: BMAD
  (`_bmad/`, `.claude/skills/`), BMAD output (`_bmad-output/`), long-term knowledge (`docs/`), the
  repo manifest (`repos.json`), and `scripts/`.
- Project code lives in the repos listed in `repos.json`, cloned as sibling folders at the root:
  `subtrack-backend/`, `subtrack-web/`, `subtrack-ios/`, `subtrack-android/`. Each is an independent git repo. The root
  `.gitignore` is an include-list, so these folders are never tracked by the root repo.
- Planning artifacts (briefs, PRDs, UX, architecture, epics, specs, sprint status) are written to the
  root `_bmad-output/` and are shared by every repo. Never write them inside a project repo.

## Specs and stories

- Every task, file path and Code Map entry in a spec starts with the repo folder, for example
  `subtrack-backend/src/Api/Users/UsersController.cs`, so it is clear which repo each change lands in.
- A spec lists the repos it touches in its frontmatter as `repos: [subtrack-backend, subtrack-web]`.
- One user-facing goal may span several repos. Do not split a story only because it crosses repos.
- Order cross-repo work by contract: the side that defines an API, schema or event (usually `subtrack-backend`)
  is implemented and verified first; clients (`subtrack-web`, `subtrack-ios`, `subtrack-android`) follow and are built against it.
- Once the contract is fixed, independent client repos can be implemented by parallel subagents, one per
  repo, each given the spec and told which repo it owns.

## Version control

"The repository", "the working tree", "HEAD" and "commit" in any BMAD step mean each affected project
repo, never the workspace root, unless the change is only to root files (docs, BMAD config, scripts).

- **Sanity check:** run `git -C <repo> status` and `git -C <repo> branch --show-current` for every
  affected repo. A dirty tree or mismatched branch in any of them is a HALT-and-ask condition. Changes
  in the root repo's `_bmad-output/` and `docs/` are expected and do not count as dirty.
- **Branches:** when an affected repo is on its default branch, create the same feature branch name in
  every affected repo (for example `feat/<spec-slug>`) before changing code.
- **Baseline:** record one commit per repo in the spec frontmatter, as
  `baseline_commit: { subtrack-backend: <full sha>, subtrack-web: <full sha> }`.
- **Diff for review:** build one unified diff covering all affected repos, with paths prefixed by the
  repo folder: `git -C <repo> diff --src-prefix=a/<repo>/ --dst-prefix=b/<repo>/ <baseline>` per repo,
  plus each untracked file via `git -C <repo> ls-files --others --exclude-standard` and
  `git -C <repo> diff --no-index /dev/null <file>`. Do not `git add` to build the diff.
- **Commits:** commit locally in each affected repo separately, using that repo's own commit-message
  convention (see its `CLAUDE.md`). Never push, open PRs, or touch remotes unless the user asks.
- **Root repo:** never stage or commit project-repo files from the root. Commit root changes (specs,
  sprint status, docs) only when the user asks.

## Working inside a project repo

- Before changing a repo, read its own `CLAUDE.md` / `AGENTS.md` and follow its conventions. Repo
  rules win over general preferences for code inside that repo.
- Run build, test, lint and format commands from inside that repo (`cd <repo> && …` or the tool's
  directory flag), never from the root.
- Implementation and review subagents must be told which repo folder(s) they work in.
