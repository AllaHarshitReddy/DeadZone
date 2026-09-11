# Sankat Setu — UI/UX Design Brief

**For: designer (Figma) + frontend dev**
**Deadline: designs needed by 8 September. Demo is 10 September.**

---

## 1. What you're designing

A mobile app used during a disaster **when there is no cellular network and no internet**. Two user types share one app:

- **Civilians** — trapped, panicking, possibly injured, on a phone at 12% battery, in rain or darkness.
- **Responders** — rescue teams coordinating from a field command post.

This is not a consumer app. Nobody is browsing. Every screen exists to get one specific thing done under stress.

---

## 2. Design principles

These override normal aesthetic instincts. Please read them before opening Figma.

**Legible at arm's length, outdoors, in sunlight.** Minimum body text 16px, primary actions 20px+. High contrast throughout. No thin font weights, no low-contrast grey-on-grey.

**One-handed, thumb-reachable.** Primary actions in the bottom third of the screen. The person may be holding a child, injured, or clinging to something.

**Panic-proof.** A frightened person cannot read a paragraph. Short sentences, big buttons, obvious next action. If a screen needs instructions, it's wrong.

**Dark theme by default.** Battery preservation matters when there's no power for days, and it's easier on the eyes at night. Light theme is optional and low priority.

**Status must be unmistakable from across a room.** This one is unusual and important — see §4.

---

## 3. Colour semantics — locked, do not reinterpret

These map to India Meteorological Department warning conventions. Judges from a disaster-management background will recognise them, so we must not invent our own palette here.

| Colour | Meaning | Used for |
|---|---|---|
| Green | Safe / connected / minor | Coverage GREEN, triage GREEN, online state |
| Amber/Yellow | Caution / weak / delayed | Coverage AMBER, triage YELLOW |
| Orange | Alert / prepare | Weather orange alert |
| Red | Immediate / disconnected / critical | Coverage RED, triage RED, offline state |
| Black/Grey | Expectant | Triage BLACK (responder view only, handle with restraint) |

Pick specific hex values for each and put them in the token set. Never use red or green decoratively anywhere else in the app — they carry meaning here.

---

## 4. The single most important element

**The OFFLINE / ONLINE banner.**

The entire product claim is that this works with no network. During judging, an evaluator standing three metres away must be able to see that the app is offline without asking. This banner is what proves it.

Requirements:
- Full width, top of screen, persistent, on every screen
- Large enough to read from three metres
- Red when offline, green when online, with an unmistakable state change animation on transition
- Text label, not just colour — "OFFLINE — MESH ACTIVE" / "ONLINE — SYNCING"

Design this first. Everything else is secondary to it.

---

## 5. Screens

Priority 1 must exist by 8 September. Priority 3 can ship unstyled.

### P1 — Civilian: Home

The default screen. Contains:
- The offline banner (§4)
- **The SOS button** — dominant, centred, unmissable, minimum 45% of screen height. Long-press to activate (prevents accidental triggering), with a visible countdown ring.
- **Coverage meter** — see §6
- Small text: number of nearby devices detected

### P1 — Civilian: SOS compose

Reached after the SOS button. Must be completable in under 15 seconds.
- Number of people (stepper, big +/− targets)
- What's needed — icon buttons, multi-select: Medical, Rescue, Food/Water, Shelter
- Severity — three large options, not a slider
- Optional note field (keyboard optional, never required)
- Location auto-filled, shown as read-only confirmation
- One large Send button

### P1 — Civilian: SOS status

After sending. Three states, visually distinct enough to read at a glance:
- **Queued** — waiting for a nearby device
- **Relayed** — passed to a nearby device
- **Delivered** — reached a responder

Show a simple hop visualisation (your phone → relay → responder) with completed hops filled in. This is a key demo moment; make it satisfying.

### P1 — Responder: Map

- Full-screen map with SOS pins coloured by triage category
- Pins must be distinguishable from each other and from the basemap
- Tap a pin → bottom sheet with SOS detail
- Offline banner overlaid on top

### P2 — Responder: SOS list + detail

- List sorted by triage priority, each row showing category colour, need icons, people count, time elapsed, distance
- Detail view shows triage category **with its reason code** ("RED — respiratory rate over 30"). The reason must be visible; explainability is a core pitch point.
- A confirm action for the responder to verify before dispatch

### P2 — Coverage warning screen

Triggered when the user walks out of mesh range. See §6.

### P3 — WeatherGPT panel

A simple conversational panel. Question input, answer display. Answer includes a highlighted **safety action** line at the bottom that must stand out from the explanatory text.

### P3 — Role selection

First launch only. Two large cards: "I need help" / "I am a responder."

---

## 6. The coverage meter — needs the most design thought

This is our differentiating feature and it has no obvious existing pattern to borrow.

**What it shows:** whether the user can currently reach a rescuer through nearby devices. Three states:

- **GREEN** — connected, message will get through
- **AMBER** — weak link, or peers visible but no path to a responder
- **RED** — no devices nearby, you are alone

**Constraint that matters:** this is *not* a signal-bars metaphor and must not look like one. Signal bars mean cellular, and the whole point is that cellular is dead. Find a different visual language — a proximity field, a ring, a horizon. Something spatial.

**The warning moment.** When the state drops to RED, a full-screen alert:

> **You are leaving relay coverage**
> Last connected point: 340 m back
> [large directional arrow, bearing 210°]
> [Guide me back]

This should feel urgent but not punishing. The person may have walked away for a good reason.

---

## 7. Deliverables

By **8 September**, in one Figma file:

1. **Design tokens** — colours, type scale, spacing, radii, as Figma variables. The frontend is built with token-driven Tailwind, so tokens are the actual handoff artefact.
2. **Components** — button (3 sizes, 4 states), status banner, SOS card, triage badge, coverage indicator, bottom sheet
3. **P1 screens** at 390 × 844 (iPhone 14 / typical Android logical size)
4. **P2 screens**, lower fidelity acceptable
5. Dark theme only

**Format notes for the dev:** name Figma layers to match component names in code. Export icons as SVG. Don't design custom form controls — use platform defaults so we don't burn build time reimplementing a stepper.

---

## 8. Explicitly out of scope

Don't design these — they're on the project cut list and won't be built:

- Voice input UI
- Turn-by-turn navigation
- Supply/inventory management screens
- Onboarding flow, tutorials, splash sequences
- Settings, profile, account screens
- Language switcher (Hindi strings are hardcoded for the demo)
- Animations beyond state transitions

---

## 9. If designs are late

The build proceeds unstyled behind a token layer. If nothing arrives by 8 September, we ship with default styling and restyle after. **Do not hold the build waiting for Figma** — send P1 screens as they're finished rather than batching the whole file.
