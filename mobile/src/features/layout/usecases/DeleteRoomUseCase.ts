import type { LayoutRepository } from '../repositories/LayoutRepository';

export class DeleteRoomUseCase {
    constructor(private readonly repository: LayoutRepository) {}

    async execute(userId: string, roomId: string): Promise<void> {
        return this.repository.deleteRoom(userId, roomId);
    }
}
