import type { FloorPlanRepository } from '../repositories/FloorPlanRepository';

export class DeleteRoomUseCase {
    constructor(private readonly repository: FloorPlanRepository) {}

    async execute(userId: string, roomId: string): Promise<void> {
        return this.repository.deleteRoom(userId, roomId);
    }
}
