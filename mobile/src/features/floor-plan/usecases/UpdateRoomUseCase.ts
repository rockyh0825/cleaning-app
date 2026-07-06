import type { FloorPlanRepository } from '../repositories/FloorPlanRepository';
import type { Furniture, Room, UpdateRoomInput } from '../types';
import { clampWithin } from '@/shared/utils/grid';
import type { Rect } from '@/shared/utils/grid';
import { GRID_COLS, GRID_ROWS } from '../constants';

export class UpdateRoomUseCase {
    constructor(private readonly repository: FloorPlanRepository) {}

    async execute(userId: string, roomId: string, input: UpdateRoomInput): Promise<Room> {
        const hasGridUpdate = 'gridX' in input || 'gridY' in input || 'gridW' in input || 'gridH' in input;

        if (!hasGridUpdate) {
            return this.repository.updateRoom(userId, roomId, input);
        }

        const floorPlan = await this.repository.getFloorPlan(userId);
        const current = floorPlan.rooms.find((r) => r.id === roomId);

        if (!current) {
            return this.repository.updateRoom(userId, roomId, input);
        }

        const g = input as { gridX?: number; gridY?: number; gridW?: number; gridH?: number };
        const canvasRect = { x: 0, y: 0, w: GRID_COLS, h: GRID_ROWS };
        const roomRect = {
            x: g.gridX ?? current.gridX,
            y: g.gridY ?? current.gridY,
            w: Math.min(Math.max(g.gridW ?? current.gridW, 1), canvasRect.w),
            h: Math.min(Math.max(g.gridH ?? current.gridH, 1), canvasRect.h),
        };
        const clamped = clampWithin(roomRect, canvasRect);

        const updatedRoom = await this.repository.updateRoom(userId, roomId, {
            ...input,
            gridX: clamped.x,
            gridY: clamped.y,
            gridW: clamped.w,
            gridH: clamped.h,
        } as UpdateRoomInput);

        await this.clampContainedFurniture(userId, current.furniture, clamped);

        return updatedRoom;
    }

    /**
     * 新しい部屋サイズからはみ出した内包家具を境界内にクランプし追随更新する（Requirement 2.3）。
     * 家具の座標は部屋相対（0基点）のため、可動域は部屋の位置に依存しない 0 起点の相対矩形
     * （新しい部屋サイズ）を親 bounds として使う。これにより部屋を移動しただけ（サイズ不変）
     * では相対座標が変わらず、家具は部屋に追従する（保存座標を書き換えない）。
     * 家具が部屋より大きい場合は clampWithin の仕様に従い相対原点 (0,0) に揃える。
     */
    private async clampContainedFurniture(
        userId: string,
        furniture: Furniture[],
        roomRect: Rect,
    ): Promise<void> {
        const relativeBounds: Rect = { x: 0, y: 0, w: roomRect.w, h: roomRect.h };
        const updates = furniture
            .map((f) => ({
                furniture: f,
                clamped: clampWithin(
                    { x: f.gridX, y: f.gridY, w: f.gridW, h: f.gridH },
                    relativeBounds,
                ),
            }))
            .filter(({ furniture: f, clamped }) => clamped.x !== f.gridX || clamped.y !== f.gridY);

        await Promise.all(
            updates.map(({ furniture: f, clamped }) =>
                this.repository.updateFurniture(userId, f.id, {
                    gridX: clamped.x,
                    gridY: clamped.y,
                }),
            ),
        );
    }
}
