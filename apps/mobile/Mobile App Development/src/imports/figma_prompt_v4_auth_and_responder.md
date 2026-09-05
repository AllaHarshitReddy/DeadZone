# DeadZone SOS — Figma AI Prompt v4

Two independent blocks. **Run Block A first, then Block B.** Do not restate or redesign screens that are not listed here — every other existing screen stays exactly as it is.

---

## BLOCK A — Civilian mobile (390×844, iPhone with Dynamic Island)

> **Scope rule:** modify only the three items below. Leave every other civilian screen untouched — same layout, same components, same copy.

**Dynamic Island constraint (still applies):** nothing may fall inside x=132–258, y=0–59. The mesh status strip starts below y=59, or splits into left and right segments around the island.

### A1. Authentication screen — India only

Edit the existing auth screen shown in the reference. Keep the layout, the dark palette, the field styling, the Civilian/Responder segmented control and the language row at the bottom.

Change one thing: **remove the country-code dropdown entirely.** No +1, no +44, no country picker, no chevron. Replace it with a **static, non-interactive `+91` prefix rendered inside the left edge of the mobile-number field itself** — a single 350px-wide field, the `+91` in secondary grey at 15px with a 1px divider after it, then the 10-digit number in primary white. Placeholder `98765 43210`. Numeric keypad only, hard cap at 10 digits. Show the field in three states: empty, partially typed, and filled-and-valid with a small green tick at the right edge.

### A2. New screen — Civilian profile setup

Appears immediately after Continue is pressed with **Civilian** selected. Standard header: back chevron top-left, title "Your details", step indicator "2 of 2".

Fields, in this order:

1. **Blood group — mandatory.** Not a dropdown. A grid of 8 selectable chips in two rows: A+, A−, B+, B−, O+, O−, AB+, AB−. Plus a 9th full-width chip "Not known". One selection only. Label carries a red asterisk and the helper line "Shared with responders when you send an SOS." Show one chip selected. Also design the error state: red border on the group and the message "Select a blood group to continue."
2. **Emergency contacts — optional, up to 3.** Three stacked rows, each with a name field and a 10-digit number field with the same static `+91` prefix treatment. Rows 2 and 3 are collapsed behind a "+ Add another contact" text button until used. Each filled row gets a small remove ✕.
3. **Medical notes — optional.** Multi-line text area, 4 rows tall, placeholder "Allergies, medication, disability, anything a rescuer should know", character counter 0/280 bottom-right.

Footer: full-width primary button "Finish". A secondary text button "Skip for now" sits below it — but only skips the optional fields; blood group still gates it, so show the disabled state of "Finish" when no blood group is chosen.

### A3. Home / SOS — button and instruction sizing only

Keep the screen's structure, the mesh strip, the header and the bottom navigation exactly as they are. Change only the SOS control:

- Button becomes **red in every connectivity state** — fill #E5484D, flat solid, no glow, no gradient, no green or amber variants. Diameter 240px, centred. Label "SOS" in white, 44px, weight 600.
- The progress ring around it stays, rendered in white at 40% opacity so it reads against red.
- Connectivity is communicated by the **ring and the caption**, not the button colour.
- The instruction line beneath the button becomes **large and dominant**: 24px, weight 600, primary white, centred, on two lines with 32px of space above it. Copy per state: "Press once to send" / "Hold 2 seconds\nor tap twice" / "Hold 2 seconds\nor tap three times".
- A 15px secondary line sits below that: "Your location and blood group are sent automatically."

Show all three connectivity variants plus one mid-hold state.

---

## BLOCK B — Responder web dashboard (laptop, 1440×900)

Desktop-first. Dark palette as before: background #0B1220, surfaces #131C2E, borders #243044, text #E6EAF2 / #8A97AC, status critical #E5484D, urgent #F5A524, stable #30A46C, accent #22D3EE. Inter, tabular numerals, sentence case, 1px borders, no glows, no gradients.

### B1. Responder sign-in — inline, on the same auth screen

When **Responder** is selected in the segmented control, a government-ID field **expands inline directly beneath the control** (animated height, no page change). It is a single field with a **static, non-editable `@gov.in` suffix pinned to its right edge** and a 1px divider before it; the user types only the username portion. Label "Official ID". Placeholder "your.name". Helper line "Only @gov.in accounts can access the responder dashboard."

Design four states: default, focused, valid (green tick, "Verified — Karnataka SDRF"), and invalid ("This ID is not registered. Contact your control room."). Below it: a password or OTP field, then "Sign in to dashboard". The Civilian path is unaffected — selecting Civilian collapses this field away.

### B2. Dashboard shell

**Remove the online/offline status pill and every connectivity banner from the dashboard entirely.** No mesh state, no sync clock, no "OFFLINE" chip anywhere in the responder UI. That signal lives only in the civilian app now.

Top bar 56px: product mark, a global search field, active-incident count, HQ name, responder avatar with name and rank. Body: 320px incident rail on the left, live map centre, 380px action panel right, collapsible 260px bottom dock.

### B3. Live map — the centre of the product

- Real interactive map of a Bengaluru district, dark desaturated basemap with legible road and place labels.
- **Zoom cluster:** + / − buttons, a zoom-level readout, "Fit all incidents", and a distinct **"My location"** control that recentres on the responder.
- **Responder marker:** blue pulsing dot with an accuracy halo and a heading cone, visually distinct from every incident marker, labelled "You".
- **Incident markers coloured strictly by severity** — critical #E5484D, urgent #F5A524, stable #30A46C — each with its own shape as well as colour (triangle / diamond / circle) so it survives colour-blindness and projector washout. Marker size scales with the number of people affected; a count badge sits on the marker.
- Clustering at low zoom: cluster bubbles take the colour of the **highest severity** they contain, with a count.
- Selected incident: white ring, and a routing line drawn from the responder marker to it with distance and ETA on the line.
- Team markers: small vehicle chips moving along dotted routes.
- A live-updating list is implied — show one marker in a "just arrived" flashing state.
- Map legend bottom-right: severity shapes, team chip, responder dot. Scale bar.

### B4. Incident detail → team dispatch

Selecting an incident opens the right panel: severity badge, disaster type, people affected, address and coordinates, time reported, blood groups of the victims, medical notes, and reporter contact.

Beneath that, the **dispatch block**: a labelled dropdown "Assign rescue team" that opens a rich menu grouped by HQ. Each row shows team name, unit type icon (Medical / Fire / Rescue / Evacuation), member count, current status badge (Available / En route / On site / Off duty), distance from the incident, and ETA. Available teams sort to the top; unavailable ones are dimmed and non-selectable with the reason shown. A search field filters the list. Multi-select is allowed for large incidents, shown as removable team chips once chosen.

Below the dropdown: "Dispatch" primary button and a confirmation state showing the assigned teams with live ETAs.

Design the dropdown **open** in one artboard and **closed with two teams assigned** in another.

### B5. Resources — backed by the HQ database

Bottom dock, two tabs.

*Tab 1 — Teams:* a dense data table, one row per team: name, HQ, unit type, members, status, current assignment, distance, last update. Sortable headers, status filter chips, row hover state.

*Tab 2 — Resources:* an inventory table read from the HQ database, columns: item, HQ / depot, total, allocated, available, reserved for, last synced. Rows for ambulances, medical kits, stretchers, water (litres), blankets, rescue boats, generators. Each row has an **allocation control** — a stepper plus an "Allocate" action — that is **hard-capped at the available count**, with the cap shown inline ("6 of 6 available") and a disabled state plus the message "Not enough stock at this HQ — request transfer" when the request exceeds it. A "Request from another HQ" action appears in that state.

Above the table: four summary tiles with large tabular numbers — Ambulances available, Medical kits available, Teams on duty, Open incidents — each with a delta versus an hour ago.

Also design the empty state ("No incidents in this district") and skeleton loading rows for both tables.

### B6. Component page

Responder ID field with `@gov.in` suffix (4 states), severity marker set (3 shapes × 3 sizes), cluster bubble, responder location dot, team chip, map control cluster, team-dropdown row, allocation stepper (default / at cap / over cap), summary tile, data-table row, filter chip, primary / secondary / danger buttons, severity badge, skeleton row, empty state.

---

## Change log — what this prompt touches

| # | Change | Where |
|---|---|---|
| A1 | Country picker removed, `+91` fixed inline | Auth screen |
| A2 | New civilian profile screen — blood group mandatory, 3 optional contacts, optional notes | New screen after Continue |
| A3 | SOS button red in all states, instructions enlarged to 24px | Home only |
| B1 | Responder `@gov.in` field expands inline on selection | Auth screen |
| B2 | Online/offline indicator deleted from dashboard | Dashboard shell |
| B3 | Dynamic map: zoom, live responder location, severity-coloured incidents | Map |
| B4 | Rescue-team dropdown grouped by HQ, on incident selection | Detail panel |
| B5 | Resource allocation bound to HQ database availability | Bottom dock |

Everything not listed above stays as currently designed.

---

## Two notes for your engineering side

- **Blood group is mandatory but the app must work offline from first launch.** If profile setup can be reached before any mesh connection exists, keep the whole screen local-only — it writes to PouchDB and syncs later. A mandatory field that blocks on a network call would defeat the entire premise of the app.
- **`@gov.in` validation cannot happen offline.** Decide now whether the responder dashboard assumes an uplink at sign-in (reasonable — it runs at the command post) or needs a cached credential list. The UI differs: the second case needs a "Signed in offline — verified against local roster" state on the dashboard.
