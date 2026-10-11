# Backend template mapping (ST-001)

Inspected 2026-10-11. Template: `in-real-life-backend-example/` (workspace root, not tracked; git HEAD
`f93b5a8`). Target repo: `subtrack-backend/` (empty, no commits, remote `alexspnx/subtrack-backend`).
Product rules: [`subtrack-project-plan.md`](subtrack-project-plan.md). Template rules: its root `CLAUDE.md` plus one `CLAUDE.md` per
`src/*` and `tests/*` folder.

## What the template is

A **structural skeleton** for a .NET backend. It is not a running feature. It fixes:

- **Runtime:** `net10.0`. The SDK is pinned to `10.0.100` with `rollForward: latestFeature` (`global.json`).
- **Layering** `Common -> Models -> Infrastructure / *.Abstractions -> Grains / Services -> ApplicationServices`,
  checked by `tests/ArchitectureTests` (reads `.csproj` and `.slnx` from disk).
- **Microsoft Orleans 10.3.1 as load-bearing.** Every host is an Orleans silo or client. Orleans packages are
  referenced only through `InRealLife.Common.Orleans`.
- **Deployables** in `src/ApplicationServices/`: `Silo` (Worker SDK), `WebAPI` (controllers + `Microsoft.AspNetCore.OpenApi`),
  `Consumer` (Kafka/RabbitMQ worker), and `Publisher` (broker producer *or* SignalR).
- **Service result pattern:** every public service method returns `ServiceResult<T>` or
  `VoidResultServiceResult`, with `ServiceErrorCode` = `GenericError | ValidationError | DatabaseError | Conflict | NotFound`.
- **Model kinds kept separate:** `DomainModels` (no suffix), `DTOs` (messaging), `ViewModels` (API
  request/response), and `Entities` (EF, `*Entity`), mapped through `InRealLife.Mapper`.
- **Conventions:** central package management (`Directory.Packages.props`), file-scoped namespaces and
  braces as build errors, summaries only on interface members and model properties, xUnit v3 on
  Microsoft.Testing.Platform. Commit subjects follow `<~|!><scope>: <message> [<TICKET>]`.
- **Claude tooling:** `.claude/agents/structure-guardian.md`, `.claude/skills/git-commit`, `.claude/skills/sync-docs`,
  and `.claude/settings.json` (allows dotnet build/test/format/restore and read-only git).

It deliberately leaves open: database provider, EF Core packages, auth, validation, the HTTP error shape,
the mapping library, logging/telemetry, background jobs, integration tests, CI (`devops/` holds only `.gitkeep`).

## Verified commands (run in the template, 2026-10-11, macOS arm64, SDK 10.0.100)

```bash
dotnet build in-real-life-backend-example.slnx                  # Build succeeded, 0 warnings, 0 errors
dotnet test --solution in-real-life-backend-example.slnx        # 121 passed, 0 failed (architecture tests; unit test projects are empty)
dotnet format in-real-life-backend-example.slnx --verify-no-changes   # exit 0
```

Prerequisite: .NET 10 SDK. Running the hosts locally requires starting `Silo` before `WebAPI` (not exercised; neither host does anything yet).

## Pre-existing template issues (not caused by SubTrack)

- `src/Common/InRealLife.Common/InRealLife.Common.csproj` repeats `TargetFramework`/`ImplicitUsings`/`Nullable`.
  This goes against the template's own "don't repeat in a `.csproj`" rule.
- `InRealLife.Common.csproj` and `InRealLife.Common.Orleans.csproj` start with a UTF-8 BOM. The rule is "UTF-8 without BOM".
- `VoidResultServiceResult(TErrorCode value)` has a "Create a new successful result" summary, but it creates a failure.

## Need-by-need mapping

| Product need | Template mechanism (real path) | Smallest extension | Decision / blocker |
|---|---|---|---|
| Runtime / SDK | `global.json`, `Directory.Build.props` (`net10.0`) | none | Reuse. Matches the plan's .NET 10 LTS. |
| Deployable shape | `src/ApplicationServices/{Silo,WebAPI,Consumer,Publisher}` | Keep `WebAPI` only; remove `Silo`, `Consumer`, `Publisher` | **Decided:** WebAPI only, no Orleans ([ADR 0001](decisions/0001-webapi-only-no-orleans.md)). |
| Account and owner scoping | none (`app.UseAuthorization()` with no scheme) | Auth registration in `WebAPI/Program.cs`. Current-user id passed explicitly into services. | **Missing.** ASP.NET Core Identity decided; flows defined in ST-004. |
| Persistence / transactions | `src/Infrastructure/InRealLife.EntityFramework` (empty), `src/Models/InRealLife.Entities` (empty); no EF package in `Directory.Packages.props` | Add EF Core + provider packages; `DbContext` + configurations in `EntityFramework`; `*Entity` classes in `Entities`; migrations in `EntityFramework` | **Missing.** PostgreSQL decided. CRUD goes service -> `DbContext` (ADR 0001). |
| Optimistic concurrency | none | EF concurrency token (e.g. Postgres `xmin` or a version column) -> `ServiceErrorCode.Conflict` -> HTTP 409 | Extend. Follows the DB choice. |
| Recurrence / price / money domain logic | `src/Services/InRealLife.DomainServices` (+ `.Abstractions`), `src/Models/InRealLife.DomainModels` | Pure services (e.g. `RecurrenceCalculationService`) returning `ServiceResult<T>`; `decimal` + ISO currency; `DateOnly` billing dates | Reuse. Rules come from plan §5.  |
| Timezone / DST policy | none | `TimeZoneInfo` (IANA works on Linux/macOS) or NodaTime | Decide later, with ST-006/ST-008. Not blocking for M1. |
| API surface, OpenAPI | `WebAPI/Program.cs`: `AddControllers`, `AddOpenApi`, `MapOpenApi` (dev only) | Controllers stay thin. `ViewModels` for request/response bodies. Expose the OpenAPI doc for client generation. | Reuse. Routes, versioning and paging conventions are not set by the template, so adopt the plan §9 shapes. |
| HTTP errors / validation | `ServiceErrorCode` only; no HTTP mapping, no validator | One `ServiceResult` -> `ProblemDetails` mapping in `WebAPI` (`ValidationError`->400, `NotFound`->404, `Conflict`->409). DataAnnotations on `ViewModels` (allowed by `src/Models/CLAUDE.md`). | Extend. May need new `ServiceErrorCode` values (e.g. `Forbidden`) per the template rule. |
| Mapping | `src/Infrastructure/InRealLife.Mapper` (empty, no library) | Hand-written mapping extensions, or Mapperly (source-generated, MIT) | Missing. Default hand-written. |
| Durable reminder jobs / outbox | `...HostedService` naming convention (template example lived in `Silo`) | DB-backed `ReminderJob` table + leased polling `...HostedService` registered in `WebAPI`; split into its own Worker host later if needed | Reliability review in M3. Not blocking M1. |
| Email channel | `src/Services/InRealLife.ClientServices` (+ `.Abstractions`) = outbound calls | `EmailSendingService` behind `IEmailSendingService` | Provider choice later (M3). |
| Logging / health / metrics | default `ILogger` only | Health checks + structured logging in hosts | Missing. M4. |
| Unit tests | `tests/UnitTests/*` (xUnit v3, empty, `--ignore-exit-code 8`); no mocking library | Recurrence tests in `DomainServices.UnitTests`; remove the placeholder `PropertyGroup` once tests exist | Reuse. |
| Integration tests (owner isolation, DB) | `tests/IntegrationTests/` reserved, empty; the layer is already allowed in the architecture tests | `SubTrack.IntegrationTests` (`WebApplicationFactory` + real DB, e.g. Testcontainers) | Missing. Needed by M1 for the owner-isolation gate. Postgres via Testcontainers or a local instance; decide in M1. |
| CI | `devops/` (empty) | GitHub Actions running the three verified commands | Missing. Small, can come with M1. |

## Owner decisions (2026-10-11)

1. **Orleans:** dropped. WebAPI is the only deployable. See [ADR 0001](decisions/0001-webapi-only-no-orleans.md).
2. **Database:** PostgreSQL, through EF Core and the Npgsql provider. Package versions are pinned in
   `Directory.Packages.props` when the persistence slice adds them.
3. **Authentication:** ASP.NET Core Identity. ST-004 must still define the flows explicitly, per plan §7:
   - cookies + CSRF for web, a token flow for native, refresh, logout/revocation, email verification and recovery;
   - Identity's bearer tokens are not an OAuth/OIDC server.
4. **Naming:**
   - `InRealLife.*` becomes `SubTrack.*`, and the solution becomes `subtrack-backend.slnx`. The
     `Repository.SolutionFileName` constant in the architecture tests changes with it.
   - Commit subjects use the `ST-xxx` ticket prefix, e.g. `~chore: bootstrap solution from template [ST-001]`.

## Still open

- **Mapping:** hand-written or Mapperly. Default: hand-written until the mapping volume justifies a library.
- **Timezone library:** `TimeZoneInfo` or NodaTime. Decide in ST-006, against the plan §6 DST policy.
- **Email provider:** M3.
