import {StyleSheet, Text, View} from 'react-native';
import {Button} from './Button';
import {colors, radius, spacing} from '../theme';
import {useSyncNow, useSyncStatus} from '../features/patients/hooks';

export function SyncCard() {
    const status = useSyncStatus();
    const sync = useSyncNow();

    const pending = status.data?.pending ?? 0;
    const lastSynced = status.data?.lastSyncedAt
        ? new Date(status.data.lastSyncedAt).toLocaleString()
        : 'Never';

    return (
        <View style={styles.card}>
            <View style={styles.row}>
                <View style={styles.info}>
                    <Text style={styles.title}>
                        {pending === 0 ? 'Everything is uploaded' : `${pending} waiting to upload`}
                    </Text>
                    <Text style={styles.meta}>Last upload: {lastSynced}</Text>
                </View>
                <Button title="Sync now" icon="sync" onPress={() => sync.mutate()} loading={sync.isPending}/>
            </View>

            {sync.isError && (
                <Text style={styles.error}>Sync failed: {sync.error.message}. Your data is safe on this device.</Text>
            )}
            {sync.isSuccess && (
                <Text style={sync.data.failed > 0 ? styles.error : styles.ok}>
                    {sync.data.pushed === 0 && sync.data.failed === 0
                        ? 'Nothing to upload.'
                        : `Uploaded ${sync.data.pushed}${sync.data.failed > 0 ? `, ${sync.data.failed} failed (will retry)` : ''}.`}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
        gap: spacing.sm,
    },
    row: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
    info: {flex: 1},
    title: {fontSize: 16, fontWeight: '600', color: colors.text},
    meta: {fontSize: 13, color: colors.textMuted, marginTop: 2},
    error: {fontSize: 13, color: colors.danger},
    ok: {fontSize: 13, color: colors.success},
});