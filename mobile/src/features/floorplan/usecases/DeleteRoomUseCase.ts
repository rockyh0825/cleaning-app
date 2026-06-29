import type { FloorplanRepository } from '../repositories/FloorplanRepository';

export class DeleteRoomUseCase {
    constructor(private readonly repository: FloorplanRepository) {}

    async execute(userId: string, roomId: string): Promise<void> {
        return this.repository.deleteRoom(userId, roomId);
    }
}
