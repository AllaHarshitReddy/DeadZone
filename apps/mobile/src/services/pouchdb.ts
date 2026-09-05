/**
 * PouchDB service: local database and sync to responder's CouchDB.
 * Each phone has its own local DB; writes sync to the mesh.
 */

import PouchDB from "pouchdb";
import type { SOSRequest } from "@sankat-setu/schema";

export interface SyncStatus {
  inProgress: boolean;
  lastSync?: Date;
  docsQueued: number;
  error?: string;
}

export class LocalDatabase {
  private db: PouchDB.Database<SOSRequest> | null = null;
  private syncStatus: SyncStatus = { inProgress: false, docsQueued: 0 };
  private syncListeners: ((status: SyncStatus) => void)[] = [];

  /**
   * Initialize the local database.
   * Runs in IndexedDB (browser) — no server needed for local storage.
   */
  async init(): Promise<void> {
    try {
      this.db = new PouchDB<SOSRequest>("sankatsetu_local");
      console.log("[db] initialized local database");
    } catch (err) {
      console.error("[db] failed to init:", err);
      throw err;
    }
  }

  /**
   * Store an SOS report in the local database.
   * UUID is the _id — same SOS arriving twice collapses to one doc.
   */
  async storeSOS(sos: SOSRequest): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    try {
      await this.db.put({
        ...sos,
        _id: sos.id, // UUID is the primary key
      });
      console.log("[db] stored SOS:", sos.id);
      this.notifySyncStatus({ ...this.syncStatus, docsQueued: (this.syncStatus.docsQueued || 0) + 1 });
    } catch (err) {
      if ((err as { status: number }).status === 409) {
        // Document already exists — idempotent, not an error
        console.log("[db] SOS already exists (idempotent):", sos.id);
      } else {
        throw err;
      }
    }
  }

  /**
   * Fetch all SOS records from the local database.
   */
  async getAllSOS(): Promise<SOSRequest[]> {
    if (!this.db) throw new Error("Database not initialized");

    try {
      const result = await this.db.allDocs({ include_docs: true });
      return result.rows
        .filter((row) => !("error" in row) && row.doc)
        .map((row) => row.doc as SOSRequest);
    } catch (err) {
      console.error("[db] failed to fetch all SOS:", err);
      return [];
    }
  }

  /**
   * Fetch a single SOS by ID.
   */
  async getSOS(id: string): Promise<SOSRequest | null> {
    if (!this.db) throw new Error("Database not initialized");

    try {
      return await this.db.get(id);
    } catch (err) {
      if ((err as { status: number }).status === 404) {
        return null;
      }
      throw err;
    }
  }

  /**
   * Watch for changes in the local database.
   * Useful for real-time UI updates.
   */
  watchChanges(
    callback: (change: { id: string; seq: number; deleted?: boolean }) => void
  ): () => void {
    if (!this.db) {
      console.error("[db] database not initialized");
      return () => {};
    }

    const feed = this.db.changes({ live: true, include_docs: false }).on("change", (change) => {
      callback({
        id: change.id,
        seq: change.seq,
        deleted: change.deleted,
      });
    });

    return () => feed.cancel();
  }

  /**
   * Manually sync with a remote CouchDB.
   * Called when network becomes available.
   */
  async syncWithRemote(remoteUrl: string, auth?: { username: string; password: string }): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    try {
      this.notifySyncStatus({ ...this.syncStatus, inProgress: true });

      const remote = new PouchDB<SOSRequest>(remoteUrl, auth ? { auth } : {});
      await this.db.sync(remote, { batch_size: 100 });

      this.notifySyncStatus({
        inProgress: false,
        lastSync: new Date(),
        docsQueued: 0,
      });
      console.log("[db] sync complete");
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.notifySyncStatus({
        inProgress: false,
        error,
        docsQueued: this.syncStatus.docsQueued,
      });
      console.error("[db] sync failed:", error);
      throw err;
    }
  }

  /**
   * Subscribe to sync status changes.
   */
  onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.syncListeners.push(callback);
    return () => {
      this.syncListeners = this.syncListeners.filter((cb) => cb !== callback);
    };
  }

  private notifySyncStatus(status: SyncStatus) {
    this.syncStatus = status;
    this.syncListeners.forEach((cb) => cb(status));
  }

  getSyncStatus(): SyncStatus {
    return this.syncStatus;
  }

  /**
   * Clear all data (for testing).
   */
  async destroy(): Promise<void> {
    if (this.db) {
      await this.db.destroy();
      this.db = null;
    }
  }
}

// Singleton instance
let instance: LocalDatabase | null = null;

export function getDatabase(): LocalDatabase {
  if (!instance) {
    instance = new LocalDatabase();
  }
  return instance;
}
