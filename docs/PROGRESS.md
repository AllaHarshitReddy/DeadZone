# Progress

**Demo: 10 September 2026.** Update at the end of every working session.

> States below are **verified by running the code**, not by recollection. Anything
> marked ✅ was observed working in this session. Anything unverified says so.

---

## Status

| Track | Owner | State |
|---|---|---|
| Scaffold + contracts | — | ✅ Done |
| Frontend (Figma → web) | — | 🟡 Core flow + offline map work; polish backlog open (notch banner, mesh/net split, SVG icons, severity colours, hop screen) |
| A — Data spine | — | ✅ UUID-as-`_id`, queue drain, and PouchDB↔CouchDB replication all proven (sync-test 5/5 over an interrupted link) |
| B — Edge node | — | ✅ Done — WeatherGPT answers offline in ~1.4s |
| C — Offline maps | — | ✅ Bengaluru basemap renders offline in the dashboard **and** the responder Map tab; markers track on zoom. 6 Sep: confirmed on hardware, with a live phone SOS landing as a pin in the same session |
| D — Triage rules | — | ✅ Done — 43/43 tests; apnea no longer inferred from incident type + priority (6 Sep) |
| E — LAN transport | — | ✅ **Proven on hardware 6 Sep** — real phone on the hotspot → SOS → live pin on the responder's offline map, no reload. Server fan-out + `GET /sos` snapshot both merged and verified |
| Expo dev client | — | 🟡 Building (separate; not in the repo) |

Legend: ⬜ not started · 🟡 in progress · ✅ done · 🔴 blocked

> **Branch:** `feat/offline-map` — 10 commits, pushed to GitHub 6 Sep. PR not
> opened yet: <https://github.com/AllaHarshitReddy/Sankat-Setu-/pull/new/feat/offline-map>.
> Pushing large payloads to this repo from the dev laptop is flaky (connection
> resets on the 17 MB tile commit; GCM auth intermittently fails from a
> non-interactive shell) — retry, or push commit-by-commit.

---

## Open blockers

| Blocker | Impact | Resolve by |
|---|---|---|
| Only one Android phone | Blocks the three-device relay (a nice-to-have). Phone → laptop over hotspot is the primary transport and does NOT need a second phone — but has still only been run laptop-to-laptop, never from real phone hardware. | Rehearse before 10 Sep |
| ~~City not chosen~~ — it is **Bengaluru** | Settled de facto: weather cache, seed data and app coords are all `12.9716, 77.5946`. Write it into `docs/decisions.md`. | Done 5 Sep |
| ~~Docker Desktop will not start~~ — **resolved 6 Sep** | Docker Desktop's WSL2 backend has no distro and won't start. Abandoned it: CouchDB 3.3.0 now runs natively as a Windows service on :5984 (admin/changeme). All the api scripts and `sync-test`'s fallback work against it unchanged. `infra/docker-compose.yml` kept for other machines. | Done |
| Demo weather is calm (0.4 mm, GREEN) | Criterion 2 works but demos weakly — the risk-band logic never shows its teeth. Decide: take live weather, or a clearly-labelled severe cache. | 9 Sep |

---

## Gates

- [ ] **Gate 1 — it moves.** SOS crosses devices in airplane mode
      *Local-first write landed 5 Sep. Cross-device hop still untested — one phone.*
- [x] **Gate 2 — it thinks.** Triage + WeatherGPT answer offline
      *Both halves proven 5 Sep. Triage 42/42. WeatherGPT answers from cached
      data in ~1.4s warm, and correctly refuses anything outside that cache.*
- [x] **Gate 3 — it remembers.** Full run, then sync on reconnect
      *Client half done 5 Sep: queue drains on reconnect, verified idempotent.
      Server half proven 6 Sep: CouchDB running natively, `pnpm sync-test`
      passed 5/5 — records survive an interrupted PouchDB↔CouchDB replication
      with zero loss and zero duplicates. Still to rehearse as one continuous
      run: phone SOS → queue → reconnect → Fauxton.*

---

## Track detail

### A — Data spine
- [x] CouchDB running (native Windows service, 3.3.0 on :5984), `deadzone`
      database created — `pnpm --filter @deadzone/api setup-db` idempotent
- [x] Seed data in CouchDB — the 20 canonical SOS records are present and
      visible in Fauxton (`pnpm seed` locks against the running server's
      `.data/local`; run it with the api server stopped, or they replicate down
      from CouchDB)
- [x] UUID used as document `_id` — server writes `_id: envelope.id`; client keys on the same id
- [x] Undelivered SOS queue drains on reconnect — `services/queue.ts`
- [x] Sync survives five interrupt/resume cycles — `pnpm sync-test` PASS 5/5,
      24 records each, zero loss / zero duplicates (Docker unavailable so it
      used the JS-level interrupt fallback)

> Note: the web app swapped PouchDB for a localStorage `StorageDatabase` to dodge
> browser adapter issues. Device-side CouchDB replication therefore does **not**
> exist. The chain is phone (localStorage) → WS mesh → server (PouchDB) → CouchDB,
> so "nothing is lost" rests entirely on the phone's queue reaching the server.

### B — Edge node
> Correction: this was listed as "not started". `apps/ai` is in fact written —
> server, chat route, forecast transform, and a populated weather cache. The
> only missing piece is the model itself.
- [x] Ollama serving, `phi4-mini` resident (2.5 GB) — use `OLLAMA_HOST=0.0.0.0` on demo day
- [x] Open-Meteo cached to `data/weather.json` — 12 KB, Bengaluru coords
- [x] Compact forecast transform with IMD risk bands — `src/weather.ts`
- [x] `POST /ai/chat` written, schema-constrained via Ollama's `format` option
- [x] Answer in under 4s warm — measured 1.0–1.7s (5.8s cold, hence the warm-up call)

### C — Offline maps
- [x] Vector tiles extracted for Bengaluru — z0–14, `data/tiles/bengaluru/{z}/{x}/{y}.pbf`,
      343 tiles / 17 MB, windowed out of the Protomaps daily build `20260905`.
      (Flat `{z}/{x}/{y}` tree, not a `.pmtiles` archive — the JS writer produced a
      non-standard header and there is no browser to verify it against;
      `TODO(post-sih)` pack to PMTiles once `go-pmtiles` is available. The extract
      does download a real `.pmtiles` first, then unpacks it.)
- [x] Glyphs and sprites self-hosted — `data/tiles/glyphs/` (Noto Sans Regular +
      Medium, 64 range files) and `data/tiles/sprites/` (Protomaps v4 light + dark),
      both from `protomaps/basemaps-assets`. MapLibre + its CSS are vendored into
      `apps/dashboard/src/vendor/`; nothing loads from a CDN.
- [x] Style contains zero external domains — `apps/dashboard/src/style.json`
      rewritten to the Protomaps v4 schema (real source-layer / kind names,
      confirmed against the tiles). `scripts/verify-offline.js` now also scans
      `index.html`, checks every referenced asset exists on disk, and backs the
      `/verify-offline` endpoint. PASS.
- [x] Tiles **and labels** render in airplane mode — **confirmed in a browser
      6 Sep.** Streets, water, buildings, district lines and labels all draw from
      local files; every style layer resolves to real features; style passes the
      MapLibre style-spec validator.
      Fixes found during that check: extract bbox was tight so the camera is now
      locked (`maxBounds`) just inside the tile window; extra glyph ranges
      (8192–12543) pulled for the rupee sign / dashes; MapLibre hands URLs to a
      Worker with no relative-URL base, so both maps `transformRequest` every URL
      to absolute; and the SOS markers had `position:relative` overriding
      MapLibre's `position:absolute`, which made them drift on zoom — moved all
      marker visuals onto child nodes.

- [x] Wired into the responder map — `apps/mobile/src/components/responder/MapView.tsx`
      is now a real MapLibre canvas (dark-themed via runtime paint overrides on the
      shared style), SOS pins placed at true `geo` lat/lng and staying anchored on
      zoom. The old SVG is kept as an automatic fallback if the tile server is
      unreachable. `maplibre-gl@4.7.1` added; Vite proxies `/tiles/*` to the
      dashboard on :3000. The three duplicated SOS→incident mappers collapsed into
      `src/services/incidents.ts`, which also threads the real coordinates and a
      real "N min ago" through. `pnpm -r typecheck` green, build green, queue
      tests 10/10. Confirmed working in a browser 6 Sep.

### D — Triage rules ✅
- [x] START protocol implemented in evaluation order
- [x] Reason code on every output
- [x] SOS-field adapter with documented assumptions
- [x] Greedy allocation by category then distance, with capacity limits
- [x] Tests cover every branch — **42 pass, 0 fail** (`pnpm --filter @deadzone/triage test`)

### E — LAN transport
- [x] Express + WebSocket bound to `0.0.0.0` — confirmed listening on :4000
- [x] Envelope create/validate/serialise — `EnvelopeSchema`, `tryDeserializeEnvelope`
- [x] Peer table with 10s heartbeat — broadcasting to connected clients
- [x] Coverage state derivation — `computeCoverage` drives the MeshStrip
- [ ] Envelope crosses phone↔laptop with mobile data off — **untested, one device**

### Frontend
- [x] Mesh client connects and reconnects cleanly
- [x] SOS writes locally before any network call
- [ ] Banner clears the notch, legible at 3m
- [ ] Coverage states internally consistent
- [ ] Internet and mesh state shown separately
- [ ] SVG icons replace emoji
- [ ] Severity options colour-coded
- [ ] Locations match chosen city
- [ ] SOS status screen with hop visualisation

---

## Daily log

### 6 Sep

**Built — Track C, the offline map.** The dashboard's map assets were stubs: a
1×1 sprite, empty glyph folders, no tiles, and an `index.html` pulling MapLibre
and pmtiles.js from `unpkg`. Replaced all of it.

- **Tiles.** `data/tiles/bengaluru/{z}/{x}/{y}.pbf` — z0–14, 343 tiles, 17 MB,
  cut from the Protomaps daily planet build (`build.protomaps.com/20260905`,
  which serves range requests so only the bbox is downloaded). Real Bengaluru
  data: Outer Ring Road, Cubbon Park, 91 hospitals, hundreds of layouts and
  nagars. `apps/dashboard/scripts/extract-tiles.mjs` reproduces it.
- **Glyphs + sprites.** Noto Sans Regular/Medium (64 range PBFs) and the
  Protomaps v4 light/dark sprites, from `protomaps/basemaps-assets` via
  `raw.githubusercontent.com`. MapLibre 4.7.1 + CSS vendored into
  `apps/dashboard/src/vendor/`. **Zero CDN references anywhere.**
- **Style.** `style.json` rewritten for the Protomaps v4 schema — every
  source-layer and `kind` value checked against the actual tiles. Roads by
  class, water, buildings from z12, district boundaries, and labels for
  localities / macrohoods / neighbourhoods / road names, plus red dots +
  names for hospitals (useful next to an SOS pin).
- **Verification.** `scripts/verify-offline.js` rewritten: scans `style.json`
  *and* `index.html` for external hosts, and asserts every referenced asset
  (tiles, each glyph fontstack, sprite sheet, vendored libs) exists on disk.
  Also backs `GET /verify-offline`. PASS.
- **Proven in a browser (later the same day).** Both maps render — streets,
  water, buildings, district lines, labels, SOS pins. Four bugs the browser
  surfaced that headless checks had not: (1) tile 404 spam because the extract
  bbox was tight — fixed by locking the camera with `maxBounds` just inside the
  tile window; (2) missing glyph ranges for the rupee sign and dashes — pulled
  8192–12543; (3) MapLibre passes URLs to a Web Worker with no relative-URL
  base, so `new Request('/tiles/…')` threw before any fetch — both maps now
  `transformRequest` every URL to absolute; (4) SOS markers carried
  `position:relative`, overriding MapLibre's `position:absolute`, so they
  drifted on zoom — all marker visuals moved onto child nodes.

**Why a flat tile tree, not `.pmtiles`.** `go-pmtiles` (the extraction CLI) is
a GitHub release binary and this machine's TLS stack cannot reach
`*.githubusercontent.com` release hosts (`raw.` works, release download does
not). The pure-JS writer (`s2-pmtiles`) produced an archive with a non-standard
header, and with no browser to test it that was too risky to ship. The extract
*does* pull a proper `.pmtiles` first, then unpacks it to `{z}/{x}/{y}`.
`TODO(post-sih)`: repack once `go-pmtiles` is in hand.

**Wired into the app (signed off).** `MapView.tsx` is now MapLibre reading the
proxied tile server, dark-themed, pins at real `geo` coords. SVG mock demoted to
a fallback. Added `maplibre-gl`, a `/tiles` Vite proxy, and
`src/services/incidents.ts` (one SOS→incident mapper replacing three copies that
had drifted and were assigning `Math.random()` positions). Typecheck + build +
tests all green, and confirmed rendering in the browser — pins stay anchored on
zoom after the marker fix above.

**Gate 3 closed — CouchDB, without Docker.** Docker Desktop's WSL2 backend has
no distro (`wsl -l -v` → none) and won't start, so it was abandoned. Installed
Apache CouchDB 3.3.0 natively (Windows service, :5984, admin/changeme, MSI
verified against Apache's SHA-256). Everything downstream worked unchanged:
`setup-db` created `sankatsetu`, the 20 seed SOS are in Fauxton, and
`pnpm sync-test` passed **5/5** — 24 records each run survive an interrupted
PouchDB↔CouchDB replication with zero loss and zero duplicates (it logs
"fallback mode" since it couldn't drive the Docker container). `infra/
docker-compose.yml` stays for machines where Docker works; the runbook
pre-flight now just checks the service is up.

Note: `pnpm seed` can't run while the api server holds the lock on
`.data/local` — run it with the server stopped, or (as done here) write the
seed docs straight to CouchDB and let them replicate down.

**Bug hunt — full read of every package.** Ten real findings. Fixed the four
that matter for the demo (commits `787fc5b`, `6ade578`, `d85eb7d`):

1. 🔴 **Mesh client gave up after ~15s offline** and never retried — the
   queued-SOS drain only fires on reconnect, so any outage longer than that
   silently stranded every message. That outage *is* Beat 6. Now reconnects
   forever, backoff capped at 5s.
2. 🔴 **Critical drowning auto-classified DECEASED** and excluded from
   allocation — apnea inferred from `incidentType + priority`. Now apnea only
   comes from an explicit "not breathing" phrase or recorded vitals. Seed
   distribution: immediate 8 / delayed 9 / minor 3 / deceased 0.
3. 🟠 Phone SOS showed "medical, rescue needed" as the location and had empty
   needs chips — `incidents.ts` now parses needs from the text and derives a
   real location label; `SendingScreen` writes a readable description and
   infers an incident type.
4. 🟠 Every phone SOS pinned to the exact city centre — now real geolocation
   when the browser allows it (secure context only), else scattered ~1-2 km.

**Still open (not fixed — lower risk, listed so they aren't lost):**

5. `apps/api/src/mesh.ts:83` writes `envelope.body` into the SOS DB with no
   schema check and no `envelope.type` check — any envelope type gets stored.
6. `mesh.ts:55` `peerTable.onHeartbeat()` registered per WS connection, never
   removed (`PeerTable` has no `off`) — a 10s callback leaks on every reconnect.
7. `packages/comms/peers.ts` never evicts peers — MeshStrip's device count
   only grows.
8. `SendingScreen` opens a second `MeshClient` alongside `MeshStrip`'s — two
   sockets per phone; the SOS and the queue drain go over different ones.
9. `PeerTable.updatePeer` types its arg `Partial<Peer>` but `PeerSchema.parse`
   requires `isResponder` — a legal-looking call throws at runtime.
10. `computeCoverage` takes the first `isResponder` peer, not the freshest.
11. ⚪ Weather cache runs out 2026-09-11T23:00 — fine for the 10th (~32h of
    window), fails loudly (`pnpm fetch-weather`) after. Refresh near the date.

### 4 Sep
- Repo scaffolded: schema, seed data, cut list, compose file
- `pnpm typecheck` passing across three packages
- Figma Make produced all P1/P2 screens as React web
- Design review complete — six issues found, revision prompt written
- Expo dev client build started

**Blocked on:** second Android phone. City decision outstanding.

### 5 Sep

Audit of the running system, then four defects fixed. All in `apps/mobile`,
approved explicitly before editing.

**Fixed — the offline premise was inverted.** `SendingScreen` called
`connect()` → `sendEnvelope()` → *then* `storeSOS()`. Offline, `connect()`
rejected and control jumped to the catch, which only set error state. **An SOS
sent with no network was discarded entirely** — the opposite of ARCHITECTURE.md
step 1 ("This succeeds with no network"). Reordered: local write first, network
second, and a failed send now leaves the record `queued` rather than lost.

**Fixed — every SOS overwrote the last.** The envelope body carried no `id`, so
`StorageDatabase.storeSOS` ran `docs.set(undefined, sos)`. The local database
could only ever hold one SOS. Masked by an `as any` cast at the call site. Body
now satisfies `SOSRequestSchema` properly, with `id` = envelope id, so a report
arriving twice collapses to one record exactly as the architecture claims.

**Fixed — duplicate sends.** `helpTypes` and `onDelivered` are unstable props in
the effect's dependency array, so any parent re-render fired a second SOS. The
id now lives in a ref, making repeat sends idempotent.

**Fixed — mesh client leaked sockets.** `disconnect()` triggered the auto-reconnect
ladder, so a deliberate close reconnected itself; and `connect()` replaced the
socket without detaching the old one's handlers, leaving orphans that could still
deliver messages. That was the double `[mesh] connected` in the console — and it
meant one SOS could be processed twice.

**Also:** WebSocket connection was failing outright (mixed content, page on :8443
reaching for `ws://localhost:4000`). Added a Vite proxy for `/mesh` and made the
client derive its protocol from the page. `watchChanges` declared a change payload
that never existed; corrected to match what the store actually emits.

**Built — the queue drain.** `services/queue.ts` tracks which SOS records are
still awaiting acknowledgement, kept outside the SOS document so
`packages/schema` is untouched (`SOSStatus` describes the incident, not this
device's transport). `MeshStrip` drains on every transition to connected, so a
reconnect flushes whatever was written while the link was down. The envelope is
reconstructed from the stored record — no extra persistence needed, and reusing
`sos.id` as the envelope id is what makes redelivery safe.

Verified against the live server over a real socket: the reconstructed envelope
is accepted, and sending it twice acks twice while collapsing to a single
document. That is the dedup property in ARCHITECTURE.md, demonstrated rather
than asserted.

**Cleaned up — typecheck is green.** Removed `src/services/services.backup/`
(orphaned; nothing imported it) and the three unreachable `LocalDatabase`
methods left over from the PouchDB→localStorage migration — `getSOS`,
`syncWithRemote`, `destroy` — plus the `StorageDatabase.syncWithRemote` stub
they fronted. That stub was the real hazard: it returned `{ ok: true }` and made
Gate 3 look implemented. **0 errors across every package** —
schema, comms, triage, api, ai, mobile. All recoverable from git if wanted.

**Tested — the queue drain.** 10 tests in `src/services/queue.test.ts`, run with
`pnpm --filter figma-make-app test`. Covers idempotent enqueue, envelope
reconstruction, full drain, mid-drain failure leaving the remainder queued,
orphaned ids being dropped rather than retried forever, and repeat drains being
no-ops. `drainQueue` now takes its store as an optional second argument purely
so a fake can be passed; production callers are unchanged.

No new dependency was added for this. `tsx` is not in this package and
CLAUDE.md rules out adding one this week, so the test asserts envelope fields
directly rather than importing Zod at runtime — wire-level schema validity is
already proven against the live server.

**Found, not fixed:**
- Docker Desktop will not start, so CouchDB is down and the server's replication
  sits paused. Gate 3's last hop stays unproven until that is launched by hand.

**Proven — WeatherGPT, criterion 2.** Installed Ollama, pulled `phi4-mini`
(2.5 GB) and ran `POST /ai/chat` for the first time. It works: **1.0–1.7s warm
against a 4s target**, 5.8s cold.

An important detail for the demo: the model answers only from facts literally
present in the compact weather object, and refuses everything else. *"How much
rain is expected in the next 24 hours?"* returns *"0.4 mm of total
precipitation..."*. *"Is it safe to move people tonight?"* returns *"I don't
have data for that."* — it declines judgement calls, and there is no wind or
temperature in the cache. The demo beat now uses four verified questions, and
deliberately asks for wind speed second so the refusal is on show. That refusal
is the strongest thing the feature does.

**Proven — the phone path.** Both servers bind `0.0.0.0` and are reachable at
the laptop's LAN address. A full WebSocket round trip over `http://<LAN-IP>:8443`
— the exact URL a phone derives — connected through the Vite proxy and got an
ack. **Not yet run from real phone hardware**, but the wiring is confirmed.

Worth noting: this means the second phone may not be the blocker PROGRESS
implied. Criterion 1 says the SOS reaches a *responder device*, and the
responder is a laptop. Phone → laptop over hotspot LAN is the primary transport.
A second phone upgrades the demo to the three-device relay; it does not gate the
success criterion.

**Written — `docs/demo-runbook.md`.** Ninety-second choreography, pre-flight
checklist, failure drills from build_logs, and a proven-vs-unproven table so
nobody demos a beat that has never been executed.

**Pushed.** History split into six focused commits (clean history is a GOALS
deliverable). Eight commits reached GitHub, including `f6c4fe8` and `edad473`
from the previous session, which had never been pushed and were local-only.
One blemish: the `services.backup` deletion landed in the proxy-fix commit
rather than the cleanup commit, because it had been staged earlier by `git rm`.
Not rewritten, since it was already pushed by the time it was noticed.

---

## Next session — start here

**Done 6 Sep** (branch `feat/offline-map`, 10 commits, pushed to GitHub):
offline map built + wired + browser-verified; docs consolidated into `docs/` +
root (`other files/` gone, stale root `PROGRESS.md` deleted); Gate 3 closed
(native CouchDB, sync-test 5/5); full bug-hunt read of every package — 4 fixed
(mesh reconnect, drowning→DECEASED, phone-SOS metadata, scattered geo), 7
tracked (see 6 Sep daily log). PR not opened yet.

**Top priority — the last unproven success criterion:**

1. **Real phone test.** Hotspot or same Wi-Fi, mobile data off, open
   `http://<laptop-IP>:8443` (was `172.20.32.44` on 6 Sep — re-check with
   `ipconfig`), log in → Responder → send / receive an SOS, check the Map tab.
   All five servers bind `0.0.0.0`; Windows firewall already allows Node.
   This is Gate 1 / criterion 1 — the only one still simulated-only.
   Pre-flight (`docs/demo-runbook.md`): CouchDB service up · `apps/api` ·
   `apps/dashboard` (tiles :3000) · `apps/mobile` (:8443) · `apps/ai` + Ollama.

**Decision still outstanding:**

- **Demo weather.** Live forecast is 0.4 mm / GREEN — criterion 2 works but the
  risk-band logic never shows its teeth. Take live weather on the day, or
  prepare a severe cache and label it plainly as illustrative. Also: the cache
  itself expires **2026-09-11T23:00** — re-run `pnpm --filter @deadzone/ai
  fetch-weather` on the 9th or 10th regardless.

**Then:**

2. **Open the PR** for `feat/offline-map` and merge to `main`.
3. **Five rehearsal runs** before the 10th — full pre-flight, 90-second run,
   record the fifth as the backup video.
4. Frontend polish backlog (Frontend track above): notch-clearing banner,
   internet vs mesh state shown separately, SVG icons, severity colours, SOS
   hop-visualisation screen.
5. Optional cleanup: the 7 tracked bugs (esp. #6 heartbeat-callback leak and #8
   SendingScreen's second socket — same demo path); delete stale root docs
   `DEMO_GUIDE.md` / `INTEGRATION_STATUS.md` / `FRONTEND_INTEGRATION_MAP.md`;
   Capacitor APK (toolchain is present; ~half day, needs endpoint config).

---

## Cut list

Not building these. Reasons in `docs/decisions.md`.

Voice input · IndicTrans2 · OSRM routing · Hungarian allocation · Ed25519 signing · Multi-hop beyond one relay · Custom conflict resolution · Design polish

---

## Post-SIH backlog

Ideas parked, not forgotten: LoRa hardware for real long-range mesh, on-device small model for civilian-side AI, CAP alert interoperability with NDMA SACHET, true multi-hop routing, supply and inventory management.
