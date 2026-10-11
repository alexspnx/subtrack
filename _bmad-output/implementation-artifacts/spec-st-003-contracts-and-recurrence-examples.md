---
title: 'ST-003: Define API contract conventions and recurrence examples'
type: 'chore'
created: '2026-10-11'
status: 'done'
route: 'dispatch'
review_loop_iteration: 1
repos: [subtrack-backend]
baseline_commit: { subtrack-backend: '140a405ad94121e686d8927f39c05c63796bb1b9' }
context:
  - '{project-root}/docs/subtrack-project-plan.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** ST-005 (CRUD) and ST-006 (recurrence engine) and all three clients need one agreed answer to how
money, dates, enums, errors, concurrency, idempotency, paging and API versions look on the wire, and a fixed
set of recurrence/forecast examples to test against. Today the plan (§5, §9) states these only loosely.

**Approach:** Write the normative contract in `subtrack-backend` (the contract owner) as a conventions doc
plus a machine-readable recurrence example fixture that the backend (ST-006) and the clients can both run.
Fold in the deferred API-versioning rule and the ambiguous Models serialization rule from the ST-001 review.

## Boundaries & Constraints

**Always:** Follow plan §5 rules exactly; where the plan is loose, the doc picks one rule and states it.
Examples use fixed dates, never "today". Money is never floating point. Totals are grouped by currency.
Template conventions win (service result pattern, model kinds, `ServiceErrorCode`).

**Never:** No endpoints, entities, migrations, or recurrence engine code (ST-004/005/006). No reminder/worker
semantics beyond naming the trial-reminder target (ST-008). No client repo changes (all empty).

**Decisions (owner, 2026-10-11):**
- **Docs + fixture only:** no code; JSON setup, ProblemDetails mapping and the currency table are built in
  ST-005/006 against these rules.
- **Currencies:** every active ISO 4217 code with its minor units; funds and metals (`XAU`, `XAG`, `XDR`,
  …) excluded.
- **Breaking changes, phased:** additive-only changes always; until the first public store release, breaking
  changes are allowed with coordinated client updates (still `!` commits); from then on a breaking change
  means `/api/v2` served alongside `/api/v1` for at least 6 months, plus a minimum-supported-client-version
  response for forced upgrades.
- **Spec size:** kept as one spec (~1,900 tokens) by owner choice.

</frozen-after-approval>

## Code Map

- `subtrack-backend/CLAUDE.md`, `README.md` -- add a pointer to the contract doc; "API changes follow it".
- `subtrack-backend/.claude/skills/git-commit/SKILL.md:48` -- garbled bullet "…shape (`ViewModels`), contract;";
  breaking-change list must reference the compatibility policy.
- `subtrack-backend/src/Models/CLAUDE.md:25` -- "No serialization framework dependencies" is ambiguous about
  `[JsonPropertyName]`/`[JsonConverter]`/EF attributes.
- `subtrack-backend/src/Common/SubTrack.Common.Enums/ServiceErrorCode.cs` -- `GenericError, ValidationError,
  DatabaseError, Conflict, NotFound`; the doc maps each to HTTP status + error `code`. Auth codes come in ST-004.
- `subtrack-backend/src/ApplicationServices/SubTrack.WebAPI/Program.cs` -- controllers + OpenAPI; no JSON or
  error config yet (do not change in this story).
- `tests/UnitTests/SubTrack.DomainServices.UnitTests` -- future consumer of the fixture (ST-006); do not touch.

## Tasks & Acceptance

**Execution:**
- [x] `subtrack-backend/docs/api-contract.md` -- new normative doc, one rule + one JSON example per topic:
  versioning/compatibility (phased policy), JSON (camelCase, string enums in camelCase, unknown request fields rejected,
  clients ignore unknown fields and tolerate unknown enum values), IDs (opaque UUID strings), money
  (`{ "amount": "9.99", "currency": "EUR" }`, ISO 4217 codes, input over the minor-unit precision is rejected not rounded,
  output always has exactly the minor-unit digits, amount ≥ 0), dates (`yyyy-MM-dd` billing dates, UTC
  `…Z` timestamps, IANA time zone ids, server derives "today"), errors (RFC 9457 problem+json with stable
  `code` and field errors array; `ServiceErrorCode` → 400/404/409/500), concurrency (`version` field → 409),
  idempotency (`Idempotency-Key` on retryable POSTs, owner-scoped, 24 h), paging (cursor, `limit` default
  50 max 100), deterministic ordering, date ranges (inclusive, max 366 days), owner never in a request,
  provider URLs `http`/`https` only, notes plain text. Then the calculation rules (see Design Notes) and the
  fixture schema.
- [x] `subtrack-backend/docs/recurrence-examples.json` -- new canonical fixture; each case has a unique `id`,
  `kind` (`occurrences` | `nextRenewal` | `monthlyEquivalent` | `forecast` | `invalid`), `input`, `expected`,
  and a `rule` reference to plan §5. Coverage listed in Design Notes.
- [x] `subtrack-backend/.claude/skills/git-commit/SKILL.md` -- fix the bullet; breaking = anything the
  contract doc's compatibility section calls breaking.
- [x] `subtrack-backend/src/Models/CLAUDE.md` -- System.Text.Json and DataAnnotations attributes allowed on
  ViewModels only; Entities configured with fluent API in `SubTrack.EntityFramework`, no EF attributes.
- [x] `subtrack-backend/CLAUDE.md`, `subtrack-backend/README.md` -- link the doc and fixture.

**Acceptance Criteria:**
- Given the contract doc, when a client author looks up any topic in the first task, then exactly one rule
  applies and a JSON example shows it.
- Given the fixture, when parsed, then it is valid JSON, ids are unique, and every case matches the
  documented schema.
- Given every calculation row of the plan §5 edge-case table, when searching the fixture, then at least one
  case covers it; concurrency is covered by the doc's 409 example; worker duplication is out (ST-008).
- Given an independent scratch recomputation of every fixture expectation, when compared, then all match.

## Implementation Notes

- Loop 0: doc + 44-case fixture; reverted after pass-1 review (bad_spec). Loop 1: rebuilt on the loop-0 drafts
  per KEEP; 77 cases. Pass-2 patches: 97 cases (14 occurrences, 14 nextRenewal, 16 monthlyEquivalent,
  14 forecast, 39 invalid); all 44 loop-0 ids kept with unchanged expectations (shape changes only).
- Rules chosen where the spec was loose: open pause = `resumeDate: null`; prices and schedule versions strictly
  ascending (a duplicate date is `outOfRange`); a schedule version on a resume date wins over the resume;
  `trialReminderTarget` only in forecast cases with exactly one trial item; 1 MiB body limit (413);
  minimum-client-version response is `400 clientUpgradeRequired` (not 426, which RFC 9110 reserves for
  protocol upgrades); stale `version` is `409 versionConflict`.
- Verified: build 0 warnings, 86 tests pass, `dotnet format` clean, fixture parses (97 unique ids);
  scratch verifier (exact fractions, real tzdata, step-by-step occurrences, own validation table) ALL MATCH,
  27/27 mutations caught. Scratch scripts are in the session scratchpad, not committed.

## Spec Change Log

- **Loop 1 (2026-10-11)** — *Trigger:* review found the contract incomplete against plan §5 and internally
  inconsistent: schedule edits missing, lifecycle/price/trial composition and validation unspecified,
  `decimal` wrongly called exact, cursor paging contradicting the forecast shape, idempotency/error/versioning
  edge cases open, and fixture kinds unable to express the next-renewal, monthly-equivalent and validation
  rules. *Amended:* Design Notes "Also pin down (review loop 1)". *Avoids:* engines and clients built in
  ST-005/006 diverging on composite schedules, rounding, list shapes and error sets. *KEEP:* the doc's topic
  order and one-rule-plus-example structure; camelCase error and field codes and the field-code table; the
  `ServiceErrorCode` mapping; the money, idempotency (24 h, `idempotencyKeyReused` 422,
  `idempotencyRequestInProgress` 409) and `426 clientUpgradeRequired` + `SubTrack-Client` rules; the
  ownership-404 and URL/notes rules; all 44 earlier case ids with their expectations (independently verified),
  adjusted only for shape changes; the independent check with exact fractions and real tzdata that steps
  occurrences one by one; the `src/Models/CLAUDE.md`, root `CLAUDE.md` and `README.md` edits.

## Review Triage Log

**Pass 1 (2026-10-11), diff `140a405..working tree`, layers: blind-hunter, edge-case-hunter, verification-gap
(no gaps).** Routes: R1 calculation rules incomplete, R2 fixture too narrow, R3 list shapes, R4 errors, R5
idempotency, R6 versioning, R7 dates, R8 JSON/IDs, R9 concurrency, R10 CORS, R11 currency changes, R12
examples (all → bad_spec, loop 1); R13 → defer.

| Finding | Verdict | Evidence | Route |
|---|---|---|---|
| `decimal` called exact for monthly equivalent | medium | `/3`, `/12`, `/(N·12)` truncate at 28–29 digits; Kotlin `BigDecimal.divide` throws without a `MathContext` | R1 |
| Monthly equivalent zero totals unspecified | low | Forecast step 6 includes zero totals; the monthly-equivalent section is silent | R1 |
| Lifecycle combinations and validation unspecified | medium | `lifecycle` is an array; only single-change semantics and no field codes | R1 |
| Duplicate price `effectiveDate` | low | "Latest price version" is ambiguous on ties; plan §8 forbids overlaps | R1 |
| Schedule edits mid-window missing | medium | Plan §5 "Schedule edits take effect on an explicit date" has no rule in the doc | R1 |
| Trial anchor/date validation has no error | low | The doc states constraints with no field codes | R1 |
| `nextRenewal` fixture can't express lifecycle or `null` | medium | Input is `{schedule, now, timeZone}`; expected is typed as a non-null date | R2 |
| `monthlyEquivalent` fixture pre-filtered | medium | No `today`, one price, so price-in-effect and lifecycle rules are untestable | R2 |
| Documented validation rules have no fixture cases | low | `"9.990"`, number amount, `eur`, negative, 13 digits, missing interval, 1899, `CHE` absent | R2 |
| Trial case passes an engine that ignores trial; DST case only does date math | low | Anchor = first paid date; weekly case has no zone | R2 |
| Trial reminder target not asserted | low | Trial case expects occurrences only | R2 |
| `nextRenewal` `null` branch untestable | medium | Same root as above (edge-case duplicate) | R2 |
| Paging vs forecast/ordering shape | medium | Paging says every occurrence list is `{items,nextCursor}`; Ordering and fixture use `occurrences`+`totals` | R3 |
| Fixture occurrence shape ≠ wire shape | low | Flat `amount`/`currency` vs `price` object in the Paging example | R3 |
| Totals per page when paged | medium | Paged response with totals is undefined | R3 |
| Today-relative list paged across midnight | low | Moot once range lists are unpaged; same root | R3 |
| "Exactly one rule" claim broken by paging | medium | Same contradiction | R3 |
| Framework errors have no `code`; extensions unlisted | medium | Only `ServiceErrorCode` is mapped; 426 adds `minimumVersion` | R4 |
| Precision checked with an invalid currency | low | Minor units unknown, so the error set is nondeterministic | R4 |
| Several violations on one field | low | No precedence stated | R4 |
| In-progress key after crash | medium | No lease timeout, so 409 until the 24 h expiry | R5 |
| Stored 409 replays on a reapplied edit | low | 4xx stored; key reuse after reload undefined | R5 |
| PATCH/DELETE retry after lost success | low | No key and no client guidance | R5 |
| 5xx after commit duplicates the create | medium | 5xx not stored, so a retry re-executes | R5 |
| `SubTrack-Client` missing or malformed | low | Behavior undefined once a minimum is enforced | R6 |
| Additive field rejected by an older server during rollout | low | `unknownField` rejection plus no deploy order | R6 |
| No default time zone | low | Plan §4 onboarding sets it; the doc doesn't say | R7 |
| IANA link names | low | Accept or reject is unstated | R7 |
| Occurrences after 2099-12-31 | low | Output could break the documented date range | R7 |
| Duplicate JSON properties | low | Last-wins vs reject differs per stack; idempotency fingerprints differ | R8 |
| UUID variants | low | `Guid.Parse` accepts braced or unhyphenated forms | R8 |
| String length unit | low | Swift graphemes vs C# UTF-16 code units | R8 |
| `PUT` not covered by `version` | low | Plan §9 has `PUT …/reminders` | R9 |
| CORS for custom headers | low | SPA needs allow/expose for the new headers | R10 |
| ISO 4217 list changes | low | Withdrawn codes and stored items: no policy | R11 |
| Examples break the doc's own rules | low | Partial replay body, no `SubTrack-Client` in examples, `limit` called a JSON number, `rule` cites §9 | R12 |
| Models rules vs automatic 400 / converter location / no architecture test | low | Fix edits the agent-context file `src/Models/CLAUDE.md` | R13 defer |
| git-commit "Additive … are `~`" inside the breaking list | low | Fix edits the agent-context file `.claude/skills/git-commit/SKILL.md` | R13 defer |
| Weekly vs every-7-days monthly equivalents differ | false | Plan §5 mandates `×52/12` and `×365/(N·12)`; the spec says follow it exactly | rejected |

**Pass 2 (2026-10-11), loop-1 diff, same layers (verification-gap: no gaps).** All bad_spec items from pass 1
resolved. Routes: P1–P12 → patch (direct doc/fixture corrections); D1–D3 → defer.

| Finding | Verdict | Evidence | Route |
|---|---|---|---|
| Every 4xx stored, so a retry replays 429/401/426/413/415 | medium | "2xx and 4xx responses are stored", with no exclusion for pre-handler or transient rejections | P1 |
| Idempotency single transaction vs in-progress marker contradiction | medium | 409 in-progress needs a marker committed first; one-transaction wording forbids it | P2 |
| Original still running after the 60 s expiry, so it executes twice | medium | No unique final record and no loser rollback stated | P2 |
| Stored 4xx vs "committed with the effect" | medium | A 4xx has no effect to commit with; same root | P2 |
| Unauthenticated POST key scope | low | Scope is "owner"; ST-004 account endpoints have none | P2 |
| 426 without `Upgrade` breaks RFC 9110 §15.5.22 | medium | MUST send `Upgrade`; app versions are not protocols | P3 |
| Preflight `OPTIONS`, health and OpenAPI blocked by a missing header | medium | "missing … gets 426" has no exemptions | P3 |
| Header-less request with a minimum on one platform only | low | Platform unknown, so `minimumVersion` undefined | P3 |
| Stale `version` shares generic `conflict` | low | Clients branch on `code`; reload/reapply needs its own code | P4 |
| Read-only properties in request bodies; `null` on required in PATCH | low | Unknown-field rule meets "responses include everything" | P5 |
| Page-size limit both additive and breaking | low | "relaxed validation limit" vs "changing a page-size limit" | P5 |
| Unhandled exception outside services has no `code` | low | Errors table lacks a framework 500 row | P5 |
| `-0` amount | low | "leading `-`" vs "(amount ≥ 0)" read differently | P5 |
| Lowercase `z` in timestamps | low | RFC 3339 allows it; doc silent | P5 |
| Integral floats `30.0` / `3e1` | low | "non-integer number" is ambiguous | P5 |
| Next-30-days window bounds | low | Off-by-one undefined | P5 |
| Both `schedule` and `scheduleVersions`: children validated? | low | "Complete error set" undefined | P5 |
| Long-cancelled items keep producing zero totals | medium | "every currency that appears in the items' price versions" with no item-set rule | P6 |
| Trial cancelled on `firstPaidDate` still counted in monthly equivalent | low | State today is `trial`, so it contributes despite no future charge | P6 |
| Schedule version inside a pause interval | medium | Segment rule silently re-anchors on `R`; no validation and no case | P7 |
| Withdrawn currency: item can't add a price version | low | Withdrawn code refused + one currency per item | P8 |
| ISO withdrawal counts as breaking by the doc's own rule | low | "tightening validation" | P8 |
| ISO minor-unit change | low | Output "exactly `d` digits" vs stored precision | P8 |
| Stored tz link or id retired by a later tzdata | low | "stored as sent" | P8 |
| Missing `invalid` cases for validation rows | low | Both/neither schedule, empty arrays, version order, pause after open pause, cancel with `resumeDate`, `unknownField`/`ownerId`, impossible date, string interval | P9 |
| Exact sum untested where it matters; no KWD or JPY-forecast case; future-anchor non-trial | low | All monthly-equivalent cases have one factor per currency | P10 |
| DST case passes with a fixed +2 offset | low | 2027-03-27T22:30Z is before the 01:00Z switch | P11 |
| Fixture distribution and loading unspecified | low | No word on test-project loading or client copies; a JSON Schema file is rejected (ST-006 tests catch drift) | P12 |
| DataAnnotations/ModelState vs one-error rule; no architecture test | low | carried: same claim as pass-1 R13 row | D1 defer (carried) |
| git-commit sentence redundant; partial breaking list | low | Fix edits the agent-context file `.claude/skills/git-commit/SKILL.md` | D2 defer |
| `CLAUDE.md:103` / `README.md:142` still say `devops/` is the only `.slnx` exclusion | low | `docs/` is now excluded too; fix edits an agent-context file | D3 defer |
| Three cases cite only plan §9 | false | Loop-1 Design Notes allow "`rule` may cite plan §5 or §9"; the doc says so | rejected |

## Design Notes

Calculation rules the doc pins down: monthly/quarterly clamp to month end from the original anchor day
(Jan 31 → Feb 28 → Mar 31); yearly Feb 29 → Feb 28 in non-leap years; weekly/every-N-days add calendar days
(N in 1–366, `interval` only valid for every-N-days); occurrences never precede the anchor; past anchors jump
straight to the window; next renewal = first occurrence ≥ today in the user's zone; monthly equivalent sums
exact per-currency contributions, then rounds once, half away from zero, to minor units; forecast applies
the latest price with effective date ≤ occurrence date; trial forecasts start at the first paid date;
cancellation excludes occurrences on/after its effective date; pause excludes its interval and resume
re-anchors on the chosen date.

Fixture coverage (≈30 cases): month-end anchors (Jan 31 in 2027 and 2028, Jan 30, quarterly Nov 30 and
Aug 31), yearly Feb 29 2028 → 2029…2032, weekly across a DST change, every 1/30/366 days, past anchor,
anchor inside window, inclusive window bounds; next renewal on/after billing day and across zones
(Auckland vs Los Angeles at the same instant); monthly equivalents (yearly €120 → 10.00, quarterly,
weekly ×52/12, every 30 days ×365/(N·12), JPY 0 decimals, sum-then-round 6.67 not 6.66, midpoint €0.30
yearly → 0.03); forecasts (annual Dec 15: Oct 0.00 / Dec 120.00, price change May 10.00 / June 12.00,
price effective on the occurrence date, trial ends May 10 → first charge May 11, cancellation June 15 vs
anchors 14/15, pause + resume, EUR+USD → two totals); invalid inputs (interval 0 and 367, interval on
monthly, precision over minor units, unknown currency).

**Also pin down (review loop 1):**
- *Exact arithmetic:* monthly equivalents are exact rationals: per currency, sum `amount × p / q` over a common
  denominator (integer minor units), divide and round once. Say plain per-item `decimal`/`BigDecimal`/JS
  division is not exact, and how clients compute it.
- *Monthly-equivalent inputs:* price in effect on `today`; a trial uses its first price; items paused or
  cancelled on `today` contribute 0; every currency among the items gets a total, zero included.
- *Schedule edits (plan §5):* an item has schedule versions ordered by `effectiveDate`; each applies from its
  effective date until the next one, generating from its own `anchorDate` (≥ its effective date); the first
  version's effective date is its anchor.
- *Lifecycle:* changes strictly ordered by date; cancel is terminal; a pause needs `resumeDate` > its date and
  the next change on/after `resumeDate`, except a cancel during an open pause; nothing before the first
  anchor; resume re-anchors on `R` with the normal clamp from `R`'s day.
- *Prices/trial validation:* unique `effectiveDate` per item, first price on/before the first anchor, one
  currency per item; trial needs `trialEndDate` < `firstPaidDate` = first anchor. Each violation gets a field
  path and code.
- *List shapes:* cursor paging is for resource lists (items, notifications). Date-range occurrence lists
  (forecast, renewals) are bounded by the 366-day range, not paged, and return
  `{ from, to, occurrences: [{ itemId, date, price: Money }], totals }` with totals over the whole window.
  Fixture occurrence objects use the same shape.
- *Errors:* framework errors (unknown route, 405, 406, 413, 415, 429) are also problem+json with a `code`;
  list the allowed extension members (`minimumVersion`, …); one error per field, by precedence
  `required` > `invalidFormat` > `invalidValue`/`unsupportedCurrency` > `outOfRange`/`notAllowed`/`tooLong`
  > `precisionExceeded`; amount precision is not checked when the currency is invalid.
- *Idempotency:* the record commits in the same transaction as the side effect (a 5xx after commit replays);
  in-progress records expire after 60 s; a reapplied edit after a 409 is a new operation with a new key;
  PATCH/DELETE take no key: a retried DELETE that gets 404 counts as done, a retried PATCH that gets 409
  reloads.
- *Versioning:* deploy the server before clients that send a new request field; once a minimum is enforced, a
  missing or malformed `SubTrack-Client` is treated as below it; semver 2.0 comparison; web sends its build version.
- *Dates/JSON/misc:* time zone is required at account creation (ST-004), so there is no default; IANA link
  names are accepted; no occurrence after 2099-12-31 (next renewal `null`); duplicate JSON properties →
  `invalidFormat`; UUIDs case-insensitive canonical 8-4-4-4-12 only; string lengths in UTF-16 code units;
  `PUT` also sends `version`; a cross-origin web app needs CORS allowing `Idempotency-Key`/`SubTrack-Client`
  and exposing `Idempotency-Replayed`; ISO 4217 changes: new codes are additive, a withdrawn code stays
  valid for existing items but is refused for new ones; examples are complete bodies or marked abbreviated,
  request examples send `SubTrack-Client`, `limit` is a query parameter, `rule` may cite plan §5 or §9.
- *Fixture expressiveness:* `nextRenewal` takes optional `scheduleVersions`/`trial`/`lifecycle` and expects
  `date | null`; `monthlyEquivalent` takes `today` and unfiltered items (prices, trial, lifecycle); `invalid`
  takes any item-shaped body; the trial case also expects `trialReminderTarget` and has its anchor checked.
  Add cases for: next renewal null after cancel and during an open pause, after a resume, and just after local
  midnight on a DST day; monthly equivalent with the price in effect today, a trial, and paused → zero
  total; a forecast across a schedule edit; a cancel during a pause; invalid `"9.990"` EUR, number amount,
  `eur`, negative, 13 integer digits, missing interval, anchor 1899, `CHE`, duplicate price date, mixed price
  currencies, `resumeDate` ≤ pause date, trial anchor ≠ first paid date.

## Verification

**Commands (in `subtrack-backend/`):**
- `dotnet build subtrack-backend.slnx` / `dotnet test --solution subtrack-backend.slnx` /
  `dotnet format subtrack-backend.slnx --verify-no-changes` -- expected: unchanged green (docs-only).
- `node -e "JSON.parse(require('fs').readFileSync('docs/recurrence-examples.json','utf8'))"` -- expected: exit 0.

**Manual checks:**
- A scratch script (scratchpad, not committed) recomputes every fixture expectation independently; all match.
