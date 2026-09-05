import { existsSync } from "node:fs";
import type PouchDB from "pouchdb";

/**
 * Shared CouchDB connection config, used by setup-db.ts, seed.ts and
 * sync-test.ts. Loads apps/api/.env when present (via Node's built-in
 * process.loadEnvFile -- no dotenv dependency needed). .env is optional and
 * gitignored; .env.example documents the shape and is committed instead.
 * See CLAUDE.md: "Never commit real credentials."
 */
if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

export interface CouchConfig {
  protocol: "http" | "https";
  host: string;
  port: number;
  user: string;
  password: string;
  dbName: string;
}

export function getCouchConfig(): CouchConfig {
  return {
    protocol: process.env.COUCHDB_PROTOCOL === "https" ? "https" : "http",
    host: process.env.COUCHDB_HOST ?? "localhost",
    port: Number(process.env.COUCHDB_PORT ?? 5984),
    user: process.env.COUCHDB_USER ?? "admin",
    password: process.env.COUCHDB_PASSWORD ?? "changeme",
    dbName: process.env.COUCHDB_DB_NAME ?? "sankatsetu",
  };
}

export function couchBaseUrl(config: CouchConfig): string {
  return `${config.protocol}://${config.host}:${config.port}`;
}

export function couchDbUrl(config: CouchConfig): string {
  return `${couchBaseUrl(config)}/${config.dbName}`;
}

/** PouchDB remote-constructor options: auth passed out-of-band, never embedded in the URL. */
export function remotePouchDbOptions(config: CouchConfig): PouchDB.Configuration.RemoteDatabaseConfiguration {
  return { auth: { username: config.user, password: config.password } };
}

function basicAuthHeader(config: CouchConfig): string {
  return `Basic ${Buffer.from(`${config.user}:${config.password}`).toString("base64")}`;
}

/**
 * Idempotent: PUTs the database into existence if it doesn't exist yet.
 * CouchDB returns 412 when the database already exists -- that is treated
 * as success here, not failure, so this is safe to call from every script.
 */
export async function ensureDatabase(config: CouchConfig): Promise<"created" | "already_exists"> {
  let res: Response;
  try {
    res = await fetch(couchDbUrl(config), {
      method: "PUT",
      headers: { Authorization: basicAuthHeader(config) },
    });
  } catch (err) {
    throw new Error(
      `Could not reach CouchDB at ${couchBaseUrl(config)}. Is \`docker compose up\` running? (${
        err instanceof Error ? err.message : err
      })`,
    );
  }
  if (res.status === 201) return "created";
  if (res.status === 412) return "already_exists";
  const body = await res.text().catch(() => "");
  throw new Error(
    `Failed to create CouchDB database "${config.dbName}" at ${couchDbUrl(config)}: ${res.status} ${res.statusText} ${body}`,
  );
}
