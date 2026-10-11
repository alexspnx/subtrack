# Project status

Last updated: 2026-10-11 (ST-001.1–.12 done; ST-001.13 reviewed, 3 low patches open; feature branch pushed)

Single source of truth for where the project is and what comes next. Update it after every task, story or
decision (see the root `CLAUDE.md`).

## Current phase

**M0: validate and inspect.** Planning docs and stack decisions are done; the backend is bootstrapped
from the template (ST-001: 12 of 13 tasks done; verification and code review done, 3 low review patches open).

## Repos

| Repo | State |
|---|---|
| `subtrack-backend/` | `main` pushed at baseline `6275905` (template renamed to `SubTrack`). Branch `feat/st-001-bootstrap-backend` (9 commits, pushed to `origin` 2026-10-11, no PR yet): Orleans removed, EF Core + Npgsql, `SubTrackDbContext`, `/health`, local Postgres compose, docs rewritten. Build 0 warnings, 86 tests pass, `dotnet format` clean. |
| `subtrack-web/` | Empty (no commits, nothing to push). |
| `subtrack-ios/` | Empty (no commits, nothing to push). |
| `subtrack-android/` | Empty (no commits, nothing to push). |

## Done

- Workspace root set up: BMAD installed, repos registered in `repos.json`, clone script.
- Product brief: `docs/subtrack-project-plan.md`.
- Backend template inspected and mapped: `docs/template-mapping.md`.
- ADR 0001: WebAPI only, no Orleans. ADR 0002: native iOS/Android + TypeScript web clients.
- ST-001 spec drafted, split into 13 tasks, and approved (2026-10-11):
  `_bmad-output/implementation-artifacts/spec-st-001-bootstrap-backend.md`.
- ST-001.1–.3: template (`f93b5a8`, 74 files) copied, renamed to `SubTrack`, committed as the root commit of `main` (`6275905`) and pushed; feature branch created.
- ST-001.4–.7 (Orleans removal): Orleans usage, projects and packages removed; template defects fixed. `Layer.Grains` kept in the architecture tests.
- ST-001.8–.11 (PostgreSQL): EF Core 10.0.12 + Npgsql 10.0.3, `SubTrackDbContext` + `AddSubTrackDbContext`, `devops/docker-compose.yml` (postgres:17), pinned `dotnet-ef` 10.0.12, WebAPI `/health` (200 `Healthy` with Postgres up, 503 `Unhealthy` with it stopped; checked by hand).
- ST-001.12: root and per-folder `CLAUDE.md`, `README.md`, `structure-guardian` agent and `git-commit` skill rewritten for the WebAPI-only SubTrack backend.

## In progress

**ST-001: Bootstrap `subtrack-backend` from the template.** Spec status: `in-progress` (approved 2026-10-11).

| Task | Phase | Status |
|---|---|---|
| ST-001.1 Copy the template | A: import | Done |
| ST-001.2 Rename `InRealLife`→`SubTrack` | A: import | Done |
| ST-001.3 Baseline commit + feature branch | A: import | Done |
| ST-001.4 Cut Orleans usage from kept projects | B: remove Orleans | Done |
| ST-001.5 Delete the Orleans projects | B: remove Orleans | Done |
| ST-001.6 Clean central packages | B: remove Orleans | Done |
| ST-001.7 Fix template defects | B: remove Orleans | Done |
| ST-001.8 Add EF Core packages | C: PostgreSQL | Done |
| ST-001.9 Add the DbContext | C: PostgreSQL | Done |
| ST-001.10 Local Postgres + `dotnet-ef` tool | C: PostgreSQL | Done |
| ST-001.11 Wire the WebAPI (`/health`) | C: PostgreSQL | Done |
| ST-001.12 Rewrite docs and Claude tooling | D: finish | Done |
| ST-001.13 Final verification and review | D: finish | In progress: verification and `/health` pass; code review done (all 4 ACs hold): 3 low patches open as action items, 11 deferred (`_bmad-output/implementation-artifacts/deferred-work.md`), 11 rejected |

## Next steps

1. ST-001.13: apply (or drop) the 3 low review patches in the spec's *Review Findings* section: empty connection-string guard, final newlines in `.config/dotnet-tools.json` and `Directory.Packages.props`, compose port bound to `127.0.0.1`. Then tick the task here and in the spec and set the spec status to `done`.
2. Open a PR for `feat/st-001-bootstrap-backend` (pushed, no PR yet).
3. After ST-001: ST-003 (contracts and recurrence examples; also pick up the deferred API-versioning rule) and ST-004 (account, Identity, owner isolation, first migration; also the WebAPI integration-test project and the migration apply strategy deferred from the ST-001 review).

## Open decisions / blockers

- None blocking ST-001.
- Decided 2026-10-11: WebAPI integration tests (`/health`, missing connection string) are deferred from the ST-001 review to ST-004.
- Still open per the brief §16: durable-job integration (needed by ST-008).
