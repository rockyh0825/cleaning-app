import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/shared/theme/useAppTheme';

type Props = {
    /** 選択中の部屋・家具の名称 */
    targetName: string;
    onRename: () => void;
    onDelete: () => void;
};

/**
 * 選択中の対象（部屋・家具）に対する操作バー。
 * 名称と「名称変更」「削除」ボタンを表示する。色はテーマトークンのみ参照する。
 */
export function SelectionActions({ targetName, onRename, onDelete }: Props) {
    const theme = useAppTheme();

    return (
        <View
            testID="selection-actions"
            style={[
                styles.bar,
                theme.elevation.card,
                {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.outline,
                    borderRadius: theme.radius.md,
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                },
            ]}
        >
            <Text
                numberOfLines={1}
                style={[styles.name, theme.typography.label, { color: theme.colors.text }]}
            >
                {targetName}
            </Text>
            <Pressable
                testID="selection-rename"
                accessibilityRole="button"
                accessibilityLabel="名称変更"
                onPress={onRename}
                style={({ pressed }) => [
                    styles.action,
                    {
                        paddingHorizontal: theme.spacing.md,
                        paddingVertical: theme.spacing.xs,
                        borderRadius: theme.radius.sm,
                        opacity: pressed ? 0.6 : 1,
                    },
                ]}
            >
                <Text style={[theme.typography.label, { color: theme.colors.primary }]}>
                    名称変更
                </Text>
            </Pressable>
            <Pressable
                testID="selection-delete"
                accessibilityRole="button"
                accessibilityLabel="削除"
                onPress={onDelete}
                style={({ pressed }) => [
                    styles.action,
                    {
                        paddingHorizontal: theme.spacing.md,
                        paddingVertical: theme.spacing.xs,
                        borderRadius: theme.radius.sm,
                        opacity: pressed ? 0.6 : 1,
                    },
                ]}
            >
                <Text style={[theme.typography.label, { color: theme.colors.danger }]}>削除</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: StyleSheet.hairlineWidth,
    },
    name: {
        flex: 1,
    },
    action: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});
