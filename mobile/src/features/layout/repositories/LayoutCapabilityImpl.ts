import type { LayoutCapability } from '@/capabilities/LayoutCapability';
import type { RoomWithFurniture } from '../types';
import type { LayoutRepository } from './LayoutRepository';

/**
 * LayoutCapability の実装。
 * LayoutRepository.getFloorPlan() を経由して部屋一覧（家具付き）を返す。
 */
export class LayoutCapabilityImpl implements LayoutCapability {
    constructor(private readonly repository: LayoutRepository) {}

    async getRooms(userId: string): Promise<RoomWithFurniture[]> {
        const plan = await this.repository.getFloorPlan(userId);
        return plan.rooms;
    }
}
