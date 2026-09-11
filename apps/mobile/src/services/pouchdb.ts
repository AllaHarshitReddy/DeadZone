/**
 * Simple localStorage-based database for demo/testing.
 * Replaces PouchDB to avoid browser compatibility issues.
 * Stores SOS records in browser localStorage.
 */

import type { SOSRequest } from "@deadzone/schema";

export interface SyncStatus {
  inProgress: boolean;
  lastSync?: Date;
  docsQueued: number;
  error?: string;
}

/**
 * LocalStorage-based database.
 * Simple, reliable, works everywhere.
 */
class StorageDatabase {
  private dbKey = "deadzone_sos_db";
  private docs = new Map<string, SOSRequest>();
  private changeListeners: Array<() => void> = [];

  async init() {
    try {
      const stored = localStorage.getItem(this.dbKey);
      if (stored) {
        const docs = JSON.parse(stored);
        this.docs = new Map(Object.entries(docs));
      }
      console.log("[db] initialized localStorage database with", this.docs.size, "documents");
    } catch (err) {
      console.warn("[db] failed to load from localStorage:", err);
      this.docs.clear();
    }
  }

  async storeSOS(sos: SOSRequest) {
    this.docs.set(sos.id, sos);
    this.persistToDisk();
    this.notifyChangeListeners();
    console.log("[db] stored SOS:", sos.id, "total docs:", this.docs.size);
  }

  async getAllSOS(): Promise<SOSRequest[]> {
    return Array.from(this.docs.values());
  }

  watchChanges(callback: () => void): () => void {
    this.changeListeners.push(callback);
    return () => {
      this.changeListeners = this.changeListeners.filter(l => l !== callback);
    };
  }

  private notifyChangeListeners() {
    this.changeListeners.forEach(cb => {
      try {
        cb();
      } catch (err) {
        console.error("[db] change listener error:", err);
      }
    });
  }

  private persistToDisk() {
    try {
      const data = Object.fromEntries(this.docs);
      localStorage.setItem(this.dbKey, JSON.stringify(data));
    } catch (err) {
      console.error("[db] failed to persist to localStorage:", err);
    }
  }
}

export class LocalDatabase {
  private db: StorageDatabase | null = null;
  private syncStatus: SyncStatus = { inProgress: false, docsQueued: 0 };
  private syncListeners: ((status: SyncStatus) => void)[] = [];

  /**
   * Initialize the local database using localStorage.
   * Simple, reliable, no external dependencies.
   */
  async init(): Promise<void> {
    try {
      this.db = new StorageDatabase();
      await this.db.init();
      console.log("[db] initialized StorageDatabase");
    } catch (err) {
      console.error("[db] failed to initialize database:", err);
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
      await this.db.storeSOS(sos);
      console.log("[db] stored SOS:", sos.id);
      this.notifySyncStatus({ ...this.syncStatus, docsQueued: (this.syncStatus.docsQueued || 0) + 1 });
    } catch (err) {
      console.warn("[db] error storing SOS:", err);
    }
  }

  /**
   * Fetch all SOS records from the local database.
   */
  async getAllSOS(): Promise<SOSRequest[]> {
    if (!this.db) throw new Error("Database not initialized");

    try {
      return await this.db.getAllSOS();
    } catch (err) {
      console.error("[db] failed to fetch all SOS:", err);
      return [];
    }
  }

  /**
   * Watch for changes in the local database.
   * Useful for real-time UI updates.
   */
  watchChanges(callback: () => void): () => void {
    if (!this.db) {
      console.error("[db] database not initialized");
      return () => {};
    }

    try {
      return this.db.watchChanges(callback);
    } catch (err) {
      console.warn("[db] watchChanges failed:", err);
      return () => {};
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
}

// Singleton instance
let instance: LocalDatabase | null = null;

export function getDatabase(): LocalDatabase {
  if (!instance) {
    instance = new LocalDatabase();
  }
  return instance;
}
