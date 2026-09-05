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
# 1. CouchDB
cd infra && docker compose up -d
curl http://localhost:5984/            # must answer, not hang

# 2. Coordination server + mesh
cd apps/api && pnpm dev                # logs "listening on 0.0.0.0:4000"

# 3. The app
cd apps/mobile && pnpm dev             # serves on 0.0.0.0:8443

# 4. Edge AI — note the env vars, they are not optional
OLLAMA_HOST=0.0.0.0 OLLAMA_ORIGINS=* OLLAMA_KEEP_ALIVE=-1 ollama serve
cd apps/ai && pnpm dev

# 5. Warm the model so the first answer is not the slow one
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

Responder view → weather question. Something like *"is it safe to move people
tonight?"*

> "That is a 3.8-billion-parameter model running on this laptop. No internet.
> The forecast numbers are computed deterministically — the model only phrases
> them. It cannot invent a rainfall figure."

Watch the clock. If it has not answered in four seconds, keep talking; do not
stare at the screen with the judge.

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

**Weather question hangs.** Model was not warm. Move on to another beat and come
back. Do not wait in silence.

**Map renders but has no labels.** Style is reaching for remote fonts. Not
fixable live. Narrate over it and move on.

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
| Weather answer offline | 🟡 Untested | Code complete and reviewed; model only just downloaded |
| Sync to CouchDB | 🔴 Unproven | Docker Desktop will not start; last hop never exercised |
| Offline map with labels | 🔴 Not built | `data/tiles/glyphs` and `sprites` are empty |
| Three-device relay | 🔴 Not built | Needs a second phone; a nice-to-have, not a success criterion |

### The honest read

Criteria 1 and 3 are in good shape. Criterion 2 is written and reviewed but has
never once been executed end to end. Criterion 4 is half proven — the phone's
queue drains and that is tested, but the server → CouchDB hop has never run
because Docker is down.

The offline map is the only piece that is genuinely absent, and it is not one of
the four success criteria. If time runs short, cut the map before you cut
anything else.

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
