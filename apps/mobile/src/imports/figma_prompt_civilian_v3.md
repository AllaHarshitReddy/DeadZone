# DeadZone SOS — Figma AI Prompt (Civilian App v3)

Three changes over v2: a **passive coverage-loss alert system**, a **hard fix for the Dynamic Island collision**, and a **UX/visual pass** to remove the generated look.

> Paste the block below into Figma AI / Figma Make. If it truncates, run **Part 1 + Part 2** first, then **Part 3**, then **Part 4**.

---

## Part 1 — Foundations (apply to every screen)

Dark-mode React Native screens for **DeadZone SOS**, a civilian offline mesh emergency app. Frame 390×844, iPhone with Dynamic Island.

**Dynamic Island — hard constraint.** The island occupies a 126×37pt pill centred horizontally, from y=11 to y=48. No text, icon, dot or control may fall inside x=132–258, y=0–59 on any screen. Status/connectivity bars are the repeat offender: a full-width status bar must **start below y=59**, not run behind the island. If a bar needs to sit in the island row, split it into two segments — left of x=126 and right of x=264 — with the centre left empty. Show every screen with the island drawn in, so the collision is visible if it exists.

**Layout grid.** 20px side margins. Safe area top 59px, bottom 34px. Content column 350px. 8px spacing scale.

**Type.** One family: Inter. Weights 400/500/600 only. Sizes: 28/20/17/15/13. Sentence case for all body and label text. Reserve uppercase for one thing only — a status word inside a badge (e.g. `CRITICAL`) — never for headlines or button labels. No condensed or display faces.

**Colour.** Background #0B1220. Surfaces #131C2E. Borders #243044. Text #E6EAF2 primary, #8A97AC secondary. Status: critical #E5484D, urgent #F5A524, ok #30A46C, mesh-accent #22D3EE. Colour appears only on status and on one primary action per screen; everything else is neutral. **No glows, no neon outer shadows, no gradient fills on buttons, no coloured drop shadows.** Elevation is a 1px border plus a slightly lighter surface — nothing else.

**Icons.** Thin 1.5px stroke line icons, single colour, 24px. No filled emoji-style warning triangles, no rounded-square icon tiles.

---

## Part 2 — Coverage-loss alert system (new)

The alert is **passive and always running**. It fires from background mesh monitoring whether or not the user has pressed SOS — the app watches signal degradation and warns the person that they are walking out of relay range. Design four escalating states:

**2a. Ambient strip (all screens).** A 32px bar below the safe area showing mesh state, peer count and a 5-bar signal history sparkline of the last 60 seconds, so degradation is visible before it becomes critical. Three variants: `Mesh strong · 14 devices` (green dot), `Mesh weakening · 3 devices` (amber dot), `No relay path` (red dot). Split around the island per Part 1.

**2b. Weakening toast (non-blocking).** Slides down under the strip when peer count drops. Amber left border, 15px sentence-case text: "Signal weakening — 3 devices left in range." Secondary line: "You are moving away from the relay area." Two actions: `Guide me back` and `Dismiss`. Auto-dismisses after 8 seconds; the strip stays amber.

**2c. Coverage-lost full screen (blocking).** Appears automatically the moment the last relay path is lost, with no SOS required. Replaces the earlier centred-poster layout with a working screen:
- Compact red status header **below** the island.
- Left-aligned headline, 28px, sentence case, two lines max: "You've left relay coverage."
- One line of body: "Your SOS can't reach a responder from here."
- **A small live map is the hero**, not a compass rose: 350×220 dark map card showing the user's dot, a dotted breadcrumb trail of the path already walked, and the last connected node marked with a labelled pin.
- Below it, a single row of facts as a label/value list, left-aligned: `Distance 340 m` · `Bearing 210° SW` · `Last node Majestic Bus Stand` · `Left coverage 2 min ago`.
- Primary button full-width, flat solid, sentence case: "Guide me back". Secondary text button: "Send SOS anyway (queued)".
- No decorative icon tile, no centred stack, no glow.

**2d. Return-guidance screen.** Held upright, walking. Large bearing arrow rotating live, distance counting down, breadcrumb map beneath, a coloured proximity bar that goes red → amber → green as peers reappear, and a persistent line "Walking back restores your connection." On reconnect: a green confirmation sheet, "Back in coverage — 4 devices in range", and any queued SOS flushes automatically with a "Queued SOS sent" line.

Also design the **queued-SOS state**: SOS pressed while out of coverage shows a pending card with "Waiting for a relay — will send automatically", a retry counter, and the same guide-me-back action.

---

## Part 3 — Screens (13)

1. Login — phone + country code, "Continue offline" secondary, language link.
2. Language select — English, हिन्दी, ಕನ್ನಡ, தமிழ், తెలుగు, मराठी, বাংলা, ગુજરાતી. Plus one Home screen duplicated in Hindi.
3. Profile — name, phone, blood group, emergency contacts, medical notes; opened from top-right avatar.
4. **Home / SOS**, three connectivity variants: no coverage → "Send now", fires on one press; weak → 2s hold ring, "Hold 2s or tap twice"; strong → 2s hold ring, "Hold 2s or tap three times". The SOS button is a flat solid disc with a thin progress ring — no concentric glow halos. Show one variant mid-hold.
5. Step I — Severity: Critical / Urgent / Stable as three stacked rows, each with status colour and shape icon.
6. Step II — Type of help: multi-select chips (Medical, Rescue, Food & water, Shelter, Fire, Evacuation). Optional; helper text "If nothing is selected, all types are sent"; show the nothing-selected state with Continue still enabled.
7. Step III — People affected: stepper plus tappable numeric field; show the keyboard-open state with Continue lifted above the keyboard.
8. Sending / relaying — hop progress as a horizontal chain of device nodes lighting up in sequence, not a ripple animation. "Relayed by 3 devices."
9. **Weakening toast** state (2b) shown over Home.
10. **Coverage lost** (2c).
11. **Return guidance** (2d) + reconnected confirmation.
12. Live tracking — my SOS card, responder marker moving along a dotted path, ETA, team name, status timeline (Sent → Relayed → Acknowledged → Dispatched → Arriving).
13. Nearby mesh — peer list with signal bars and "You're relaying 4 messages for others."

Every screen except Home gets a 24px back chevron at top-left and a profile avatar at top-right, both below y=59.

---

## Part 4 — Component page

Ambient mesh strip (3 states, island-split), signal sparkline, weakening toast, SOS button (3 connectivity variants × default/holding/sent), severity row, help chip, numeric stepper, hop-chain node, bearing arrow, proximity bar, map card, label/value fact row, primary/secondary/text buttons, status badge, back chevron, avatar, empty state, skeleton rows.

---

## Why the current build reads as AI-generated — fix these six

1. **Everything is centred.** Centred icon, centred headline, centred body, centred button. Real product UI is left-aligned with a clear reading edge; centring is for a single confirmation moment, not a whole screen.
2. **Glow and neon.** Coloured outer shadows on the icon tile, the card, the button and the SOS disc. Remove all of them — 1px borders only.
3. **Uppercase condensed display type** for headlines and buttons. It reads as a poster, not an interface. Sentence case, Inter.
4. **Decorative rather than functional content.** A generic warning triangle and a compass rose occupy the most valuable space while telling the user nothing. Put a map with a breadcrumb trail there instead — same space, actual information.
5. **Gradient orange CTA** against an otherwise flat palette. Flat solid fill, one accent per screen.
6. **No information density.** One fact per card, huge vertical gaps. Group the facts into a compact label/value list so the screen answers "how far, which way, how long ago" in one glance.

## Open decision

Is "tap twice / three times" an alternative to the hold, or a confirmation after it? The button's mid-hold state differs in each case.
