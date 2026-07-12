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
     * 指定時のみ「中を修正」ボタンを表示する（間取り画面の部屋選択のみ）。
     * 部屋詳細（家具配置編集）への導線。読み上げ名は「部屋の中を修正」。
     */
    onEditInterior?: () => void;
    /**
     * 指定時のみ「掃除場所」ボタンを表示する（部屋詳細の家具選択のみ）。
     * 家具のエリア詳細（パーツの閲覧・追加・編集）への導線。読み上げ名は「掃除場所を編集」。
     */
    onOpenCleaningParts?: () => void;
    /** 名称変更ボタンの文言（省略時「名称変更」。部屋では「名称修正」を渡す） */
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
            <Text numberOfLines={1} style={[theme.typography.label, { color }]}>
                {label}
            </Text>
        </Pressable>
    );
}

/**
 * 選択中の対象（部屋・家具）に対する操作バー。
 * 名称と「名称変更」「削除」ボタン（部屋では「中を修正」、家具では「掃除場所」も）を表示する。
 * ラベルは 375pt 幅端末でも名称が視認できるよう短い文言にする。
 * 色はテーマトークンのみ参照する。
 */
export function SelectionActions({
    targetName,
    onRename,
    onDelete,
    onDismiss,
    onEditInterior,
    onOpenCleaningParts,
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
                    label="中を修正"
                    accessibilityLabel="部屋の中を修正"
                    color={theme.colors.primary}
                    onPress={onEditInterior}
                />
            )}
            {onOpenCleaningParts && (
                <ActionButton
                    testID="selection-cleaning-parts"
                    label="掃除場所"
                    accessibilityLabel="掃除場所を編集"
                    color={theme.colors.primary}
                    onPress={onOpenCleaningParts}
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
        // ボタン群が幅を占めても名称が 0 幅に潰れないよう最小幅を確保する（375pt 端末対策）
        minWidth: 48,
    },
    action: {
        justifyContent: 'center',
        alignItems: 'center',
        // RN の flexShrink デフォルトは 0。狭い端末では ✕ をバー外へ押し出すのではなく
        // ボタン側を縮めて 1 行（numberOfLines=1）で収める
        flexShrink: 1,
    },
});
