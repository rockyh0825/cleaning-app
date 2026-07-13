import React, { useEffect, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/shared/theme/useAppTheme';

type Props = {
    visible: boolean;
    /** 画面上部に表示する見出し（例: 部屋の名称を修正） */
    title: string;
    /** 現在の名称。画面を開くたびに入力の初期値になる */
    initialName: string;
    onSubmit: (name: string) => void;
    onClose: () => void;
};

// 名称入力を画面の主役にするための大きめフォント。
// テーマの typography には見出し超のサイズが無いためここで定義する
const INPUT_FONT_SIZE = 28;

/**
 * 名称編集専用のフルスクリーン画面（Modal）。
 * 入力欄が画面を支配するレイアウトで、開いた瞬間からキーボードで入力できる。
 * 空・空白のみの入力では確定できない。色・余白はテーマトークンのみ参照する。
 * 確定・キャンセル後に閉じる責務は親が持つ。
 */
export function RenameScreen({ visible, title, initialName, onSubmit, onClose }: Props) {
    const theme = useAppTheme();
    const insets = useSafeAreaInsets();
    const [name, setName] = useState(initialName);
    const prevVisibleRef = useRef(visible);

    // 画面が開いた（false→true）ときのみ現在の名称へ入力を戻す。
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
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
            testID="rename-screen"
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={[styles.root, { backgroundColor: theme.colors.background }]}
            >
                <View style={[styles.body, { padding: theme.spacing.xl }]}>
                    <Text
                        style={[
                            theme.typography.label,
                            {
                                color: theme.colors.textMuted,
                                marginBottom: theme.spacing.md,
                            },
                        ]}
                    >
                        {title}
                    </Text>
                    <TextInput
                        testID="rename-input"
                        style={[
                            styles.input,
                            {
                                color: theme.colors.text,
                                borderBottomColor: theme.colors.primary,
                                paddingVertical: theme.spacing.md,
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
                </View>

                <View
                    testID="rename-button-row"
                    style={[
                        styles.buttonRow,
                        {
                            gap: theme.spacing.md,
                            padding: theme.spacing.xl,
                            // ホームインジケータ領域と重ならないよう safe area の下端を加算する
                            paddingBottom: theme.spacing.xl + insets.bottom,
                        },
                    ]}
                >
                    <TouchableOpacity
                        testID="rename-cancel"
                        accessibilityRole="button"
                        style={[
                            styles.button,
                            {
                                borderWidth: 1,
                                borderColor: theme.colors.outline,
                                borderRadius: theme.radius.md,
                                paddingVertical: theme.spacing.md,
                            },
                        ]}
                        onPress={onClose}
                    >
                        <Text
                            style={[
                                theme.typography.label,
                                { color: theme.colors.textMuted },
                            ]}
                        >
                            キャンセル
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        testID="rename-submit"
                        accessibilityRole="button"
                        accessibilityState={{ disabled: !canSubmit }}
                        disabled={!canSubmit}
                        style={[
                            styles.button,
                            {
                                backgroundColor: theme.colors.primary,
                                borderRadius: theme.radius.md,
                                paddingVertical: theme.spacing.md,
                                opacity: canSubmit ? 1 : 0.4,
                            },
                        ]}
                        onPress={handleSubmit}
                    >
                        <Text
                            style={[
                                theme.typography.label,
                                { color: theme.colors.onPrimary },
                            ]}
                        >
                            保存
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    // 入力欄を垂直センターに置き、画面の主役にする
    body: {
        flex: 1,
        justifyContent: 'center',
    },
    input: {
        fontSize: INPUT_FONT_SIZE,
        fontWeight: '700',
        borderBottomWidth: 2,
    },
    buttonRow: {
        flexDirection: 'row',
    },
    button: {
        flex: 1,
        alignItems: 'center',
    },
});
