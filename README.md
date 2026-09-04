# Sankat Setu

Offline-first disaster response app — Smart India Hackathon 2026.

> When cellular and internet fail, victims can still send an SOS,
> responders still coordinate, and everything syncs once a link returns.

See `CLAUDE.md` for the full architecture and sprint context, and
`docs/decisions.md` for what's deliberately cut for the 10 September 2026
demo.

**This is a foundation commit: monorepo scaffold, shared contracts,
config, and seed data only. No product features are implemented yet.**

---

## Prerequisites

- Node.js ≥ 20
- [Corepack](https://nodejs.org/api/corepack.html) for pnpm (ships with
  Node; enable with `corepack enable`, or run pnpm via `corepack pnpm
  <command>` if `corepack enable` needs permissions you don't have)
- Docker, for running CouchDB locally

## Setup

```sh
corepack enable
pnpm install
```

## Workspace structure

```text
apps/
  mobile/       Expo app (civilian + responder) — NOT scaffolded here, built separately
  api/          Node/Express API — placeholder, empty
  dashboard/    placeholder, empty
  ai/           placeholder, empty
packages/
  schema/       Zod contracts — source of truth for all shared types
  comms/        envelope/transport package — scaffold only
  triage/       START triage rules package — scaffold only
  ui/           design tokens — placeholder, empty
data/
  seed/         fictional demo records (data/seed/sos.json)
docs/           decisions, strategy, sprint notes
infra/          docker-compose (CouchDB)
```

## Typecheck

```sh
pnpm typecheck
```

Runs `tsc --noEmit` recursively across every workspace package.

## CouchDB

```sh
docker compose -f infra/docker-compose.yml up -d
```

Starts a single-node CouchDB at `http://localhost:5984` (default
credentials `admin` / `changeme` — local dev only, change before any
shared use).

## Seed data

Fictional, Bengaluru-area SOS records for local testing live at
[`data/seed/sos.json`](data/seed/sos.json). Every record conforms to
`SOSRequestSchema` from `packages/schema`.

## `apps/mobile` is intentionally untouched

The Expo development client is being built separately and is **not**
part of this scaffold. No Expo files, `package.json`, config, or app
code have been added to `apps/mobile` tonight, and the directory does
not even exist yet — do not create or modify anything there without an
explicit task to do so.
