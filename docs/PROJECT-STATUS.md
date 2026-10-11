# Project status

Last updated: 2026-10-11 (ST-001 done; PR for `feat/st-001-bootstrap-backend` not opened yet)

Single source of truth for where the project is and what comes next. Update it after every task, story or
decision (see the root `CLAUDE.md`).

## Current phase

**M0: validate and inspect.** Planning docs and stack decisions are done; the backend is bootstrapped
from the template (ST-001 done: all 13 tasks, code review passed). Next: merge ST-001, then ST-003 / ST-004.

## Repos

| Repo | State |
|---|---|
| `subtrack-backend/` | `main` pushed at baseline `6275905` (template renamed to `SubTrack`). Branch `feat/st-001-bootstrap-backend` (10 commits, tracks `origin`; the review-patch commit `140a405` is not pushed yet; no PR yet): Orleans removed, EF Core + Npgsql, `SubTrackDbContext`, `/health`, local Postgres compose, docs rewritten. Build 0 warnings, 86 tests pass, `dotnet format` clean. |
| `subtrack-web/` | Empty (no commits, nothing to push). |
| `subtrack-ios/` | Empty (no commits, nothing to push). |
| `subtrack-android/` | Empty (no commits, nothing to push). |

## Done

- Workspace root set up: BMAD installed, repos registered in `repos.json`, clone script.
- Product brief: `docs/subtrack-project-plan.md`.
- Backend template inspected and mapped: `docs/template-mapping.md`.
- ADR 0001: WebAPI only, no Orleans. ADR 0002: native iOS/Android + TypeScript web clients.
- **ST-001: Bootstrap `subtrack-backend` from the template** (spec `done`, 2026-10-11):
  `_bmad-output/implementation-artifacts/spec-st-001-bootstrap-backend.md`.
  - ST-001.1–.3: template (`f93b5a8`, 74 files) copied, renamed to `SubTrack`, committed as the root commit of `main` (`6275905`) and pushed; feature branch created.
  - ST-001.4–.7 (Orleans removal): Orleans usage, projects and packages removed; template defects fixed. `Layer.Grains` kept in the architecture tests.
  - ST-001.8–.11 (PostgreSQL): EF Core 10.0.12 + Npgsql 10.0.3, `SubTrackDbContext` + `AddSubTrackDbContext`, `devops/docker-compose.yml` (postgres:17), pinned `dotnet-ef` 10.0.12, WebAPI `/health` (200 `Healthy` with Postgres up, 503 `Unhealthy` with it stopped; checked by hand).
  - ST-001.12: root and per-folder `CLAUDE.md`, `README.md`, `structure-guardian` agent and `git-commit` skill rewritten for the WebAPI-only SubTrack backend.
  - ST-001.13: verification commands and `/health` check pass; `bmad-code-review` (4 layers) confirmed all 4 ACs. 3 low patches applied in `140a405` (whitespace connection-string guard, Postgres port bound to `127.0.0.1`, final newlines); 11 findings deferred to `_bmad-output/implementation-artifacts/deferred-work.md`; 11 rejected.

## In progress

Nothing.

## Next steps

1. Push `140a405` and open a PR for `feat/st-001-bootstrap-backend` into `main`.
2. ST-003 (contracts and recurrence examples; also pick up the deferred API-versioning rule).
3. ST-004 (account, Identity, owner isolation, first migration; also the WebAPI integration-test project and the migration apply strategy deferred from the ST-001 review).
4. Small cleanups from `deferred-work.md` when convenient (garbled git-commit skill bullet, Grains docs/tests, structure-guardian controller rule).

## Open decisions / blockers

- None blocking.
- Decided 2026-10-11: WebAPI integration tests (`/health`, missing connection string) are deferred from the ST-001 review to ST-004.
- Still open per the brief §16: durable-job integration (needed by ST-008).
