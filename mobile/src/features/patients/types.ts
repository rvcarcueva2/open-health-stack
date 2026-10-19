export type SyncStatus = 'pending' | 'synced';

export interface LocalPatient {
    localId: string;
    serverId: string | null;
    resource: fhir4.Patient;
    syncStatus: SyncStatus;
    lastError: string | null;
    updatedAt: string;
}