# Goals — Sankat Setu

**The thing we're building and why it matters. Updated daily.**

---

## The mission

Build an offline-first disaster response platform that keeps rescue operations moving when cellular networks and internet fail. Demonstrate it working — end to end — with zero connectivity on 10 September 2026.

**One-line pitch:** *"When networks go down, Sankat Setu keeps rescue operations moving."*

**Narrative spine:** COMMUNICATE → UNDERSTAND → PRIORITISE → COORDINATE → DELIVER

---

## Success criteria

A judge watching the demo must see:

1. **Communication works.** An SOS typed on a phone in airplane mode reaches a responder device with no cellular or internet.
2. **Understanding is local.** The responder asks a weather question, gets an answer in plain language, all from cached data offline.
3. **Triage is explainable.** Every victim is scored RED / YELLOW / GREEN with a stated reason, not a black box.
4. **Nothing is lost.** The moment connectivity returns, all data syncs to a central node. Zero messages dropped, zero status regressions.

If all four happen, the project wins. Everything else is elaboration.

---

## What we're delivering

| Deliverable | Status | Done by |
|---|---|---|
| **Working offline demo** | Core | 10 Sep |
| **Source code** | Repo + clean history | 10 Sep |
| **Documentation** | README, ARCHITECTURE, CLAUDE, CONTRIBUTING, build_logs | Today |
| **Design tokens** | Figma → code | 8 Sep |
| **Recorded backup demo** | Insurance against live networking failures | 9 Sep |
| **SIH PPT** | Official template, problem/solution/feasibility/impact | 9 Sep |

---

## Timeline

| Phase | Dates | Gate | Done when |
|---|---|---|---|
| A | 5–6 Sep | PouchDB sync survives five interruptions | Zero lost records |
| B | 5–6 Sep | WeatherGPT answers in under 4 seconds offline | Schema-valid JSON from another device |
| C | 5–6 Sep | Offline map renders labels in airplane mode | Tiles AND labels, no remote fonts |
| D | 5–6 Sep | Triage tests pass, reason codes present | Tests green, every branch covered |
| E | 5–6 Sep | SOS crosses phone↔laptop with mobile data off | Envelope persists in local DB |
| Integration | 7–8 Sep | Full chain works end-to-end | One complete run without intervention |
| Rehearsal | 9 Sep | Demo is smooth, backup video recorded | Five consecutive runs, zero crashes |
| **Demo** | **10 Sep** | **Judge sees all four success criteria** | **Shipped** |

---

## Files that matter

Read these in this order:

1. **CLAUDE.md** — the architectural decisions and guardrails
2. **ARCHITECTURE.md** — how each layer works
3. **claude-code-prompts-day2-3.md** — the exact tasks for each track
4. **PROGRESS.md** — what's done, what's blocked
5. **build_logs.md** — when things break, the fixes are here

---

## Open decisions

**City:** Bengaluru or Bhopal? Gates seed data, PMTiles extract, weather cache, location strings. Pick today, write to `docs/decisions.md`.

**Second phone:** Needed by 6 September for Nearby Connections testing. Fallback is hotspot-LAN transport (already in the plan, not a crisis if this doesn't happen).

---

## The two things that kill demos

1. **Offline map renders tiles but no labels.** The style JSON is still reaching for remote fonts. Fix: self-host both, grep for `http://` in the finished style — zero external domains allowed.
2. **Device drops the hotspot mid-demo.** Android's captive-portal detection kills Wi-Fi networks with no internet. Fix: on every demo device, tap "stay connected" beforehand and disable auto-switch to mobile data.

Both are documented in `build_logs.md` with fixes. Remember them.

---

## The cut list

Not building. Decided. Non-negotiable. See `docs/decisions.md` for reasoning.

Voice input · IndicTrans2 · OSRM routing · Hungarian allocation · Ed25519 signing · Multi-hop beyond one relay · Custom conflict resolution · Design polish

If someone suggests adding one of these, the answer is no. The cut list exists so you don't debate at 2am on the 9th.

---

## Guardrails

**No changes to `apps/mobile` without explicit approval.** The Expo build is running separately; concurrent edits cause native build conflicts.

**Triage is rules, never an LLM.** A hallucinated triage result could kill someone. This is non-negotiable and a core pitch strength.

**Everything writes locally first.** No code path may require a network call to succeed. This is the entire premise.

**Measure, never estimate.** The coverage meter derives state from observed RSSI and peer heartbeats, not from hardware specs. Never state a fixed range in kilometres.

---

## Post-demo backlog

These are good ideas. They don't ship on the 10th. Noted for later:

- LoRa hardware for real long-range mesh
- On-device small model for civilians
- CAP alert interoperability with NDMA SACHET
- True multi-hop routing
- Supply and inventory management
- Turn-by-turn offline navigation

---

## Daily standup checklist

Every morning:

- [ ] Read PROGRESS.md — is anything blocked that I can unblock?
- [ ] Read build_logs.md — have I hit a known error? The fix is already written.
- [ ] Check CLAUDE.md — am I about to violate a guardrail?
- [ ] Run `pnpm typecheck` — does the codebase still compile?
- [ ] If I'm working offline testing: are both devices in airplane mode and visible to each other?

---

## When things break

1. Check `build_logs.md` first. If it's documented, the fix is there.
2. If it's new, ask in the group chat before spending 30 minutes fighting it. Someone else may have seen it.
3. After you fix it, add it to `build_logs.md` so the next person doesn't lose an evening.

---

## The demo runbook

Full choreography in `docs/demo-runbook.md`. Memorise it. Rehearse it five times before the 10th. Have a recording as backup.

In 90 seconds you must show:
- No cellular, no internet (visible on screen)
- SOS crosses devices
- Coverage meter changes state
- Triage scoring with reason code
- WeatherGPT answer
- Reconnect → data syncs

The banner is the thing judges watch. Make it unmissable.

---

## Why this matters

In 2026, when a flood takes down cell towers in a region, people trapped there have no way to call for help. Responders coordinating from the field have no way to share information. Sankat Setu solves that exact problem. It's not a theoretical project — it's a response to something that is happening right now in India.

Build it to work. Build it to ship. Build it to save lives.

---

## Last thing

If you're reading this and feeling the pressure, remember: a judge who watches one SOS cross three devices in airplane mode and then sync will remember it for years. Five half-working features leave nothing behind. Pick the clean path over the ambitious one every single time.

You have six days. Go.
