# Project status

Last updated: 2026-10-11 (ST-003 merged to `main` via PR #1; repos now work on `main` only)

Single source of truth for where the project is and what comes next. Update it after every task, story or
decision (see the root `CLAUDE.md`).

## Current phase

**M0: validate and inspect.** Planning docs and stack decisions are done; the backend is bootstrapped
from the template (ST-001 done) and the API contract is defined (ST-003 done), both on `main`. Next: ST-004.

## Repos

| Repo | State |
|---|---|
| `subtrack-backend/` | `main` pushed at `dbdfff3` (ST-001 fast-forwarded in at `140a405`; ST-003 `29c80ff` merged via PR #1 at `274f94f`; main-only workflow docs in `dbdfff3`; baseline was `6275905`): Orleans removed, EF Core + Npgsql, `SubTrackDbContext`, `/health`, local Postgres compose, docs rewritten. Build 0 warnings, 86 tests pass, `dotnet format` clean. ST-003 contract doc + fixture in `docs/`. Leftover branch `feat/st-003-contracts-and-recurrence-examples` (local and `origin`) is fully merged. |
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

- **ST-003: API contract conventions and recurrence examples** (spec `done`, 2026-10-11):
  `_bmad-output/implementation-artifacts/spec-st-003-contracts-and-recurrence-examples.md`. Docs + fixture only,
  `subtrack-backend` commit `29c80ff` on `feat/st-003-contracts-and-recurrence-examples` (baseline `140a405`).
  - `subtrack-backend/docs/api-contract.md`: normative wire rules (versioning, JSON, IDs, money, dates, errors,
    concurrency with `409 versionConflict`, idempotency, paging, ordering, date ranges, ownership) and the
    calculation rules (schedules, schedule versions, trial, lifecycle, prices, item validation, next renewal,
    exact monthly equivalent, forecast).
  - `subtrack-backend/docs/recurrence-examples.json`: 97 canonical cases for ST-006 and the clients,
    independently recomputed (all match).
  - Owner decisions: docs + fixture only; all active ISO 4217 currencies; phased breaking-change policy
    (`/api/v2` alongside `v1` for 6 months from the first public store release).
  - Review: 2 passes (3 layers). Pass 1 → spec amended and re-implemented; pass 2 → 12 patches. Items deferred
    to `deferred-work.md` (agent-context files: Models attribute rules vs automatic 400s, git-commit wording,
    `docs/` missing from the `.slnx`-exclusion lines).

## In progress

Nothing.

## Next steps

1. ST-004 (account, Identity, owner isolation, first migration; also the WebAPI integration-test project and the migration apply strategy deferred from the ST-001 review).
2. ST-005 picks up the contract plumbing: JSON options (camelCase, string enums, decimal-string money, `Z`
   timestamps), the `errors`-array ProblemDetails mapping replacing ASP.NET's default, the ISO 4217 table,
   `ServiceErrorCode.VersionConflict`.
3. Small cleanups from `deferred-work.md` when convenient (Grains docs/tests, structure-guardian controller rule,
   git-commit wording, `docs/` in the `.slnx`-exclusion lines).

## Open decisions / blockers

- None blocking.
- Decided 2026-10-11: every repo works and commits directly on `main` (no feature branches, no PRs); only `main` is pushed, and only when asked.
- Decided 2026-10-11: WebAPI integration tests (`/health`, missing connection string) are deferred from the ST-001 review to ST-004.
- Still open per the brief §16: durable-job integration (needed by ST-008).
