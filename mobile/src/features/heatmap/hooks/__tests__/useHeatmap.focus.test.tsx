import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lightTheme } from "@/shared/theme/tokens";
import type { RoomWithFurniture } from "@/capabilities/FloorPlanCapability";
import { useHeatmap } from "../useHeatmap";

// expo-router の Tabs は画面をマウント保持するため、refetchOnMount では
// タブ再訪時の再取得が発火しない。useFocusEffect（フォーカス復帰）で
// invalidate する実装を、登録されたコールバックを手動発火して検証する。
jest.mock("expo-router", () => ({
    useFocusEffect: jest.fn(),
}));

import { useFocusEffect } from "expo-router";
const mockUseFocusEffect = useFocusEffect as jest.Mock;

/** 直近に useFocusEffect へ登録されたコールバックを「タブ再訪」として発火する */
function fireFocus() {
    const calls = mockUseFocusEffect.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    act(() => {
        calls[calls.length - 1][0]();
    });
}

const ROOM: RoomWithFurniture = {
    id: "room-1",
    name: "リビング",
    type: "LIVING",
    gridX: 0,
    gridY: 0,
    gridW: 4,
    gridH: 3,
    createdAt: new Date("2026-07-01"),
    updatedAt: new Date("2026-07-01"),
    furniture: [],
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

describe("useHeatmap（タブ再訪時の再計算）", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("refetches_area_statuses_and_updates_color_when_tab_regains_focus", async () => {
        // Arrange: 初回フォーカスでは黄（0.9）、再訪時には時間経過で赤（1.2）になっている
        const floorPlanCapability = {
            getRooms: jest.fn().mockResolvedValue([ROOM]),
        };
        const cleaningStatusCapability = {
            getAreaStatuses: jest
                .fn()
                .mockResolvedValueOnce([
                    { areaId: "room-1", maxElapsedRatio: 0.9 },
                ])
                .mockResolvedValue([
                    { areaId: "room-1", maxElapsedRatio: 1.2 },
                ]),
        };
        const { result } = renderHook(
            () =>
                useHeatmap("user-1", {
                    floorPlanCapability,
                    cleaningStatusCapability,
                }),
            { wrapper: createWrapper() },
        );
        await waitFor(() => {
            expect(result.current.areaColors.get("room-1")).toBe(
                lightTheme.colors.heatDue,
            );
        });

        // Act: タブ再訪（マウント維持のままフォーカス復帰）を発火する
        fireFocus();

        // Assert: 現在時刻基準で再取得され、黄→赤に推移する（Requirement 5.1）
        await waitFor(() => {
            expect(result.current.areaColors.get("room-1")).toBe(
                lightTheme.colors.heatOverdue,
            );
        });
        expect(
            cleaningStatusCapability.getAreaStatuses,
        ).toHaveBeenCalledTimes(2);
    });

    it("does_not_refetch_rooms_when_tab_regains_focus", async () => {
        // Arrange: 部屋配置は時間経過で変わらないため、フォーカス復帰の対象外
        const floorPlanCapability = {
            getRooms: jest.fn().mockResolvedValue([ROOM]),
        };
        const cleaningStatusCapability = {
            getAreaStatuses: jest.fn().mockResolvedValue([]),
        };
        const { result } = renderHook(
            () =>
                useHeatmap("user-1", {
                    floorPlanCapability,
                    cleaningStatusCapability,
                }),
            { wrapper: createWrapper() },
        );
        await waitFor(() => {
            expect(result.current.isPending).toBe(false);
        });

        // Act
        fireFocus();

        // Assert: エリア状態のみ再取得し、部屋一覧は再取得しない
        await waitFor(() => {
            expect(
                cleaningStatusCapability.getAreaStatuses,
            ).toHaveBeenCalledTimes(2);
        });
        expect(floorPlanCapability.getRooms).toHaveBeenCalledTimes(1);
    });
});
