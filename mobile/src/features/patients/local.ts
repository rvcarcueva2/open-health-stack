import * as Crypto from 'expo-crypto';
import type {SQLiteDatabase} from 'expo-sqlite';
import {localIdOf, NewPatient, toFhirPatient} from './fhir';
import {LocalPatient, SyncStatus} from './types';

interface PatientRow {
    local_id: string;
    server_id: string | null;
    resource: string;
    sync_status: SyncStatus;
    last_error: string | null;
    updated_at: string;
}

const fromRow = (r: PatientRow): LocalPatient => ({
    localId: r.local_id,
    serverId: r.server_id,
    resource: JSON.parse(r.resource) as fhir4.Patient,
    syncStatus: r.sync_status,
    lastError: r.last_error,
    updatedAt: r.updated_at,
});

export async function listPatients(db: SQLiteDatabase): Promise<LocalPatient[]> {
    const rows = await db.getAllAsync<PatientRow>('SELECT * FROM patients ORDER BY updated_at DESC');
    return rows.map(fromRow);
}

export async function insertLocalPatient(db: SQLiteDatabase, input: NewPatient): Promise<void> {
    const localId = Crypto.randomUUID();
    const resource = toFhirPatient(input, localId);
    await db.runAsync(
        `INSERT INTO patients (local_id, resource, sync_status, updated_at)
         VALUES (?, ?, 'pending', ?)`,
        [localId, JSON.stringify(resource), new Date().toISOString()],
    );
}

export async function pendingPatients(db: SQLiteDatabase): Promise<LocalPatient[]> {
    const rows = await db.getAllAsync<PatientRow>(
        `SELECT *
         FROM patients
         WHERE sync_status = 'pending'
           AND server_id IS NULL
         ORDER BY updated_at ASC`,
    );
    return rows.map(fromRow);
}

export async function countPending(db: SQLiteDatabase): Promise<number> {
    const row = await db.getFirstAsync<{ n: number }>(
        `SELECT COUNT(*) AS n
         FROM patients
         WHERE sync_status = 'pending'`,
    );
    return row?.n ?? 0;
}

export async function markSynced(db: SQLiteDatabase, localId: string, saved: fhir4.Patient) {
    if (!saved.id) throw new Error('Server did not return an id');
    await db.runAsync(
        `UPDATE patients
         SET server_id   = ?,
             resource    = ?,
             sync_status = 'synced',
             last_error  = NULL,
             updated_at  = ?
         WHERE local_id = ?`,
        [saved.id, JSON.stringify(saved), saved.meta?.lastUpdated ?? new Date().toISOString(), localId],
    );
}

export async function markFailed(db: SQLiteDatabase, localId: string, message: string) {
    await db.runAsync('UPDATE patients SET last_error = ? WHERE local_id = ?', [message, localId]);
}

/** Merge one patient downloaded from the server into the local table. */
export async function upsertFromServer(db: SQLiteDatabase, p: fhir4.Patient): Promise<void> {
    if (!p.id) return;
    const json = JSON.stringify(p);
    const updatedAt = p.meta?.lastUpdated ?? new Date().toISOString();

    // 1. Already known by server id: refresh it, unless there are local changes waiting
    const known = await db.getFirstAsync<{ local_id: string; sync_status: SyncStatus }>(
        'SELECT local_id, sync_status FROM patients WHERE server_id = ?',
        [p.id],
    );
    if (known) {
        if (known.sync_status === 'synced') {
            await db.runAsync('UPDATE patients SET resource = ?, updated_at = ? WHERE local_id = ?', [
                json,
                updatedAt,
                known.local_id,
            ]);
        }
        return;
    }

    // 2. Created on this device earlier, but the server's reply never arrived: link it
    const localId = localIdOf(p);
    if (localId) {
        const result = await db.runAsync(
            `UPDATE patients
             SET server_id   = ?,
                 resource    = ?,
                 sync_status = 'synced',
                 last_error  = NULL,
                 updated_at  = ?
             WHERE local_id = ?
               AND server_id IS NULL`,
            [p.id, json, updatedAt, localId],
        );
        if (result.changes > 0) return;
    }

    // 3. New to this device
    await db.runAsync(
        `INSERT INTO patients (local_id, server_id, resource, sync_status, updated_at)
         VALUES (?, ?, ?, 'synced', ?)`,
        [Crypto.randomUUID(), p.id, json, updatedAt],
    );
}

export async function getMeta(db: SQLiteDatabase, key: string): Promise<string | null> {
    const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM sync_meta WHERE key = ?', [key]);
    return row?.value ?? null;
}

export async function setMeta(db: SQLiteDatabase, key: string, value: string): Promise<void> {
    await db.runAsync(
        `INSERT INTO sync_meta (key, value)
         VALUES (?, ?) ON CONFLICT(key) DO
        UPDATE SET value = excluded.value`,
        [key, value],
    );
}