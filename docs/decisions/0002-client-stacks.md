# 0002: Native iOS and Android, TypeScript web

Date: 2026-10-11. Status: accepted (owner).

## Context

The plan (§7) recommended one universal Expo / React Native client, pending a feasibility spike (ST-002).
The owner chose separate native apps and a TypeScript web app instead, each following its platform's
best practices.

## Decision

Three independent clients, one per repo. They share no code, only the backend's OpenAPI contract.

| | `subtrack-ios` | `subtrack-android` | `subtrack-web` |
|---|---|---|---|
| Language | Swift 6 language mode (strict concurrency) | Kotlin | TypeScript, `strict` |
| UI | SwiftUI, `NavigationStack` | Jetpack Compose, Material 3, single activity, type-safe Navigation Compose | React SPA built with Vite, React Router |
| State | `@Observable` view models, async/await | `ViewModel` + `StateFlow` (unidirectional data flow), coroutines | TanStack Query for server state, minimal local state |
| DI | Initializer injection | Hilt | Module imports / React context |
| API client | Generated from OpenAPI (`swift-openapi-generator`) | Generated from OpenAPI (OpenAPI Generator, Kotlin) | Generated from OpenAPI (`openapi-typescript` + `openapi-fetch`) |
| Auth storage | Keychain | Android Keystore-backed encrypted storage | HttpOnly secure cookie (no token in JS) |
| Push (M5) | APNs | FCM | Deferred |
| Localization | String Catalogs | `strings.xml` resources | Message catalog (library chosen at bootstrap) |
| Tests | Swift Testing + XCUITest | JUnit + Compose UI tests | Vitest + Testing Library, Playwright E2E |
| Lint / format | swift-format | ktlint or detekt | ESLint + Prettier |
| Dependencies | Swift Package Manager | Gradle Kotlin DSL + version catalog | pnpm, lockfile committed |
| Minimum | iOS 17 | Android 8.0 (API 26) | Current evergreen browsers |

- Exact versions and libraries are checked against current official sources when each repo is bootstrapped
  (plan §17), not pinned from this document.
- Each repo gets its own `CLAUDE.md` with verified build, test and lint commands.

## Rules that now matter more

- **The server owns every calculation** (plan §5): recurrence, forecasts, monthly equivalents, totals.
  Clients don't reimplement recurrence. Previews call `POST /api/v1/recurrence-preview`. Three
  reimplementations would drift.
- **Money stays exact on every client.** Decimal strings from the API are parsed to `Decimal` (Swift) and
  `BigDecimal` (Kotlin). On the web they stay strings, or go through a decimal library; they never become a
  JS `number` for arithmetic.
- **The OpenAPI document is the contract.** A backend change that alters it is followed by regenerating all
  three clients. Contract drift is a review finding.
- **Auth with ASP.NET Core Identity:**
  - Web uses cookie auth with CSRF protection. Web and API must share a site (e.g. `app.` and `api.` subdomains)
    so `SameSite` cookies work.
  - Native apps use Identity's bearer/refresh tokens. These are not OAuth/OIDC (see plan §7).

## Consequences

- The ST-002 universal-client spike is dropped. Each client gets a bootstrap task instead: skeleton, generated
  API client, sign-in screen, and one list screen against the real API.
- Client effort grows. The plan's M4–M5 estimates assumed one shared client, and three codebases roughly
  multiply the client share of that work. Re-estimate after the first client reaches M1.
- Native gives first-class platform behavior (accessibility, notifications, date pickers, navigation) without
  cross-platform workarounds.
