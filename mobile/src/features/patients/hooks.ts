import {QueryClient, useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useSQLiteContext} from 'expo-sqlite';
import syncPatients from '../../sync/syncPatients';
import {NewPatient} from './fhir';
import {countPending, getMeta, insertLocalPatient, listPatients} from './local';

const patientsKey = ['patients'] as const;
const syncStatusKey = ['sync-status'] as const;

function refreshLocalData(qc: QueryClient) {
    return Promise.all([
        qc.invalidateQueries({queryKey: patientsKey}),
        qc.invalidateQueries({queryKey: syncStatusKey}),
    ]);
}

export function usePatients() {
    const db = useSQLiteContext();
    return useQuery({queryKey: patientsKey, queryFn: () => listPatients(db)});
}

export function useSyncStatus() {
    const db = useSQLiteContext();
    return useQuery({
        queryKey: syncStatusKey,
        queryFn: async () => ({
            pending: await countPending(db),
            lastSyncedAt: await getMeta(db, 'last_synced_at'),
        }),
    });
}

export function useCreatePatient() {
    const db = useSQLiteContext();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: NewPatient) => insertLocalPatient(db, input),
        onSuccess: () => refreshLocalData(qc),
    });
}

export function useSyncNow() {
    const db = useSQLiteContext();
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => syncPatients(db),
        onSettled: () => refreshLocalData(qc),
    });
}