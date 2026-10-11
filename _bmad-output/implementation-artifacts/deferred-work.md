# Deferred work

## Deferred from: code review of spec-st-001-bootstrap-backend (2026-10-11)

- **No automated test for the WebAPI wiring → ST-004** (`subtrack-backend/src/ApplicationServices/SubTrack.WebAPI/Program.cs:12`): `/health` 200/503 and the missing-connection-string fail-fast are checked only by hand. Add `tests/IntegrationTests/SubTrack.WebAPI.IntegrationTests` (`WebApplicationFactory<Program>`) in ST-004. Reason: ST-004 adds the first migration and needs DB integration tests anyway (owner decision).

- **git-commit skill garbled bullet** (`subtrack-backend/.claude/skills/git-commit/SKILL.md:48`): "…response shape (`ViewModels`), contract;" left over from removing SignalR. One-word fix in an agent-context file.
- **ADR 0001 not enforced by tests** (`subtrack-backend/tests/ArchitectureTests/SubTrack.ArchitectureTests/ProjectReferenceTests.cs`): add a `Fact` asserting no project resolves to `Layer.Grains` and no `Microsoft.Orleans.*` package is referenced.
- **Architecture-test docs vs code on `Grains`** (`subtrack-backend/tests/ArchitectureTests/CLAUDE.md:18`): docs say unit tests reference `Services`; code still accepts `Grains`, and `AllowedReferences` allows `Grains` from Services/ApplicationServices unlike the root `CLAUDE.md` diagram.
- **structure-guardian has no controller rule** (`subtrack-backend/.claude/agents/structure-guardian.md`): the `Handler` rule was removed with nothing for WebAPI controllers (suffix, folder, thin, return ViewModels).
- **Production connection-string source undocumented** (`subtrack-backend/src/ApplicationServices/SubTrack.WebAPI/Program.cs:11`): startup throws outside Development by design; document `ConnectionStrings__SubTrack` (or user-secrets) when deployment lands.
- **API versioning for mobile clients** (`subtrack-backend/.claude/skills/git-commit/SKILL.md`): no rule on additive-only changes, versioning or deprecation windows for shipped iOS/Android builds. Belongs to ST-003.
- **Liveness vs readiness** (`subtrack-backend/src/ApplicationServices/SubTrack.WebAPI/Program.cs:27`): unverified until an orchestrator is chosen; `/health` checks the DB, so as a liveness probe it would restart the API during a DB outage.
- **Migration apply strategy** (`subtrack-backend/CLAUDE.md:30`): docs show `migrations add` only; decide and document `database update` / apply-at-startup / deploy step in ST-004.
- **Models serialization rule ambiguous** (`subtrack-backend/src/Models/CLAUDE.md:25`): say whether `[JsonPropertyName]`/`[JsonConverter]` and EF attributes are allowed on model types.
- **Baseline pushed to `origin/main`** (`subtrack-backend` `main` at `6275905`): spec says no pushing; `docs/PROJECT-STATUS.md` records it as done. Confirm it was requested; if so, nothing to do.
