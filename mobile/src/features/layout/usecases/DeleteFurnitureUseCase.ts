import type { LayoutRepository } from '../repositories/LayoutRepository';

export class DeleteFurnitureUseCase {
    constructor(private readonly repository: LayoutRepository) {}

    async execute(userId: string, furnitureId: string): Promise<void> {
        return this.repository.deleteFurniture(userId, furnitureId);
    }
}
