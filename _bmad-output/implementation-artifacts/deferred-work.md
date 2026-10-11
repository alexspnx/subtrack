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

## Deferred from: code review of spec-st-003-contracts-and-recurrence-examples (2026-10-11)

- source_spec: `_bmad-output/implementation-artifacts/spec-st-003-contracts-and-recurrence-examples.md`
  summary: `src/Models/CLAUDE.md` attribute rules should say that `[ApiController]` automatic 400s are replaced by the contract's `errors` array, where JSON converter classes (e.g. Money) live, and whether an architecture test enforces "no attributes on DomainModels/DTOs/Entities".
  evidence: Default `ValidationProblemDetails` emits an `errors` dictionary without field codes, contradicting `docs/api-contract.md`; converters are logic, which `Models` forbids; no test checks attributes. Agent-context file, so deferred (pick up in ST-005).
- source_spec: `_bmad-output/implementation-artifacts/spec-st-003-contracts-and-recurrence-examples.md`
  summary: In `subtrack-backend/.claude/skills/git-commit/SKILL.md`, move "Additive changes listed there are `~`" out of the bulleted list of breaking cases and keep route/status-code changes visibly breaking.
  evidence: The sentence sits inside the `!` list and reads as one more breaking item. Agent-context file, so deferred.
- source_spec: `_bmad-output/implementation-artifacts/spec-st-003-contracts-and-recurrence-examples.md`
  summary: In `subtrack-backend/.claude/skills/git-commit/SKILL.md`, drop the redundant "API changes that the contract doc lists as additive … are `~`. Everything else is `~` too." and refer to the contract's breaking list instead of restating a partial copy (it omits defaults, sort orders, page-size limits, header meaning, optional→required).
  evidence: Review pass 2 of ST-003; a reader may take the shorter list as complete. Agent-context file, so deferred. (The earlier "sentence inside the breaking list" item is fixed in ST-003.)
- source_spec: `_bmad-output/implementation-artifacts/spec-st-003-contracts-and-recurrence-examples.md`
  summary: `subtrack-backend/CLAUDE.md:103` and `README.md:142` still say `devops/` is the only folder excluded from the `.slnx`; `docs/` (added by ST-003) is excluded too.
  evidence: Contributors or `structure-guardian` may flag `docs/` or add it to the `.slnx`. Agent-context file (CLAUDE.md), so deferred; one-line fix in both files.
