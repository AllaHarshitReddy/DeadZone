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

**Free memory before you start anything.** On 8 Sep the laptop sat at ~2 GB free
of 16 GB, and Windows killed the tile server, the API and Vite within minutes of
them starting — silently, with no error in any terminal. The ports simply went
quiet while the responder tab kept showing its last-painted state, so everything
looked healthy from the screen. Close Discord and spare browser windows; target
**at least 4 GB free** before the first service, and remember Ollama wants
~2.5 GB on top of that.

**Start every service in its own independent terminal.** Services started inside
a Claude Code session (or any agent/background runner) are the first thing
Windows reaps under memory pressure. Three plain terminals survive; background
tasks under a tool session do not.

**Verify each port after starting it — do not assume.** The tile server has been
in this list since 6 Sep and the map still fell back on 8 Sep, because it was
never actually started that morning. The sequence being written down is not the
same as it having run. The `curl` ready-checks below exist for exactly this.

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

**That line is printed once, at boot, and goes stale.** The address changed
twice on 7 Sep on shared Wi-Fi (`172.20.32.44` → `10.19.132.48` → back to
`172.20.32.44`) without the API restarting, so the log kept advertising an
address that no longer answered. Confirm the live address instead:

```bash
# PowerShell — the Wi-Fi adapter's current address
Get-NetIPAddress -AddressFamily IPv4 | Where-Object InterfaceAlias -eq 'Wi-Fi'
```

The stale log line is cosmetic: `config.ts` derives the mesh URL from
`window.location`, so a phone that loads the *right* `:8443` address gets the
right WebSocket through the Vite proxy. **Only the printed line lies — the mesh
follows whatever address the phone actually used.** Do not chase it.

**Use your own hotspot, not shared Wi-Fi.** A shared network can move the
laptop to a new subnet mid-session, and the phone will be on the old one —
which presents as the app failing to load, not as a network problem.

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

On the phone: **Home → SOS → Severity → Help type → Number of people → sending**

**Four gestures, about 10-11 seconds.** Budget for that; it is the longest
interactive beat and the one a judge watches most closely.

| Coverage | Fire the SOS | Then | Total |
|---|---|---|---|
| GREEN | hold 2s **or** tap 3x | 1 tap severity, 1 tap Continue, 1 tap Continue | ~10-11s |
| AMBER | hold 2s **or** tap 2x | same three taps | ~10-11s |
| RED | single tap | **nothing — see below** | ~1s |

Help type and number of people are both skippable in one tap: selecting no help
type sends all types, and the people count defaults to 1. Severity advances on
the tap itself, with no separate Continue. The sending screen then runs itself —
about 3.4s to "delivered", auto-advancing to live tracking at 5s.

**RED coverage short-circuits the wizard.** Pressing SOS at RED sets the pending
state and renders a queued-SOS card on the home screen; it does *not* enter
severity/help-type/people, so no SOS detail is collected and the sending screen
never appears. Correct behaviour for a phone with no link, but it means **you
cannot demo this beat at RED** — run it at GREEN or AMBER and use Beat 6 to show
what happens when the link drops. Check which state the phone is in before you
start: the mesh strip at the top of the screen says.

Say while it sends:

> "This wrote to the phone's own storage before it touched the network. If
> nothing is in range, it waits. It is never lost."

The screen walks the chain **You → Command node → Stored**, then lands on live
tracking. (It formerly read "You → Relay 1 → Relay 2 → Responder". There is no
device-to-device relay in this build — each phone holds one direct WebSocket to
the command node — so do not describe hops that do not exist.)

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

**Responder map is wrong — two different failures, tell them apart first.**
They look similar and have different fixes. The console decides it in seconds.

*Signature A — grey hand-drawn blocks, and the console says:*

```
[MapView] falling back to the sketch map: Error: style 502
```

The tile server on :3000 is down or was never started; Vite's proxy returns 502
when its target is missing. `cd apps/dashboard && pnpm dev`, then **switch the
responder view away and back** (SOS tab, then Map). That unmounts MapView and
re-runs its init, which is faster than a reload. A soft refresh alone does not
clear it — `mapError` latches at init and only resets on remount. The SVG
fallback is deliberate: the list, triage and pins still work over it.

*Signature B — empty dark canvas, pins visible, console clean.* The map
initialised fine and the tiles are 404ing. **Nothing is logged**: MapView
deliberately swallows 404s (`MapView.tsx:176`), because a missing tile or glyph
range is normally harmless. Open the Network tab and look for red `.pbf`
requests — nothing else will tell you. Usually means the tile server is up but
serving the wrong directory. Verify with the proxy path the app actually uses,
not the direct one:

```bash
curl -s -o /dev/null -w '%{http_code}
' http://localhost:8443/tiles/bengaluru/10/732/474.pbf   # 200
```

Signature B is the one that will rattle you mid-demo, because it looks like a
styling bug rather than a service being down. Narrate over it and move on — the
pins and the incident rail carry the beat without a basemap.

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
| 1 | 6 Sep, evening | ✅ Clean | Nothing. First run on the merged build: real offline basemap, live phone SOS landing as a pin, all beats through. |
| 2 | 6 Sep, evening | ✅ Clean | Nothing. Run straight after 1, no restarts between them. |
| 3 | 7 Sep, night | ✅ Clean | Nothing. First run on the current UI (map sidebar, incident rail, description-based titles, team dropdown, working Allocate) and the first from a genuinely cold Ollama — no model resident, tray app confirmed not running. |
| 4 | | | |
| 5 | | | |

Wall-clock durations were not captured for runs 1 and 2 — time them from run 3
on, since ninety seconds is the constraint and "clean" is not the same as
"in time".

**Run 3 was not timed either.** It was clean end to end and the cold start was
real, but no stopwatch was on it, so the cold-path duration is still unmeasured.
Runs 4 and 5 must be timed — that is now the only outstanding rehearsal
question, and the ~58s model load is the part of it that can sink the run.

**Both runs inherited a warm, already-pinned model and a browser-cached map.**
A run started from cold — which is what demo morning is — has not been rehearsed
yet. Do at least one of runs 3–5 from a full cold start, following the pre-flight
top to bottom, so the ~58s model load and the first uncached map paint are inside
a run you have actually timed.
