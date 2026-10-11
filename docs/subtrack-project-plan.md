# SubTrack — Product and Engineering Brief

Date: 2026-10-11  
Audience: product owner, Claude Code, implementation and review agents  
Status: planning baseline; backend implementation blocked until the owner's template is supplied and inspected.

## 1. Read this first

SubTrack is a personal subscription and recurring-expense manager for web, iOS, and Android. It helps people understand recurring commitments, avoid surprise renewals, see price changes, and review subscriptions they may no longer need.

This document contains product requirements, proposed technical decisions, business rules, acceptance criteria, and a delivery plan. It is not evidence of an existing implementation. Keep requirements distinct from hypotheses and recommendations.

**Mandatory constraint:** the owner has an ASP.NET Core backend template and will provide it later. Follow its structure, patterns, dependency choices, conventions, authentication, persistence, testing, and deployment practices. Do not scaffold a competing backend or silently redesign the template. If it cannot support a requirement, document the exact conflict and propose the smallest change. Product behavior remains the target; technical recommendations below are subordinate to the template.

Until it arrives, agents may refine requirements, design screens, define provisional contracts, create client prototypes with fixtures, and write recurrence examples. They must not invent template paths, commands, abstractions, or package versions.

### Requirement labels

- **Required:** baseline product behavior or owner constraint.
- **Recommended:** default implementation approach, subject to template inspection.
- **Hypothesis:** business assumption requiring evidence.
- **Deferred:** outside the first release.

## 2. Product thesis and customer needs

### Positioning

“Know what renews, what it costs, and what deserves another month.”

Start with individuals managing streaming services, software, gym memberships, phone plans, insurance, and recurring household bills. Freelancers with personal and professional subscriptions are a secondary segment. Team procurement, accounting, and complex shared households are deferred.

Competition is a material risk. A polished dashboard alone is unlikely to differentiate the product. The initial hypothesis is that fast setup, trustworthy reminders, transparent forecasts, and a useful subscription-review flow can justify adoption. Validate that hypothesis before building integrations.

| Customer need | Product response | Success signal |
| --- | --- | --- |
| I forget renewal and trial deadlines | Upcoming calendar and configurable reminders | Users act on a reminder before renewal |
| I do not know my recurring commitments | Monthly-equivalent summary and date-based forecast | User adds at least three items and revisits |
| Prices rise without me noticing | User-recorded price history and change comparison | User recognizes a material increase |
| I pay for things I rarely use | Optional last-used/review date and review queue | User reviews or marks an item cancelled |
| My information is scattered across devices | One account and server-authoritative data | Edits appear on all three clients |
| I do not want to grant banking access | Manual-first onboarding | First useful view in a few minutes |

SubTrack tracks records and estimates. It does not charge the user's subscriptions, verify actual bank payments, or cancel services on their behalf. Marking an item cancelled changes SubTrack's record only. Make that limitation visible where users take the action.

### Validation before significant investment

1. Interview 8–12 people about the last renewal they regretted, current tracking habits, and willingness to enter subscriptions manually.
2. Test a clickable add-item, dashboard, and renewal-reminder flow with 5–8 people.
3. Run a small manual-entry beta. Measure setup completion, useful reminders, and repeat usage.
4. Ask about payment after demonstrated value. Treat €3–6/month as a pricing hypothesis, not a forecast or established willingness to pay.

## 3. Scope and release boundaries

| Capability | Initial private beta | Later release |
| --- | --- | --- |
| Account, preferences, cross-device sync | Required | Social sign-in if useful |
| Manual recurring-item CRUD | Required | Import and provider suggestions |
| Fixed recurring prices and free trials | Required | Variable bill estimates and richer schedules |
| Upcoming renewals and expense summaries | Required | Budgets and deeper comparisons |
| Reminder inbox and email | Required | Native push before public mobile launch |
| Native iOS and Android interfaces | Beta builds against the same API | Store release and device polish |
| Price history | Required, manually recorded | Automated detection through integrations |
| Subscription review queue | Simple explicit review date | More nuanced user-configured recommendations |
| Data export and account deletion | Required | CSV import and household sharing |
| Paid SubTrack premium | Deferred during beta | Server-verified billing and entitlements |
| Bank, card, and email scanning | Deferred | Separate feasibility and privacy project |
| AI recommendations | Deferred | Only with a measured benefit over simple rules |

Keep the first release focused on recurring commitments. A full daily-expense ledger, receipt OCR, bank reconciliation, and general budgeting suite would expand the project substantially.

## 4. User journeys and interfaces

### Onboarding

Create an account, choose timezone and default currency, add the first item, and see its next renewal and estimated cost. Default currency may be EUR, but let the user choose. Explain reminder permissions after a reminder is configured, rather than demanding every permission at first launch. Seed examples only in a clearly labelled demo mode; never pollute a real account.

### Add a recurring item

Enter name, type (subscription or bill), category, amount, currency, billing frequency, first/anchor billing date, status, and optional provider URL or notes. Preview the next three occurrences before saving. Require an explicit trial-end date and first paid date when adding a free trial. Optional cancellation deadline is separate from the charge date.

### Dashboard and renewals

Show monthly-equivalent commitment, expected charges this calendar month, upcoming renewals for the next 30 days, trials ending, and items due for review. Each number must identify whether it is an estimate. Show a list fallback for charts. Offer sort/filter by date, cost, category, and status.

### Item detail and changes

Show schedule, upcoming occurrences, price history, reminders, and recorded lifecycle changes. Editing a price requires an effective billing date. A future change should not overwrite historical prices. Changing a schedule previews the consequences and invalidates obsolete reminder jobs.

### Review and cancellation

A review queue uses user-entered review dates or last-used information; it does not claim to know real service usage. Let the user mark “keep,” “review later,” or “cancelled with provider.” The cancellation action includes a provider link if available and a reminder to complete cancellation externally. No claimed savings until the user records cancellation; even then label them estimated avoided future cost.

### Screen inventory

1. Sign in, registration, verification, recovery.
2. First-run setup and add-first-item.
3. Dashboard.
4. Subscription/bill list with search and filters.
5. Add/edit form with schedule preview.
6. Item detail and price history.
7. Renewal calendar/list.
8. Reminder inbox and notification preferences.
9. Review queue.
10. Settings, devices, export, and account deletion.

Recommended UI: restrained personal-finance styling, clear totals, generous spacing, accessible contrast, and explicit dates. Mobile uses a compact bottom navigation; desktop uses a sidebar and wider lists. Support keyboard operation, screen readers, dynamic text, loading/empty/error states, and decimal/date localization. Keep currency and timezone independent of interface language. English first; localization-ready strings, with Greek a sensible later addition.

## 5. Domain rules: money, recurrence, and lifecycle

These rules are normative until the owner explicitly changes them. The server owns calculations; clients may preview results but must reconcile with server output.

### Money and totals

- Store money as decimal values or exact minor units compatible with the template, with ISO currency codes. Never use floating-point arithmetic for money.
- Validate allowed decimal precision by currency. API monetary values should be decimal strings to avoid JavaScript precision loss; document parsing and rounding centrally.
- Beta supports mixed-currency records, but totals are grouped by currency. Never sum EUR and USD as if equivalent.
- Currency conversion is deferred. A future converted summary needs a rate source, timestamp, base currency, and “estimate” label; historical totals must retain their original currency and rate policy.
- Monthly equivalent is a comparison metric, not a forecast: monthly amount = amount; quarterly = amount/3; yearly = amount/12; weekly = amount*52/12; every N days = amount*365/(N*12). Display rounded currency values after summing exact contributions. Explain the 52-week/365-day approximation.
- Calendar-month forecast enumerates eligible scheduled billing dates in the month and applies the price effective on each date. Annual subscriptions contribute their entire charge only in their billing month.
- No “actual spent” metric without confirmed payment records. A forecast is never a payment ledger.

### Supported schedules

Initial frequencies: weekly, monthly, quarterly, yearly, and every N days. N must be an integer in a bounded, documented range (recommend 1–366). Arbitrary recurrence expressions are deferred.

- Store billing dates as date-only values. Store operational timestamps as UTC instants. Store the user's IANA timezone for reminder scheduling.
- Preserve the original anchor date/day. Monthly and quarterly dates clamp to the last valid day of a month but do not drift: January 31 → February 28 → March 31.
- Yearly February 29 clamps to February 28 in non-leap years, returning to February 29 in leap years.
- Weekly and every-N-days schedules advance in calendar days from the anchor, not fixed UTC-hour intervals.
- A billing occurrence has a stable identity based on item, schedule version, and scheduled billing date. Do not advance the recurrence based on when a worker happens to run.
- When the anchor is in the past, calculate the next occurrence directly from it; do not produce an unbounded history during a dashboard request.
- “Next renewal” means the next eligible billing date on or after today in the user's timezone. Today's occurrence remains visible until tomorrow because no payment confirmation exists.
- Schedule edits take effect on an explicit date, preserve prior history, and replace future projections. The first beta may restrict edits to today or later; state that limit in the UI.

### Lifecycle

Use explicit transitions for Trial, Active, Paused, and Cancelled, with effective dates. Archive is a visibility flag, not cancellation.

- Trial: free until its explicit end date, with an explicitly configured first paid date and recurring paid price. Forecast paid charges only from that first paid date. Do not infer successful provider billing.
- Active: eligible scheduled occurrences appear in forecasts.
- Paused: exclude occurrences during the pause interval. Resume requires a selected next billing date and re-established anchor; avoid guessing provider policy.
- Cancelled: exclude charges on or after cancellation effective date. Charges before that date can remain in forecasts. Record cancellation externally with the provider separately from this tracking action.
- Archived: hide from normal lists; lifecycle still governs forecasting. Warn when archiving an active item because it does not stop reminders or projected charges.

### Edge-case acceptance examples

| Case | Expected behavior |
| --- | --- |
| €120 annual plan renewing on December 15 | €10 monthly equivalent; €0 October forecast; €120 December forecast |
| €10 monthly plan anchored on January 31, 2027 | February 28 and March 31 renewals |
| Annual anchor February 29, 2028 | February 28, 2029; February 29, 2032 |
| Price €10 until May 31, €12 from June 1 | May occurrences use €10; June occurrences use €12 |
| Free trial ends May 10, first paid charge May 11 | Trial reminder targets May 10; first charge is May 11 |
| Cancellation effective June 15 | June 14 occurrence included; June 15 occurrence excluded |
| EUR and USD records | Two currency totals; no combined unlabeled total |
| Concurrent edits from two devices | Second stale edit rejected; user can refresh and resolve |
| Worker restarts or duplicate execution | Existing delivery record reused; no new logical reminder |

## 6. Reminders and reliability

Recommended defaults: renewal reminder 3 days before billing; trial reminder 2 days before trial end; local delivery time 09:00. Allow users to disable channels and select a bounded offset list. A cancellation deadline, when provided, can be a separate reminder target.

Recommended architecture: durable database-backed reminder jobs, polled by a worker using the template's existing scheduler. If absent, assess a database-backed background-job library before building custom infrastructure. An in-memory timer alone is insufficient.

1. Calculate jobs from eligible occurrences and user preferences, including a generation/version marker.
2. Convert target local date/time to UTC. For a nonexistent DST time use the next valid local instant; for an ambiguous time use the earlier occurrence. Test this policy.
3. Acquire jobs atomically with a lease so several workers cannot freely dispatch the same job.
4. Recheck ownership, item state, schedule version, user preferences, and account-deletion state immediately before dispatch.
5. Persist channel-specific attempts, provider IDs, next retry time, and final state. Retry transient failures with bounded exponential backoff and jitter; disable invalid push tokens.
6. Use a unique deduplication key such as user + item + target type + occurrence date + offset + channel + generation. Preference edits must cancel superseded jobs before creating replacements.

External provider calls and database writes cannot be made perfectly atomic. Use provider idempotency where supported and document that a crash after acceptance can cause a duplicate email/push. Promise durable scheduling and bounded retries, not exactly-once delivery or guaranteed device receipt. Distinguish queued, provider-accepted, failed, and read states; provider acceptance is not proof of receipt.

Beta catch-up policy: if a reminder is late by at most 24 hours and its target date is not past, send it once; otherwise mark expired. Preference/timezone changes reschedule future jobs. Do not issue retroactive reminders for newly added historical items. Test cancellation and edit races against a worker already holding a lease.

In-app inbox is canonical. Email is the first external channel. Native push is a separate platform adapter, required before a public mobile launch; browser push is deferred. Ask for consent contextually and make denied permissions recoverable. Keep lock-screen content minimal by default.

## 7. Technical recommendation

### Architecture

Use one ASP.NET Core backend deployable, a relational database, and a durable worker. This is a small modular application, not a microservice system. Modules may include recurring items, forecasts, notifications, and account/preferences, organized according to the owner's template. Orleans, Kafka, Redis, object storage, and Kubernetes are not required for the first release. Reuse any of these only if the template or a measured need warrants them.

### Clients

Recommended default: TypeScript + React Native + Expo + Expo Router for one universal application targeting web, iOS, and Android. This matches the predominantly forms/list/calendar product and reduces duplicated work. Expo supports web development; see the official source list below. Universal does not mean every component is identical: isolate platform-specific authentication storage, notifications, date inputs, navigation details, and accessibility behavior.

Run a short proof of concept before committing: responsive dashboard, add form, sign-in redirect, accessible web list, and native notification registration on real devices. If desktop tables/charts or accessibility become excessively awkward, use a separate React web client and share TypeScript contracts, validation helpers, and domain-independent utilities with Expo mobile. Do not select two clients before this evidence exists.

Recommended client state: a server-state query cache with invalidation after mutations; minimal local UI state. Generate API types/client from OpenAPI using a pinned tool. Validate runtime responses where needed. Use a shared theme and lightweight component primitives; evaluate chart/calendar dependencies for accessibility, native support, licensing, and maintenance before adopting them.

### Backend and database

ASP.NET Core is required. Prefer a supported LTS runtime compatible with the template; .NET 10 is an LTS option as of this brief. Do not upgrade the template without inspecting compatibility. PostgreSQL is a default candidate, but use SQL Server or another supported relational database if that is the template's standard. Preserve its EF Core/Dapper choice and migration strategy.

Use a relational transaction for mutation plus reminder/outbox state changes. Prefer ordinary SQL indexes and queries initially. Add caching only after measuring a specific bottleneck; never cache user data without ownership-aware keys and invalidation.

### Authentication

Follow the template's established authentication mechanism. If absent, record a decision comparing a managed OIDC provider with ASP.NET Core Identity; do not implement custom password or token cryptography. Browser sessions should use secure HttpOnly cookies where the architecture allows, with CSRF protection for cookie-authenticated mutations. Native OIDC clients use authorization code + PKCE via the system browser and OS-protected credential storage. Do not assume an Identity API bearer token is an OAuth/OIDC server. Define logout, refresh, revocation, email verification, and recovery explicitly.

### Online behavior

Beta is online-first. A cached view may be displayed with a stale-data indicator, but mutations require a server response. Disable misleading “saved” messages while offline. Offline queues and merge semantics are deferred. Cross-device freshness uses normal refetching after edits, focus, and reconnect; realtime sockets are unnecessary initially.

## 8. Conceptual data model

Names describe responsibilities; map them to the supplied template rather than imposing these classes or tables literally.

| Entity | Main fields and responsibility |
| --- | --- |
| UserPreferences | Owner ID, timezone, default currency, locale, reminder time and channel preferences |
| RecurringItem | ID, owner, name, type, category, status, archive flag, provider URL, notes, version |
| BillingScheduleVersion | Item, effective range, anchor date, frequency, interval, schedule version |
| PriceVersion | Item, effective billing date, amount, currency; no overlapping effective ranges |
| LifecycleChange | Item, transition, effective date, optional pause end/resume anchor |
| TrialDetails | Item, trial end, first paid date; valid relationship to paid schedule |
| ReminderRule | Item/user, target type, days before, channel, enabled |
| ReminderJob | Owner/item, target date, UTC due time, generation, dedup key, lease, state |
| NotificationAttempt | Job, channel, attempt count, provider reference, retry and sanitized error |
| NotificationInboxItem | Owner, type, target reference, created/read timestamps |
| DeviceRegistration | Owner, platform, push token, last seen, disabled timestamp |
| ReviewRecord | Item, last-used date if volunteered, next review date, last review result |

All private queries and mutations scope by authenticated owner. IDs alone confer no access. Enforce uniqueness, foreign keys, valid dates, positive intervals, nonnegative prices, and ownership at the correct layer. Use optimistic concurrency via the template's mechanism; map stale updates to a documented conflict response.

Forecast occurrences can be calculated on demand over bounded horizons. Materialize only the upcoming horizon needed for reminders (recommend 90 days, continuously replenished). Do not pre-generate decades of recurring rows. Account deletion must erase dependent history, jobs, devices, inbox data, and exports according to the documented retention policy; soft deletion alone is insufficient for final erasure.

## 9. Provisional API contract

Follow template routing, versioning, DTOs, errors, paging, and validation. Paths below express capabilities and are not final scaffolding instructions.

| Capability | Suggested endpoint |
| --- | --- |
| Profile/preferences | GET/PATCH /api/v1/me/preferences |
| List/create items | GET/POST /api/v1/recurring-items |
| Read/edit/delete item | GET/PATCH/DELETE /api/v1/recurring-items/{id} |
| Change status | POST /api/v1/recurring-items/{id}/transitions |
| Record effective price | POST /api/v1/recurring-items/{id}/prices |
| Schedule preview | POST /api/v1/recurrence-preview |
| Forecast and summary | GET /api/v1/dashboard?from=...&to=... |
| Upcoming occurrences | GET /api/v1/renewals?from=...&to=... |
| Reminder rules | GET/PUT /api/v1/recurring-items/{id}/reminders |
| Inbox/read action | GET /api/v1/notifications; PATCH /api/v1/notifications/{id} |
| Register/remove device | POST/DELETE /api/v1/devices |
| Review item | POST /api/v1/recurring-items/{id}/reviews |
| Export/delete account | POST /api/v1/me/export; DELETE /api/v1/me |

Contract requirements: date-only ISO dates, UTC ISO timestamps, decimal-string monetary values, explicit currency, documented enums, bounded date ranges and page sizes, deterministic ordering, and machine-readable field errors. Do not expose persistence entities directly. Use structured errors consistent with the template. Requests must never select their own owner ID.

Use idempotency for retryable create/transition operations where duplicate execution matters. Scope keys by owner and operation, store request fingerprint and response for a defined lifetime, and reject reuse with a different payload. Safe retries should not create two subscriptions.

User-supplied provider links must be validated as allowed web URL schemes. Never fetch arbitrary provider URLs from the backend for logos or previews. Do not accept notes as executable HTML.

## 10. Security, privacy, and operations

- Test ownership isolation for item IDs, notifications, device tokens, exports, and nested resources.
- Enforce TLS, secure secret storage, least-privilege database accounts, login/API rate limits, and dependency checks.
- Redact tokens, email contents, personal notes, and amounts from operational logs unless explicitly needed and access-controlled. Avoid provider raw payload dumps.
- Export through an authenticated download or short-lived, account-bound access mechanism. Protect CSV exports from formula injection if CSV is added.
- Handle unverified-email abuse and notification costs with quotas and rate limits. Email reminder preference is separate from marketing consent.
- Document collection, retention, processors, user export/deletion, and backup expiry before public release. Obtain an appropriate privacy/legal review for EU launch; this brief is not a legal compliance assessment.
- Use structured logs, correlation IDs, exception tracking, health/readiness checks, and metrics for API latency/error rate, worker lag, retries, and expired jobs.
- Keep local, test, and production separate. Run the API, worker, and database reproducibly with the template's development tooling; containers are recommended where compatible.
- Use managed relational hosting and backups initially. Perform a restore exercise before public launch. Deployment migrations need a reviewed rollout and recovery procedure; destructive database rollback is not an automatic recovery strategy.

Provisional beta targets, to validate with representative data: common API requests p95 below 500 ms at 25 concurrent users with 100 items each; reminder queue processing normally within 5 minutes of due time; critical email queue backlog alert after 15 minutes. These are engineering targets, not delivered SLAs. Measure provider acceptance separately from app/device delivery.

## 11. Monetization and cost control

Run the private beta free. Test freemium afterward: a generous basic tracker and reminders, with premium potentially adding advanced forecasts, imports, configurable review workflows, and household features. Do not withhold export or account deletion as paid features. Avoid making essential reminder reliability a premium claim.

€3–6/month is an initial pricing hypothesis. Validate annual pricing, trial policy, churn, support demand, and net margin after platform fees, taxes, and infrastructure. No revenue projection is established here.

SubTrack's own paid membership is distinct from user-tracked recurring items. Before selling digital premium features in native apps, verify current Apple/Google rules for the intended markets and purchase flows. Evaluate web billing, native purchases, restore purchases, refunds, grace periods, account linking, and server-verified entitlements. Never unlock paid access from a client boolean. Signed webhook processing needs idempotency and reconciliation. This is a later milestone, not part of manual tracking CRUD.

Cost model: API/worker hosting + database/backups + email volume + monitoring + optional build services + app-store memberships + support. Obtain current vendor quotes before selecting providers. Instrument email and worker costs early; avoid external calls on every dashboard render.

## 12. Backend-template intake: required first implementation milestone

When the template is provided, Claude Code must inspect it before editing production backend code.

1. Read repository instructions, CLAUDE.md, solution/project files, SDK pins, dependency management, and configuration examples.
2. Identify architecture, module boundaries, naming, request pipeline, persistence, auth, authorization, validation, errors, scheduler, logging, tests, and CI.
3. Run the documented baseline build/tests if available. Report pre-existing failures separately.
4. Produce a mapping with actual files and extension points. Classify each need as reuse, extend, missing, or conflict.
5. Record exact verified commands and environment prerequisites. Never guess secret values or silently replace tooling.
6. Propose only necessary new packages with purpose, compatibility, licensing, and alternatives.
7. Resolve blocking conflicts with the owner, then implement the first vertical slice in the template's style.

Required mapping output:

| Product need | Existing template mechanism and real path | Smallest extension | Decision/blocker |
| --- | --- | --- | --- |
| Account and owner scoping | To inspect | To inspect | Blocking until known |
| Item CRUD and transactions | To inspect | To inspect | Blocking until known |
| Recurrence/price domain logic | To inspect | To inspect | Product rules in section 5 |
| Durable jobs/outbox | To inspect | To inspect | Reliability review required |
| OpenAPI/client generation | To inspect | To inspect | Contract mapping required |
| Tests and CI | To inspect | To inspect | Use verified commands |

Do not force Clean Architecture, CQRS, repositories, MediatR, or a new unit of work because an agent prefers them. Preserve the supplied template's approach. An unsupported runtime is a compatibility issue to report, not permission to rewrite the backend.

## 13. Claude Code working agreement

### Document placement and context budget

Store this file as `docs/subtrack-project-plan.md` in the eventual project. Keep root `CLAUDE.md` short: project purpose, template constraint, authoritative document links, actual commands, and non-obvious invariants. Do not put this entire brief into automatically loaded context. Use scoped instructions for backend and client conventions after real folders exist.

Maintain small durable planning files when implementation begins:

- `docs/template-mapping.md`: actual backend extension points and verified commands.
- `docs/decisions/`: short architecture decisions with context, choice, and consequences.
- `docs/backlog.md`: task IDs, dependencies, scope, acceptance criteria, status.
- `docs/progress.md`: current slice, completed validation, blockers, next action.

These are recommended documents, not existing files. For multiple repositories, use a workspace-level brief plus repository-local instructions; execute builds and tests in the correct repository. Do not assume a root agent automatically coordinates independent repos.

### Suggested root CLAUDE.md excerpt

```markdown
# SubTrack
Read docs/subtrack-project-plan.md sections relevant to the task.
Read docs/template-mapping.md before backend implementation.
The owner's backend template governs architecture and conventions.
If the template is absent, backend implementation is blocked.
Do not invent paths, commands, dependencies, or completed validation.
Scope every private operation to the authenticated owner.
Use exact money; retain currency; preserve billing anchors.
Forecasts are estimates, not confirmed payments.
Implement one bounded vertical slice with its acceptance criteria.
Run the relevant verified checks and report their actual results.
Update backlog/progress; record material decisions without duplicating this brief.
```

Add real build/test/lint commands only after inspecting the repositories.

### Task execution loop

1. Read the current backlog/progress, relevant brief sections, applicable repo instructions, and affected code.
2. Identify one task, dependencies, observable behavior, and acceptance cases. Clarify only genuinely blocking ambiguity.
3. Inspect existing implementation and tests. Propose a short plan for nontrivial changes.
4. Implement the smallest complete slice following template patterns.
5. Run targeted tests/checks, including failure and ownership cases for affected APIs.
6. Review the diff for money/date errors, auth isolation, races, logging leaks, and contract drift.
7. Summarize files changed, behavior, checks actually run, remaining risks, and next task; update progress.

Do not implement the entire backlog from a broad “build the app” prompt. Avoid unnecessary abstractions, repeated full-repository reads, large speculative dependency installs, and unrelated refactoring. Do not claim a check passed if it was skipped or blocked.

Optional specialized agents later: product analyst, backend implementer, client implementer, QA, and reviewer. Delegate only when requested and when tasks have disjoint write ownership. Contracts and domain rules need a single coordinating owner. A few useful roles beat a large permanent agent hierarchy. Review findings should identify severity, actual file/line, reproduction, impact, and a concrete correction; omit speculative generic warnings.

Skills can capture repeated template-intake, contract-update, recurrence-review, or release-check workflows after those workflows stabilize. MCP integrations are optional: prefer existing repository/test tools, add only a concrete needed capability, and give minimal access. Do not send personal financial records to an external AI provider by default. Keep credentials out of instructions and committed files.

### Ready-to-use initial prompt

```text
Read docs/subtrack-project-plan.md. Treat product requirements as the baseline
and the owner's backend template as authoritative for technical conventions.
First report whether the template is available. If absent, do not scaffold a
backend: refine the backlog, draft contracts, or prototype client screens with
clearly labelled fixtures. If present, inspect it, run its documented baseline
checks, and create docs/template-mapping.md using real paths and commands.
Then propose the smallest first vertical slice and its acceptance criteria.
List genuine blocking questions; make routine reversible choices explicitly.
Do not implement subsequent milestones before the first slice is verified.
```

## 14. Delivery milestones and estimates

Planning estimate for one experienced backend engineer learning the client stack, working roughly 10–15 focused hours/week with AI assistance. These are ranges, not commitments. Template quality, existing auth, mobile experience, and beta feedback can change them substantially. Full-time calendar delivery may be faster; integration/store review delays do not scale linearly with hours.

| Milestone | Deliverable and exit gate | Effort |
| --- | --- | --- |
| M0: validate and inspect | Interviews, scope baseline, template mapping, client feasibility spike | 15–25 hours |
| M1: first vertical slice | Authenticated user creates/lists one item; migration, owner isolation, real client/API round trip | 20–35 hours |
| M2: trusted calculations | Recurrence, lifecycle, effective prices, dashboard and renewal views with edge-case tests | 30–50 hours |
| M3: durable reminders | Inbox + email, retries, deduplication, restart/edit/cancellation tests | 25–45 hours |
| M4: private cross-platform beta | Responsive web, iOS/Android test builds, export/deletion, observability, restore drill | 30–50 hours |
| M5: public mobile readiness | Native push, real-device QA, accessibility, privacy materials, release builds and store preparation | 25–45 hours |
| M6: monetization | Validated pricing, billing architecture, verified entitlements, restore/refund tests | Separate estimate after policy/provider decisions |

M0–M4 totals roughly 120–205 hours, or 8–21 weeks at the stated availability. M5 adds roughly 2–5 weeks plus external release delays. Do not equate code generation speed with product readiness.

### Initial agent backlog

| ID | Task | Depends on | Acceptance |
| --- | --- | --- | --- |
| ST-001 | Inspect backend template and produce mapping | Template supplied | Real paths/commands; baseline checks; gaps recorded |
| ST-002 | Universal-client feasibility spike | None | Web and native form/dashboard demonstrable; platform gaps recorded |
| ST-003 | Define contracts and recurrence examples | ST-001 for final contracts | Money/date/error semantics and boundary examples agreed |
| ST-004 | Account/preferences and owner isolation | ST-001 | Two users cannot read or mutate each other's resources |
| ST-005 | Create/list/edit item slice | ST-003, ST-004 | Real client/API/storage round trip; invalid/stale edits handled |
| ST-006 | Recurrence and effective-price engine | ST-003, ST-005 | All section 5 examples pass with deterministic time |
| ST-007 | Dashboard and renewal UI | ST-006 | Forecast vs equivalent clear; mixed currency grouped |
| ST-008 | Durable inbox/email reminders | ST-006 | Restart, retries, obsolete-job invalidation and race tests pass |
| ST-009 | Reviews, export, account deletion | ST-005, ST-008 | Review semantics clear; export isolated; jobs stop on deletion |
| ST-010 | Beta release and operating checks | ST-002, ST-007–009 | Three clients checked; backups restored; failures observable |
| ST-011 | Native push/public release | ST-010 | Permission denial/token rotation/deep links tested on devices |

## 15. Verification and definition of done

Prioritize tests that protect behavior rather than mirroring implementation.

- Domain unit tests: month-end anchors, leap years, interval boundaries, price effective dates, trials, pause/resume, cancellation, rounding, currency grouping.
- Database/API integration tests: owner scoping, transactions, unique job keys, stale edits, idempotent retries, validation, deletion. Use the actual database engine where semantics matter.
- Worker tests: controlled clock, two workers, restart, lease expiry, provider timeout, crash window, preferences changing, job invalidation.
- Client tests: add/edit validation, loading/error/empty states, stale response handling, monetary/date formatting, accessible critical journeys.
- End-to-end smoke checks: sign in → add → dashboard → edit → reminder inbox → export/delete on web; equivalent core flow on physical iOS and Android devices before public release.
- Release checks: build/tests/lint, dependency review, migration safety, no committed secrets, telemetry and restore validation.

A task is done when its acceptance criteria hold, it follows the actual template, appropriate checks pass, contracts/docs reflect the change, and known limitations are stated. A public release additionally requires functioning account recovery/deletion, durable reminders, real-device checks, operational visibility, and reviewed privacy/store requirements.

## 16. Decisions still open

Blocking for backend work: template location/content; supported runtime and database; authentication mechanism; durable-job integration; verified development/test commands.

Nonblocking defaults in this brief: individual users first; manual entry; fixed prices; currency-grouped totals; online-first operation; universal Expo client subject to spike; email + inbox beta; free private beta; no bank/email scanning or automatic provider cancellation.

Resolve later using evidence: separate web client, paid limits/pricing, localization sequence, household sharing, imports, exchange-rate conversion, and automatic discovery. Keep a decision log rather than silently expanding scope.

## 17. Official references and freshness

Technical recommendations were checked against official sources on 2026-10-11. Recheck versions, support, SDK capabilities, vendor costs, and store policies at implementation time. The product choices, effort ranges, and pricing are this plan's recommendations/hypotheses, not claims established by these sources.

- Expo web support: https://docs.expo.dev/workflow/web/
- Expo progressive web apps and native/offline tradeoffs: https://docs.expo.dev/guides/progressive-web-apps/
- ASP.NET Core Identity overview: https://learn.microsoft.com/aspnet/core/security/authentication/identity
- .NET 10 LTS overview: https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-10/overview
- .NET support policy: https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core
- Anthropic guidance on CLAUDE.md: https://claude.com/resources/articles/using-claude-md-files
- Anthropic guidance on instructions, skills, hooks, and agents: https://claude.com/resources/articles/steering-claude-code-skills-hooks-rules-subagents-and-more

**Next action:** supply the backend template, perform ST-001, and use its results to finalize contracts and the first implementation slice.
