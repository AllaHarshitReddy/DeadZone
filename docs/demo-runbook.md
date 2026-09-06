# Demo Runbook

**10 September 2026. Ninety seconds. Rehearse five times.**

Read the status table at the bottom first. It says which beats are proven and
which are still hope. Never demo an unproven beat without a rehearsal behind it.

---

## What the judge must see

Four things, in this order. Everything else is elaboration.

1. **Communication works** — an SOS typed with no cellular and no internet
   reaches a responder.
2. **Understanding is local** — a weather question answered offline, in plain
   language, from cached data.
3. **Triage is explainable** — RED / YELLOW / GREEN with a stated reason, not a
   black box.
4. **Nothing is lost** — connectivity returns, data syncs, no message dropped.

---

## Pre-flight — T minus 30 minutes

Do all of this before anyone is watching. Every line is a demo that died once.

### Laptop

```bash
# 1. CouchDB — runs natively as a Windows service since 6 Sep (Docker Desktop
#    won't start on this laptop). It's already up after boot; just check it.
curl http://localhost:5984/            # must answer {"couchdb":"Welcome",...}
#    If it doesn't: Services -> "Apache CouchDB" -> Start.
#    admin / changeme; Fauxton at http://localhost:5984/_utils

# 2. Coordination server + mesh
cd apps/api && pnpm dev                # logs "listening on 0.0.0.0:4000"

# 3. Offline tile server (feeds the responder map)
cd apps/dashboard && pnpm dev          # "Offline tile server on 0.0.0.0:3000"
curl -s http://localhost:3000/verify-offline   # must say "ok": true

# 4. The app
cd apps/mobile && pnpm dev             # serves on 0.0.0.0:8443
                                       # proxies /tiles/* -> :3000

# 5. Edge AI — note the env vars, they are not optional
OLLAMA_HOST=0.0.0.0 OLLAMA_ORIGINS=* OLLAMA_KEEP_ALIVE=-1 ollama serve
cd apps/ai && pnpm dev

# 6. Warm the model so the first answer is not the slow one
curl -X POST http://localhost:4001/ai/chat \
  -H 'Content-Type: application/json' \
  -d '{"q":"is it going to rain today?"}'
```

`OLLAMA_KEEP_ALIVE=-1` keeps the model resident. Without it the first question
of the demo pays a cold-start pause while a judge watches a spinner.

`OLLAMA_HOST=0.0.0.0` is what lets the phone reach the laptop. It also opens the
model API to the whole network — only ever do this on the isolated demo hotspot,
never on venue Wi-Fi.

### Note the laptop's LAN address

```bash
# the API prints it on boot: "Reachable from phones at: ws://<IP>:4000/mesh"
```

The phone opens **`http://<that-IP>:8443`**. Write the address on your hand.

### Phone

- [ ] Joined the laptop's hotspot
- [ ] Tapped **"stay connected"** when Android warned there is no internet
- [ ] Disabled *"switch to mobile data when Wi-Fi has no internet"*
- [ ] App loads at `http://<laptop-IP>:8443`
- [ ] **Mobile data OFF**, and visibly off — a judge must be able to see it

Android's captive-portal detection silently drops Wi-Fi with no uplink. This is
the single most common way this demo dies. See `build_logs.md`.

### Final checks

- [ ] Airplane-mode / no-signal indicator visible on the phone screen
- [ ] Screen brightness up, auto-lock off, notifications silenced
- [ ] Backup video ready to play if anything stalls for more than ten seconds

---

## The run — ninety seconds

### Beat 1 · Frame it (10s)

> "Cell towers are down. There is no internet in this room. Everything you are
> about to see runs on a laptop and a phone talking directly to each other."

Hold up the phone. Show mobile data off. **Do not skip this** — the whole demo
is meaningless if the judge does not believe the network is gone.

### Beat 2 · Send the SOS (20s)

On the phone: **Home → tap SOS → Severity → Help type → Number of people → sending**

Say while it sends:

> "This wrote to the phone's own storage before it touched the network. If
> nothing is in range, it waits. It is never lost."

The screen walks the hop chain: You → Relay 1 → Relay 2 → Responder, then lands
on live tracking.

### Beat 3 · It arrived (10s)

On the laptop, responder view: the SOS is in **Map**, **SOS**, and **Triage**.

> "Same message, no internet involved."

### Beat 4 · Triage with a reason (15s)

Open **Triage**. Point at the colour and read the reason code aloud.

> "This is the START mass-casualty protocol as plain branching logic. No language
> model touches it. Every result carries the reason it reached that category —
> we can read it out in a courtroom. A hallucinated triage category could kill
> someone, so that path does not exist."

This is your strongest argument. Do not rush it.

### Beat 5 · Ask the weather (20s)

**Ask two questions, in this order. The second one is the better moment.**

**First, a question it can answer:**

> *"How much rain is expected in the next 24 hours?"*

Verified answer: *"0.4 mm of total precipitation is expected in the next 24
hours."* — 1.4s.

> "That is a 3.8-billion-parameter model running on this laptop with no
> internet. The number is computed deterministically from cached forecast data
> — the model only phrases it. It cannot invent a rainfall figure."

**Then, deliberately ask something it does not have:**

> *"What is the wind speed?"*

Verified answer: *"I don't have data for that."* — 0.95s.

> "There is no wind data in the cache, so it says so. It does not guess. In a
> disaster, a confident wrong answer is worse than no answer."

That refusal is the strongest thing this feature does. Do not skip it — an
assistant that admits ignorance is a far better argument than one that always
has something to say.

**Questions verified to answer well** (all under 2s warm):

| Question | Answers with |
|---|---|
| How much rain is expected in the next 24 hours? | total precipitation in mm |
| When is the heaviest rain expected? | peak hour, with time and mm |
| What is the worst weather expected? | the worst condition in the window |
| What is the risk level right now? | the IMD risk band |

**Questions that will refuse** — only use these when you *want* the refusal:
anything about wind or temperature (not in the cached object), anything phrased
as a judgment call (*"is it safe to move people tonight?"*), and *"will it rain
tonight?"* (the model does not map "tonight" onto the forecast window).

Rehearse with the exact wording above. Improvised phrasing gets refusals.

### Beat 6 · Nothing is lost (15s)

Reconnect the laptop. The queued messages drain and replicate to CouchDB.

> "Every device kept its own copy the whole time. The moment a link came back,
> they reconciled. Same message ID everywhere, so nothing duplicates and nothing
> is dropped."

### Closing line

> "When the network comes back, you get your data. When it does not, you still
> get rescue."

---

## If it breaks

**Phone dropped the Wi-Fi.** Most likely cause of anything not working. Rejoin,
tap "stay connected". Prevented in pre-flight, not fixed live.

**SOS shows "Saved on this device" and stops.** That is the offline path working
correctly — the record is safe. Say so out loud, it is a feature:
> "No relay in range. It is holding it. Watch what happens when one appears."
Then reconnect and let it drain. This is a better demo than the happy path.

**Weather question hangs.** Model was not warm. Cold start measured at 5.8s
against 1.4s warm, so this is what the pre-flight warm-up call prevents. Move on
to another beat and come back; do not wait in silence.

**Weather answers "I don't have data for that."** Expected for anything outside
the cached object. Use it — see Beat 5 — or re-ask with one of the verified
questions.

**Responder map is blank or falls back to the sketch grid.** The tile server on
:3000 is down or was never started. `cd apps/dashboard && pnpm dev`, then switch
the responder view away and back. The SVG fallback is deliberate — the rest of
the responder screen (list, triage, pins) still works over it.

**Map renders but has no labels.** Glyphs aren't being served. Check
`curl http://localhost:3000/glyphs/Noto%20Sans%20Regular/0-255.pbf`. Not fixable
live — narrate over it and move on.

**Anything stalls past ten seconds.** Cut to the backup video. Rehearse the
handoff so it looks deliberate.

---

## Status — proven vs. unproven

Updated 5 Sep. **Do not demo an unproven beat cold.**

| Beat | State | Evidence |
|---|---|---|
| Triage + reason codes | ✅ Proven | 42/42 tests, every START branch in evaluation order |
| SOS survives with no network | ✅ Proven | Local write precedes every network call; asserted in code |
| Queue drains on reconnect | ✅ Proven | 10/10 tests, plus live round trip against the server |
| Same message ID collapses duplicates | ✅ Proven | Sent twice over a real socket, one document resulted |
| Phone → laptop over LAN | 🟡 Simulated | Full WS round trip over the LAN IP; **not yet run from real phone hardware** |
| Weather answer offline | ✅ Proven | Ran end to end on `phi4-mini`; 1.0-1.7s warm, against a 4s target |
| Sync to CouchDB | ✅ Proven | Native CouchDB 3.3.0 (Docker abandoned); `pnpm sync-test` passed 5/5 — 24 records across an interrupted PouchDB↔CouchDB replication, zero loss, zero duplicates; 20 seed SOS visible in Fauxton |
| Offline map with labels | 🟢 Working | Bengaluru basemap z0–14 + self-hosted glyphs/sprites; served by `apps/dashboard`, shown in the responder Map tab (dark, real SOS coords, pins anchored on zoom). Confirmed in a browser 6 Sep. Not yet run on real phone hardware or in a rehearsal. |
| Three-device relay | 🔴 Not built | Needs a second phone; a nice-to-have, not a success criterion |

### The honest read

Criteria 2, 3 and 4 are proven. Criterion 4 (nothing is lost) is now fully
exercised end to end: the phone's queue drains on reconnect (tested), and the
server → CouchDB replication survives interruption with zero loss (sync-test
5/5). Criterion 1 is the last gap — the phone → laptop hop is simulated but has
not run from real phone hardware.

**One judgement call to make before the 10th.** The weather cache holds real
Open-Meteo data for Bengaluru, and right now that is 0.4 mm and GREEN. A calm
forecast makes a weak demo for a disaster-response app: the risk-band logic
never shows its teeth. Either refresh the cache near the date and take what the
weather gives you, or prepare a severe-weather cache and say plainly that it is
illustrative. Do not quietly present fabricated weather as live data.

The offline map works — a Bengaluru vector basemap rendering with no network,
in the responder Map tab. It is not one of the four success criteria, and it has
not survived a full rehearsal or run on the phone yet, so if time runs short cut
it before anything else (switch the responder off the Map tab; the SVG fallback
also covers a dead tile server).

---

## Rehearsal log

Five clean consecutive runs before the 10th. Record the fifth as the backup.

| # | Date | Result | What broke |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |
