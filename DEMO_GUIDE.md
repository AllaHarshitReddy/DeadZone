# Demo Guide — Sept 10, 2026

**Status**: All services built and ready. This guide walks through testing each critical demo flow before the grand finale.

**Timeline**: ~2–3 hours for full end-to-end verification.

---

## Prerequisites

1. **Docker Desktop** running on the responder laptop
2. **Two devices** on the same Wi-Fi network:
   - Phone (civilian or second laptop) — runs frontend at `http://<responder-ip>:5173`
   - Responder laptop (responder role) — runs all backend services
3. **Terminal** access (PowerShell on Windows, bash on Mac/Linux)

---

## Setup (One Time)

### Step 1: Start All Services

From `C:\Users\harsh\OneDrive\Desktop\Sanket Setu\`, run the startup script:

**Windows PowerShell:**
```powershell
.\START_ALL.ps1
```

This opens 5 terminals:
1. **Terminal 1**: CouchDB (docker-compose up)
2. **Terminal 2**: Seed data loader (runs `pnpm seed`)
3. **Terminal 3**: API Server (ws://localhost:4000)
4. **Terminal 4**: Dashboard (http://localhost:3000)
5. **Terminal 5**: Mobile Frontend (http://localhost:5173)

**Wait for ready messages:**
- Terminal 1: `CouchDB is ready to accept connections`
- Terminal 2: `[OK] Seed data loaded`
- Terminal 3: `[Server] listening on 0.0.0.0:4000 — ready to accept mesh connections`
- Terminal 4: `Listening on http://localhost:3000`
- Terminal 5: `  ➜  Local: http://localhost:5173/`

### Step 2: Get Responder Laptop IP

Find your responder laptop's local IP (not localhost):

**Windows PowerShell:**
```powershell
ipconfig | Select-String "IPv4 Address"
```

**Mac/Linux:**
```bash
ifconfig | grep inet
```

Example: `192.168.1.100`

### Step 3: Access Frontend from Phone

On the phone/second device, open:
```
http://<responder-ip>:5173
```

Example: `http://192.168.1.100:5173`

---

## Test Flows

### **Flow 1: Civilian Sends SOS (CRITICAL for demo)**

**Start State**: Frontend loaded, login screen visible

1. **Login as Civilian**
   - Name: "Victim 1" (any name)
   - Phone: "9999999999"
   - Location: "Malleswaram, Bengaluru"
   - Press "Continue"

2. **Navigate to SOS Form**
   - Press "Send SOS" button (prominent red button)

3. **Fill SOS Form**
   - **Severity**: Select "Critical" (life-threatening)
   - Press "Next"
   - **Help Type**: Check "Medical" + "Rescue"
   - Press "Next"
   - **People Count**: Select "5 people"
   - Press "Send SOS"

4. **Watch Sending Animation**
   - Screen should show:
     - "Sending..." (icon animating)
     - Peer count badge (e.g., "2 peers")
     - Coverage status (GREEN/AMBER/RED)
   - After ~2s: Status changes to "Relaying..."
   - After ~4s: Status changes to "Delivered ✓"

5. **Verify in Responder Dashboard**
   - Open responder view on the responder laptop (or same browser)
   - Look for new SOS in:
     - **MapView**: New pin should appear, colored RED (immediate)
     - **SOSList**: New SOS should appear at top, sorted by priority
     - **TriageBoard**: Card should appear in "IMMEDIATE" (RED) column

**Expected Result**: ✅ SOS sent, received, and triaged correctly.

---

### **Flow 2: Responder Receives & Triages SOS**

**Start State**: SOS visible in responder dashboard from Flow 1

1. **Open MapView Tab**
   - Click "MAP" in responder nav
   - **Expected**: 
     - Bengaluru map visible (with or without tiles)
     - New SOS pin visible (RED color = immediate)
     - Pin label shows "5 people" or incident summary

2. **Click SOS Pin**
   - Bottom sheet should open showing:
     - Severity: Critical
     - Help types: Medical, Rescue
     - People: 5
     - Triage: RED (IMMEDIATE)
     - Reason: START protocol explanation

3. **Open SOS List Tab**
   - Click "SOS" in responder nav
   - **Expected**:
     - SOS sorted by priority (RED entries first)
     - New SOS shows:
       - Triage color badge (RED)
       - People count (5)
       - Needs (Medical, Rescue)
       - Reason code (e.g., "RESP_COMP" = respiratory compromise)

4. **Open Triage Board Tab**
   - Click "TRIAGE" in responder nav
   - **Expected**:
     - Four columns: IMMEDIATE (RED), DELAYED (YELLOW), MINOR (GREEN), EXPECTANT (BLACK)
     - New SOS card in IMMEDIATE column
     - Reason text visible (e.g., "Respiratory compromise — immediate care needed")

5. **Optional: Drag to Reassign**
   - Drag the card from IMMEDIATE to DELAYED
   - **Expected**: Card moves and override is saved

**Expected Result**: ✅ Responder sees all views synced with real triage data.

---

### **Flow 3: Offline Sync (Demonstrates Offline-First)**

**Start State**: Both devices on Wi-Fi, one SOS already sent

1. **Disconnect Responder Laptop from Network**
   - Unplug Ethernet OR disable Wi-Fi
   - **Expected**: 
     - Responder dashboard shows "Offline" or "Syncing..." badge
     - API server shows no outbound connection errors (local SOS still works)

2. **Send Second SOS from Civilian**
   - Go back to civilian view (phone)
   - Press "Send SOS" again
   - Fill form with different severity (e.g., "Stable")
   - **Expected**:
     - Status shows "Sending..." → "Queued" (instead of "Delivered")
     - No error thrown
     - Coverage shows AMBER or RED (fewer peers reachable)

3. **Verify Local DB Still Works**
   - On responder laptop, keep dashboard open
   - **Expected**: Second SOS still appears in SOSList and TriageBoard locally
   - (Local replication works; remote sync is paused)

4. **Reconnect Responder Laptop**
   - Re-enable Wi-Fi or re-plug Ethernet
   - **Expected**:
     - API server log shows `[sync] active`
     - Dashboard shows "Synced" badge
     - Both SOS sync to remote CouchDB

5. **Verify Sync Completed**
   - Check API server Terminal 3 for:
     ```
     [sync] active — replicating docs
     ```
   - Both SOS should be visible in responder dashboard

**Expected Result**: ✅ Offline queueing works; sync completes when network returns.

---

### **Flow 4: Coverage Meter (Peer Heartbeats)**

**Start State**: Civilian and Responder devices on same Wi-Fi

1. **View Coverage Strip (Civilian)**
   - On civilian phone, scroll to see "MeshStrip" at top of screen
   - **Expected**:
     - "Connected" badge
     - Peer count: "2 peers" (responder laptop + any other devices)
     - Coverage: GREEN (if signal strong)
     - Sparkline (decorative — it is keyed to the GREEN/AMBER/RED state, not to measured signal)

2. **Simulate Peer Disconnect**
   - Stop one device from the mesh (e.g., close frontend on a third device)
   - **Expected**: Peer count decreases (e.g., "1 peer")
   - Coverage may change to AMBER (weaker signal)

3. **Verify Heartbeat Updates**
   - Look at API server Terminal 3 for heartbeat logs:
     ```
     [heartbeat] peer-123 lastSeen: 0.5s ago
     ```
     There is no `rssi` field — the browser cannot measure signal strength.
   - Civilian's MeshStrip should update live (~every 10 seconds)

4. **Responder's Peer Table**
   - On responder dashboard, look at MeshStrip (usually top-right)
   - Should show same peer count and coverage

**Expected Result**: ✅ Peer discovery and coverage calculation work in real-time.

---

### **Flow 5: Multi-Relay (Optional, Advanced)**

**Start State**: 3+ devices on same Wi-Fi, all on the mesh

**Scenario**: Device A → Device B → Device C (two hops)

1. **Send SOS from Device A**
   - Fill SOS form and submit
   - Watch for "Relaying..." state
   - **Expected**: Status shows relay progression

2. **Verify Device B Relays to Device C**
   - Device B's SOS list should show the message briefly as it relays
   - Responder (Device C) receives and stores SOS

3. **Check Hop Count**
   - In responder dashboard, SOS should show:
     - Hop status: "delivered via relay"
     - Original sender: Device A

**Expected Result**: ✅ Multi-hop relay works (if 3+ devices available).

---

## Troubleshooting

### **SOS Doesn't Send**
- Check API server Terminal 3 for errors
- Ensure phone/responder on same Wi-Fi
- Try `ws://localhost:4000/mesh` instead of IP (if on same device)

### **Coverage Shows RED**
- Normal if only 1 peer or weak signal
- Confirm the phone is still on the laptop's hotspot — coverage is derived
  purely from whether heartbeats are arriving, so RED means "no heartbeat",
  not "weak signal". Distance is not measured and cannot be diagnosed here.

### **SOS Doesn't Appear in Responder Dashboard**
- Check Frontend Terminal 5 for errors
- Ensure CouchDB is running (Terminal 1)
- Try refreshing browser (F5)

### **Sync Stuck at "Syncing..."**
- Check if CouchDB is still running
- Look at API Terminal 3 for replication errors
- May take 10–30 seconds for large changes

### **Responder Can't See Phone's SOS**
- Verify both are connected to same Wi-Fi
- Check if PouchDB was initialized (check localStorage in browser DevTools)
- Ensure API server is on correct port (4000)

---

## Demo Day Checklist (Sept 10)

- [ ] All 5 services start without errors
- [ ] Civilian can send SOS (animation plays)
- [ ] Responder sees SOS in map + list + triage board
- [ ] Offline → send SOS → back online → syncs
- [ ] Coverage meter shows live peer count
- [ ] Triage colors match START protocol (RED=immediate, etc.)
- [ ] No console errors in browser
- [ ] API server handles 3+ concurrent SOS without dropping messages

---

## Key Success Metrics (Pitch Focus)

1. **Offline-First**: "When networks go down, Sankat Setu keeps rescue operations moving."
   - ✅ Civilian can send SOS with no internet
   - ✅ Responder works with no CouchDB (local only)
   - ✅ Everything syncs when link returns

2. **Peer-to-Peer**: "One SOS crosses three phones in airplane mode."
   - ✅ Mesh discovery works without internet
   - ✅ Multi-hop relay passes messages 2+ hops
   - ✅ Coverage meter shows live peer count

3. **Triage Automation**: "Responder sees red/yellow/green instantly."
   - ✅ START protocol runs on every SOS
   - ✅ Reason codes explain every decision
   - ✅ No life-critical decisions touch the LLM

---

## Post-Demo Notes (Not Required for Sept 10)

- Real-time chat with AI (weather explanation)
- Voice input (cut list — typed only)
- Multi-language (hand-translated strings ready)
- Native mobile app (current: web-wrapped)
- Ed25519 signing (cut list)
- Sophisticated conflict resolution (last-write-wins sufficient)

---

**Ready to ship. See you on Sept 10.** 🚀
