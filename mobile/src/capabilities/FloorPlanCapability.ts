import type { RoomWithFurniture } from "@/features/floor-plan/types";

// 依存する側（heatmap）が floor-plan を直接 import せずに戻り値の型を扱えるよう再公開する
export type { RoomWithFurniture };

/**
 * heatmap feature が floorPlan feature の部屋・家具情報を読むための境界インターフェース。
 * feature 間の直接 import を禁止し、このインターフェース経由でのみアクセスする。
 */
export interface FloorPlanCapability {
  getRooms(userId: string): Promise<RoomWithFurniture[]>;
}
