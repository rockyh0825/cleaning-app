import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useAppTheme } from '@/shared/theme/useAppTheme';
import type { AppTheme } from '@/shared/theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
    label: string;
    onPress: () => void;
    /** 見た目のバリアント（省略時は primary） */
    variant?: ButtonVariant;
    disabled?: boolean;
    accessibilityLabel?: string;
    testID?: string;
};

type VariantStyle = {
    backgroundColor: string;
    labelColor: string;
    borderColor?: string;
};

function resolveVariantStyle(
    variant: ButtonVariant,
    disabled: boolean,
    theme: AppTheme,
): VariantStyle {
    if (disabled) {
        return { backgroundColor: theme.colors.surfaceAlt, labelColor: theme.colors.textMuted };
    }
    switch (variant) {
        case 'primary':
            return { backgroundColor: theme.colors.primary, labelColor: theme.colors.onPrimary };
        case 'secondary':
            return {
                backgroundColor: theme.colors.surface,
                labelColor: theme.colors.primary,
                borderColor: theme.colors.primary,
            };
        case 'ghost':
            return { backgroundColor: 'transparent', labelColor: theme.colors.textMuted };
        case 'danger':
            return { backgroundColor: theme.colors.dangerSoft, labelColor: theme.colors.danger };
    }
}

/**
 * アプリ共通のボタン。色・余白はテーマトークンのみ参照する。
 * 画面ごとの TouchableOpacity 直書きの置き換え先。
 */
export function Button({
    label,
    onPress,
    variant = 'primary',
    disabled = false,
    accessibilityLabel,
    testID = 'button',
}: Props) {
    const theme = useAppTheme();
    const variantStyle = resolveVariantStyle(variant, disabled, theme);

    return (
        <Pressable
            testID={testID}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? label}
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={onPress}
            style={({ pressed }) => [
                styles.button,
                {
                    backgroundColor: variantStyle.backgroundColor,
                    borderRadius: theme.radius.md,
                    paddingVertical: theme.spacing.md,
                    paddingHorizontal: theme.spacing.lg,
                    opacity: pressed ? 0.85 : 1,
                },
                variantStyle.borderColor != null && {
                    borderWidth: 1.5,
                    borderColor: variantStyle.borderColor,
                },
            ]}
        >
            <Text style={[theme.typography.label, { color: variantStyle.labelColor }]}>
                {label}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
