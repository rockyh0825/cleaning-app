import type { FloorplanRepository } from '../repositories/FloorplanRepository';
import type { Furniture, CreateFurnitureInput } from '../types';
import { clampWithin } from '@/shared/utils/grid';

export class AddFurnitureUseCase {
    constructor(private readonly repository: FloorplanRepository) {}

    async execute(userId: string, roomId: string, input: CreateFurnitureInput): Promise<Furniture> {
        const floorplan = await this.repository.getFloorplan(userId);
        const room = floorplan.rooms.find((r) => r.id === roomId);

        if (!room) {
            return this.repository.createFurniture(userId, roomId, input);
        }

        const roomRect = { x: room.gridX, y: room.gridY, w: room.gridW, h: room.gridH };
        const furnitureRect = { x: input.gridX, y: input.gridY, w: input.gridW, h: input.gridH };
        const clamped = clampWithin(furnitureRect, roomRect);

        return this.repository.createFurniture(userId, roomId, {
            ...input,
            gridX: clamped.x,
            gridY: clamped.y,
        });
    }
}
