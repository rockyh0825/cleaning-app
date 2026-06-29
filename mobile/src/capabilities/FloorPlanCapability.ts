import type { RoomWithFurniture } from '@/features/floor-plan/types';

/**
 * heatmap feature が floorplan feature の部屋・家具情報を読むための境界インターフェース。
 * feature 間の直接 import を禁止し、このインターフェース経由でのみアクセスする。
 */
export interface FloorPlanCapability {
    getRooms(userId: string): Promise<RoomWithFurniture[]>;
}
