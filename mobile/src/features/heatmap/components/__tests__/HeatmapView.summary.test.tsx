import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { RoomWithFurniture } from "@/capabilities/FloorPlanCapability";
import { HeatmapView } from "../HeatmapView";

jest.mock("@shopify/react-native-skia");

// expo-router をモック（useFocusEffect は useHeatmap がタブ再訪時の再取得に使う）
jest.mock("expo-router", () => ({
    router: { push: jest.fn() },
    useFocusEffect: jest.fn(),
}));

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
            rotation: 0,
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
    render(
        <HeatmapView
            userId="user-1"
            floorPlanCapability={{
                getRooms: deps.getRooms ?? jest.fn().mockResolvedValue([]),
            }}
            cleaningStatusCapability={{
                getAreaStatuses:
                    deps.getAreaStatuses ?? jest.fn().mockResolvedValue([]),
            }}
        />,
        { wrapper: createWrapper() },
    );
}

describe("HeatmapView（状態別サマリー行）", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("shows_summary_counts_matching_area_statuses_above_the_canvas", async () => {
        // Arrange: room-1 は期限超過、furn-1 は状態なし（パーツ0件）
        renderHeatmapView({
            getRooms: jest.fn().mockResolvedValue([ROOM_WITH_FURNITURE]),
            getAreaStatuses: jest
                .fn()
                .mockResolvedValue([{ areaId: "room-1", maxElapsedRatio: 1.5 }]),
        });

        // Act & Assert: キャンバスの塗り分けと一致する件数を表示する
        await waitFor(() => {
            expect(screen.getByTestId("heatmap-summary")).toBeTruthy();
        });
        expect(screen.getByText("要掃除 1")).toBeTruthy();
        expect(screen.getByText("記録なし 1")).toBeTruthy();
        expect(screen.getByText("きれい 0")).toBeTruthy();
        expect(screen.getByText("そろそろ 0")).toBeTruthy();
    });

    it("counts_all_areas_as_neutral_when_status_fetch_fails", async () => {
        // Arrange: 掃除状態のみ取得失敗 → 全エリア neutral の縮退表示
        renderHeatmapView({
            getRooms: jest.fn().mockResolvedValue([ROOM_WITH_FURNITURE]),
            getAreaStatuses: jest
                .fn()
                .mockRejectedValue(new Error("network error")),
        });

        // Act & Assert
        await waitFor(() => {
            expect(screen.getByTestId("heatmap-status-error")).toBeTruthy();
        });
        expect(screen.getByText("記録なし 2")).toBeTruthy();
        expect(screen.getByText("要掃除 0")).toBeTruthy();
    });

    it("hides_summary_row_when_no_rooms_exist", async () => {
        // Arrange: 空状態ではサマリーを出さない
        renderHeatmapView({
            getRooms: jest.fn().mockResolvedValue([]),
        });

        // Act & Assert
        await waitFor(() => {
            expect(screen.getByTestId("empty-state")).toBeTruthy();
        });
        expect(screen.queryByTestId("heatmap-summary")).toBeNull();
    });
});
