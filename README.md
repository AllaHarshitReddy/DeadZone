# DeadZone

**An offline-first AI-powered disaster response network.**

> When networks go down, DeadZone keeps rescue operations moving.

Built for Smart India Hackathon 2026.

---

## The problem

When a flood, landslide or cyclone takes down cellular and internet in a region, victims cannot call for help and responders cannot coordinate — precisely when speed saves lives. Existing emergency apps assume connectivity. DeadZone assumes its absence.

## What it does

**COMMUNICATE → UNDERSTAND → PRIORITISE → COORDINATE → DELIVER**

| Stage | Capability |
|---|---|
| Communicate | SOS reaches a responder with no cellular and no internet, over a field command node's own Wi-Fi hotspot |
| Understand | Local LLM explains weather and disaster risk in plain language |
| Prioritise | Deterministic START triage scores every incoming SOS |
| Coordinate | Responders see a live offline Bengaluru map and assign nearest teams |
| Deliver | Everything syncs to a central node the moment a link returns |

Plus a **coverage meter** that reports how long since the device last heard from the command node — a measured liveness signal, never an estimated range.

> **Transport, precisely.** The app is a web page running in the phone's browser. There is no Bluetooth, no Nearby Connections, no RSSI and no device-to-device relay — a browser exposes none of those. Each phone holds one WebSocket to the responder's laptop over its hotspot. See "Transport reality" in [`CLAUDE.md`](CLAUDE.md).

---

## Prerequisites

- Node 20+
- pnpm 9+ (`corepack enable`)
- CouchDB 3.3+ — runs natively as a Windows service on the dev laptop; `infra/docker-compose.yml` is kept for machines with a working Docker daemon
- [Ollama](https://ollama.com) on the machine acting as edge node
- A phone with a modern browser. No app install, no Android Studio, no JDK — it is a web app.

---

## Setup

```bash
pnpm install
pnpm typecheck

# CouchDB: native service, or compose where Docker works
#   docker compose -f infra/docker-compose.yml up -d
curl http://localhost:5984/            # must answer, not hang

# Seed the local database
pnpm seed

# Edge node: pull the model and serve on the LAN
ollama pull phi4-mini
OLLAMA_HOST=0.0.0.0 OLLAMA_ORIGINS=* OLLAMA_KEEP_ALIVE=-1 ollama serve
```

Copy `.env.example` to `.env` and fill in local values. Never commit `.env`.

---

## Workspace

```
apps/
  mobile/       Vite + React web app — civilian + responder
  api/          Express coordination, sync, LAN mesh
  ai/           WeatherGPT service (edge node)
  dashboard/    offline tile server — basemap, glyphs, sprites
packages/
  schema/       Zod contracts — source of truth
  comms/        envelope, peer table, coverage state
  triage/       START rules + greedy allocation
  ui/           placeholder — design tokens
data/
  seed/         fictional demo records
  tiles/        offline Bengaluru vector tiles + glyphs + sprites
infra/          docker-compose (CouchDB)
docs/           architecture, decisions, progress, runbook
```

---

## Commands

| Command | Does |
|---|---|
| `pnpm typecheck` | Recursive typecheck across all packages |
| `pnpm test` | Unit tests |
| `pnpm seed` | Load seed data into local PouchDB |
| `pnpm sync-test` | Interrupt/resume replication test (cleans up after itself) |
| `pnpm dev:api` | Express + WebSocket on 0.0.0.0 |
| `pnpm dev:ai` | WeatherGPT service |

---

## Running the offline demo

1. Start CouchDB, the tile server and the AI service on the edge-node laptop
2. Enable the laptop hotspot; connect the phone to it
3. Turn the phone's mobile data off — visibly, so a judge can see it
4. Open `http://<laptop-IP>:8443` on the phone and send an SOS
5. It appears on the responder's screen with no cellular and no internet
6. Re-enable connectivity and watch replication drain to the central node

Full choreography in [`docs/demo-runbook.md`](docs/demo-runbook.md).

---

## Architecture in one line

Everything writes locally first. The network is treated as an optional enhancement, never a dependency. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Documentation

| File | Contents |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Standing context: stack, settled decisions, cut list, guardrails. Read first. |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System design and rationale |
| [`docs/PROGRESS.md`](docs/PROGRESS.md) | Current status, per track |
| [`docs/demo-runbook.md`](docs/demo-runbook.md) | The ninety-second demo, with a proven/unproven status table |
| [`docs/pitch-transport-coverage.md`](docs/pitch-transport-coverage.md) | Approved wording for transport and coverage, and the claims that must not be made |
| [`docs/decisions.md`](docs/decisions.md) | Cut list and settled decisions |
| [`docs/GOALS.md`](docs/GOALS.md) | What success looks like |
| [`docs/build_logs.md`](docs/build_logs.md) | Build failures and their fixes |

---

## `apps/mobile` needs an explicit task before you touch it

It originated as a Figma Make export and may still be edited there, so unannounced changes can be overwritten or conflict. Do not modify anything under `apps/mobile` without an explicit task to do so.

---

## Status

Pre-alpha. Built to a six-day sprint deadline for SIH internal evaluation. **Not production software** — see the cut list in [`docs/decisions.md`](docs/decisions.md) for what is deliberately unimplemented.

If you are modifying this for production use in a disaster-response context, read the critical notes in `CONTRIBUTING.md` first.

---

## Licensing

This project is licensed under the MIT License. See `LICENSE` for the full text.

By contributing, you agree your work is licensed under the same terms. See `CONTRIBUTING.md` for details.

### Using in production

This is prototype code. Before deploying to a real disaster-response system:

- [ ] Audit the cut list in `docs/decisions.md` — several items (encryption, conflict resolution, transport reliability) are critical for production
- [ ] Have triage and allocation logic reviewed by someone with disaster-management or medical training
- [ ] Verify against your region's actual protocols (this uses Indian IMD thresholds)
- [ ] Test exhaustively on real hardware and networks
- [ ] Implement proper error handling and logging
- [ ] Set up monitoring and alerting
