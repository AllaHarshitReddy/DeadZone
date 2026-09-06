# Build Logs

Every build failure and its fix. Append, never delete — a solved error will recur on someone else's machine, and this file is the difference between a two-minute fix and a lost evening.

**Format:** date, what broke, the actual error text, what fixed it.

---

## Known issues and fixes

These are documented in advance because they are near-certain on this stack.

### corepack EPERM on Windows

```
Error: EPERM: operation not permitted
C:\Program Files\nodejs\...
```

**Cause:** `corepack enable` writes shims into the Node install directory, which needs elevation on Windows.

**Fix:** run `corepack enable` once from an elevated PowerShell. The `%LOCALAPPDATA%\corepack-shims` workaround is session-local and will fail again in a new terminal.

---

### Gradle fails on JDK version

```
Unsupported class file major version
```
or a Kotlin compilation daemon error.

**Cause:** JDK 21 installed; Expo's Gradle plugin expects 17.

**Fix:** install JDK 17, set `JAVA_HOME` to it, restart the terminal. Verify with `java -version` before rebuilding.

---

### expo-nearby-connections build failure

Likely errors mention `compileSdk`, Kotlin version conflicts, or an unresolved reference to `ConnectionsClient`.

**Cause:** the package lags behind current Expo SDK versions.

**Fix, in order:** pin `compileSdkVersion` and `targetSdkVersion` to 34 in `app.json`; if that fails, try the package's latest prerelease; if that fails, write a thin Kotlin module against `ConnectionsClient` via the Expo Modules API. Do not spend more than two hours on the package before switching to the custom module.

---

### Nearby Connections silently does nothing

No error, no callbacks, no discovered endpoints.

**Cause:** missing runtime permissions. This API fails silently rather than throwing.

**Fix:** confirm all of these are declared **and granted at runtime**: `BLUETOOTH_SCAN`, `BLUETOOTH_ADVERTISE`, `BLUETOOTH_CONNECT`, `ACCESS_FINE_LOCATION`, `ACCESS_WIFI_STATE`, `CHANGE_WIFI_STATE`, `NEARBY_WIFI_DEVICES`. Check the app's permission screen in Android settings — declaring is not granting.

---

### Map renders tiles but no text labels

Everything looks correct online, labels vanish offline.

**Cause:** the style JSON references remote glyphs or sprites.

**Fix:** self-host both, point the style at local paths, and grep the finished style for `http` — the only permitted hosts are localhost or the LAN IP.

---

### Phone drops the hotspot Wi-Fi

Phone silently leaves the network mid-demo.

**Cause:** Android's captive-portal detection sees no internet uplink and switches to mobile data.

**Fix:** on the client phone, tap "stay connected" when prompted, and disable "switch to mobile data when Wi-Fi has no internet" in Wi-Fi settings. Do this on every demo device beforehand.

---

### Ollama unreachable from the phone

`curl` works on the laptop, fails from the phone.

**Cause:** Ollama binds to localhost by default.

**Fix:** start with `OLLAMA_HOST=0.0.0.0 OLLAMA_ORIGINS=*`. Also check the laptop firewall — Windows Defender blocks inbound 11434 by default. Only do this on an isolated demo hotspot; it leaves the model API open to the whole network.

---

### PouchDB adapter error in React Native

```
Error: Could not find adapter
```

**Cause:** default adapters target browsers.

**Fix:** install the SQLite adapter and register it explicitly before creating the database.

---

**`git push` fails from a non-interactive shell**

```
remote: Repository not found.
fatal: Authentication failed for 'https://github.com/AllaHarshitReddy/Sankat-Setu-.git/'
```

and sometimes:

```
fatal: Cannot prompt because user interactivity has been disabled.
```

**Cause:** `credential.helper` is `manager` (Git Credential Manager), which
authenticates by opening a GUI dialog. A script or agent shell cannot answer it,
so the push fails with a misleading *"Repository not found"* — that is what an
unauthenticated request to a private repo looks like, not a wrong URL. Do not go
hunting for a typo in the remote.

**Fix:** run the push from your own interactive terminal, where the dialog can
appear. In Claude Code, prefixing a command with `!` runs it in your session:
`! git push origin main`. Installing the GitHub CLI (`gh auth login`) and using a
token would remove the prompt entirely.

**Note:** a successful push updates the remote-tracking ref, so
`git reflog show origin/main` is the reliable way to confirm one actually landed
— look for `update by push`. `git rev-parse origin/main` alone can look correct
from a stale local ref.

---

**Ollama installer times out under winget**

```
Downloading https://github.com/ollama/ollama/releases/download/v0.33.3/OllamaSetup.exe
An unexpected error occurred while executing the command:
InternetOpenUrl() failed.
0x80072ee2 : unknown error
```

**Cause:** `0x80072ee2` is an internet timeout. The installer is ~1.5 GB and
winget gave up part-way. GitHub itself was reachable.

**Fix:** download it directly with resume support, then install silently:

```bash
curl -L -C - --retry 5 --retry-all-errors -o OllamaSetup.exe   https://github.com/ollama/ollama/releases/download/v0.33.3/OllamaSetup.exe
```

```powershell
Start-Process OllamaSetup.exe -ArgumentList "/VERYSILENT","/SUPPRESSMSGBOXES","/NORESTART" -Wait
```

Budget for it: 1.5 GB installer plus a 2.5 GB model pull. Start it before you
need it.

---

## Session log

### 4 Sep
- **corepack EPERM** — worked around session-locally during scaffold. Permanent fix pending elevated shell.

### 5 Sep

**WebSocket fails immediately from the Vite dev server**

```
[mesh] WebSocket error: [object Event]
[MeshStrip] connect failed: Error: WebSocket error: [object Event]
    at ws.onerror (mesh.ts:56:18)
[mesh] disconnected
[mesh] reconnecting (attempt 1/5)...
```

**Cause:** the page is served on :8443 but `config.ts` hardcoded
`ws://localhost:4000/mesh`. Cross-origin, and mixed content the moment the page
is served over HTTPS. The browser gives you `[object Event]` and nothing else —
the error object carries no detail, which is why this looks unexplainable.

**Fix:** proxy the socket through the dev server instead of pointing at the API
directly. In `vite.config.ts`:

```ts
server: {
  proxy: { '/mesh': { target: 'ws://localhost:4000', ws: true, changeOrigin: true } },
}
```

and derive the URL from the page rather than hardcoding it, so it follows
whatever protocol/host/port the app is actually served on.

---

**`Port 8443 is already in use` after killing the terminal**

```
error when starting dev server:
Error: Port 8443 is already in use
```

**Cause:** `strictPort: true` plus an orphaned node process. Closing the terminal
does not always reap it, and `pkill` does not exist in Git Bash on Windows.

**Fix:** `Get-Process | Where-Object {$_.Name -match "node"} | Stop-Process -Force`
from PowerShell. Note this kills *every* node process, the Expo build included —
check what is running before firing it.

---

**`[sync] paused: undefined` repeating in the API server log**

**Cause:** not an error. PouchDB reports a paused replication with an undefined
argument when the remote is simply unreachable. CouchDB was not running.

**Fix:** `cd infra && docker-compose up`. Confirm with `curl http://localhost:5984/`
before assuming sync is broken.

---

---

## When adding an entry

Paste the **actual error text**, not a paraphrase. Someone searching this file will search for the string they see on screen.
