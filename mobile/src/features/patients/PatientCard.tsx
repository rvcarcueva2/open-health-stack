import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import { Gender, formatName } from './fhir';
import { ageFromBirthDate, genderLabel, initialsOf } from './format';
import { LocalPatient } from './types';

export function PatientCard({ patient }: { patient: LocalPatient }) {
    const { resource, syncStatus, lastError } = patient;
    const pending = syncStatus === 'pending';
    const name = formatName(resource);
    const age = ageFromBirthDate(resource.birthDate);
    const details = [
        genderLabel[(resource.gender ?? 'unknown') as Gender],
        age !== null ? `${age} yrs` : null,
        resource.birthDate,
    ]
        .filter(Boolean)
        .join(' · ');

    return (
        <View
            style={styles.card}
            accessible
            accessibilityLabel={`${name}. ${details}. ${pending ? 'Waiting to sync' : 'Synced'}`}
        >
            <View style={styles.row}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initialsOf(resource)}</Text>
                </View>
                <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>
                        {name}
                    </Text>
                    <Text style={styles.details} numberOfLines={1}>
                        {details}
                    </Text>
                </View>
                <View style={[styles.badge, pending ? styles.badgePending : styles.badgeSynced]}>
                    <Ionicons
                        name={pending ? 'cloud-upload-outline' : 'cloud-done-outline'}
                        size={14}
                        color={pending ? colors.warning : colors.success}
                    />
                    <Text style={[styles.badgeText, { color: pending ? colors.warning : colors.success }]}>
                        {pending ? 'Pending' : 'Synced'}
                    </Text>
                </View>
            </View>
            {pending && !!lastError && <Text style={styles.error}>Last sync attempt failed: {lastError}</Text>}
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
        marginBottom: spacing.sm,
        gap: spacing.sm,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: radius.pill,
        backgroundColor: colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: '600', color: colors.text },
    details: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radius.pill,
    },
    badgePending: { backgroundColor: colors.warningSoft },
    badgeSynced: { backgroundColor: colors.successSoft },
    badgeText: { fontSize: 12, fontWeight: '600' },
    error: { fontSize: 13, color: colors.danger },
});