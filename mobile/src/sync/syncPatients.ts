import type {SQLiteDatabase} from 'expo-sqlite';
import {createPatient} from '../features/patients/api';
import {ApiError} from '../api/client';
import {
    markFailed,
    markSynced,
    pendingPatients,
    setMeta,
} from '../features/patients/local';

export interface SyncResult {
    pushed: number;
    failed: number;
}

let running = false;

async function syncPatients(db: SQLiteDatabase): Promise<SyncResult> {
    if (running) throw new Error('A sync is already in progress');
    running = true;
    try {
        let pushed = 0;
        let failed = 0;

        for (const row of await pendingPatients(db)) {
            try {
                const saved = await createPatient(row.resource);
                await markSynced(db, row.localId, saved);
                await setMeta(db, 'last_synced_at', new Date().toISOString());
                pushed++;
            } catch (err) {
                // Offline: stop now instead of waiting for a timeout on every remaining patient
                if (err instanceof ApiError && err.status === 0) throw err;

                failed++;
                const message = err instanceof Error ? err.message : 'Unknown error';
                await markFailed(db, row.localId, message);
            }
        }

        return {pushed, failed};
    } finally {
        running = false;
    }
}

export default syncPatients