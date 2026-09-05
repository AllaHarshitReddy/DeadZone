import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import PouchDB from "pouchdb";
import { couchBaseUrl, couchDbUrl, ensureDatabase, getCouchConfig, remotePouchDbOptions } from "./couchdb";

/**
 * The real deliverable for Track A: prove that a write survives an
 * interrupted PouchDB<->CouchDB replication and resumes cleanly, with zero
 * lost records and zero duplicates. Last-write-wins only -- no custom
 * conflict resolution, that's on the cut list (docs/decisions.md).
 *
 * Interruption strategy: this stops and restarts the actual `couchdb`
 * container from infra/docker-compose.yml via the docker CLI, which is a
 * real network-level interruption, not just a JS-level one. If `docker
 * compose` isn't reachable from this machine, it falls back to cancelling
 * and recreating the PouchDB sync handle instead -- still a genuine
 * interrupt-and-resume of the replication itself, just not of the
 * underlying TCP connection. Either way the run logs which mode it used.
 *
 * Repeatable: every run uses fresh random UUIDs and cleans up the records
 * it created (both locally and on the remote) at the end, so `pnpm
 * sync-test` can be run over and over without accumulating state.
 */

const execFileAsync = promisify(execFile);

const REPO_ROOT = path.resolve(process.cwd(), "../..");
const COMPOSE_FILE = path.join(REPO_ROOT, "infra", "docker-compose.yml");
const LOCAL_DB_PATH = path.resolve(process.cwd(), ".data/sync-test");

const BATCH_SIZE = 12;
const SYNC_SETTLE_TIMEOUT_MS = 60_000;
const COUCHDB_UP_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 1000;

interface TestDoc {
  _id: string;
  batch: "before" | "after";
  seq: number;
  createdAt: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeBatch(batch: "before" | "after", count: number): TestDoc[] {
  return Array.from({ length: count }, (_, seq) => ({
    _id: randomUUID(),
    batch,
    seq,
    createdAt: new Date().toISOString(),
  }));
}

/** Runs `docker compose -f infra/docker-compose.yml <action> couchdb`. Returns false (never throws) if it can't. */
async function tryDockerComposeAction(action: "stop" | "start"): Promise<boolean> {
  try {
    await execFileAsync("docker", ["compose", "-f", COMPOSE_FILE, action, "couchdb"]);
    return true;
  } catch (err) {
    console.warn(
      `[sync-test] could not ${action} the couchdb container via docker compose (${
        err instanceof Error ? err.message : String(err)
      })`,
    );
    return false;
  }
}

async function waitForCouchDbUp(config: ReturnType<typeof getCouchConfig>, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(couchBaseUrl(config));
      if (res.ok) return;
    } catch {
      // not reachable yet -- keep polling
    }
    await sleep(500);
  }
  throw new Error(`Timed out waiting for CouchDB to come back up at ${couchBaseUrl(config)}`);
}

/**
 * Zero lost records: every expected _id must resolve on this database.
 * Zero duplicates: none of them may carry an unresolved _conflicts array,
 * which is how CouchDB/PouchDB represent two writers racing on the same
 * document id (the id itself can never literally duplicate -- CouchDB
 * enforces uniqueness -- a race shows up as competing revisions instead).
 * Looked up by explicit `keys` rather than a full allDocs scan, so this is
 * correct even if the shared dev database also holds unrelated documents.
 */
async function assertNoLossAndNoDuplicates(
  db: PouchDB.Database<TestDoc>,
  expectedIds: Set<string>,
  label: string,
): Promise<void> {
  const result = await db.allDocs({ keys: [...expectedIds], include_docs: true, conflicts: true });

  const missing: string[] = [];
  const conflicted: string[] = [];
  for (const row of result.rows) {
    if ("error" in row) {
      missing.push(row.key);
      continue;
    }
    if (row.doc?._conflicts?.length) {
      conflicted.push(row.id);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `[${label}] lost ${missing.length}/${expectedIds.size} record(s), e.g. ${missing.slice(0, 5).join(", ")}`,
    );
  }
  if (conflicted.length > 0) {
    throw new Error(
      `[${label}] ${conflicted.length} record(s) have unresolved _conflicts (duplicate concurrent writes): ${conflicted
        .slice(0, 5)
        .join(", ")}`,
    );
  }
}

/** Polls assertNoLossAndNoDuplicates against the remote until it passes or the timeout elapses. */
async function waitUntilRemoteSettles(
  remote: PouchDB.Database<TestDoc>,
  expectedIds: Set<string>,
  timeoutMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      await assertNoLossAndNoDuplicates(remote, expectedIds, "remote");
      return;
    } catch (err) {
      lastError = err;
      await sleep(POLL_INTERVAL_MS);
    }
  }
  throw new Error(
    `Sync did not settle within ${timeoutMs}ms: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}

async function cleanup(
  db: PouchDB.Database<TestDoc>,
  remote: PouchDB.Database<TestDoc>,
  expectedIds: Set<string>,
): Promise<void> {
  await db.destroy().catch(() => {});
  await Promise.all(
    [...expectedIds].map((id) =>
      remote
        .get(id)
        .then((doc) => remote.remove(doc))
        .catch(() => {}),
    ),
  );
}

async function main(): Promise<void> {
  const config = getCouchConfig();
  await ensureDatabase(config);

  // Fresh local db every run -- never inherits state from a previous run.
  await new PouchDB(LOCAL_DB_PATH).destroy().catch(() => {});
  const db = new PouchDB<TestDoc>(LOCAL_DB_PATH);
  const remote = new PouchDB<TestDoc>(couchDbUrl(config), remotePouchDbOptions(config));

  let activeSync = db.sync<TestDoc>(remote, { live: true, retry: true });
  const syncErrors: unknown[] = [];
  activeSync.on("error", (err) => syncErrors.push(err));
  activeSync.on("denied", (doc) => console.warn("[sync-test] denied:", doc));

  console.log(`[sync-test] local=${LOCAL_DB_PATH}  remote=${couchDbUrl(config)}`);

  const before = makeBatch("before", BATCH_SIZE);
  const after = makeBatch("after", BATCH_SIZE);
  const expectedIds = new Set([...before, ...after].map((d) => d._id));

  try {
    // Phase 1: write while the connection is healthy, and interrupt it
    // *concurrently* with the write (not after a delay) to maximise the
    // chance the outgoing push is still in flight when the interruption
    // lands, rather than already complete.
    console.log(`[sync-test] writing ${before.length} record(s) and interrupting the connection concurrently...`);
    const writeBefore = db.bulkDocs(before);
    const usedRealInterrupt = await tryDockerComposeAction("stop");
    if (!usedRealInterrupt) {
      console.log("[sync-test] falling back to a JS-level interruption (cancelling the sync handle)");
      activeSync.cancel();
    }
    await writeBefore;

    // Phase 2: write more records purely offline. This is the point of the
    // whole architecture -- local writes never wait on the network.
    console.log(`[sync-test] writing ${after.length} more record(s) while the remote is unreachable...`);
    await db.bulkDocs(after);

    // Phase 3: restart and let replication resume.
    if (usedRealInterrupt) {
      console.log("[sync-test] restarting the couchdb container...");
      await tryDockerComposeAction("start");
      await waitForCouchDbUp(config, COUCHDB_UP_TIMEOUT_MS);
    } else {
      console.log("[sync-test] starting a fresh sync handle to resume replication...");
      activeSync = db.sync<TestDoc>(remote, { live: true, retry: true });
      activeSync.on("error", (err) => syncErrors.push(err));
    }

    // Phase 4: assert zero lost records and zero duplicates, on both sides.
    console.log("[sync-test] waiting for replication to catch up...");
    await waitUntilRemoteSettles(remote, expectedIds, SYNC_SETTLE_TIMEOUT_MS);
    await assertNoLossAndNoDuplicates(db, expectedIds, "local");

    if (syncErrors.length > 0) {
      throw new Error(`sync reported ${syncErrors.length} error event(s): ${JSON.stringify(syncErrors[0])}`);
    }

    console.log(
      `[sync-test] PASS -- ${expectedIds.size} record(s) replicated across an interrupted connection with zero loss and zero duplicates.`,
    );
  } finally {
    activeSync.cancel();
    await cleanup(db, remote, expectedIds);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
