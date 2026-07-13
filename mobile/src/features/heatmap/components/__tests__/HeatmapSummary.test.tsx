import React from "react";
import { StyleSheet, useColorScheme } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";
import { darkTheme, lightTheme } from "@/shared/theme/tokens";
import { HeatmapSummary } from "../HeatmapSummary";
import type { HeatStatusSummary } from "../../usecases/summarizeHeatStatuses";

// useAppTheme.test.tsx と同じ方法で OS のカラースキームをモックする
jest.mock("react-native/Libraries/Utilities/useColorScheme");

const mockUseColorScheme = useColorScheme as jest.Mock;

const SUMMARY: HeatStatusSummary = {
    fresh: 2,
    due: 1,
    overdue: 3,
    neutral: 0,
};

function renderWithTheme(ui: React.ReactElement) {
    return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("HeatmapSummary", () => {
    beforeEach(() => {
        mockUseColorScheme.mockReturnValue("light");
    });

    it("shows_one_pill_per_status_with_label_and_count", () => {
        // Arrange & Act
        renderWithTheme(<HeatmapSummary summary={SUMMARY} />);

        // Assert: 状態名 + 件数を全4状態ぶん表示する（0件も枠として出す）
        expect(screen.getByText("きれい 2")).toBeTruthy();
        expect(screen.getByText("そろそろ 1")).toBeTruthy();
        expect(screen.getByText("要掃除 3")).toBeTruthy();
        expect(screen.getByText("記録なし 0")).toBeTruthy();
    });

    it("paints_each_pill_with_matching_heat_fill_and_border_pair", () => {
        // Arrange & Act
        renderWithTheme(<HeatmapSummary summary={SUMMARY} />);

        // Assert: 色覚多様性でも輪郭で判別できる塗り + 縁取りペア
        const overdueStyle = StyleSheet.flatten(
            screen.getByTestId("heatmap-summary-overdue").props.style,
        );
        expect(overdueStyle.backgroundColor).toBe(
            lightTheme.colors.heatOverdue,
        );
        expect(overdueStyle.borderColor).toBe(
            lightTheme.colors.heatOverdueBorder,
        );
    });

    it("paints_pills_with_dark_heat_tokens_in_dark_mode", () => {
        // Arrange
        mockUseColorScheme.mockReturnValue("dark");

        // Act
        renderWithTheme(<HeatmapSummary summary={SUMMARY} />);

        // Assert
        const freshStyle = StyleSheet.flatten(
            screen.getByTestId("heatmap-summary-fresh").props.style,
        );
        expect(freshStyle.backgroundColor).toBe(darkTheme.colors.heatFresh);
        expect(freshStyle.borderColor).toBe(darkTheme.colors.heatFreshBorder);
    });

    it("exposes_summary_container_for_screen_readers", () => {
        // Arrange & Act
        renderWithTheme(<HeatmapSummary summary={SUMMARY} />);

        // Assert
        const container = screen.getByTestId("heatmap-summary");
        expect(container.props.accessibilityLabel).toBe("掃除状態のサマリー");
    });
});
