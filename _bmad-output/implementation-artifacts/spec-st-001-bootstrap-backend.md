---
title: 'ST-001: Bootstrap subtrack-backend from the template'
type: 'chore'
created: '2026-10-11'
status: 'in-progress'
route: 'dispatch'
review_loop_iteration: 0
repos: [subtrack-backend]
baseline_commit: { subtrack-backend: '6275905f164311efdf6281462606644054441282' }
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
- [x] **ST-001.2 Rename `InRealLife`→`SubTrack`.** Dirs, files and contents; solution → `subtrack-backend.slnx`; `Repository.cs` `SolutionFileName`; `.http`, `launchSettings.json`. Done when: no `InRealLife` match (case-insensitive) and build + test pass (Orleans still present).
- [x] **ST-001.3 Baseline commit.** Root commit on `main` (`~chore: import backend template as SubTrack [ST-001]`), record its hash in `baseline_commit`, create `feat/st-001-bootstrap-backend`. Done when: the branch exists and the spec holds the hash.

*Phase B: remove Orleans (ADR 0001, on the feature branch)*
- [x] **ST-001.4 Cut Orleans usage from kept projects.** Remove `UseOrleansClient` from `WebAPI/Program.cs`; strip `[GenerateSerializer]`/`[Id]` from `ServiceResult`, `VoidResultServiceResult`, `ServiceResultError`; remove the Orleans `ProjectReference`s from `Common`, `DomainModels`, `DTOs`, `WebAPI` and the `Grains.Abstractions` refs from `WebAPI`, `DomainServices`. Done when: build + test pass.
- [x] **ST-001.5 Delete the Orleans projects.** `src/Common/SubTrack.Common.Orleans`, `src/Grains/` (incl. its `CLAUDE.md`), `src/ApplicationServices/{Silo,Consumer,Publisher}`, `tests/UnitTests/SubTrack.Grains.UnitTests`, and their `.slnx` entries. Keep `Layer.Grains` in the architecture tests. Done when: build + test pass and `Layer.Grains` still exists.
- [x] **ST-001.6 Clean central packages.** Remove the Orleans group and `Microsoft.Orleans.Core.Abstractions` from `Directory.Packages.props`; drop `Microsoft.Extensions.Hosting` if unused. Done when: build passes with 0 warnings and no `Orleans|GenerateSerializer` match in code.
- [x] **ST-001.7 Fix template defects.** Duplicated props in `Common.csproj`, BOMs (UTF-8 without BOM, LF), wrong summary on the `VoidResultServiceResult(TErrorCode)` ctor. Done when: `dotnet format --verify-no-changes` exits 0.

*Phase C: PostgreSQL wiring*
- [x] **ST-001.8 Add EF Core packages.** EF Core, Npgsql provider, EF Design, DbContext health checks (latest 10.0.x, checked with `dotnet package search`), versions only in `Directory.Packages.props`. Done when: build passes.
- [x] **ST-001.9 Add the DbContext.** Empty `SubTrackDbContext` and `AddSubTrackDbContext(IServiceCollection, IConfiguration)` reading `ConnectionStrings:SubTrack` in `SubTrack.EntityFramework`. Done when: build + architecture tests pass.
- [x] **ST-001.10 Local Postgres + tools.** `devops/docker-compose.yml` (pinned major image, named volume, dev-only creds); `.config/dotnet-tools.json` pinning `dotnet-ef` 10.0.x. Done when: `docker compose -f devops/docker-compose.yml up -d` starts a healthy container and `dotnet ef --version` works.
- [x] **ST-001.11 Wire the WebAPI.** Register the DbContext, map `/health` with a DbContext check, dev connection string in `appsettings.Development.json` matching docker-compose. Done when: `GET /health` returns 200 `Healthy` with Postgres up and 503 with it stopped.

*Phase D: docs and finish*
- [x] **ST-001.12 Rewrite docs and Claude tooling.** Root and per-folder `CLAUDE.md`, `README.md`, `.claude/agents/structure-guardian.md`, `.claude/skills/*`: no Orleans, WebAPI-only run instructions, Postgres prerequisites, `ST-xxx` tickets, template origin (`f93b5a8`). Done when: `Orleans|InRealLife|GenerateSerializer` matches only ADR-reference prose.
- [ ] **ST-001.13 Final verification and review.** Run the three verification commands and the manual checks below, then `bmad-code-review` on the branch. Done when: all acceptance criteria hold.

**Acceptance Criteria:**
- Given the bootstrapped repo, when the three verification commands run, then all succeed with 0 warnings.
- Given the repo, when searching for `Orleans|InRealLife|GenerateSerializer` (case-insensitive) outside ADR-reference prose, then nothing matches.
- Given Postgres running from `devops/docker-compose.yml`, when the WebAPI starts in Development, then `GET /health` returns 200 `Healthy`; with Postgres stopped it returns 503.
- Given the architecture tests, when they run, then every remaining project passes and `Layer.Grains` still exists.

## Implementation Notes

## Spec Change Log

## Review Triage Log

### Review Findings

Code review 2026-10-11 of `feat/st-001-bootstrap-backend` (`6275905..c61f573`), 4 layers (blind-hunter,
edge-case-hunter, verification-gap, acceptance-auditor), none failed. All four ACs verified to hold.

- [x] [Review][Defer] No automated test covers the WebAPI wiring — `/health` (200/503) and the fail-fast on a missing `ConnectionStrings:SubTrack` are checked only by hand; nothing under `tests/` builds the host, so removing `AddDbContextCheck` or the `/health` route keeps `dotnet test` green. `tests/IntegrationTests/` is empty. [subtrack-backend/src/ApplicationServices/SubTrack.WebAPI/Program.cs:12] — deferred (owner decision 2026-10-11): build the WebAPI integration-test project in ST-004, which adds the first migration and needs DB tests anyway [medium; verification-gap+blind-hunter]
- [ ] [Review][Patch] Empty or whitespace connection string passes the `?? throw` guard and fails later inside Npgsql [subtrack-backend/src/Infrastructure/SubTrack.EntityFramework/ServiceCollectionExtensions.cs:13] [low; edge-case-hunter+blind-hunter]
- [ ] [Review][Patch] Missing final newline in the new `.config/dotnet-tools.json` and in the touched `Directory.Packages.props` (`.editorconfig` `insert_final_newline = true`; `dotnet format` does not check these) [subtrack-backend/.config/dotnet-tools.json] [low; blind-hunter+acceptance-auditor]
- [ ] [Review][Patch] Compose publishes Postgres with a committed password on all host interfaces; bind to `127.0.0.1:5432:5432` [subtrack-backend/devops/docker-compose.yml:12] [low; blind-hunter]
- [x] [Review][Defer] Garbled breaking-change bullet after removing SignalR: "…response shape (`ViewModels`), contract;" [subtrack-backend/.claude/skills/git-commit/SKILL.md:48] — deferred: fix edits an agent-context file (one-word fix) [low; all 4 layers]
- [x] [Review][Defer] ADR 0001 not enforced by tests: a new `src/Grains` project or `Microsoft.Orleans.*` package passes every architecture test [subtrack-backend/tests/ArchitectureTests/SubTrack.ArchitectureTests/ProjectReferenceTests.cs:17] — deferred: guard against future drift, not a regression; one `Fact` later [low; verification-gap+edge-case-hunter]
- [x] [Review][Defer] Architecture-test docs vs code on `Grains`: `tests/ArchitectureTests/CLAUDE.md:18` says unit tests reference a `Services` project while `FindProjectUnderTest` still accepts `Grains`; `AllowedReferences` lets Services/ApplicationServices reference `Grains`, root `CLAUDE.md` diagram does not [subtrack-backend/tests/ArchitectureTests/CLAUDE.md:18] — deferred: agent-context file [low; blind-hunter]
- [x] [Review][Defer] `structure-guardian` dropped the `Handler` naming rule with no WebAPI controller rule in its place, though its description now says to run it after adding a controller [subtrack-backend/.claude/agents/structure-guardian.md:3] — deferred: agent-context file [low; blind-hunter+edge-case-hunter]
- [x] [Review][Defer] Startup throws outside Development (only `appsettings.Development.json` sets the connection string) and no doc names the production source (`ConnectionStrings__SubTrack`) [subtrack-backend/src/ApplicationServices/SubTrack.WebAPI/Program.cs:11] — deferred: fail-fast is intended; document when deployment lands [low; edge-case-hunter+blind-hunter+acceptance-auditor]
- [x] [Review][Defer] Breaking-change guidance ignores shipped mobile clients (no API versioning, additive-only or deprecation rule) [subtrack-backend/.claude/skills/git-commit/SKILL.md:48] — deferred: belongs to ST-003 (contracts) [medium; blind-hunter]
- [x] [Review][Defer] `/health` mixes liveness and readiness; a liveness probe would restart the API during a DB outage [subtrack-backend/src/ApplicationServices/SubTrack.WebAPI/Program.cs:27] — deferred: unverified, no orchestrator/deployment exists yet; settle when one is chosen [maybe-false → medium if true; blind-hunter]
- [x] [Review][Defer] Migration workflow documents only `migrations add`, not `database update` or how migrations are applied (manual, startup, deploy step) [subtrack-backend/CLAUDE.md:30] — deferred: decide in ST-004 with the first migration [low; blind-hunter]
- [x] [Review][Defer] `src/Models/CLAUDE.md` serialization rule is ambiguous about `[JsonPropertyName]`/EF attributes on model types [subtrack-backend/src/Models/CLAUDE.md:25] — deferred: agent-context file; clarify in ST-003/ST-004 [low; blind-hunter]
- [x] [Review][Defer] Baseline `6275905` was pushed to `origin/main` while the spec says "no pushing" [subtrack-backend main] — deferred: unverified; `docs/PROJECT-STATUS.md` records the push as done, so confirm it was requested — if so, nothing to do [maybe-false → medium if unrequested; acceptance-auditor]

**Rejected:**
- low — `/health` blocks ~15 s (Npgsql default connect timeout) when the DB host is blackholed: local compose refuses fast; fix adds config.
- low — host port 5432 clashes with a local Postgres; fix adds a port variable kept in sync with appsettings.
- low — `restart: unless-stopped` restarts the dev DB with Docker: preference, not a defect.
- false — volume path breaks on Postgres 18: image is pinned to `postgres:17`.
- low — changing `POSTGRES_*` after first init has no effect: standard image behavior.
- false — documented `curl http://localhost:5053/health` gets a 307 under the https profile: `dotnet run` uses the first profile (`http`), so the documented command works.
- false — a `ServiceResult` with `Exception` could be serialized into a response: no controller exists and nothing returns one over HTTP.
- low — README says "Docker" not "Docker Compose v2": v1 is end-of-life.
- false — new convention in `src/Models/CLAUDE.md` breaks "no new architecture patterns": it replaces the removed Orleans rule; not an architecture pattern.
- low — `SubTrack.WebAPI.http` has no `/health` request: not required by the spec.
- low — `Handler` agent-noun exception removed (framework handlers may be flagged): speculative; folded into the structure-guardian defer above.

## Verification

**Commands (in `subtrack-backend/`):**
- `dotnet build subtrack-backend.slnx` -- expected: Build succeeded, 0 warnings, 0 errors
- `dotnet test --solution subtrack-backend.slnx` -- expected: all pass
- `dotnet format subtrack-backend.slnx --verify-no-changes` -- expected: exit 0

**Manual checks:**
- `docker compose -f devops/docker-compose.yml up -d`, then `dotnet run --project src/ApplicationServices/SubTrack.WebAPI` and `curl localhost:5053/health` → `Healthy`.
