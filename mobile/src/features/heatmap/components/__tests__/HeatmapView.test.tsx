import React from "react";
import { StyleSheet } from "react-native";
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react-native";
import { State } from "react-native-gesture-handler";
import {
    fireGestureHandler,
    getByGestureTestId,
} from "react-native-gesture-handler/jest-utils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lightTheme } from "@/shared/theme/tokens";
import type { RoomWithFurniture } from "@/capabilities/FloorPlanCapability";
import { HeatmapView } from "../HeatmapView";

jest.mock("@shopify/react-native-skia");

// expo-router をモック（エリアタップで詳細画面へ push する）
// useFocusEffect は useHeatmap がタブ再訪時の再取得に使う（no-op で十分）
jest.mock("expo-router", () => ({
    router: { push: jest.fn() },
    useFocusEffect: jest.fn(),
}));

import { router } from "expo-router";

const ROOM_WITH_FURNITURE: RoomWithFurniture = {
    id: "room-1",
    name: "リビング",
    type: "LIVING",
    gridX: 0,
    gridY: 0,
    gridW: 5,
    gridH: 4,
    createdAt: new Date("2026-07-01"),
    updatedAt: new Date("2026-07-01"),
    furniture: [
        {
            id: "furn-1",
            roomId: "room-1",
            name: "ソファ",
            gridX: 0,
            gridY: 0,
            gridW: 2,
            gridH: 1,
            createdAt: new Date("2026-07-01"),
            updatedAt: new Date("2026-07-01"),
        },
    ],
};

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );
    };
}

function renderHeatmapView(deps: {
    getRooms?: jest.Mock;
    getAreaStatuses?: jest.Mock;
}) {
    const floorPlanCapability = {
        getRooms: deps.getRooms ?? jest.fn().mockResolvedValue([]),
    };
    const cleaningStatusCapability = {
        getAreaStatuses: deps.getAreaStatuses ?? jest.fn().mockResolvedValue([]),
    };
    render(
        <HeatmapView
            userId="user-1"
            floorPlanCapability={floorPlanCapability}
            cleaningStatusCapability={cleaningStatusCapability}
        />,
        { wrapper: createWrapper() },
    );
}

describe("HeatmapView", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("正常系: 色付きヒートマップの描画", () => {
        it("renders_areas_filled_with_heat_colors_resolved_from_statuses", async () => {
            // Arrange: room-1 は期限超過（赤）、furn-1 は状態なし（中立）
            renderHeatmapView({
                getRooms: jest.fn().mockResolvedValue([ROOM_WITH_FURNITURE]),
                getAreaStatuses: jest
                    .fn()
                    .mockResolvedValue([
                        { areaId: "room-1", maxElapsedRatio: 1.5 },
                    ]),
            });

            // Act & Assert
            await waitFor(() => {
                const room = screen.getByTestId("room-shape-room-1");
                expect(
                    StyleSheet.flatten(room.props.style).backgroundColor,
                ).toBe(lightTheme.colors.heatOverdue);
            });
            const furniture = screen.getByTestId("furniture-item-furn-1");
            expect(
                StyleSheet.flatten(furniture.props.style).backgroundColor,
            ).toBe(lightTheme.colors.heatNeutral);
        });

        it("shows_legend_alongside_the_canvas", async () => {
            // Arrange & Act
            renderHeatmapView({
                getRooms: jest.fn().mockResolvedValue([ROOM_WITH_FURNITURE]),
            });

            // Assert
            await waitFor(() => {
                expect(screen.getByTestId("heatmap-legend")).toBeTruthy();
            });
        });
    });

    describe("正常系: エリアタップで詳細へ遷移する", () => {
        it("navigates_to_area_detail_when_room_is_tapped", async () => {
            // Arrange
            renderHeatmapView({
                getRooms: jest.fn().mockResolvedValue([ROOM_WITH_FURNITURE]),
            });
            await screen.findByTestId("room-shape-room-1");

            // Act
            fireGestureHandler(getByGestureTestId("room-tap-room-1"), [
                { state: State.BEGAN },
                { state: State.ACTIVE },
                { state: State.END },
            ]);

            // Assert
            await waitFor(() => {
                expect(router.push).toHaveBeenCalledWith("/area/room-1");
            });
        });

        it("navigates_to_area_detail_when_furniture_is_tapped", async () => {
            // Arrange
            renderHeatmapView({
                getRooms: jest.fn().mockResolvedValue([ROOM_WITH_FURNITURE]),
            });
            await screen.findByTestId("furniture-item-furn-1");

            // Act
            fireGestureHandler(getByGestureTestId("furniture-tap-furn-1"), [
                { state: State.BEGAN },
                { state: State.ACTIVE },
                { state: State.END },
            ]);

            // Assert
            await waitFor(() => {
                expect(router.push).toHaveBeenCalledWith("/area/furn-1");
            });
        });
    });

    describe("異常系: 部屋が1件も無いとき", () => {
        it("shows_empty_state_with_link_to_floor_plan_when_no_rooms_exist", async () => {
            // Arrange & Act
            renderHeatmapView({
                getRooms: jest.fn().mockResolvedValue([]),
            });

            // Assert: 空状態と間取り作成への導線
            await waitFor(() => {
                expect(screen.getByTestId("empty-state")).toBeTruthy();
            });

            fireEvent.press(screen.getByTestId("empty-state-cta"));
            expect(router.push).toHaveBeenCalledWith("/floor-plan");
        });
    });

    describe("異常系: 取得状態の表示", () => {
        it("shows_loading_indicator_while_queries_are_pending", () => {
            // Arrange & Act: 解決しない Promise でローディングを維持する
            renderHeatmapView({
                getRooms: jest.fn().mockReturnValue(new Promise(() => {})),
                getAreaStatuses: jest
                    .fn()
                    .mockReturnValue(new Promise(() => {})),
            });

            // Assert
            expect(screen.getByTestId("heatmap-loading")).toBeTruthy();
        });

        it("shows_error_state_when_floor_plan_fetch_fails", async () => {
            // Arrange & Act: 間取りが読めなければ色付けも無意味なのでエラー表示
            renderHeatmapView({
                getRooms: jest
                    .fn()
                    .mockRejectedValue(new Error("network error")),
            });

            // Assert
            await waitFor(() => {
                expect(screen.getByTestId("error-state")).toBeTruthy();
            });
        });

        it("shows_status_error_banner_and_neutral_colors_when_status_fetch_fails", async () => {
            // Arrange & Act: 配置は表示しつつ全エリア neutral + バナー
            renderHeatmapView({
                getRooms: jest.fn().mockResolvedValue([ROOM_WITH_FURNITURE]),
                getAreaStatuses: jest
                    .fn()
                    .mockRejectedValue(new Error("network error")),
            });

            // Assert
            await waitFor(() => {
                expect(
                    screen.getByTestId("heatmap-status-error"),
                ).toBeTruthy();
            });
            const room = screen.getByTestId("room-shape-room-1");
            expect(StyleSheet.flatten(room.props.style).backgroundColor).toBe(
                lightTheme.colors.heatNeutral,
            );
        });
    });
});
