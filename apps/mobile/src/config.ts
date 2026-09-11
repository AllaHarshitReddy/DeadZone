/**
 * Configuration for responder server URLs.
 * Override via environment variables or update here for local testing.
 */

function getMeshUrl(): string {
  if (import.meta.env.VITE_MESH_URL) {
    return import.meta.env.VITE_MESH_URL;
  }
  // Use same host and port as the frontend (Vite proxies to localhost:4000)
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = window.location.hostname;
  const port = window.location.port;
  return `${protocol}://${host}${port ? `:${port}` : ''}/mesh`;
}

export const RESPONDER_CONFIG = {
  // WebSocket mesh endpoint (for sending/receiving SOS)
  get meshUrl() {
    return getMeshUrl();
  },

  // Offline maps and tile server
  mapUrl: import.meta.env.VITE_MAP_URL || "http://localhost:3000",

  // AI chat and weather API
  aiUrl: import.meta.env.VITE_AI_URL || "http://localhost:4001",

  // CouchDB remote (for PouchDB sync when online)
  couchUrl: import.meta.env.VITE_COUCH_URL || "http://localhost:5984",
  couchDb: "deadzone",
  couchAuth: {
    username: import.meta.env.VITE_COUCH_USER || "admin",
    password: import.meta.env.VITE_COUCH_PASS || "changeme",
  },
};

// Device identification (generated once per app instance)
export function getOrCreateDeviceId(): string {
  const key = "deadzone_device_id";
  let deviceId = localStorage.getItem(key);
  if (!deviceId) {
    deviceId = generateUUID();
    localStorage.setItem(key, deviceId);
  }
  return deviceId;
}

// UUID v4 generator (using crypto.randomUUID if available, fallback otherwise)
export function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return `${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`.replace(/[018]/g, (c) =>
    (Number(c) ^ (Math.random() * 16 >> (Number(c) / 4))).toString(16)
  );
}
