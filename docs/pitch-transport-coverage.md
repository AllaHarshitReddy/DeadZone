# Pitch language — transport and coverage

Approved wording. Use this verbatim when describing how devices talk to each
other and what the coverage meter means. It replaces every earlier claim about
Nearby Connections, BLE mesh, RSSI, and multi-hop relay — none of which the
code supports. See CLAUDE.md, "Transport reality".

---

## Transport

> DeadZone does not depend on any infrastructure it doesn't bring with it.
> The responder's laptop is a field command node running the coordination
> server, the database, and the language model. It raises its own Wi-Fi
> hotspot. Phones join that hotspot and open the app in a browser — no app
> store, no install, no cell tower, no ISP, no internet. Every phone holds a
> WebSocket to the node.

## Coverage

> The meter reports one fact the device can actually observe: how long since we
> last heard from the command node. Green means within thirty seconds. We
> deliberately do not display signal strength or distance, because we cannot
> measure either — and a wrong number is more dangerous than no number when
> someone is deciding which way to walk.

---

## Claims that must not be made

| Do not claim | Reality |
|---|---|
| Android Nearby Connections / P2P_CLUSTER | A browser cannot access it |
| BLE mesh, 10–100 m range | No Bluetooth, no distance measurement |
| RSSI-based coverage | Time since last heartbeat only |
| Multi-hop relay (A → B → C) | One hop, phone → node |
| "N nearby devices" | Always 1 — the node is the only heartbeat source |

## The honest cost

We lose "peer-to-peer mesh." Say so plainly if asked; do not paper over it.

What survives is **infrastructure independence**, which is the claim that
actually matters to a responder and is fully true: no tower, no ISP, no
internet, and it works in a room with all of that switched off.

The coverage argument is the one worth fighting for. Refusing to display a
number we cannot measure is the same argument as the weather model answering
*"I don't have data for that"* — and it generalises.
