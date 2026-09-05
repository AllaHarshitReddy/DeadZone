import "./env";
import os from "node:os";
import express from "express";
import { chatRouter } from "./routes/chat";

/**
 * The edge-node AI service. Runs on the responder's laptop, not the phone
 * -- see CLAUDE.md's architecture decision. Bound to 0.0.0.0 and its LAN IP
 * logged at startup so phones on the same hotspot/Wi-Fi can reach it.
 */

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/ai", chatRouter);

function getLanIp(): string | null {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] ?? []) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

const PORT = Number(process.env.PORT ?? 4001);
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Sankat Setu AI edge node listening on ${HOST}:${PORT}`);
  const lanIp = getLanIp();
  if (lanIp) {
    console.log(`Reachable from phones on the same Wi-Fi at: http://${lanIp}:${PORT}/ai/chat`);
  } else {
    console.warn("Could not determine a LAN IP -- is this machine connected to Wi-Fi?");
  }
});
