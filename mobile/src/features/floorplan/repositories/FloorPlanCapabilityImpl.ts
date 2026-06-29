import type { FloorPlanCapability } from '@/capabilities/FloorPlanCapability';
import type { RoomWithFurniture } from '../types';
import type { FloorPlanRepository } from './FloorPlanRepository';

/**
 * FloorPlanCapability の実装。
 * FloorPlanRepository.getFloorPlan() を経由して部屋一覧（家具付き）を返す。
 */
export class FloorPlanCapabilityImpl implements FloorPlanCapability {
    constructor(private readonly repository: FloorPlanRepository) {}

    async getRooms(userId: string): Promise<RoomWithFurniture[]> {
        const plan = await this.repository.getFloorPlan(userId);
        return plan.rooms;
    }
}
