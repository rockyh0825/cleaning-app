import type { LayoutRepository } from '../repositories/LayoutRepository';
import type { Furniture, UpdateFurnitureInput } from '../types';
import { clampWithin } from '@/shared/utils/grid';

export class UpdateFurnitureUseCase {
    constructor(private readonly repository: LayoutRepository) {}

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

        const roomRect = { x: room.gridX, y: room.gridY, w: room.gridW, h: room.gridH };
        const clampedW = Math.min((input as { gridW?: number }).gridW ?? current.gridW, roomRect.w);
        const clampedH = Math.min((input as { gridH?: number }).gridH ?? current.gridH, roomRect.h);
        const furnitureRect = {
            x: (input as { gridX?: number }).gridX ?? current.gridX,
            y: (input as { gridY?: number }).gridY ?? current.gridY,
            w: clampedW,
            h: clampedH,
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
