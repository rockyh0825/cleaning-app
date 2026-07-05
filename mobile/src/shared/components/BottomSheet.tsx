import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useAppTheme } from '@/shared/theme/useAppTheme';

type Props = {
    visible: boolean;
    /** オーバーレイのタップ・Android バックキーで呼ばれる */
    onClose: () => void;
    children: React.ReactNode;
};

/**
 * 背景オーバーレイ＋下からのスライドインを持つ汎用ボトムシート。
 * 色・余白はテーマトークンのみ参照する。
 */
export function BottomSheet({ visible, onClose, children }: Props) {
    const theme = useAppTheme();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.root}>
                <Animated.View
                    entering={FadeIn}
                    style={[
                        StyleSheet.absoluteFillObject,
                        { backgroundColor: theme.colors.overlay },
                    ]}
                >
                    <Pressable
                        testID="bottom-sheet-overlay"
                        accessibilityLabel="閉じる"
                        style={styles.overlayPressable}
                        onPress={onClose}
                    />
                </Animated.View>
                <Animated.View
                    testID="bottom-sheet-content"
                    entering={SlideInDown}
                    style={[
                        styles.sheet,
                        theme.elevation.sheet,
                        {
                            backgroundColor: theme.colors.surface,
                            borderTopLeftRadius: theme.radius.lg,
                            borderTopRightRadius: theme.radius.lg,
                            padding: theme.spacing.lg,
                        },
                    ]}
                >
                    {children}
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    overlayPressable: {
        flex: 1,
    },
    sheet: {
        width: '100%',
    },
});
