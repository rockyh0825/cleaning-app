import type { AreaStatus } from "@/capabilities/CleaningStatusCapability";
import type { RoomWithFurniture } from "@/capabilities/FloorPlanCapability";
import {
    DEFAULT_THRESHOLDS,
    resolveHeatStatus,
    type HeatStatus,
} from "./resolveHeatStatus";

/** 状態ごとのエリア件数（部屋 + 家具）。サマリー行の表示に使う */
export type HeatStatusSummary = Record<HeatStatus, number>;

/**
 * 全エリア（部屋 + 家具）を状態別に数える純粋関数。
 * 分類ルールはキャンバスの塗り分け（buildAreaColors）と同一にする:
 * - 状態があるエリア → maxElapsedRatio を既定閾値で fresh / due / overdue に分類
 * - 状態が無いエリア（パーツ0件） → neutral
 * - statuses が undefined（掃除状態の取得失敗） → 全エリア neutral
 */
export function summarizeHeatStatuses(
    rooms: RoomWithFurniture[],
    statuses: AreaStatus[] | undefined,
): HeatStatusSummary {
    const ratioByArea = new Map(
        (statuses ?? []).map((status) => [status.areaId, status.maxElapsedRatio]),
    );

    const summary: HeatStatusSummary = {
        fresh: 0,
        due: 0,
        overdue: 0,
        neutral: 0,
    };

    function countArea(areaId: string) {
        const ratio = ratioByArea.get(areaId);
        const status =
            ratio === undefined
                ? "neutral"
                : resolveHeatStatus(ratio, DEFAULT_THRESHOLDS);
        summary[status] += 1;
    }

    for (const room of rooms) {
        countArea(room.id);
        for (const furniture of room.furniture) {
            countArea(furniture.id);
        }
    }
    return summary;
}
