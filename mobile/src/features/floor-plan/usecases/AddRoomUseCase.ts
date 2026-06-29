import type { FloorPlanRepository } from '../repositories/FloorPlanRepository';
import type { Room, CreateRoomInput } from '../types';

export class AddRoomUseCase {
    constructor(private readonly repository: FloorPlanRepository) {}

    async execute(userId: string, input: CreateRoomInput): Promise<Room> {
        return this.repository.createRoom(userId, input);
    }
}
