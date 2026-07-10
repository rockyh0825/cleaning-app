import { QueryClient, QueryObserver } from "@tanstack/react-query";
import type { AreaStatus } from "@/capabilities/CleaningStatusCapability";
import type { RoomWithFurniture } from "@/capabilities/FloorPlanCapability";
import {
    buildAreaColors,
    buildAreaStatusesQuery,
    buildHeatmapRoomsQuery,
} from "../useHeatmap";

/** テスト用の heat 状態→hex（テーマ層の代役） */
const HEAT_COLORS = {
    fresh: "#00FF00",
    due: "#FFFF00",
    overdue: "#FF0000",
    neutral: "#CCCCCC",
} as const;

function makeRoom(
    id: string,
    furnitureIds: string[] = [],
): RoomWithFurniture {
    return {
        id,
        name: `部屋 ${id}`,
        type: "LIVING",
        gridX: 0,
        gridY: 0,
        gridW: 4,
        gridH: 3,
        createdAt: new Date("2026-07-01"),
        updatedAt: new Date("2026-07-01"),
        furniture: furnitureIds.map((furnitureId) => ({
            id: furnitureId,
            roomId: id,
            name: `家具 ${furnitureId}`,
            gridX: 0,
            gridY: 0,
            gridW: 1,
            gridH: 1,
            createdAt: new Date("2026-07-01"),
            updatedAt: new Date("2026-07-01"),
        })),
    };
}

function createQueryClient(): QueryClient {
    // gcTime: 0 でテスト後に GC タイマーを残さない（jest の open handle 防止）
    return new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
}

describe("buildAreaColors", () => {
    describe("正常系: 経過割合に応じた色の割り当て", () => {
        it("maps_mixed_statuses_to_fresh_due_and_overdue_colors_per_area", () => {
            // Arrange: 緑（0.5）・黄（0.9）・赤（1.5）が混在する
            const rooms = [makeRoom("room-1"), makeRoom("room-2"), makeRoom("room-3")];
            const statuses: AreaStatus[] = [
                { areaId: "room-1", maxElapsedRatio: 0.5 },
                { areaId: "room-2", maxElapsedRatio: 0.9 },
                { areaId: "room-3", maxElapsedRatio: 1.5 },
            ];

            // Act
            const colors = buildAreaColors(rooms, statuses, HEAT_COLORS);

            // Assert
            expect(colors.get("room-1")).toBe(HEAT_COLORS.fresh);
            expect(colors.get("room-2")).toBe(HEAT_COLORS.due);
            expect(colors.get("room-3")).toBe(HEAT_COLORS.overdue);
        });

        it("maps_unclean_area_with_infinity_ratio_to_overdue_color", () => {
            // Arrange: 未掃除パーツを含むエリアは Infinity
            const rooms = [makeRoom("room-1")];
            const statuses: AreaStatus[] = [
                { areaId: "room-1", maxElapsedRatio: Infinity },
            ];

            // Act
            const colors = buildAreaColors(rooms, statuses, HEAT_COLORS);

            // Assert
            expect(colors.get("room-1")).toBe(HEAT_COLORS.overdue);
        });

        it("includes_furniture_area_ids_in_color_map", () => {
            // Arrange: 部屋に内包される家具もエリアとして個別に色分けされる
            const rooms = [makeRoom("room-1", ["furn-1"])];
            const statuses: AreaStatus[] = [
                { areaId: "room-1", maxElapsedRatio: 0.2 },
                { areaId: "furn-1", maxElapsedRatio: 2.0 },
            ];

            // Act
            const colors = buildAreaColors(rooms, statuses, HEAT_COLORS);

            // Assert
            expect(colors.get("room-1")).toBe(HEAT_COLORS.fresh);
            expect(colors.get("furn-1")).toBe(HEAT_COLORS.overdue);
        });
    });

    describe("正常系: 状態が無いエリアの中立フォールバック", () => {
        it("falls_back_to_neutral_color_when_area_has_no_status", () => {
            // Arrange: room-2 はパーツ0件のため statuses に現れない
            const rooms = [makeRoom("room-1"), makeRoom("room-2")];
            const statuses: AreaStatus[] = [
                { areaId: "room-1", maxElapsedRatio: 0.5 },
            ];

            // Act
            const colors = buildAreaColors(rooms, statuses, HEAT_COLORS);

            // Assert
            expect(colors.get("room-2")).toBe(HEAT_COLORS.neutral);
        });
    });

    describe("異常系: 掃除状態の取得に失敗したとき", () => {
        it("falls_back_to_neutral_for_all_areas_when_statuses_are_undefined", () => {
            // Arrange: 掃除状態取得失敗（undefined）でも間取りは表示する
            const rooms = [makeRoom("room-1", ["furn-1"]), makeRoom("room-2")];

            // Act
            const colors = buildAreaColors(rooms, undefined, HEAT_COLORS);

            // Assert
            expect(colors.get("room-1")).toBe(HEAT_COLORS.neutral);
            expect(colors.get("furn-1")).toBe(HEAT_COLORS.neutral);
            expect(colors.get("room-2")).toBe(HEAT_COLORS.neutral);
        });
    });
});

describe("buildHeatmapRoomsQuery", () => {
    const mockFloorPlanCapability = {
        getRooms: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("fetches_rooms_via_floor_plan_capability", async () => {
        // Arrange
        const rooms = [makeRoom("room-1")];
        mockFloorPlanCapability.getRooms.mockResolvedValue(rooms);
        const queryClient = createQueryClient();

        // Act
        const query = buildHeatmapRoomsQuery("user-1", mockFloorPlanCapability);
        const result = await queryClient.fetchQuery(query);

        // Assert
        expect(mockFloorPlanCapability.getRooms).toHaveBeenCalledWith("user-1");
        expect(result).toEqual(rooms);
    });

    it("shares_floor_plan_query_key_prefix_so_room_mutations_invalidate_it", () => {
        // Arrange & Act: floor-plan の mutation は ['floorPlan', userId] を invalidate する。
        // 前方一致で巻き込まれるよう同じ prefix を共有する（部屋・家具変更の鮮度担保）
        const query = buildHeatmapRoomsQuery("user-1", mockFloorPlanCapability);

        // Assert
        expect(query.queryKey.slice(0, 2)).toEqual(["floorPlan", "user-1"]);
        // floor-plan 側の ['floorPlan', userId]（FloorPlan 形状）と exact key は衝突させない
        expect(query.queryKey.length).toBeGreaterThan(2);
    });

    it("does_not_fetch_rooms_when_userId_is_empty", async () => {
        // Arrange
        const queryClient = createQueryClient();
        const query = buildHeatmapRoomsQuery("", mockFloorPlanCapability);

        // Act: QueryObserver は enabled を尊重してフェッチを判断する
        const observer = new QueryObserver(queryClient, query);
        const unsubscribe = observer.subscribe(() => {});
        await new Promise((resolve) => setTimeout(resolve, 0));
        unsubscribe();

        // Assert
        expect(mockFloorPlanCapability.getRooms).not.toHaveBeenCalled();
    });
});

describe("buildAreaStatusesQuery", () => {
    const mockCleaningStatusCapability = {
        getAreaStatuses: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("fetches_area_statuses_via_cleaning_status_capability", async () => {
        // Arrange
        const statuses: AreaStatus[] = [
            { areaId: "room-1", maxElapsedRatio: 0.5 },
        ];
        mockCleaningStatusCapability.getAreaStatuses.mockResolvedValue(statuses);
        const queryClient = createQueryClient();

        // Act
        const query = buildAreaStatusesQuery(
            "user-1",
            mockCleaningStatusCapability,
        );
        const result = await queryClient.fetchQuery(query);

        // Assert
        expect(
            mockCleaningStatusCapability.getAreaStatuses,
        ).toHaveBeenCalledWith("user-1");
        expect(result).toEqual(statuses);
    });

    it("shares_parts_query_key_prefix_so_cleaning_record_mutations_invalidate_it", () => {
        // Arrange & Act: cleaning-record の mutation は ['parts'] を invalidate する。
        // エリア状態はパーツ（lastCleanedAt）由来のため同じ prefix を共有して巻き込まれる
        const query = buildAreaStatusesQuery(
            "user-1",
            mockCleaningStatusCapability,
        );

        // Assert
        expect(query.queryKey[0]).toBe("parts");
        expect(query.queryKey[1]).toEqual({ userId: "user-1" });
        // パーツ一覧 ['parts', { userId }] と exact key は衝突させない
        expect(query.queryKey.length).toBeGreaterThan(2);
    });

    it("refetches_on_mount_to_recompute_ratio_with_current_time", () => {
        // Arrange & Act: 表示のたびに現在時刻基準で経過割合を再計算する（時間経過で黄→赤）
        const query = buildAreaStatusesQuery(
            "user-1",
            mockCleaningStatusCapability,
        );

        // Assert
        expect(query.refetchOnMount).toBe("always");
        expect(query.staleTime).toBe(0);
    });

    it("does_not_fetch_statuses_when_userId_is_empty", async () => {
        // Arrange
        const queryClient = createQueryClient();
        const query = buildAreaStatusesQuery("", mockCleaningStatusCapability);

        // Act
        const observer = new QueryObserver(queryClient, query);
        const unsubscribe = observer.subscribe(() => {});
        await new Promise((resolve) => setTimeout(resolve, 0));
        unsubscribe();

        // Assert
        expect(
            mockCleaningStatusCapability.getAreaStatuses,
        ).not.toHaveBeenCalled();
    });
});
