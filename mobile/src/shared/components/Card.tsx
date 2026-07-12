import React from 'react';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '@/shared/theme/useAppTheme';

type Props = {
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
    testID?: string;
};

/**
 * surface 背景 + outline 枠 + card 影の共通コンテナ。
 * 一覧の行・サマリータイルなど「面」の土台に使う。
 */
export function Card({ children, style, testID = 'card' }: Props) {
    const theme = useAppTheme();

    return (
        <View
            testID={testID}
            style={[
                styles.card,
                theme.elevation.card,
                {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.outline,
                    borderRadius: theme.radius.lg,
                    padding: theme.spacing.lg,
                },
                style,
            ]}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderWidth: 1,
    },
});
