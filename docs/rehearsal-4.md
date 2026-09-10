# Rehearsal 4 — run-sheet and measured gates

**10 September 2026.** Branch `feat/medical-profile` at `918aff5`.

Part 1 was executed on this laptop and the numbers below are measured. Part 2 is
the stopwatch script for the manual run and has **not** been executed — it needs
the phone. Record the result and the wall-clock in the rehearsal log in
`demo-runbook.md` once it has been run.

Also published as a page for the run itself:
<https://claude.ai/code/artifact/9d986f76-e6b0-45f0-8716-f39cbe906ee9>

---

## Part 1 — automated gates, all four pass

| Check | Result | Time |
|---|---|---|
| `pnpm typecheck` | ✅ PASS — 7 workspace projects, exit 0 | 4.0 s |
| `pnpm test` | ✅ PASS — 53/53 (43 `packages/triage`, 10 comms queue), 0 fail | 1.6 s |
| `pnpm sync-test` ×5 | ✅ PASS 5/5 — 24 records per run, 120 total, zero loss, zero duplicates | 2.6 s each |
| Edge node reachable | ✅ PASS — `phi4-mini:latest` resident in VRAM (3.09 GB), `/ai/chat` 200 in **0.9 s** warm | 6.7 s cold |

The 4-second gate in `GOALS.md` is met warm, with a wide margin.

**Ollama was not running when this started.** Started with the pre-flight env —
`OLLAMA_HOST=0.0.0.0 OLLAMA_ORIGINS=* OLLAMA_KEEP_ALIVE=-1` — plus the AI node on
`:4001`. `/api/ps` reports `expires_at 2318-12-21`, so keep-alive took and the
model is pinned rather than idling toward an unload. CouchDB 3.3.0 was already up
as a native Windows service.

**Weather cache:** Bengaluru, 168 hours, fetched 5 Sep, last cached hour
`2026-09-11T23:00`. Covers today with about 32 hours to spare, then fails loudly.
If anything slips past tonight, run `pnpm fetch-weather` while there is internet.

### What the edge node answered today

Verbatim from `POST :4001/ai/chat`. The millimetre figures move as the 24-hour
window rolls forward — rehearse the shape, and take the day's number from the
pre-flight warm-up call.

| Question, exactly as asked | Answer | 1st ask | Warm |
|---|---|---|---|
| how much rain is expected in the next 24 hours? | 1.2 millimetres of rain is expected in the next 24 hours. (riskBand GREEN) | 6.7 s | 0.7–1.1 s |
| when is the heaviest rain expected? | The heaviest rain is expected at 00:30 on 2026-09-11 with 0.1 mm of precipitation. | 0.9 s | 0.9 s |
| what is the risk level right now? | The risk level is GREEN. | 0.7 s | 0.7 s |
| what is the wind speed? | I don't have data for that. | **11.3 s** | 0.6 s |

---

## Three findings that change how the manual run is done

### 1. Warm every question you will ask, not just one

The wind refusal took **11.3 s on its first ask**, 2.9 s on the second, and 0.6 s
from the third on — while the rain question was already warm. So the cost is
per-question, not per-model, and the runbook's single warm-up call leaves the
strongest moment of Beat 5 as an eleven-second silence.

**Fire all four questions above three times each in pre-flight**, and do not start
until the last of them lands under two seconds.

### 2. Beat 4 promises a reason code the screen does not show

The responder sidebar renders `triageReason` (`MapView.tsx:442`), which is a
priority restatement — *"Critical - needs immediate response"* — deliberately,
because the civilian supplied no vitals and the code does not surface clinical
assumptions it did not receive. The START reason codes are real and tested but
live in `packages/triage`, not on screen.

Say what is on screen, then name the protocol behind it. Claiming a code the judge
cannot see is the one way to lose the strongest beat.

### 3. All four triage bands are reachable from the civilian form

Computed by calling `adaptToTriageInput()` then `triage()` with the shapes the form
produces. To show all four colours, send four SOS in this order:

| What the civilian sends | Band | Reason code |
|---|---|---|
| priority **critical**, "Building collapsed, people trapped" | 🔴 RED — immediate | `RESP_GT_30` |
| priority **high**, "Injured, bleeding" | 🟡 YELLOW — delayed | `STABLE_PENDING_TREATMENT` |
| priority **low**, "Minor cut, can walk" | 🟢 GREEN — minor | `CAN_WALK` |
| priority **medium**, description contains "not breathing" | ⚫ BLACK — deceased | `APNEA_AFTER_REPOSITION` |

---

## Part 2 — Gate P: profile handover

Verifies today's fix (`0a5acb7`) under the real choreography. Not one of the four
criteria and **not part of the ninety seconds** — run it once on the demo handset
immediately before the timed run. Budget 60 s.

| # | Do | Expect |
|---|---|---|
| P1 (15 s) | Log in as civilian A. ProfileSetup appears. Pick **O−**, add one next-of-kin, Finish. | Lands on Home, no error. |
| P2 (10 s) | Send one SOS as A. | Responder sidebar shows a MEDICAL PROFILE block carrying **O−**. Positive control: the profile does travel. |
| P3 (10 s) | Leave via the in-app **Back / logout** control. **Not a refresh, not a new tab.** | Login screen. |
| P4 (25 s) | Log in as civilian B, complete or skip ProfileSetup, send an SOS. | **ProfileSetup appears** — B is asked, not skipped past. B's SOS carries no O− and none of A's contacts. |

**Fail condition:** B goes straight to Home, or O− appears on B's SOS. Stop and
clear site data for the app origin before the run.

**Why P3 matters:** the clear runs inside `logout`. A reload never calls it, and
A's profile stays in localStorage. The rekey that would close that door is
deferred post-SIH.

---

## Part 2 — the run, ninety seconds

Cumulative clock on the left, per-beat budget in brackets. Runs 1–3 were never
timed; that is the point of this one. Call the split out loud at Beat 3 and Beat 5
so someone is tracking drift.

### 0:00 · Beat 1 — Frame it (10 s)

- **Do:** hold up the phone, show mobile data off and the no-signal indicator.
- **Expect:** the judge can see, on the device, that there is no network.
- *"Cell towers are down. There is no internet in this room. Everything you are
  about to see runs on a laptop and a phone talking directly to each other."*

### 0:10 · Beat 2 — Send the SOS (20 s) — **criterion 1**

- **Do:** Home → SOS → Severity → Help type → People. Four gestures. At GREEN hold
  the button 2 s or tap 3×; at AMBER, 2×.
- **Expect:** the sending screen walks **You → Command node → Stored**, "delivered"
  at about 3.4 s, auto-advancing to live tracking at 5 s.
- **Check first:** the mesh strip must read GREEN or AMBER *before* you press. At
  RED the wizard short-circuits to a queued card and this beat cannot be shown.
- *"This wrote to the phone's own storage before it touched the network. If nothing
  is in range, it waits. It is never lost."*

### 0:30 · Beat 3 — It arrived (10 s) — call the split

- **Do:** switch to the responder laptop.
- **Expect:** the same SOS in **Map** (as a pin), **SOS** and **Triage** — same id
  in all three.
- *"Same message, no internet involved."*

### 0:40 · Beat 4 — Triage with a reason (15 s) — **criterion 3**

- **Do:** open Triage, point at the colour, read the reason line that is on screen,
  then name the protocol behind it.
- **Expect:** the band matches the recipe sent — critical → RED. The reason line
  reads as a priority statement.
- **Do not** promise a reason code like `RESP_GT_30`; it is real but not rendered.
- *"This is the START mass-casualty protocol as plain branching logic. No language
  model touches it. Every result carries the reason it reached that category. A
  hallucinated triage category could kill someone, so that path does not exist."*

### 0:55 · Beat 5 — Ask the weather (20 s) — **criterion 2**

- **Do:** rain question first, then the wind question, in the exact wording above.
  Improvised phrasing gets refusals.
- **Expect:** rain — a millimetre figure in about 1 s; wind — *"I don't have data
  for that."* in about 1 s, **only if it was warmed in pre-flight**.
- **Abort rule:** nothing back by 10 s, move to Beat 6, re-warm off to the side,
  return only if it answers.
- *"That is a 3.8-billion-parameter model running on this laptop with no internet —
  the number is computed deterministically from cached forecast data, the model
  only phrases it. And there is no wind data in the cache, so it says so. In a
  disaster, a confident wrong answer is worse than no answer."*

### 1:15 · Beat 6 — Nothing is lost (15 s) — **criterion 4**

- **Do:** reconnect the laptop, let the queue drain and replicate.
- **Expect:** queued SOS drain and the records appear in CouchDB. Have Fauxton
  (`:5984/_utils`) already open on the database so the judge sees rows land rather
  than a loading spinner.
- **Check:** count what was sent against what landed — same ids, no duplicates, and
  nothing that was RED coming back as anything else.
- *"Every device kept its own copy the whole time. The moment a link came back, they
  reconciled. Same message ID everywhere, so nothing duplicates and nothing is
  dropped."*

### 1:30 · Close

*"When the network comes back, you get your data. When it does not, you still get
rescue."*

---

## What is not covered

**Criterion 4 is proven for records, not for status.** `sync-test` proves zero lost
and zero duplicated *documents* across an interrupted replication, five times over.
"Zero status regressions" has no automated test — last-write-wins is the stated
policy, so a status set on the laptop while the phone holds an older copy is decided
by write order, not by rank. Check it by eye at Beat 6 and claim no more than that.

**The interruption is JS-level, not a severed link.** The script prefers stopping the
CouchDB container and falls back to cancelling the sync handle, which is what ran all
five times. It proves replication resumes cleanly; it does not prove a half-transferred
batch survives a cable pull. Airplane mode on the phone during Beat 2 is the real
version of that test, and it is the one the judge sees.

**The profile fix does not survive a reload.** Cleared on logout only. Gate P is the
only proof it holds, and it only holds if nobody refreshes.

**Cold start is still unrehearsed, and the warm-up is now longer.** Today's cold call
was 6.7 s, but the weights were already in the OS page cache; the measured cold path
is ~58 s, unrecoverable inside ninety seconds. Runs 4 and 5 were meant to include one
full cold start, and the per-question warm-up above makes pre-flight longer.

**Weather is calm, so the risk band never shows its teeth.** 1.2 mm and GREEN. The
band logic is correct but undramatic — ask the risk-level question only if you are
content to say GREEN out loud.
