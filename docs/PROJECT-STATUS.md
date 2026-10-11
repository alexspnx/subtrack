# Project status

Last updated: 2026-10-11 (ST-001 spec approved; ST-001.1 done)

Single source of truth for where the project is and what comes next. Update it after every task, story or
decision (see the root `CLAUDE.md`).

## Current phase

**M0: validate and inspect.** Planning docs and stack decisions are done; the backend is being
bootstrapped from the template (ST-001, phase A: import, 1 of 3 tasks done).

## Repos

| Repo | State |
|---|---|
| `subtrack-backend/` | Template files copied (ST-001.1), uncommitted: `main` still has no commits. Still named `InRealLife.*` and still has Orleans until ST-001.2 / ST-001.4–.5. |
| `subtrack-web/` | Empty. |
| `subtrack-ios/` | Empty. |
| `subtrack-android/` | Empty. |

## Done

- Workspace root set up: BMAD installed, repos registered in `repos.json`, clone script.
- Product brief: `docs/subtrack-project-plan.md`.
- Backend template inspected and mapped: `docs/template-mapping.md`.
- ADR 0001: WebAPI only, no Orleans. ADR 0002: native iOS/Android + TypeScript web clients.
- ST-001 spec drafted, split into 13 tasks, and approved (2026-10-11):
  `_bmad-output/implementation-artifacts/spec-st-001-bootstrap-backend.md`.
- ST-001.1: template (`f93b5a8`, 74 tracked files) copied into `subtrack-backend/`; the copied solution builds with 0 warnings.

## In progress

**ST-001: Bootstrap `subtrack-backend` from the template.** Spec status: `in-progress` (approved 2026-10-11).

| Task | Phase | Status |
|---|---|---|
| ST-001.1 Copy the template | A: import | Done |
| ST-001.2 Rename `InRealLife`→`SubTrack` | A: import | To do |
| ST-001.3 Baseline commit + feature branch | A: import | To do |
| ST-001.4 Cut Orleans usage from kept projects | B: remove Orleans | To do |
| ST-001.5 Delete the Orleans projects | B: remove Orleans | To do |
| ST-001.6 Clean central packages | B: remove Orleans | To do |
| ST-001.7 Fix template defects | B: remove Orleans | To do |
| ST-001.8 Add EF Core packages | C: PostgreSQL | To do |
| ST-001.9 Add the DbContext | C: PostgreSQL | To do |
| ST-001.10 Local Postgres + `dotnet-ef` tool | C: PostgreSQL | To do |
| ST-001.11 Wire the WebAPI (`/health`) | C: PostgreSQL | To do |
| ST-001.12 Rewrite docs and Claude tooling | D: finish | To do |
| ST-001.13 Final verification and review | D: finish | To do |

## Next steps

1. ST-001.2: rename `InRealLife`→`SubTrack` in `subtrack-backend/` (solution file is still `in-real-life-backend-example.slnx`).
2. Work through ST-001.3 – ST-001.13 in order; tick each off here and in the spec.
3. After ST-001: ST-003 (contracts and recurrence examples) and ST-004 (account, Identity, owner isolation).

## Open decisions / blockers

- None blocking ST-001.
- Still open per the brief §16: durable-job integration (needed by ST-008).
