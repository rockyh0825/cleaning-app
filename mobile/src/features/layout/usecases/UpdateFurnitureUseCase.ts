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

        const furnitureRect = {
            x: (input as { gridX?: number }).gridX ?? current.gridX,
            y: (input as { gridY?: number }).gridY ?? current.gridY,
            w: (input as { gridW?: number }).gridW ?? current.gridW,
            h: (input as { gridH?: number }).gridH ?? current.gridH,
        };
        const roomRect = { x: room.gridX, y: room.gridY, w: room.gridW, h: room.gridH };
        const clamped = clampWithin(furnitureRect, roomRect);

        return this.repository.updateFurniture(userId, furnitureId, {
            ...input,
            gridX: clamped.x,
            gridY: clamped.y,
        } as UpdateFurnitureInput);
    }
}
