import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radius } from '../theme';

interface FieldProps extends TextInputProps {
    label: string;
    error?: string | null;
}

export function Field({ label, error, style, ...inputProps }: FieldProps) {
    return (
        <View style={styles.wrap}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                accessibilityLabel={label}
                placeholderTextColor={colors.placeholder}
                style={[styles.input, !!error && styles.inputError, style]}
                {...inputProps}
            />
            {!!error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: { gap: 6 },
    label: { fontSize: 14, fontWeight: '600', color: colors.text },
    input: {
        minHeight: 48,
        paddingHorizontal: 14,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        fontSize: 16,
        color: colors.text,
    },
    inputError: { borderColor: colors.danger },
    error: { fontSize: 13, color: colors.danger },
});