import type { FloorPlanRepository } from '../repositories/FloorPlanRepository';

export class DeleteFurnitureUseCase {
    constructor(private readonly repository: FloorPlanRepository) {}

    async execute(userId: string, furnitureId: string): Promise<void> {
        return this.repository.deleteFurniture(userId, furnitureId);
    }
}
