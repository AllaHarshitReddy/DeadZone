# Demo Day — Checklist

**10 September 2026.** Follow top to bottom. Don't think, just tick.
Full detail lives in `demo-runbook.md`. This page is for the venue.

---

## 1 · Free memory FIRST

Close **Discord**, spare **Brave/Chrome** windows, VS Code if unused.

```powershell
Get-CimInstance Win32_OperatingSystem | % { [math]::Round($_.FreePhysicalMemory/1MB,2) }
```

**Target ≥ 4 GB free.** Below that, Windows kills services silently — ports go
quiet, no error anywhere, screen still shows the last good frame.

**Every service in its own terminal.** Never inside an agent/background runner —
those get reaped first.

---

## 2 · Start services, in this order, verifying each

Each check must print `200` before you start the next one.

```powershell
# 0 · CouchDB (native service, usually already up)
curl http://localhost:5984/                       # {"couchdb":"Welcome",...}
#   if not:  Start-Service "Apache CouchDB"        # NOT docker compose

# 1 · TILE SERVER — FIRST. Vite's proxy needs it to exist at map init.
cd apps/dashboard; pnpm dev
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/style.json        # 200

# 2 · API + mesh
cd apps/api; pnpm dev
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:4000/health            # 200

# 3 · The app (LAST)
cd apps/mobile; pnpm dev
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8443/                  # 200
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8443/sos               # 200
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8443/tiles/style.json  # 200
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8443/tiles/bengaluru/10/732/474.pbf  # 200
curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:8443/tiles/glyphs/Noto%20Sans%20Regular/0-255.pbf"  # 200

# 4 · Ollama — the env vars are NOT optional
OLLAMA_HOST=0.0.0.0 OLLAMA_ORIGINS=* OLLAMA_KEEP_ALIVE=-1 ollama serve
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:11434/api/tags         # 200

# 5 · AI service
cd apps/ai; pnpm dev
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:4001/health            # 200
```

Six ports live: **3000 · 4000 · 8443 · 5984 · 11434 · 4001**

```powershell
foreach ($p in 3000,4000,8443,5984,11434,4001) { "$p " + [bool](Get-NetTCPConnection -LocalPort $p -State Listen -EA SilentlyContinue) }
```

---

## 3 · Warm the model — MANDATORY

```bash
curl -X POST http://localhost:4001/ai/chat -H 'Content-Type: application/json' \
  -d '{"q":"how much rain is expected in the next 24 hours?"}'
```

First call **~58 s** — wait it out, touch nothing. Then run it **twice more**.

☐ **Two consecutive ~1 s responses seen.** Not started until you have.
Note the mm figure it returns — that's the number you'll hear on stage.

---

## 4 · Read the LIVE LAN IP — never trust the boot log

The API prints an address once at boot and it goes stale. It moved **three
times** on 7–8 Sep.

```powershell
Get-NetIPAddress -AddressFamily IPv4 | ? { $_.IPAddress -notlike '169.254.*' -and $_.IPAddress -ne '127.0.0.1' } |
  % { "{0}  {1}" -f $_.IPAddress, $_.InterfaceAlias }
```

- **Hotspot on** → use the `192.168.137.1`-style address (Wi-Fi Direct adapter)
- Same Wi-Fi as laptop → the `Wi-Fi` adapter address
- **Never** the `vEthernet` / Hyper-V address — a phone can't reach it

Phone opens **`http://<that-IP>:8443`**. ✍️ Write it on your hand.

---

## 5 · Reseed, then reload the phone

```powershell
cd apps/api; pnpm seed        # upserts the 20 fictional records
```

⚠️ **`pnpm seed` does NOT delete anything.** It upserts the 20 seed records by
id and leaves every rehearsal SOS in place. As of 8 Sep the store held 24 docs:
the 20 seeded plus 4 rehearsal artifacts. To actually start clean you must
remove the extras yourself — Fauxton at <http://localhost:5984/_utils>
(admin / changeme), delete the non-seed docs, then reseed.

Check what's in there:

```powershell
$h=@{Authorization="Basic "+[Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:changeme"))}
(Invoke-RestMethod "http://localhost:5984/sankatsetu" -Headers $h).doc_count    # expect 20 when clean
```

Do this **after** your last rehearsal. Then **hard-reload the phone** (clear
site data, see below) so it doesn't show stale incidents.

---

## 6 · Phone setup

☐ Airplane mode **ON**, then Wi-Fi back **ON**
☐ Joined the laptop's hotspot
☐ Tapped **"stay connected"** on Android's no-internet warning
☐ Disabled *"switch to mobile data when Wi-Fi has no internet"*
☐ **Mobile data OFF and visibly off** — the judge must see this
☐ Site data cleared for the app, then loaded `http://<IP>:8443`
☐ Screen timeout **10 min**, brightness up, notifications silenced
☐ Backup video queued and ready

> Android's captive-portal detection silently drops Wi-Fi with no uplink.
> This is the single most common way this demo dies.

---

## 7 · Map failure — two signatures, tell them apart

| You see | Console | Cause | Fix |
|---|---|---|---|
| Grey hand-drawn blocks | `[MapView] falling back to the sketch map: Error: style 502` | Tile server :3000 down | Start it, then **switch responder view away and back** (SOS tab → Map). Remount clears it; a soft refresh won't. |
| Empty dark canvas, pins visible | **Clean — nothing logged** | Tiles 404ing (404s are swallowed at `MapView.tsx:176`) | Network tab → red `.pbf`. Not fixable live: narrate over it, the pins carry the beat. |

---

## 8 · If the link drops mid-demo — this is a feature

The SOS shows **"Saved on this device"** and stops. Don't apologise. Say:

> "No relay in range. It wrote to the phone's own storage before it touched the
> network. It's holding it — nothing is lost. Watch what happens when a link
> comes back."

Then reconnect and let the queue drain. **This is a better demo than the happy
path.** It's the whole product claim, demonstrated live.

---

## Last look before you walk up

☐ 6 ports live ☐ model warm (2× ~1 s) ☐ IP written down ☐ store reseeded
☐ phone on hotspot, mobile data off ☐ ≥ 4 GB free ☐ backup video ready
