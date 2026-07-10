import React from "react";
import { StyleSheet } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { lightTheme } from "@/shared/theme/tokens";
import { HeatmapLegend } from "../HeatmapLegend";

describe("HeatmapLegend", () => {
    it("shows_labels_for_all_four_heat_statuses", () => {
        // Arrange & Act: 色のみに依存しないよう4状態すべてにテキストラベルを付ける
        render(<HeatmapLegend />);

        // Assert
        expect(screen.getByText("きれい")).toBeTruthy();
        expect(screen.getByText("そろそろ")).toBeTruthy();
        expect(screen.getByText("要掃除")).toBeTruthy();
        expect(screen.getByText("記録なし")).toBeTruthy();
    });

    it("fills_each_swatch_with_matching_heat_token_color", () => {
        // Arrange
        const expected = {
            fresh: lightTheme.colors.heatFresh,
            due: lightTheme.colors.heatDue,
            overdue: lightTheme.colors.heatOverdue,
            neutral: lightTheme.colors.heatNeutral,
        } as const;

        // Act
        render(<HeatmapLegend />);

        // Assert: 各スウォッチの背景がテーマの heat トークンと一致する
        for (const [status, color] of Object.entries(expected)) {
            const swatch = screen.getByTestId(`legend-swatch-${status}`);
            expect(StyleSheet.flatten(swatch.props.style).backgroundColor).toBe(
                color,
            );
        }
    });

    it("outlines_swatches_with_border_color_distinct_from_neutral_fill", () => {
        // Arrange & Act: ライトテーマは heatNeutral と outline が同色（gray200）のため、
        // 枠線には塗りと同化しない濃いトークン（textMuted）を使う
        render(<HeatmapLegend />);

        // Assert: 全スウォッチの枠線が textMuted で、neutral の塗りとは異なる
        for (const status of ["fresh", "due", "overdue", "neutral"]) {
            const style = StyleSheet.flatten(
                screen.getByTestId(`legend-swatch-${status}`).props.style,
            );
            expect(style.borderColor).toBe(lightTheme.colors.textMuted);
            expect(style.borderColor).not.toBe(
                lightTheme.colors.heatNeutral,
            );
        }
    });
});
