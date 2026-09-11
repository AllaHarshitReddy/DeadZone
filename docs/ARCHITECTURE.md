# Architecture

How DeadZone works, and why it's built this way.

---

## Governing principle

**The network is an optional enhancement, never a dependency.**

Every write goes to local storage first. Synchronisation is a background process that may never happen. No code path may require a network call to succeed. This inverts the assumption behind most emergency software, which degrades to uselessness exactly when it's needed.

---

## Layers

```
┌──────────────────────────────────────────────────────────┐
│  DEVICES                                                  │
│  Civilian phone (Expo/RN)    Responder + edge node        │
└───────────────┬──────────────────────┬───────────────────┘
                │                      │
        ┌───────▼──────────────────────▼───────┐
        │  COMMUNICATION                        │
        │  Wi-Fi hotspot LAN (primary)          │
        │  Nearby Connections (if available)    │
        │  Envelope: id, orig, ts, ttl, prio,   │
        │            type, geo, body            │
        └───────────────┬───────────────────────┘
                        │
        ┌───────────────▼───────────────────────┐
        │  LOCAL DATA                            │
        │  PouchDB on every device               │
        │  message UUID = document _id           │
        └───────┬───────────────────┬────────────┘
                │                   │
    ┌───────────▼──────┐  ┌─────────▼────────────┐
    │  EDGE AI          │  │  DECISION            │
    │  Ollama +         │  │  START triage rules  │
    │  Phi-4-mini       │  │  Greedy allocation   │
    │  (laptop only)    │  │  (deterministic)     │
    └───────────┬──────┘  └─────────┬────────────┘
                │                   │
        ┌───────▼───────────────────▼────────────┐
        │  RESPONDER UI                           │
        │  MapLibre + PMTiles (offline tiles)     │
        └───────────────┬─────────────────────────┘
                        │  only when a link exists
        ┌───────────────▼─────────────────────────┐
        │  SYNC — CouchDB central node             │
        └──────────────────────────────────────────┘
```

---

## Layer notes

### Devices

One Expo app, two roles chosen at launch. Civilians get the SOS flow and coverage meter; responders get the map, triage board and WeatherGPT. Same codebase, same local database, different surface.

### Communication

Two transports, same envelope format:

**Wi-Fi hotspot LAN** — one device runs a hotspot, others join. DHCP gives everyone an IP; the responder laptop is discovered by mDNS rather than a typed address. No internet uplink involved. Reliable, cross-platform, and unaffected by radio congestion.

**Nearby Connections** — Android-only, needs Google Play Services but no internet. Discovers over BLE, then upgrades to a Wi-Fi data path. This is the true device-to-device story, and the more impressive one, but it degrades badly in RF-crowded rooms.

Envelope fields are fixed: `id, orig, ts, ttl, prio, type, geo, body`. `ttl` and `prio` exist for relay routing; `prio` orders transmission so a RED SOS goes before telemetry.

### Local data

PouchDB everywhere. The critical design choice: **the message UUID is the document `_id`**. The same SOS arriving via three different relay paths collapses into one document with no dedup logic, and CouchDB replication inherits that property for free.

### Edge AI

Phi-4-mini needs roughly 2.5 GB of VRAM, so it runs on the responder's laptop, not on phones. Phones call it over the local Wi-Fi. This mirrors real incident command, where responders deploy with field terminals while civilians carry only phones.

The model is kept resident (`OLLAMA_KEEP_ALIVE=-1`) so there's no cold-start pause. Output is constrained by a JSON schema and validated with Zod before it reaches the UI.

### Decision layer

**No LLM touches a life-critical decision.** Triage follows the START mass-casualty protocol as pure branching logic, and every result carries a reason code. Allocation is greedy — sort by category, assign the nearest available responder.

This is deliberate and defensible: a hallucinated triage category could kill someone, and a rule that can be read aloud in a courtroom is worth more than a marginally smarter one that cannot.

### Responder UI

MapLibre with PMTiles — a single-file tile archive served locally over HTTP range requests. Glyphs and sprites are self-hosted, because a style referencing remote fonts renders perfectly online and silently loses every label offline.

### Sync

PouchDB ↔ CouchDB bidirectional replication with `{live: true, retry: true}`. Offline, writes queue and replication pauses. On reconnect it resumes from its last checkpoint. Conflicts resolve last-write-wins.

---

## Data flow — one SOS

1. Civilian taps SOS. A document is written to local PouchDB with `_id` = a fresh UUID. The UI shows *queued*. **This succeeds with no network.**
2. The app wraps it in an envelope and transmits over whichever transport is live.
3. A relay device receives it, checks its seen-set, stores it under the same `_id`, decrements `ttl`, and forwards.
4. The responder device receives it, validates against the schema, and writes it locally. Duplicate arrivals collapse by `_id`.
5. `db.changes` fires; triage scores the SOS and produces a category with a reason code.
6. Greedy allocation assigns the nearest available responder.
7. The map renders the pin over offline tiles.
8. When connectivity returns, replication drains everything to the central CouchDB node. Nothing is lost.

---

## Coverage state

Derived from observed reality, not estimated from hardware specifications:

| State | Condition |
|---|---|
| GREEN | A responder is reachable, directly or via one relay, with adequate signal |
| AMBER | Peers visible but weak, or no path to a responder |
| RED | No peer heard in the last 30 seconds |

On transition to RED, the app surfaces the last known good position with distance and bearing — a search-and-rescue primitive, not a UI flourish.

We never state a fixed range in kilometres. Real range collapses indoors and in terrain; measurement beats specification.

---

## What is deliberately absent

Signing, multi-hop relay beyond one hop, routing engines, optimisation algorithms, speech input, on-device translation, and sophisticated conflict resolution. Each was cut for a stated reason — see `docs/decisions.md`. These are scope decisions under a six-day deadline, not architectural blind spots.
