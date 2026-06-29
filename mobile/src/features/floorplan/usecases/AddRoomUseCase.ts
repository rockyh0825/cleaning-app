import type { FloorplanRepository } from '../repositories/FloorplanRepository';
import type { Room, CreateRoomInput } from '../types';

export class AddRoomUseCase {
    constructor(private readonly repository: FloorplanRepository) {}

    async execute(userId: string, input: CreateRoomInput): Promise<Room> {
        return this.repository.createRoom(userId, input);
    }
}
