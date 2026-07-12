import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BottomSheet } from '@/shared/components/BottomSheet';
import { useAppTheme } from '@/shared/theme/useAppTheme';

type Props = {
    visible: boolean;
    /** 現在の名称。シートを開くたびに入力の初期値になる */
    initialName: string;
    onSubmit: (name: string) => void;
    onClose: () => void;
};

/**
 * 部屋・家具の名称編集ボトムシート。
 * 空・空白のみの入力では確定できない。色・余白はテーマトークンのみ参照する。
 * 確定・キャンセル後にシートを閉じる責務は親が持つ。
 */
export function RenameSheet({ visible, initialName, onSubmit, onClose }: Props) {
    const theme = useAppTheme();
    const [name, setName] = useState(initialName);
    const prevVisibleRef = useRef(visible);

    // シートが開いた（false→true）ときのみ現在の名称へ入力を戻す。
    // 開いている最中に initialName が変わっても編集中の入力は破棄しない。
    useEffect(() => {
        if (!prevVisibleRef.current && visible) {
            setName(initialName);
        }
        prevVisibleRef.current = visible;
    }, [visible, initialName]);

    const trimmedName = name.trim();
    const canSubmit = trimmedName.length > 0;

    function handleSubmit() {
        if (!canSubmit) {
            return;
        }
        onSubmit(trimmedName);
    }

    return (
        <BottomSheet visible={visible} onClose={onClose}>
            <Text
                style={[
                    theme.typography.title,
                    { color: theme.colors.text, marginBottom: theme.spacing.lg },
                ]}
            >
                名称を変更
            </Text>

            <TextInput
                testID="rename-input"
                style={[
                    theme.typography.body,
                    {
                        color: theme.colors.text,
                        borderWidth: 1,
                        borderColor: theme.colors.outline,
                        borderRadius: theme.radius.md,
                        padding: theme.spacing.md,
                        marginBottom: theme.spacing.lg,
                    },
                ]}
                placeholder="名称"
                placeholderTextColor={theme.colors.textMuted}
                value={name}
                onChangeText={setName}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                autoFocus
            />

            <View style={[styles.buttonRow, { gap: theme.spacing.md }]}>
                <TouchableOpacity
                    testID="rename-cancel"
                    accessibilityRole="button"
                    style={{
                        borderWidth: 1,
                        borderColor: theme.colors.outline,
                        borderRadius: theme.radius.md,
                        paddingVertical: theme.spacing.md,
                        paddingHorizontal: theme.spacing.xl,
                    }}
                    onPress={onClose}
                >
                    <Text style={[theme.typography.label, { color: theme.colors.textMuted }]}>
                        キャンセル
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    testID="rename-submit"
                    accessibilityRole="button"
                    accessibilityState={{ disabled: !canSubmit }}
                    disabled={!canSubmit}
                    style={{
                        backgroundColor: theme.colors.primary,
                        borderRadius: theme.radius.md,
                        paddingVertical: theme.spacing.md,
                        paddingHorizontal: theme.spacing.xl,
                        opacity: canSubmit ? 1 : 0.4,
                    }}
                    onPress={handleSubmit}
                >
                    <Text style={[theme.typography.label, { color: theme.colors.onPrimary }]}>
                        変更
                    </Text>
                </TouchableOpacity>
            </View>
        </BottomSheet>
    );
}

const styles = StyleSheet.create({
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
});
