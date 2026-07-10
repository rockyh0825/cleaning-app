import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/shared/theme/useAppTheme';

type Props = {
    /** 選択中の部屋・家具の名称 */
    targetName: string;
    onRename: () => void;
    onDelete: () => void;
    /** 指定時のみ右端に選択解除（✕）ボタンを表示する */
    onDismiss?: () => void;
    /**
     * 指定時のみ「部屋の中を修正」ボタンを表示する（間取り画面の部屋選択のみ）。
     * 部屋詳細（家具配置編集）への導線。
     */
    onEditInterior?: () => void;
    /** 名称変更ボタンの文言（省略時「名称変更」。部屋では「部屋の名称を修正」を渡す） */
    renameLabel?: string;
};

type ActionButtonProps = {
    testID: string;
    label: string;
    /** 表示ラベルが記号のみの場合などに読み上げ用の名前を指定する（省略時は label） */
    accessibilityLabel?: string;
    color: string;
    onPress: () => void;
};

/**
 * 操作バー内のテキストボタン。
 * 見た目はコンパクトなまま、縦方向の hitSlop でタッチターゲットを 44pt 以上確保する。
 */
function ActionButton({
    testID,
    label,
    accessibilityLabel,
    color,
    onPress,
}: ActionButtonProps) {
    const theme = useAppTheme();

    return (
        <Pressable
            testID={testID}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? label}
            onPress={onPress}
            hitSlop={{ top: theme.spacing.sm, bottom: theme.spacing.sm }}
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
            <Text style={[theme.typography.label, { color }]}>{label}</Text>
        </Pressable>
    );
}

/**
 * 選択中の対象（部屋・家具）に対する操作バー。
 * 名称と「名称変更」「削除」ボタン（部屋では「部屋の中を修正」も）を表示する。
 * 色はテーマトークンのみ参照する。
 */
export function SelectionActions({
    targetName,
    onRename,
    onDelete,
    onDismiss,
    onEditInterior,
    renameLabel = '名称変更',
}: Props) {
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
            {onEditInterior && (
                <ActionButton
                    testID="selection-edit-interior"
                    label="部屋の中を修正"
                    color={theme.colors.primary}
                    onPress={onEditInterior}
                />
            )}
            <ActionButton
                testID="selection-rename"
                label={renameLabel}
                color={theme.colors.primary}
                onPress={onRename}
            />
            <ActionButton
                testID="selection-delete"
                label="削除"
                color={theme.colors.danger}
                onPress={onDelete}
            />
            {onDismiss && (
                <ActionButton
                    testID="selection-dismiss"
                    label="✕"
                    accessibilityLabel="選択を解除"
                    color={theme.colors.textMuted}
                    onPress={onDismiss}
                />
            )}
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
