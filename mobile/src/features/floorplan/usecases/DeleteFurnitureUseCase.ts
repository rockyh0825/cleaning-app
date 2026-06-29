import type { FloorplanRepository } from '../repositories/FloorplanRepository';

export class DeleteFurnitureUseCase {
    constructor(private readonly repository: FloorplanRepository) {}

    async execute(userId: string, furnitureId: string): Promise<void> {
        return this.repository.deleteFurniture(userId, furnitureId);
    }
}
