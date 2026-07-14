import { summarizeHeatStatuses } from "../summarizeHeatStatuses";
import type { RoomWithFurniture } from "@/capabilities/FloorPlanCapability";
import type { AreaStatus } from "@/capabilities/CleaningStatusCapability";

function makeRoom(
    id: string,
    furnitureIds: string[] = [],
): RoomWithFurniture {
    return {
        id,
        name: `部屋${id}`,
        type: "LIVING",
        gridX: 0,
        gridY: 0,
        gridW: 4,
        gridH: 4,
        createdAt: new Date("2026-07-01"),
        updatedAt: new Date("2026-07-01"),
        furniture: furnitureIds.map((furnitureId) => ({
            id: furnitureId,
            roomId: id,
            name: `家具${furnitureId}`,
            gridX: 0,
            gridY: 0,
            gridW: 1,
            gridH: 1,
            rotation: 0,
            createdAt: new Date("2026-07-01"),
            updatedAt: new Date("2026-07-01"),
        })),
    };
}

describe("summarizeHeatStatuses", () => {
    it("returns_all_zeros_when_no_rooms_exist", () => {
        // Act & Assert
        expect(summarizeHeatStatuses([], [])).toEqual({
            fresh: 0,
            due: 0,
            overdue: 0,
            neutral: 0,
        });
    });

    it("classifies_each_area_by_max_elapsed_ratio_thresholds", () => {
        // Arrange: fresh(< 0.8) / due(0.8〜1.0) / overdue(>= 1.0) を1件ずつ
        const rooms = [makeRoom("room-fresh"), makeRoom("room-due"), makeRoom("room-overdue")];
        const statuses: AreaStatus[] = [
            { areaId: "room-fresh", maxElapsedRatio: 0.5 },
            { areaId: "room-due", maxElapsedRatio: 0.8 },
            { areaId: "room-overdue", maxElapsedRatio: 1.0 },
        ];

        // Act & Assert
        expect(summarizeHeatStatuses(rooms, statuses)).toEqual({
            fresh: 1,
            due: 1,
            overdue: 1,
            neutral: 0,
        });
    });

    it("counts_furniture_areas_in_addition_to_rooms", () => {
        // Arrange: 部屋1（fresh）+ 家具2（overdue / 状態なし）
        const rooms = [makeRoom("room-1", ["furn-1", "furn-2"])];
        const statuses: AreaStatus[] = [
            { areaId: "room-1", maxElapsedRatio: 0.1 },
            { areaId: "furn-1", maxElapsedRatio: Infinity },
        ];

        // Act & Assert: キャンバスの塗り分け（buildAreaColors）と同じ母集団
        expect(summarizeHeatStatuses(rooms, statuses)).toEqual({
            fresh: 1,
            due: 0,
            overdue: 1,
            neutral: 1,
        });
    });

    it("counts_areas_without_status_as_neutral", () => {
        // Arrange: パーツ0件のエリアは状態が返らない
        const rooms = [makeRoom("room-1"), makeRoom("room-2")];
        const statuses: AreaStatus[] = [
            { areaId: "room-1", maxElapsedRatio: 0.2 },
        ];

        // Act & Assert
        expect(summarizeHeatStatuses(rooms, statuses)).toEqual({
            fresh: 1,
            due: 0,
            overdue: 0,
            neutral: 1,
        });
    });

    it("falls_back_to_all_neutral_when_statuses_are_unavailable", () => {
        // Arrange: 掃除状態の取得失敗（undefined）
        const rooms = [makeRoom("room-1", ["furn-1"])];

        // Act & Assert: 全エリア neutral（buildAreaColors の縮退と整合）
        expect(summarizeHeatStatuses(rooms, undefined)).toEqual({
            fresh: 0,
            due: 0,
            overdue: 0,
            neutral: 2,
        });
    });
});
