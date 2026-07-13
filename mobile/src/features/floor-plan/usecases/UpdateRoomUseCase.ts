import type { FloorPlanRepository } from '../repositories/FloorPlanRepository';
import type { Furniture, Room, UpdateFurnitureInput, UpdateRoomInput } from '../types';
import { clampWithin, fitWithin } from '@/shared/utils/grid';
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
     * 新しい部屋サイズからはみ出した内包家具を「①押し戻し → ②縮小」の2段階で
     * 追随更新する（Requirement 2.3 / issue #148 Step 3）。
     * まずサイズを保ったまま境界内へ押し戻し、それでも収まらない軸だけ
     * 部屋サイズまで縮小する（最小 1×1、fitWithin の仕様）。
     * 家具の座標は部屋相対（0基点）のため、可動域は部屋の位置に依存しない 0 起点の相対矩形
     * （新しい部屋サイズ）を親 bounds として使う。これにより部屋を移動しただけ（サイズ不変）
     * では相対座標が変わらず、家具は部屋に追従する（保存座標を書き換えない）。
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
                fitted: fitWithin(
                    { x: f.gridX, y: f.gridY, w: f.gridW, h: f.gridH },
                    relativeBounds,
                ),
            }))
            .map(({ furniture: f, fitted }) => {
                // 変化した組（位置・サイズ）だけを更新ペイロードに含める
                const positionChanged = fitted.x !== f.gridX || fitted.y !== f.gridY;
                const sizeChanged = fitted.w !== f.gridW || fitted.h !== f.gridH;
                if (!positionChanged && !sizeChanged) return null;
                const input = {
                    ...(positionChanged ? { gridX: fitted.x, gridY: fitted.y } : {}),
                    ...(sizeChanged ? { gridW: fitted.w, gridH: fitted.h } : {}),
                } as UpdateFurnitureInput;
                return { id: f.id, input };
            })
            .filter((update): update is { id: string; input: UpdateFurnitureInput } => update !== null);

        await Promise.all(
            updates.map(({ id, input }) =>
                this.repository.updateFurniture(userId, id, input),
            ),
        );
    }
}
