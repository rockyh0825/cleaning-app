import type { FloorPlanRepository } from '../repositories/FloorPlanRepository';
import type { Room, UpdateRoomInput } from '../types';
import { clampWithin } from '@/shared/utils/grid';
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

        return this.repository.updateRoom(userId, roomId, {
            ...input,
            gridX: clamped.x,
            gridY: clamped.y,
            gridW: clamped.w,
            gridH: clamped.h,
        } as UpdateRoomInput);
    }
}
