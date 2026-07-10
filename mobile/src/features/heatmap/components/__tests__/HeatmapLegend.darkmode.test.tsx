import React from "react";
import { StyleSheet, useColorScheme } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";
import { darkTheme } from "@/shared/theme/tokens";
import { HeatmapLegend } from "../HeatmapLegend";

// useAppTheme.test.tsx と同じ方法で OS のカラースキームをモックする
jest.mock("react-native/Libraries/Utilities/useColorScheme");

const mockUseColorScheme = useColorScheme as jest.Mock;

describe("HeatmapLegend（ダークモード）", () => {
    it("fills_swatches_with_dark_theme_heat_tokens_when_color_scheme_is_dark", () => {
        // Arrange: design.md 結合テスト項目「ダークモードで heat トークンが切り替わる」
        mockUseColorScheme.mockReturnValue("dark");
        const expected = {
            fresh: darkTheme.colors.heatFresh,
            due: darkTheme.colors.heatDue,
            overdue: darkTheme.colors.heatOverdue,
            neutral: darkTheme.colors.heatNeutral,
        } as const;

        // Act
        render(
            <ThemeProvider>
                <HeatmapLegend />
            </ThemeProvider>,
        );

        // Assert: 各スウォッチの塗りが darkTheme の heat トークンに切り替わる
        for (const [status, color] of Object.entries(expected)) {
            const swatch = screen.getByTestId(`legend-swatch-${status}`);
            expect(
                StyleSheet.flatten(swatch.props.style).backgroundColor,
            ).toBe(color);
        }
    });
});
