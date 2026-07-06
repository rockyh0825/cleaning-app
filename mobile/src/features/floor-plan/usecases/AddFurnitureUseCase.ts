import type { FloorPlanRepository } from '../repositories/FloorPlanRepository';
import type { Furniture, CreateFurnitureInput } from '../types';
import { clampWithin } from '@/shared/utils/grid';

export class AddFurnitureUseCase {
    constructor(private readonly repository: FloorPlanRepository) {}

    async execute(userId: string, roomId: string, input: CreateFurnitureInput): Promise<Furniture> {
        const floorPlan = await this.repository.getFloorPlan(userId);
        const room = floorPlan.rooms.find((r) => r.id === roomId);

        if (!room) {
            return this.repository.createFurniture(userId, roomId, input);
        }

        // 家具座標は部屋相対（0基点）。可動域は部屋サイズの相対矩形でクランプする
        const relativeBounds = { x: 0, y: 0, w: room.gridW, h: room.gridH };
        const furnitureRect = { x: input.gridX, y: input.gridY, w: input.gridW, h: input.gridH };
        const clamped = clampWithin(furnitureRect, relativeBounds);

        return this.repository.createFurniture(userId, roomId, {
            ...input,
            gridX: clamped.x,
            gridY: clamped.y,
        });
    }
}
