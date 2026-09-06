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
  mobile/       Vite React web app (civilian + responder)
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
docs/           decisions, demo runbook, approved pitch language
infra/          docker-compose (CouchDB)
```

## Documentation

| Document | What it is |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Standing context: stack, settled decisions, cut list, guardrails. Read first. |
| [`docs/decisions.md`](docs/decisions.md) | What was deliberately cut for the 10 September 2026 demo, and why. |
| [`docs/demo-runbook.md`](docs/demo-runbook.md) | The ninety-second demo: pre-flight, beat-by-beat script, and a proven/unproven status table. |
| [`docs/pitch-transport-coverage.md`](docs/pitch-transport-coverage.md) | Approved wording for how devices talk and what the coverage meter means, plus the claims that must not be made. |

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

## `apps/mobile` needs an explicit task before you touch it

`apps/mobile` is a Vite + React **web app** — there is no Expo and no
React Native anywhere in this repo. The phone runs it by opening
`http://<laptop-IP>:8443` in its browser.

It originated as a Figma Make export and may still be edited there, so
unannounced changes can be overwritten or conflict. Do not modify
anything under `apps/mobile` without an explicit task to do so.
