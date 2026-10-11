# 0001: WebAPI only, no Orleans

Date: 2026-10-11. Status: accepted (owner).

## Context

The backend template (`in-real-life-backend-example`) makes Microsoft Orleans load-bearing. Every host is a
silo or a client, and the template ships `Silo`, `WebAPI`, `Consumer` (Kafka/RabbitMQ) and `Publisher`
(broker or SignalR). SubTrack's needs don't call for Orleans:

- Beta load is about 25 concurrent users with 100 items each.
- Stale edits are rejected through optimistic concurrency.
- Reminders need DB-level dedup, leases and attempt records anyway.
- There's no broker and no real-time requirement.

The plan (§7) asks for one deployable plus a durable worker.

## Decision

`subtrack-backend` keeps the template's structure and conventions, but drops Orleans:

- Remove `Common.Orleans`, `Grains`, `Grains.Abstractions`, `Grains.UnitTests`, and the `Silo`, `Consumer`
  and `Publisher` hosts. Remove the Orleans packages from `Directory.Packages.props`.
- Remove `[GenerateSerializer]`/`[Id]` from the `ServiceResult` types in `Common`.
- The only deployable is `WebAPI`. Request flow: controller -> domain service -> `DbContext`.
- The reminder worker is a `...HostedService` in `WebAPI`. It moves to its own Worker host only if load or
  isolation requires it.
- Kept from the template: the layering, architecture tests, service result pattern, model kinds, naming,
  coding and commit conventions, and central package management.

## Consequences

- One process to run, test and deploy. Integration tests use `WebApplicationFactory` and a real database.
- The template's `CLAUDE.md` files, README and architecture tests are adjusted to drop the Orleans rules.
  The `Grains` layer can stay in the architecture tests, empty, so Orleans can come back without
  redesigning the layers.
- Orleans can be reintroduced later if a measured need appears, e.g. real-time shared households or
  per-user state that's expensive to recompute. That would get a new ADR.
