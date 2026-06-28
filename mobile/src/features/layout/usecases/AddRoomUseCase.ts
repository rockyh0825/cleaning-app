import type { LayoutRepository } from '../repositories/LayoutRepository';
import type { Room, CreateRoomInput } from '../types';

export class AddRoomUseCase {
    constructor(private readonly repository: LayoutRepository) {}

    async execute(userId: string, input: CreateRoomInput): Promise<Room> {
        return this.repository.createRoom(userId, input);
    }
}
