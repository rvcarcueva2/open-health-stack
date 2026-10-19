import {Ionicons} from '@expo/vector-icons';
import {useRouter} from 'expo-router';
import {useMemo, useState} from 'react';
import {FlatList, Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {colors, radius, spacing} from '../../theme';
import {SyncCard} from '../../components/SyncCard';
import {formatName} from './fhir';
import {usePatients} from './hooks';
import {PatientCard} from './PatientCard';

export function PatientsScreen() {
    const router = useRouter();
    const {data, isLoading} = usePatients();
    const [query, setQuery] = useState('');

    const all = data ?? [];
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return q ? all.filter((p) => formatName(p.resource).toLowerCase().includes(q)) : all;
    }, [all, query]);

    return (
        <View style={styles.container}>
            <FlatList
                data={filtered}
                keyExtractor={(p) => p.localId}
                renderItem={({item}) => <PatientCard patient={item}/>}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                ListHeaderComponent={
                    <View style={styles.header}>
                        <SyncCard/>
                        {all.length > 0 && (
                            <View style={styles.search}>
                                <Ionicons name="search" size={18} color={colors.textMuted}/>
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search patients"
                                    placeholderTextColor={colors.placeholder}
                                    value={query}
                                    onChangeText={setQuery}
                                    autoCorrect={false}
                                    returnKeyType="search"
                                    accessibilityLabel="Search patients"
                                />
                                {query.length > 0 && (
                                    <Pressable onPress={() => setQuery('')} hitSlop={8}
                                               accessibilityLabel="Clear search">
                                        <Ionicons name="close-circle" size={18} color={colors.placeholder}/>
                                    </Pressable>
                                )}
                            </View>
                        )}
                    </View>
                }
                ListEmptyComponent={
                    isLoading ? null : (
                        <View style={styles.empty}>
                            <Ionicons name="people-outline" size={48} color={colors.placeholder}/>
                            <Text style={styles.emptyTitle}>
                                {all.length === 0 ? 'No patients on this device yet' : `No matches for “${query.trim()}”`}
                            </Text>
                            {all.length === 0 && (
                                <Text style={styles.emptyText}>Tap + to register a patient. Records upload when you tap
                                    “Sync now”.</Text>
                            )}
                        </View>
                    )
                }
            />

            <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add patient"
                onPress={() => router.push('/add-patient')}
                style={({pressed}) => [styles.fab, pressed && {opacity: 0.85}]}
            >
                <Ionicons name="add" size={28} color={colors.primaryText}/>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bg},
    content: {padding: spacing.lg, paddingBottom: 96},
    header: {gap: spacing.md, marginBottom: spacing.lg},
    search: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        minHeight: 44,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchInput: {flex: 1, fontSize: 16, color: colors.text},
    empty: {alignItems: 'center', gap: spacing.sm, paddingVertical: 48, paddingHorizontal: spacing.xl},
    emptyTitle: {fontSize: 16, fontWeight: '600', color: colors.text, textAlign: 'center'},
    emptyText: {fontSize: 14, color: colors.textMuted, textAlign: 'center'},
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 24,
        width: 56,
        height: 56,
        borderRadius: radius.pill,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: {width: 0, height: 3},
    },
});