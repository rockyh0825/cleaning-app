import type { FloorPlanRepository } from '../repositories/FloorPlanRepository';
import type { Furniture, UpdateFurnitureInput } from '../types';
import { clampWithin } from '@/shared/utils/grid';

export class UpdateFurnitureUseCase {
    constructor(private readonly repository: FloorPlanRepository) {}

    async execute(userId: string, furnitureId: string, input: UpdateFurnitureInput): Promise<Furniture> {
        const hasGridUpdate = 'gridX' in input || 'gridY' in input || 'gridW' in input || 'gridH' in input;

        if (!hasGridUpdate) {
            return this.repository.updateFurniture(userId, furnitureId, input);
        }

        const floorPlan = await this.repository.getFloorPlan(userId);
        const current = floorPlan.rooms.flatMap((r) => r.furniture).find((f) => f.id === furnitureId);

        if (!current) {
            return this.repository.updateFurniture(userId, furnitureId, input);
        }

        const room = floorPlan.rooms.find((r) => r.id === current.roomId);

        if (!room) {
            return this.repository.updateFurniture(userId, furnitureId, input);
        }

        const g = input as { gridX?: number; gridY?: number; gridW?: number; gridH?: number };
        // 家具座標は部屋相対（0基点）。可動域は部屋サイズの相対矩形でクランプする
        const relativeBounds = { x: 0, y: 0, w: room.gridW, h: room.gridH };
        const furnitureRect = {
            x: g.gridX ?? current.gridX,
            y: g.gridY ?? current.gridY,
            w: Math.min(g.gridW ?? current.gridW, relativeBounds.w),
            h: Math.min(g.gridH ?? current.gridH, relativeBounds.h),
        };
        const clamped = clampWithin(furnitureRect, relativeBounds);

        return this.repository.updateFurniture(userId, furnitureId, {
            ...input,
            gridX: clamped.x,
            gridY: clamped.y,
            gridW: clamped.w,
            gridH: clamped.h,
        } as UpdateFurnitureInput);
    }
}
