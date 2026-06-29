import type { FloorplanRepository } from '../repositories/FloorplanRepository';
import type { Furniture, UpdateFurnitureInput } from '../types';
import { clampWithin } from '@/shared/utils/grid';

export class UpdateFurnitureUseCase {
    constructor(private readonly repository: FloorplanRepository) {}

    async execute(userId: string, furnitureId: string, input: UpdateFurnitureInput): Promise<Furniture> {
        const hasGridUpdate = 'gridX' in input || 'gridY' in input || 'gridW' in input || 'gridH' in input;

        if (!hasGridUpdate) {
            return this.repository.updateFurniture(userId, furnitureId, input);
        }

        const floorplan = await this.repository.getFloorplan(userId);
        const current = floorplan.rooms.flatMap((r) => r.furniture).find((f) => f.id === furnitureId);

        if (!current) {
            return this.repository.updateFurniture(userId, furnitureId, input);
        }

        const room = floorplan.rooms.find((r) => r.id === current.roomId);

        if (!room) {
            return this.repository.updateFurniture(userId, furnitureId, input);
        }

        const g = input as { gridX?: number; gridY?: number; gridW?: number; gridH?: number };
        const roomRect = { x: room.gridX, y: room.gridY, w: room.gridW, h: room.gridH };
        const furnitureRect = {
            x: g.gridX ?? current.gridX,
            y: g.gridY ?? current.gridY,
            w: Math.min(g.gridW ?? current.gridW, roomRect.w),
            h: Math.min(g.gridH ?? current.gridH, roomRect.h),
        };
        const clamped = clampWithin(furnitureRect, roomRect);

        return this.repository.updateFurniture(userId, furnitureId, {
            ...input,
            gridX: clamped.x,
            gridY: clamped.y,
            gridW: clamped.w,
            gridH: clamped.h,
        } as UpdateFurnitureInput);
    }
}
