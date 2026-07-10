import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
    AreaStatus,
    CleaningStatusCapability,
} from "@/capabilities/CleaningStatusCapability";
import type {
    FloorPlanCapability,
    RoomWithFurniture,
} from "@/capabilities/FloorPlanCapability";
import type { AppTheme } from "@/shared/theme/tokens";
import { useAppTheme } from "@/shared/theme/useAppTheme";
import {
    DEFAULT_THRESHOLDS,
    resolveHeatStatus,
    type HeatStatus,
} from "../usecases/resolveHeatStatus";

/** heat 状態 → 具体色（hex）。テーマ（ライト／ダーク）から解決する */
export type HeatColors = Record<HeatStatus, string>;

const EMPTY_ROOMS: RoomWithFurniture[] = [];

/** テーマの heat セマンティックトークンを状態→hex の対応表に変換する */
export function resolveHeatColors(colors: AppTheme["colors"]): HeatColors {
    return {
        fresh: colors.heatFresh,
        due: colors.heatDue,
        overdue: colors.heatOverdue,
        neutral: colors.heatNeutral,
    };
}

/**
 * ヒートマップ表示用の部屋・家具一覧を FloorPlanCapability 経由で取得するクエリ。
 * floor-plan の mutation は ['floorPlan', userId] を invalidate するため、
 * 前方一致で巻き込まれるよう同じ prefix を共有する（部屋・家具変更の鮮度担保）。
 * データ形状（RoomWithFurniture[]）が floor-plan 側（FloorPlan）と異なるので
 * exact key は分けてキャッシュの衝突を防ぐ。
 */
export function buildHeatmapRoomsQuery(
    userId: string,
    capability: Pick<FloorPlanCapability, "getRooms">,
) {
    return {
        queryKey: ["floorPlan", userId, "heatmap-rooms"] as const,
        queryFn: () => capability.getRooms(userId),
        // userId 未解決（空文字）のうちは実行しない
        enabled: userId !== "",
    };
}

/**
 * 全エリアの最大経過割合を CleaningStatusCapability 経由で取得するクエリ。
 * cleaning-record の mutation（記録の登録・修正・削除）は ['parts'] を invalidate
 * するため、エリア状態（パーツの lastCleanedAt 由来）も同じ prefix を共有して
 * 巻き込まれる（境界を跨ぐ直接依存を作らない query key 連携）。
 * 経過割合は取得時の現在時刻で決まるため、マウントごとに再取得して
 * 時間経過による黄→赤の推移を反映する。
 */
export function buildAreaStatusesQuery(
    userId: string,
    capability: Pick<CleaningStatusCapability, "getAreaStatuses">,
) {
    return {
        queryKey: ["parts", { userId }, "area-statuses"] as const,
        queryFn: () => capability.getAreaStatuses(userId),
        enabled: userId !== "",
        staleTime: 0,
        refetchOnMount: "always" as const,
    };
}

/**
 * 各エリア（room.id / furniture.id）の色を解決した Map を作る純粋関数。
 * - 状態があるエリア: maxElapsedRatio を既定閾値で fresh / due / overdue に分類
 * - 状態が無いエリア（パーツ0件）: neutral
 * - statuses が undefined（掃除状態の取得失敗）: 全エリア neutral にフォールバック
 */
export function buildAreaColors(
    rooms: RoomWithFurniture[],
    statuses: AreaStatus[] | undefined,
    heatColors: HeatColors,
): Map<string, string> {
    const ratioByArea = new Map(
        (statuses ?? []).map((status) => [status.areaId, status.maxElapsedRatio]),
    );

    function colorOf(areaId: string): string {
        const ratio = ratioByArea.get(areaId);
        if (ratio === undefined) return heatColors.neutral;
        return heatColors[resolveHeatStatus(ratio, DEFAULT_THRESHOLDS)];
    }

    const colors = new Map<string, string>();
    for (const room of rooms) {
        colors.set(room.id, colorOf(room.id));
        for (const furniture of room.furniture) {
            colors.set(furniture.id, colorOf(furniture.id));
        }
    }
    return colors;
}

export type UseHeatmapDeps = {
    floorPlanCapability: Pick<FloorPlanCapability, "getRooms">;
    cleaningStatusCapability: Pick<CleaningStatusCapability, "getAreaStatuses">;
};

/**
 * floor-plan（配置）と cleaning-record（掃除状態）を Capability 経由で合成し、
 * ヒートマップ画面が使う整形済みデータ（部屋一覧と areaId→hex の Map）を返す。
 * 掃除状態の取得のみ失敗した場合は全エリア neutral にフォールバックし、
 * isStatusError でエラーを surface する（配置だけでも見える方が有用）。
 */
export function useHeatmap(userId: string, deps: UseHeatmapDeps) {
    const theme = useAppTheme();

    const roomsQuery = useQuery(
        buildHeatmapRoomsQuery(userId, deps.floorPlanCapability),
    );
    const statusesQuery = useQuery(
        buildAreaStatusesQuery(userId, deps.cleaningStatusCapability),
    );

    const rooms = roomsQuery.data ?? EMPTY_ROOMS;
    const statuses = statusesQuery.data;
    // theme.colors はテーマ定数（lightTheme / darkTheme）への参照なのでモード切替時のみ変わる
    const themeColors = theme.colors;

    const areaColors = useMemo(
        () => buildAreaColors(rooms, statuses, resolveHeatColors(themeColors)),
        [rooms, statuses, themeColors],
    );

    return {
        rooms,
        areaColors,
        isPending: roomsQuery.isPending || statusesQuery.isPending,
        isError: roomsQuery.isError,
        /** 掃除状態のみ取得失敗（全エリア neutral フォールバック中）を表す */
        isStatusError: statusesQuery.isError,
    };
}
