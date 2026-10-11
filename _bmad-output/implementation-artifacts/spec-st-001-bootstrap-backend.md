---
title: 'ST-001: Bootstrap subtrack-backend from the template'
type: 'chore'
created: '2026-10-11'
status: 'in-progress'
route: 'dispatch'
review_loop_iteration: 0
repos: [subtrack-backend]
baseline_commit: { subtrack-backend: '' }
context:
  - '{project-root}/docs/template-mapping.md'
  - '{project-root}/docs/decisions/0001-webapi-only-no-orleans.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `subtrack-backend/` is an empty repo. Every backend story (ST-003 onward) needs a solution that builds,
follows the template's layering and conventions, and reflects the owner decisions: no Orleans, the `SubTrack` naming, and PostgreSQL.

**Approach:** Copy `in-real-life-backend-example/` (HEAD `f93b5a8`) into `subtrack-backend/`. Rename `InRealLife.*` to
`SubTrack.*`, remove everything Orleans per ADR 0001, and update docs, architecture tests and Claude tooling to match.
Build, test and format must stay green.

## Boundaries & Constraints

**Always:** keep the template's layering, architecture tests, service result pattern, model kinds, naming,
coding/commit conventions and central package management. Keep `Layer.Grains` in the architecture tests (ADR 0001).
Package versions go only in `Directory.Packages.props`. Files are UTF-8 without a BOM, with LF line endings.

**Never:** no Identity registration, auth flows, entities or business endpoints (ST-004/ST-005). No new architecture
patterns (MediatR, repositories, CQRS). No pushing, remotes or PRs. No edits to `in-real-life-backend-example/`.
No CI workflow and no migrations in this story.

**Decisions (owner, 2026-10-11):**
- **Scope = bootstrap + Postgres wiring:** EF Core + Npgsql packages, an empty `SubTrackDbContext` registered from
  config, `devops/docker-compose.yml` for local Postgres, `/health` checking the DB, and a pinned `dotnet-ef` local
  tool. The first migration comes with ST-004 (Identity tables).
- **Git history = two-step:** the root commit on `main` is the template copied as-is plus only the
  `InRealLife`→`SubTrack` renames. That commit is the baseline. Everything else goes on `feat/st-001-bootstrap-backend`.

</frozen-after-approval>

## Code Map

- `in-real-life-backend-example/` -- source. Copy everything tracked (`git ls-files`); skip `bin/`, `obj/`, `.git/`.
- `.slnx`, `Repository.cs` (`SolutionFileName`), all `*.csproj`, namespaces, `.http`, `launchSettings.json` -- rename targets.
- `src/Common/InRealLife.Common.Orleans`, `src/Grains/*`, `src/ApplicationServices/{Silo,Consumer,Publisher}`,
  `tests/UnitTests/InRealLife.Grains.UnitTests` -- delete (ADR 0001).
- `src/Common/InRealLife.Common/{ServiceResult,VoidResultServiceResult,ServiceResultError}.cs` -- strip `[GenerateSerializer]`/`[Id]`.
- Orleans `ProjectReference`s to remove: `Common`, `DomainModels`, `DTOs`, `WebAPI`; `Grains.Abstractions` refs in `WebAPI`, `DomainServices`.
- `WebAPI/Program.cs` -- remove `UseOrleansClient`; keep controllers/OpenAPI.
- `src/Infrastructure/InRealLife.EntityFramework` -- home of the `DbContext` and its DI extension (may reference packages, not other Infrastructure).
- Template defects to fix in passing (mapping doc): duplicated props in `Common.csproj`, BOMs, the wrong summary on the `VoidResultServiceResult(TErrorCode)` ctor.
- Docs/tooling with Orleans text: root and per-folder `CLAUDE.md`, `README.md`, `.claude/agents/structure-guardian.md`, `.claude/skills/*`.

## Tasks & Acceptance

**Execution:** small tasks, done in order. Each ends green (build/test) unless noted, so work can stop after any of them.

*Phase A: import (on `main`)*
- [x] **ST-001.1 Copy the template.** Copy `git ls-files` of `in-real-life-backend-example/` into `subtrack-backend/` (skip `bin/`, `obj/`, `.git/`). Done when: the file lists match and `dotnet build` of the template solution passes.
- [ ] **ST-001.2 Rename `InRealLife`→`SubTrack`.** Dirs, files and contents; solution → `subtrack-backend.slnx`; `Repository.cs` `SolutionFileName`; `.http`, `launchSettings.json`. Done when: no `InRealLife` match (case-insensitive) and build + test pass (Orleans still present).
- [ ] **ST-001.3 Baseline commit.** Root commit on `main` (`~chore: import backend template as SubTrack [ST-001]`), record its hash in `baseline_commit`, create `feat/st-001-bootstrap-backend`. Done when: the branch exists and the spec holds the hash.

*Phase B: remove Orleans (ADR 0001, on the feature branch)*
- [ ] **ST-001.4 Cut Orleans usage from kept projects.** Remove `UseOrleansClient` from `WebAPI/Program.cs`; strip `[GenerateSerializer]`/`[Id]` from `ServiceResult`, `VoidResultServiceResult`, `ServiceResultError`; remove the Orleans `ProjectReference`s from `Common`, `DomainModels`, `DTOs`, `WebAPI` and the `Grains.Abstractions` refs from `WebAPI`, `DomainServices`. Done when: build + test pass.
- [ ] **ST-001.5 Delete the Orleans projects.** `src/Common/SubTrack.Common.Orleans`, `src/Grains/` (incl. its `CLAUDE.md`), `src/ApplicationServices/{Silo,Consumer,Publisher}`, `tests/UnitTests/SubTrack.Grains.UnitTests`, and their `.slnx` entries. Keep `Layer.Grains` in the architecture tests. Done when: build + test pass and `Layer.Grains` still exists.
- [ ] **ST-001.6 Clean central packages.** Remove the Orleans group and `Microsoft.Orleans.Core.Abstractions` from `Directory.Packages.props`; drop `Microsoft.Extensions.Hosting` if unused. Done when: build passes with 0 warnings and no `Orleans|GenerateSerializer` match in code.
- [ ] **ST-001.7 Fix template defects.** Duplicated props in `Common.csproj`, BOMs (UTF-8 without BOM, LF), wrong summary on the `VoidResultServiceResult(TErrorCode)` ctor. Done when: `dotnet format --verify-no-changes` exits 0.

*Phase C: PostgreSQL wiring*
- [ ] **ST-001.8 Add EF Core packages.** EF Core, Npgsql provider, EF Design, DbContext health checks (latest 10.0.x, checked with `dotnet package search`), versions only in `Directory.Packages.props`. Done when: build passes.
- [ ] **ST-001.9 Add the DbContext.** Empty `SubTrackDbContext` and `AddSubTrackDbContext(IServiceCollection, IConfiguration)` reading `ConnectionStrings:SubTrack` in `SubTrack.EntityFramework`. Done when: build + architecture tests pass.
- [ ] **ST-001.10 Local Postgres + tools.** `devops/docker-compose.yml` (pinned major image, named volume, dev-only creds); `.config/dotnet-tools.json` pinning `dotnet-ef` 10.0.x. Done when: `docker compose -f devops/docker-compose.yml up -d` starts a healthy container and `dotnet ef --version` works.
- [ ] **ST-001.11 Wire the WebAPI.** Register the DbContext, map `/health` with a DbContext check, dev connection string in `appsettings.Development.json` matching docker-compose. Done when: `GET /health` returns 200 `Healthy` with Postgres up and 503 with it stopped.

*Phase D: docs and finish*
- [ ] **ST-001.12 Rewrite docs and Claude tooling.** Root and per-folder `CLAUDE.md`, `README.md`, `.claude/agents/structure-guardian.md`, `.claude/skills/*`: no Orleans, WebAPI-only run instructions, Postgres prerequisites, `ST-xxx` tickets, template origin (`f93b5a8`). Done when: `Orleans|InRealLife|GenerateSerializer` matches only ADR-reference prose.
- [ ] **ST-001.13 Final verification and review.** Run the three verification commands and the manual checks below, then `bmad-code-review` on the branch. Done when: all acceptance criteria hold.

**Acceptance Criteria:**
- Given the bootstrapped repo, when the three verification commands run, then all succeed with 0 warnings.
- Given the repo, when searching for `Orleans|InRealLife|GenerateSerializer` (case-insensitive) outside ADR-reference prose, then nothing matches.
- Given Postgres running from `devops/docker-compose.yml`, when the WebAPI starts in Development, then `GET /health` returns 200 `Healthy`; with Postgres stopped it returns 503.
- Given the architecture tests, when they run, then every remaining project passes and `Layer.Grains` still exists.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands (in `subtrack-backend/`):**
- `dotnet build subtrack-backend.slnx` -- expected: Build succeeded, 0 warnings, 0 errors
- `dotnet test --solution subtrack-backend.slnx` -- expected: all pass
- `dotnet format subtrack-backend.slnx --verify-no-changes` -- expected: exit 0

**Manual checks:**
- `docker compose -f devops/docker-compose.yml up -d`, then `dotnet run --project src/ApplicationServices/SubTrack.WebAPI` and `curl localhost:5053/health` → `Healthy`.
