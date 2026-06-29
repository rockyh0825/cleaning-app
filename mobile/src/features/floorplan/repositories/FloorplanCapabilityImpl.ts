import type { FloorplanCapability } from '@/capabilities/FloorplanCapability';
import type { RoomWithFurniture } from '../types';
import type { FloorplanRepository } from './FloorplanRepository';

/**
 * FloorplanCapability の実装。
 * FloorplanRepository.getFloorplan() を経由して部屋一覧（家具付き）を返す。
 */
export class FloorplanCapabilityImpl implements FloorplanCapability {
    constructor(private readonly repository: FloorplanRepository) {}

    async getRooms(userId: string): Promise<RoomWithFurniture[]> {
        const plan = await this.repository.getFloorplan(userId);
        return plan.rooms;
    }
}
