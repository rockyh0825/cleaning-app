import React from "react";
import { StyleSheet, useColorScheme } from "react-native";
import { render, screen, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";
import { darkTheme } from "@/shared/theme/tokens";
import { HeatmapView } from "../HeatmapView";

jest.mock("@shopify/react-native-skia");

// expo-router をモック（空状態 CTA が間取り画面へ push する）
jest.mock("expo-router", () => ({
    router: { push: jest.fn() },
    useFocusEffect: jest.fn(),
}));

// useAppTheme.test.tsx と同じ方法で OS のカラースキームをモックする
jest.mock("react-native/Libraries/Utilities/useColorScheme");

const mockUseColorScheme = useColorScheme as jest.Mock;

function renderEmptyHeatmapView() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    render(
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <HeatmapView
                    userId="user-1"
                    floorPlanCapability={{
                        getRooms: jest.fn().mockResolvedValue([]),
                    }}
                    cleaningStatusCapability={{
                        getAreaStatuses: jest.fn().mockResolvedValue([]),
                    }}
                />
            </ThemeProvider>
        </QueryClientProvider>,
    );
}

describe("HeatmapView（ダークモード）", () => {
    it("labels_empty_state_cta_with_on_primary_token_when_color_scheme_is_dark", async () => {
        // Arrange: primary 背景の CTA ラベルには意味的に正しい onPrimary トークンを使う
        // （surface の流用は primary のトーン変更に追従できないため）。
        // light では onPrimary と surface が同値のため、ダークテーマで検証する
        mockUseColorScheme.mockReturnValue("dark");

        // Act
        renderEmptyHeatmapView();

        // Assert
        await waitFor(() => {
            expect(screen.getByTestId("empty-state-cta")).toBeTruthy();
        });
        const labelStyle = StyleSheet.flatten(
            screen.getByText("間取りを作る").props.style,
        );
        expect(labelStyle.color).toBe(darkTheme.colors.onPrimary);
    });
});
