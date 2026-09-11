import { readFile } from "node:fs/promises";
import path from "node:path";
import PouchDB from "pouchdb";
import { SOSRequestSchema, type SOSRequest } from "@deadzone/schema";

// Repo-root-relative: data/seed/ is fictional demo data, not app state --
// see CLAUDE.md's structure section. Resolved from process.cwd() rather
// than import.meta paths so this works the same whether tsx is transpiling
// to ESM or CJS under the hood.
const SEED_PATH = path.resolve(process.cwd(), "../../data/seed/sos.json");

// Gitignored local PouchDB storage -- runtime state, not source-controlled
// seed data. Kept separate from sync-test's own local db so the two scripts
// never step on each other.
const LOCAL_DB_PATH = path.resolve(process.cwd(), ".data/local");

async function loadSeedRecords(): Promise<SOSRequest[]> {
  const raw = await readFile(SEED_PATH, "utf-8");
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`Expected an array of SOS records in ${SEED_PATH}`);
  }

  return parsed.map((record, index) => {
    const result = SOSRequestSchema.safeParse(record);
    if (!result.success) {
      const id = typeof record === "object" && record !== null && "id" in record ? (record as { id: unknown }).id : "?";
      throw new Error(
        `Seed record at index ${index} (id=${id}) failed SOSRequestSchema validation:\n` +
          JSON.stringify(result.error.format(), null, 2),
      );
    }
    return result.data;
  });
}

async function main() {
  const records = await loadSeedRecords();
  const db = new PouchDB<SOSRequest>(LOCAL_DB_PATH);

  for (const record of records) {
    // The message UUID IS the document _id -- not a generated one. The same
    // SOS arriving again (a re-seed, a relay retry) collapses onto the same
    // document instead of creating a duplicate. See CLAUDE.md's "Message
    // UUID is the PouchDB document _id" architecture decision.
    const existing = await db.get(record.id).catch(() => null);
    await db.put({ ...record, _id: record.id, _rev: existing?._rev });
  }

  const info = await db.info();
  console.log(`Seeded ${records.length} record(s) into ${LOCAL_DB_PATH}. Local doc_count=${info.doc_count}.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
