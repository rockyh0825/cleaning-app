import type { RoomWithFurniture } from '@/features/layout/types';

/**
 * heatmap feature が layout feature の部屋・家具情報を読むための境界インターフェース。
 * feature 間の直接 import を禁止し、このインターフェース経由でのみアクセスする。
 */
export interface LayoutCapability {
    getRooms(userId: string): Promise<RoomWithFurniture[]>;
}
