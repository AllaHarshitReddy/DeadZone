# Sankat Setu

**An offline-first AI-powered disaster response network.**

> When networks go down, Sankat Setu keeps rescue operations moving.

Built for Smart India Hackathon 2026.

---

## The problem

When a flood, landslide or cyclone takes down cellular and internet in a region, victims cannot call for help and responders cannot coordinate — precisely when speed saves lives. Existing emergency apps assume connectivity. Sankat Setu assumes its absence.

## What it does

**COMMUNICATE → UNDERSTAND → PRIORITISE → COORDINATE → DELIVER**

| Stage | Capability |
|---|---|
| Communicate | SOS travels device-to-device with no cellular or internet |
| Understand | Local LLM explains weather and disaster risk in plain language |
| Prioritise | Deterministic START triage scores every incoming SOS |
| Coordinate | Responders see a live offline map and assign nearest teams |
| Deliver | Everything syncs to a central node the moment a link returns |

Plus a **coverage meter** that measures actual mesh reachability from observed signal strength and warns a user before they walk out of relay range.

---

## Prerequisites

- Node 20+
- pnpm 9+ (`corepack enable`)
- JDK 17 (not 21 — Expo's Gradle plugin requires 17)
- Android Studio with SDK and platform-tools
- Docker Desktop
- [Ollama](https://ollama.com) on the machine acting as edge node
- A physical Android device (Android 10+). Emulators lack the radios needed for device-to-device testing.

---

## Setup

```bash
pnpm install
pnpm typecheck

# Start CouchDB
docker compose -f infra/docker-compose.yml up -d

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
  mobile/       Expo — civilian + responder app
  api/          Express coordination, sync, LAN mesh
  ai/           WeatherGPT service (edge node)
  dashboard/    placeholder
packages/
  schema/       Zod contracts — source of truth
  comms/        envelope, peer table, coverage state
  triage/       START rules + greedy allocation
  ui/           placeholder — design tokens
data/
  seed/         fictional demo records
  tiles/        offline PMTiles + glyphs + sprites
  weather.json  cached Open-Meteo forecast
infra/          docker-compose (CouchDB)
docs/           architecture, decisions, progress
```

---

## Commands

| Command | Does |
|---|---|
| `pnpm typecheck` | Recursive typecheck across all packages |
| `pnpm test` | Unit tests |
| `pnpm seed` | Load seed data into local PouchDB |
| `pnpm sync-test` | Interrupt/resume replication test |
| `pnpm dev:api` | Express + WebSocket on 0.0.0.0 |
| `pnpm dev:ai` | WeatherGPT service |

---

## Running the offline demo

1. Start CouchDB and the AI service on the edge-node laptop
2. Enable the laptop hotspot; connect the phone to it
3. Put the phone in airplane mode, then re-enable Wi-Fi only
4. Send an SOS — it crosses to the responder with no cellular or internet
5. Re-enable connectivity and watch replication drain to the central node

Full choreography in `docs/demo-runbook.md`.

---

## Architecture in one line

Everything writes locally first. The network is treated as an optional enhancement, never a dependency. See `ARCHITECTURE.md`.

---

## Documentation

| File | Contents |
|---|---|
| `CLAUDE.md` | Standing context for Claude Code |
| `ARCHITECTURE.md` | System design and rationale |
| `PROGRESS.md` | Current status, per track |
| `build_logs.md` | Build failures and their fixes |
| `docs/decisions.md` | Cut list and settled decisions |

---

## Status

Pre-alpha. Built to a six-day sprint deadline for SIH internal evaluation. **Not production software** — see the cut list in `docs/decisions.md` for what is deliberately unimplemented.

If you are modifying this for production use in a disaster-response context, read the critical notes in `CONTRIBUTING.md` first.

---

## Licensing

This project is licensed under the MIT License. See `LICENSE` for the full text.

By contributing, you agree your work is licensed under the same terms. See `CONTRIBUTING.md` for details.

### Using in production

This is prototype code. Before deploying to a real disaster-response system:

- [ ] Audit the cut list in `docs/decisions.md` — several items (encryption, conflict resolution, multi-hop reliability) are critical for production
- [ ] Have triage and allocation logic reviewed by someone with disaster-management or medical training
- [ ] Verify against your region's actual protocols (this uses Indian IMD thresholds)
- [ ] Test exhaustively on real hardware and networks
- [ ] Implement proper error handling and logging
- [ ] Set up monitoring and alerting
