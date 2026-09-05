import { couchDbUrl, ensureDatabase, getCouchConfig } from "./couchdb";

/**
 * Idempotent CouchDB setup: creates the `sankatsetu` database if it doesn't
 * already exist. Run this once after `docker compose up` (infra/docker-compose.yml),
 * and again any time you tear the volume down.
 */
async function main() {
  const config = getCouchConfig();
  const result = await ensureDatabase(config);
  const verb = result === "created" ? "Created" : "Already exists:";
  console.log(`${verb} ${couchDbUrl(config)}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
