import {Ionicons} from '@expo/vector-icons';
import DateTimePicker, {DateTimePickerAndroid} from '@react-native-community/datetimepicker';
import {useState} from 'react';
import {Platform, Pressable, StyleSheet, Text, View} from 'react-native';
import {colors, radius} from '../theme';

interface Props {
    label: string;
    value: Date | null;
    onChange: (date: Date) => void;
    error?: string | null;
    maximumDate?: Date;
}

const DEFAULT_PICKER_DATE = new Date(1990, 0, 1);

export function DateField({label, value, onChange, error, maximumDate = new Date()}: Props) {
    const [iosOpen, setIosOpen] = useState(false);

    const open = () => {
        if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
                value: value ?? DEFAULT_PICKER_DATE,
                mode: 'date',
                maximumDate,
                onValueChange: (_event, date) => onChange(date),
            });
        } else {
            setIosOpen((o) => !o);
        }
    };

    const display = value
        ? value.toLocaleDateString(undefined, {year: 'numeric', month: 'long', day: 'numeric'})
        : 'Select date';

    return (
        <View style={styles.wrap}>
            <Text style={styles.label}>{label}</Text>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${label}: ${display}`}
                onPress={open}
                style={[styles.input, !!error && styles.inputError]}
            >
                <Text style={value ? styles.value : styles.placeholder}>{display}</Text>
                <Ionicons name="calendar-outline" size={20} color={colors.textMuted}/>
            </Pressable>
            {Platform.OS === 'ios' && iosOpen && (
                <DateTimePicker
                    value={value ?? DEFAULT_PICKER_DATE}
                    mode="date"
                    display="inline"
                    maximumDate={maximumDate}
                    onValueChange={(_event, date) => onChange(date)}
                />
            )}
            {!!error && <Text style={styles.error}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {gap: 6},
    label: {fontSize: 14, fontWeight: '600', color: colors.text},
    input: {
        minHeight: 48,
        paddingHorizontal: 14,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    inputError: {borderColor: colors.danger},
    value: {fontSize: 16, color: colors.text},
    placeholder: {fontSize: 16, color: colors.placeholder},
    error: {fontSize: 13, color: colors.danger},
});