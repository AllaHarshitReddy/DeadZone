# CLAUDE.md

Standing context for Claude Code on this repo. Read before any task.

---

## What this is

**Sankat Setu** — an offline-first disaster response app for Smart India Hackathon 2026.

Core claim: when cellular and internet fail, victims can still send an SOS, responders still coordinate, and everything syncs once a link returns.

One-line pitch: *"When networks go down, Sankat Setu keeps rescue operations moving."*

The narrative spine, used in the pitch, the demo order, and the build order:
**COMMUNICATE → UNDERSTAND → PRIORITISE → COORDINATE → DELIVER**

---

## Deadline reality

**Demo deadline: 10 September 2026.** Grand Finale is December.

This is a six-day sprint, not a product build. Bias every decision toward: fewer features, working reliably, demonstrable offline. A judge who watches one SOS cross three phones in airplane mode and then sync will remember it. Five half-working features leave nothing behind.

When a choice is between "correct" and "shippable by Tuesday," pick shippable and leave a `TODO(post-sih)` comment.

---

## Stack

| Layer | Choice |
|---|---|
| Mobile | Expo / React Native / TypeScript — one app, civilian and responder roles |
| Transport | Android Nearby Connections (P2P_CLUSTER), Wi-Fi hotspot LAN as fallback |
| Local data | PouchDB with SQLite adapter |
| Sync | PouchDB ↔ CouchDB bidirectional replication |
| API | Node / Express / TypeScript |
| AI | Ollama + Phi-4-mini on a laptop edge node, reached over local Wi-Fi |
| Maps | MapLibre + PMTiles, self-hosted glyphs and sprites |
| Monorepo | pnpm workspaces |

---

## Architecture decisions

These are settled. Do not relitigate them in code or suggestions.

**AI runs on an edge node, not on the phone.** Phi-4-mini needs ~2.5 GB VRAM; phones can't host it. The responder carries a laptop acting as a field command node — this mirrors how NDRF actually deploys. Phones are thin clients calling it over the local hotspot. Rejected: on-device LLM (VRAM), and a two-model hybrid (prompt duplication, degraded Hindi output).

**Life-critical decisions never touch the LLM.** Triage and resource allocation are deterministic rules derived from the START mass-casualty protocol, with explicit reason codes on every output. The LLM is used only for natural-language weather explanation, where fluent phrasing is the point and a wrong word is not fatal. This is a core pitch argument — preserve it.

**Message UUID is the PouchDB document `_id`.** The same SOS arriving via three relay paths collapses to one document automatically. Do not add a separate dedup layer at the DB level.

**Coverage is measured, never estimated.** The coverage meter derives GREEN/AMBER/RED from observed RSSI and peer heartbeats, not from hardware specifications. Never state a fixed range in kilometres anywhere in code comments, UI copy, or docs. BLE is 10–100 m in practice.

---

## Cut list — do not build these

Decided deliberately. If a task seems to need one of these, stop and ask rather than implementing it.

- Voice input / faster-whisper — typed SOS only
- IndicTrans2 — hand-translated fixed Hindi strings; LLM answers in English
- OSRM routing — straight-line haversine distance and bearing
- Allocation optimisation / Hungarian algorithm — greedy nearest-available only
- Ed25519 signing — unsigned envelopes for now
- Multi-hop beyond one relay — TTL exists in the envelope, but only A → B → C is demoed
- Sophisticated conflict resolution — plain PouchDB sync, last-write-wins
- Design polish — unstyled but legible; visual design arrives from outside the build team

---

## Conventions

- **Zod schemas are the source of truth.** Always `export const XSchema = z.object(...)` then `export type X = z.infer<typeof XSchema>`. Never hand-write a type that duplicates a schema.
- `packages/schema` is the contract. Changes there affect every package — flag them explicitly rather than editing quietly.
- Everything must pass `pnpm typecheck` before it is considered done.
- Offline-first means **write locally first, always.** No code path may require a network call to succeed.
- No hardcoded colours. Styling goes through tokens in `packages/ui` so external design can be applied late.
- Seed data lives in `data/seed/` and is clearly fictional. Bengaluru-area coordinates.

---

## Structure

```
apps/
  mobile/       Expo app — civilian + responder
  api/          Express coordination + sync
  dashboard/    placeholder
  ai/           placeholder
packages/
  schema/       Zod contracts — source of truth
  comms/        envelope, peer table, transport
  triage/       START rules + allocation
  ui/           placeholder — design tokens
data/seed/      fictional demo records
infra/          docker-compose (CouchDB)
docs/           strategy, internals, sprint, decisions
```

---

## Guardrails

- **Never modify `apps/mobile` unless a task says so explicitly.** The Expo dev client is built and managed separately; concurrent edits cause native build conflicts.
- Do not add dependencies beyond what the current task strictly needs. Every dependency is a Gradle risk this week.
- Do not scaffold ahead. Placeholder directories stay empty until their task arrives.
- Do not "helpfully" implement cut-list items.
- When something on the cut list looks necessary, say so and wait — don't decide unilaterally.

---

## Known risks

- `expo-nearby-connections` is lightly maintained and may fail against the current Expo SDK. Fallback is a thin custom Kotlin module wrapping `ConnectionsClient`.
- Offline maps commonly render tiles but no labels, because the style JSON reaches for remote glyphs and sprites. Both must be self-hosted.
- Android drops Wi-Fi networks with no internet uplink (captive-portal detection). Affects the hotspot demo path.
- Missing Android nearby-devices runtime permissions make Nearby fail silently rather than throwing.
