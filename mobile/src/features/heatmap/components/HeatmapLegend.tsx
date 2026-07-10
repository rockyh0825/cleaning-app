import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "@/shared/theme/useAppTheme";
import type { HeatStatus } from "../usecases/resolveHeatStatus";
import { resolveHeatColors } from "../hooks/useHeatmap";

/** 状態→ラベル。色覚特性に配慮し、色のみに依存せずテキストでも意味を示す */
const LEGEND_ITEMS: ReadonlyArray<{ status: HeatStatus; label: string }> = [
    { status: "fresh", label: "きれい" },
    { status: "due", label: "そろそろ" },
    { status: "overdue", label: "要掃除" },
    { status: "neutral", label: "記録なし" },
];

/**
 * ヒートマップの色の意味を示す凡例。
 * スウォッチ（テーマの heat トークン色）とラベルを4状態ぶん横並びで表示する。
 */
export function HeatmapLegend() {
    const theme = useAppTheme();
    const heatColors = resolveHeatColors(theme.colors);

    return (
        <View
            testID="heatmap-legend"
            accessibilityLabel="ヒートマップの凡例"
            style={[styles.container, { gap: theme.spacing.md }]}
        >
            {LEGEND_ITEMS.map(({ status, label }) => (
                <View
                    key={status}
                    style={[styles.item, { gap: theme.spacing.xs }]}
                >
                    <View
                        testID={`legend-swatch-${status}`}
                        style={[
                            styles.swatch,
                            {
                                backgroundColor: heatColors[status],
                                // outline は heatNeutral と同色（ライト: gray200）で
                                // スウォッチが同化するため、濃い textMuted で縁取る
                                borderColor: theme.colors.textMuted,
                                borderRadius: theme.radius.sm,
                            },
                        ]}
                    />
                    <Text
                        style={[
                            theme.typography.caption,
                            { color: theme.colors.textMuted },
                        ]}
                    >
                        {label}
                    </Text>
                </View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    item: {
        flexDirection: "row",
        alignItems: "center",
    },
    swatch: {
        width: 14,
        height: 14,
        borderWidth: 1,
    },
});
