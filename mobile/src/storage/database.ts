/**
 * SQLite Database Setup and Helpers
 * Handles all local persistence for offline-first operations
 */

import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize database and run migrations
 */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  const dbName = 'operations.db';
  const database = await SQLite.openDatabaseAsync(dbName);

  // Run migrations
  await runMigrations(database);

  db = database;
  return database;
}

/**
 * Get database instance (must call initDatabase first)
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Database migrations
 */
async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  // Create drafts table
  await database.execAsync(`
      CREATE TABLE IF NOT EXISTS drafts (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        rental_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('pickup', 'return')),
        km REAL,
        fuel_level TEXT CHECK(fuel_level IN ('FULL', 'THREE_QUARTERS', 'HALF', 'QUARTER', 'EMPTY')),
        status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'pending_complete', 'completed')),
        last_saved_at TEXT NOT NULL,
        server_synced_at TEXT,
        payload_json TEXT,
        UNIQUE(tenant_id, rental_id, type)
      )
    `);

  // Create draft_photos table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS draft_photos (
        id TEXT PRIMARY KEY,
        draft_id TEXT NOT NULL,
        slot_index INTEGER NOT NULL CHECK(slot_index >= 1 AND slot_index <= 8),
        local_uri TEXT NOT NULL,
        server_media_id TEXT,
        server_url TEXT,
        upload_status TEXT NOT NULL DEFAULT 'pending' CHECK(upload_status IN ('pending', 'uploading', 'uploaded', 'failed')),
        error_message TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(draft_id) REFERENCES drafts(id) ON DELETE CASCADE,
        UNIQUE(draft_id, slot_index)
      )
    `);

  // Create upload_jobs table
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS upload_jobs (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        kind TEXT NOT NULL CHECK(kind IN ('UPLOAD_PHOTO', 'SYNC_DRAFT', 'COMPLETE_PICKUP', 'COMPLETE_RETURN')),
        rental_id TEXT NOT NULL,
        draft_id TEXT,
        attempt_count INTEGER NOT NULL DEFAULT 0,
        next_retry_at TEXT,
        status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued', 'running', 'failed', 'done')),
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        error_message TEXT,
        FOREIGN KEY(draft_id) REFERENCES drafts(id) ON DELETE SET NULL
      )
    `);

  // Create indexes
  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_drafts_tenant_rental 
    ON drafts(tenant_id, rental_id, type)
  `);

  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_draft_photos_draft 
    ON draft_photos(draft_id)
  `);

  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_upload_jobs_status_retry 
    ON upload_jobs(status, next_retry_at)
  `);

  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_upload_jobs_tenant 
    ON upload_jobs(tenant_id)
  `);
}

/**
 * Draft operations
 */
export const DraftRepository = {
  async save(draft: {
    id: string;
    tenantId: string;
    rentalId: string;
    type: 'pickup' | 'return';
    km?: number;
    fuelLevel?: string;
    status?: string;
    payloadJson?: Record<string, any>;
  }): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO drafts 
      (id, tenant_id, rental_id, type, km, fuel_level, status, last_saved_at, payload_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        draft.id,
        draft.tenantId,
        draft.rentalId,
        draft.type,
        draft.km ?? null,
        draft.fuelLevel ?? null,
        draft.status || 'draft',
        new Date().toISOString(),
        draft.payloadJson ? JSON.stringify(draft.payloadJson) : null,
      ]
    );
  },

  async findByRental(tenantId: string, rentalId: string, type: 'pickup' | 'return'): Promise<any | null> {
    const db = getDatabase();
    const result = await db.getFirstAsync<{
      id: string;
      tenant_id: string;
      rental_id: string;
      type: string;
      km?: number;
      fuel_level?: string;
      status: string;
      last_saved_at: string;
      server_synced_at?: string;
      payload_json?: string;
    }>(
      `SELECT * FROM drafts 
       WHERE tenant_id = ? AND rental_id = ? AND type = ?`,
      [tenantId, rentalId, type]
    );
    if (!result) return null;
    return {
      id: result.id,
      tenantId: result.tenant_id,
      rentalId: result.rental_id,
      type: result.type,
      km: result.km,
      fuel_level: result.fuel_level,
      status: result.status,
      last_saved_at: result.last_saved_at,
      server_synced_at: result.server_synced_at,
      payloadJson: result.payload_json ? JSON.parse(result.payload_json) : null,
    };
  },

  async updateStatus(id: string, status: string, serverSyncedAt?: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      `UPDATE drafts SET status = ?, server_synced_at = ? WHERE id = ?`,
      [status, serverSyncedAt || null, id]
    );
  },

  async getAll(tenantId: string): Promise<any[]> {
    const db = getDatabase();
    const result = await db.getAllAsync<{
      id: string;
      tenant_id: string;
      rental_id: string;
      type: string;
      km?: number;
      fuel_level?: string;
      status: string;
      last_saved_at: string;
      server_synced_at?: string;
      payload_json?: string;
    }>(`SELECT * FROM drafts WHERE tenant_id = ?`, [tenantId]);
    return result.map((row) => ({
      id: row.id,
      tenantId: row.tenant_id,
      rentalId: row.rental_id,
      type: row.type,
      km: row.km,
      fuel_level: row.fuel_level,
      status: row.status,
      last_saved_at: row.last_saved_at,
      server_synced_at: row.server_synced_at,
      payloadJson: row.payload_json ? JSON.parse(row.payload_json) : null,
    }));
  },
};

/**
 * Draft photo operations
 */
export const DraftPhotoRepository = {
  async save(photo: {
    id: string;
    draftId: string;
    slotIndex: number;
    localUri: string;
    serverMediaId?: string;
    serverUrl?: string;
    uploadStatus?: string;
    errorMessage?: string;
  }): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO draft_photos 
      (id, draft_id, slot_index, local_uri, server_media_id, server_url, upload_status, error_message, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        photo.id,
        photo.draftId,
        photo.slotIndex,
        photo.localUri,
        photo.serverMediaId ?? null,
        photo.serverUrl ?? null,
        photo.uploadStatus || 'pending',
        photo.errorMessage ?? null,
        new Date().toISOString(),
      ]
    );
  },

  async findByDraft(draftId: string): Promise<any[]> {
    const db = getDatabase();
    return await db.getAllAsync<{
      id: string;
      draft_id: string;
      slot_index: number;
      local_uri: string;
      server_media_id?: string;
      server_url?: string;
      upload_status: string;
      error_message?: string;
      created_at: string;
    }>(`SELECT * FROM draft_photos WHERE draft_id = ? ORDER BY slot_index`, [draftId]);
  },

  async updateUploadStatus(id: string, status: string, serverMediaId?: string, serverUrl?: string, errorMessage?: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      `UPDATE draft_photos 
       SET upload_status = ?, server_media_id = ?, server_url = ?, error_message = ?
       WHERE id = ?`,
      [status, serverMediaId || null, serverUrl || null, errorMessage || null, id]
    );
  },

  async deleteByDraft(draftId: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync(`DELETE FROM draft_photos WHERE draft_id = ?`, [draftId]);
  },
};

/**
 * Upload job operations
 */
export const UploadJobRepository = {
  async create(job: {
    id: string;
    tenantId: string;
    kind: string;
    rentalId: string;
    draftId?: string;
    payloadJson: Record<string, any>;
  }): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      `INSERT INTO upload_jobs 
      (id, tenant_id, kind, rental_id, draft_id, attempt_count, status, payload_json, created_at)
      VALUES (?, ?, ?, ?, ?, 0, 'queued', ?, ?)`,
      [
        job.id,
        job.tenantId,
        job.kind,
        job.rentalId,
        job.draftId ?? null,
        JSON.stringify(job.payloadJson),
        new Date().toISOString(),
      ]
    );
  },

  async getNextJob(): Promise<any | null> {
    const db = getDatabase();
    const now = new Date().toISOString();
    const result = await db.getFirstAsync<{
      id: string;
      tenant_id: string;
      kind: string;
      rental_id: string;
      draft_id?: string;
      attempt_count: number;
      next_retry_at?: string;
      status: string;
      payload_json: string;
      created_at: string;
      error_message?: string;
    }>(
      `SELECT * FROM upload_jobs 
       WHERE status = 'queued' AND (next_retry_at IS NULL OR next_retry_at <= ?)
       ORDER BY created_at ASC
       LIMIT 1`,
      [now]
    );
    if (!result) return null;
    return {
      id: result.id,
      tenant_id: result.tenant_id,
      kind: result.kind,
      rental_id: result.rental_id,
      draft_id: result.draft_id,
      attempt_count: result.attempt_count,
      next_retry_at: result.next_retry_at,
      status: result.status,
      payloadJson: JSON.parse(result.payload_json),
      created_at: result.created_at,
      error_message: result.error_message,
    };
  },

  async updateStatus(id: string, status: string, nextRetryAt?: string, errorMessage?: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      `UPDATE upload_jobs 
       SET status = ?, next_retry_at = ?, error_message = ?
       WHERE id = ?`,
      [status, nextRetryAt || null, errorMessage || null, id]
    );
  },

  async incrementAttempt(id: string, nextRetryAt: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      `UPDATE upload_jobs 
       SET attempt_count = attempt_count + 1, next_retry_at = ?, status = 'queued'
       WHERE id = ?`,
      [nextRetryAt, id]
    );
  },

  async getAll(tenantId: string, status?: string): Promise<any[]> {
    const db = getDatabase();
    let sql = `SELECT * FROM upload_jobs WHERE tenant_id = ?`;
    const params: any[] = [tenantId];
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }
    sql += ` ORDER BY created_at DESC`;
    const result = await db.getAllAsync<{
      id: string;
      tenant_id: string;
      kind: string;
      rental_id: string;
      draft_id?: string;
      attempt_count: number;
      next_retry_at?: string;
      status: string;
      payload_json: string;
      created_at: string;
      error_message?: string;
    }>(sql, params);
    return result.map((row) => ({
      id: row.id,
      tenant_id: row.tenant_id,
      kind: row.kind,
      rental_id: row.rental_id,
      draft_id: row.draft_id,
      attempt_count: row.attempt_count,
      next_retry_at: row.next_retry_at,
      status: row.status,
      payloadJson: JSON.parse(row.payload_json),
      created_at: row.created_at,
      error_message: row.error_message,
    }));
  },

  async delete(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync(`DELETE FROM upload_jobs WHERE id = ?`, [id]);
  },
};

