import {Ionicons} from '@expo/vector-icons';
import type {ComponentProps} from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text} from 'react-native';
import {colors, radius} from '../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary';
    loading?: boolean;
    disabled?: boolean;
    icon?: IconName;
}

export function Button({title, onPress, variant = 'primary', loading, disabled, icon}: ButtonProps) {
    const isPrimary = variant === 'primary';
    const inactive = disabled || loading;
    const fg = isPrimary ? colors.primaryText : colors.primary;

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{disabled: !!inactive, busy: !!loading}}
            onPress={onPress}
            disabled={inactive}
            style={({pressed}) => [
                styles.base,
                isPrimary ? styles.primary : styles.secondary,
                inactive && styles.inactive,
                pressed && styles.pressed,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={fg}/>
            ) : (
                <>
                    {icon && <Ionicons name={icon} size={18} color={fg}/>}
                    <Text style={[styles.text, {color: fg}]}>{title}</Text>
                </>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        minHeight: 48,
        paddingHorizontal: 16,
        borderRadius: radius.md,
    },
    primary: {backgroundColor: colors.primary},
    secondary: {backgroundColor: colors.primarySoft},
    inactive: {opacity: 0.5},
    pressed: {opacity: 0.85},
    text: {fontSize: 16, fontWeight: '600'},
});