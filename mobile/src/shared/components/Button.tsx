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
    // 全バリアントで borderWidth を揃えるため、縁のないバリアントは transparent を指定する
    borderColor: string;
};

function resolveVariantStyle(
    variant: ButtonVariant,
    disabled: boolean,
    theme: AppTheme,
): VariantStyle {
    // disabled はバリアントの性格（透明・危険の色相）を保ったままラベルを muted にする
    switch (variant) {
        case 'primary':
            return disabled
                ? {
                      backgroundColor: theme.colors.surfaceAlt,
                      labelColor: theme.colors.textMuted,
                      borderColor: 'transparent',
                  }
                : {
                      backgroundColor: theme.colors.primary,
                      labelColor: theme.colors.onPrimary,
                      borderColor: 'transparent',
                  };
        case 'secondary':
            return {
                backgroundColor: theme.colors.surface,
                labelColor: disabled ? theme.colors.textMuted : theme.colors.primary,
                borderColor: disabled ? theme.colors.outline : theme.colors.primary,
            };
        case 'ghost':
            return {
                backgroundColor: 'transparent',
                labelColor: theme.colors.textMuted,
                borderColor: 'transparent',
            };
        case 'danger':
            return {
                backgroundColor: theme.colors.dangerSoft,
                labelColor: disabled ? theme.colors.textMuted : theme.colors.danger,
                borderColor: 'transparent',
            };
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
                    // 縁のないバリアントも transparent の border を持たせて高さを揃える
                    borderWidth: 1.5,
                    borderColor: variantStyle.borderColor,
                    borderRadius: theme.radius.md,
                    paddingVertical: theme.spacing.md,
                    paddingHorizontal: theme.spacing.lg,
                    opacity: pressed ? 0.85 : 1,
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
