import type { SQLiteDatabase } from 'expo-sqlite';

const DATABASE_VERSION = 1;

export async function migrate(db: SQLiteDatabase) {
    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    let version = row?.user_version ?? 0;
    if (version >= DATABASE_VERSION) return;

    if (version === 0) {
        await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE patients (
        local_id    TEXT PRIMARY KEY NOT NULL,
        server_id   TEXT UNIQUE,
        resource    TEXT NOT NULL,
        sync_status TEXT NOT NULL CHECK (sync_status IN ('pending', 'synced')),
        last_error  TEXT,
        updated_at  TEXT NOT NULL
      );
      CREATE INDEX idx_patients_sync_status ON patients (sync_status);

      CREATE TABLE sync_meta (
        key   TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
        version = 1;
    }

    // Future schema changes go here as: if (version === 1) { ...; version = 2; }
    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}