import type { CleaningRecordRepository } from '../repositories/CleaningRecordRepository';
import type { Part, CreatePartInput, UpdatePartInput } from '../types';

export class ManagePartUseCase {
    constructor(private readonly repository: CleaningRecordRepository) {}

    async addPart(userId: string, input: CreatePartInput): Promise<Part> {
        return this.repository.createPart(userId, input);
    }

    async updatePart(userId: string, partId: string, input: UpdatePartInput): Promise<Part> {
        return this.repository.updatePart(userId, partId, input);
    }

    async deletePart(userId: string, partId: string): Promise<void> {
        return this.repository.deletePart(userId, partId);
    }
}
