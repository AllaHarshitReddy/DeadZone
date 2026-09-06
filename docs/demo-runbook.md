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

**Start in this order and do not skip a ready-check.** Each service depends on
the one above it. Starting Vite before the tile server is up is the usual cause
of an empty Map tab that looks like a code failure.

```bash
# 1. CouchDB - a native Windows service since 6 Sep (Docker Desktop will not
#    start on this laptop). Set to start on boot, so normally just verify:
curl http://localhost:5984/            # READY: {"couchdb":"Welcome",...}
#    If not: Start-Service "Apache CouchDB"
#    admin / changeme; Fauxton at http://localhost:5984/_utils
#    Do NOT reach for docker compose - there is no working daemon here.

# 2. Offline tile server - FIRST of the node services; the map depends on it
cd apps/dashboard && pnpm dev
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/style.json
#                                        READY: 200
node apps/dashboard/scripts/verify-offline.js
#                                        READY: "PASS - no external dependencies"

# 3. Coordination server + mesh
cd apps/api && pnpm dev
#   READY: logs "listening on 0.0.0.0:4000" and
#          "Reachable from phones at: ws://<LAN-IP>:4000/mesh"  <- write the IP down
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:4000/health     # READY: 200

# 4. The app
cd apps/mobile && pnpm dev             # serves on 0.0.0.0:8443
#   READY: all four return 200 -
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8443/
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8443/sos
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8443/tiles/style.json
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8443/fonts/Inter-400-latin.woff2

# 5. Edge AI - the env vars are not optional
OLLAMA_HOST=0.0.0.0 OLLAMA_ORIGINS=* OLLAMA_KEEP_ALIVE=-1 ollama serve
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:11434/api/tags  # READY: 200
cd apps/ai && pnpm dev

# 6. WARM THE MODEL. Mandatory - see the timing table below.
curl -X POST http://localhost:4001/ai/chat \
  -H 'Content-Type: application/json' \
  -d '{"q":"how much rain is expected in the next 24 hours?"}'
#   First call: expect up to ~60s. Wait it out, touch nothing else.
#   Then run it twice more - READY when both return in about 1s.
```

### The warm-up is mandatory, not a nicety

Measured on this laptop, 6 Sep:

| State | Time |
|---|---|
| Cold - Ollama just started, model still on disk | **~58 s** |
| Warm - model resident | **~0.9-1.1 s** |

Sixty seconds of silence with a judge watching is the demo dying, and it is
unrecoverable inside ninety seconds. `ollama serve` being up is **not** the same
as the model being loaded: the first request is what pulls the weights off disk.
Never start a rehearsal or the real run until you have seen two consecutive ~1s
responses.

`OLLAMA_KEEP_ALIVE=-1` keeps it resident afterwards. Without it the model
unloads while idle and you pay the cold start again, mid-demo.

`OLLAMA_HOST=0.0.0.0` is what lets the phone reach the laptop. It also opens the
model API to the whole network - only ever on the isolated demo hotspot, never
on venue Wi-Fi.

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

> **The millimetre figure moves. Do not memorise it.** The answer is computed
> from the cached forecast against a 24-hour window anchored to *now*, so it
> drifts as the window rolls forward: 0.4 mm on 5 Sep, 0.2 mm on 6 Sep, from the
> same cache — and the model read both correctly. Rehearse the *shape* of the
> answer, not the value. On demo morning, the pre-flight warm-up call returns
> the number you should be ready to hear.

Answer shape: *"<N> millimetres of rain is expected in the next 24 hours."*
— about 1s warm.

> "That is a 3.8-billion-parameter model running on this laptop with no
> internet. The number is computed deterministically from cached forecast data
> — the model only phrases it. It cannot invent a rainfall figure."

**Then, deliberately ask something it does not have:**

> *"What is the wind speed?"*

Verified answer: *"I don't have data for that."* — about 1s. This one does not
drift: it is a refusal, not a figure.

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

**CouchDB is not answering on :5984.** `Start-Service "Apache CouchDB"`. Do not
reach for `docker compose up` — the Docker daemon on this laptop is unreachable
(both the `desktop-linux` and `default` contexts fail to open their named pipe),
so that command errors out and costs you a minute you do not have. Only Beat 6
needs CouchDB; every earlier beat runs without it.

**Weather question hangs.** The model was not warm. Cold start is **~58s**
against ~1s warm — that is unrecoverable inside a ninety-second demo, and it is
exactly what the mandatory pre-flight warm-up prevents. Move to another beat
immediately; never wait in silence. Re-run the warm-up call off to the side and
come back to the weather beat only if it answers.

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

Updated 6 Sep. **Do not demo an unproven beat cold.**

| Beat | State | Evidence |
|---|---|---|
| Triage + reason codes | ✅ Proven | 42/42 tests, every START branch in evaluation order |
| SOS survives with no network | ✅ Proven | Local write precedes every network call; asserted in code |
| Queue drains on reconnect | ✅ Proven | 10/10 tests, plus live round trip against the server |
| Same message ID collapses duplicates | ✅ Proven | Sent twice over a real socket, one document resulted |
| Phone → laptop over LAN | ✅ **Proven on hardware** | 6 Sep: a real Android phone on the laptop hotspot sent an SOS that arrived on a separately-opened responder screen. No longer simulated. |
| Weather answer offline | ✅ Proven | Ran end to end on `phi4-mini`; 1.0-1.7s warm, against a 4s target |
| Sync to CouchDB | ✅ Proven | Native CouchDB 3.3.0 (Docker abandoned). `cd apps/api && pnpm sync-test`: 24 records across an interrupted PouchDB↔CouchDB replication, zero loss, zero duplicates; seed SOS visible in Fauxton. The interrupt is a cancelled-and-restarted sync handle, not a real network cut |
| Offline map with labels | ✅ Proven | Bengaluru basemap z0–14, self-hosted glyphs and sprites, served by `apps/dashboard`. Renders with labels in the responder Map tab, pins anchored on zoom. 6 Sep: confirmed alongside a live phone SOS in the same session. |
| SOS appears live on the responder screen | ✅ **Proven on hardware** | Server fans each stored envelope out to every other connected client; `GET /sos` snapshots the store for a late joiner. 6 Sep: a real phone SOS appeared as a pin on the real offline basemap, live, with no reload. |
| Three-device relay | 🔴 Not built | Needs a second phone; a nice-to-have, not a success criterion |

### The honest read

Criteria 2, 3 and 4 are proven. Criterion 4 (nothing is lost) is exercised end
to end: the phone's queue drains on reconnect, and server → CouchDB replication
survives interruption with zero loss or duplication.

Read the replication result precisely. `sync-test` cancels the sync handle and
starts a fresh one; it does not stop the database, and it does not log how much
had transferred before the cancel. What is proven is that replication survives
being cancelled and restarted cleanly — not that a half-transferred batch
resumed mid-flight. Good enough for the beat; do not claim more to a judge.

**All four criteria are now proven, criterion 1 on real hardware (6 Sep).** The
last structural gap — nothing had ever run on a phone — is closed: a real
handset on the hotspot sent an SOS that landed as a pin on the real offline
basemap without a reload.

What is left is not architecture, it is rehearsal. The five clean runs below
have not been done, and the log is empty.

**One judgement call to make before the 10th.** The weather cache holds real
Open-Meteo data for Bengaluru; on 6 Sep the rolling 24-hour window put that at
0.2 mm and GREEN, and it will read differently again on the 10th. A calm
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
