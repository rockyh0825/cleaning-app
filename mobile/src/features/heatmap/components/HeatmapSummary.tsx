import React from "react";
import { StyleSheet, View } from "react-native";
import { StatusPill } from "@/shared/components/StatusPill";
import { useAppTheme } from "@/shared/theme/useAppTheme";
import type { HeatStatusSummary } from "../usecases/summarizeHeatStatuses";
import { LEGEND_ITEMS } from "./HeatmapLegend";

type HeatmapSummaryProps = {
    summary: HeatStatusSummary;
};

/**
 * ヒートマップ上部の状態別サマリー行。
 * 全エリア（部屋 + 家具）の件数を StatusPill で状態別に一覧表示し、
 * キャンバスを眺めなくても「要掃除が何件あるか」を一目で把握できるようにする。
 * 0件の状態も枠として出し、「要掃除 0」を良い状態のフィードバックにする。
 */
export function HeatmapSummary({ summary }: HeatmapSummaryProps) {
    const theme = useAppTheme();

    return (
        <View
            testID="heatmap-summary"
            accessibilityLabel="掃除状態のサマリー"
            style={[
                styles.container,
                {
                    gap: theme.spacing.sm,
                    paddingHorizontal: theme.spacing.lg,
                    paddingVertical: theme.spacing.sm,
                },
            ]}
        >
            {LEGEND_ITEMS.map(({ status, label }) => (
                <StatusPill
                    key={status}
                    status={status}
                    label={`${label} ${summary[status]}`}
                    testID={`heatmap-summary-${status}`}
                />
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
    },
});
