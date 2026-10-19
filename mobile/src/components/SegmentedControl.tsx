import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../theme';

interface Props<T extends string> {
    label: string;
    options: { value: T; label: string }[];
    value: T;
    onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ label, options, value, onChange }: Props<T>) {
    return (
        <View style={styles.wrap}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.track} accessibilityRole="radiogroup">
                {options.map((o) => {
                    const selected = o.value === value;
                    return (
                        <Pressable
                            key={o.value}
                            accessibilityRole="radio"
                            accessibilityState={{ selected }}
                            onPress={() => onChange(o.value)}
                            style={[styles.segment, selected && styles.segmentActive]}
                        >
                            <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>{o.label}</Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { gap: 6 },
    label: { fontSize: 14, fontWeight: '600', color: colors.text },
    track: {
        flexDirection: 'row',
        backgroundColor: colors.border,
        borderRadius: radius.md,
        padding: 3,
    },
    segment: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
    segmentActive: { backgroundColor: colors.surface },
    segmentText: { fontSize: 14, color: colors.textMuted },
    segmentTextActive: { color: colors.text, fontWeight: '600' },
});