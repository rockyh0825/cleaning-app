import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useAppTheme } from '@/shared/theme/useAppTheme';

type Props = {
    onPress: () => void;
    /** ボタン内に表示する記号・絵文字（省略時は＋） */
    label?: string;
    accessibilityLabel: string;
    testID?: string;
};

const FAB_SIZE = 56;

/**
 * 画面右下固定のフローティングアクションボタン。
 * 色・余白はテーマトークンのみ参照する。
 */
export function FloatingActionButton({
    onPress,
    label = '＋',
    accessibilityLabel,
    testID = 'fab',
}: Props) {
    const theme = useAppTheme();

    return (
        <Pressable
            testID={testID}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            onPress={onPress}
            style={({ pressed }) => [
                styles.fab,
                theme.elevation.sheet,
                {
                    backgroundColor: theme.colors.primary,
                    right: theme.spacing.xl,
                    bottom: theme.spacing.xl,
                    opacity: pressed ? 0.85 : 1,
                },
            ]}
        >
            <Text style={[styles.label, { color: theme.colors.onPrimary }]}>
                {label}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        width: FAB_SIZE,
        height: FAB_SIZE,
        borderRadius: FAB_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontSize: 28,
        lineHeight: 32,
        fontWeight: '600',
    },
});
