import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/shared/theme/useAppTheme';
import type { AppTheme } from '@/shared/theme/tokens';

export type HeatStatus = 'fresh' | 'due' | 'overdue' | 'none';

type Props = {
    status: HeatStatus;
    /** 表示テキスト（省略時は状態の既定ラベル） */
    label?: string;
    testID?: string;
};

const DEFAULT_LABELS: Record<HeatStatus, string> = {
    fresh: 'きれい',
    due: 'そろそろ',
    overdue: '要掃除',
    none: '記録なし',
};

function resolveHeatPair(status: HeatStatus, theme: AppTheme): { fill: string; border: string } {
    switch (status) {
        case 'fresh':
            return { fill: theme.colors.heatFresh, border: theme.colors.heatFreshBorder };
        case 'due':
            return { fill: theme.colors.heatDue, border: theme.colors.heatDueBorder };
        case 'overdue':
            return { fill: theme.colors.heatOverdue, border: theme.colors.heatOverdueBorder };
        case 'none':
            return { fill: theme.colors.heatNeutral, border: theme.colors.heatNeutralBorder };
    }
}

/**
 * 掃除状態を示すピル型チップ。塗り + 縁取りのペアで表現し、
 * 色覚多様性でもテキストと輪郭で状態を判別できるようにする。
 */
export function StatusPill({ status, label, testID = 'status-pill' }: Props) {
    const theme = useAppTheme();
    const pair = resolveHeatPair(status, theme);

    return (
        <View
            testID={testID}
            accessibilityLabel={label ?? DEFAULT_LABELS[status]}
            style={[
                styles.pill,
                {
                    backgroundColor: pair.fill,
                    borderColor: pair.border,
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.xs,
                },
            ]}
        >
            <Text style={[theme.typography.caption, styles.label, { color: theme.colors.text }]}>
                {label ?? DEFAULT_LABELS[status]}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    pill: {
        alignSelf: 'flex-start',
        borderRadius: 999,
        borderWidth: 1,
    },
    label: {
        fontWeight: '700',
    },
});
