import type { CleaningRecordRepository } from '../repositories/CleaningRecordRepository';

export class DeleteRecordUseCase {
    constructor(private readonly repository: CleaningRecordRepository) {}

    async execute(userId: string, recordId: string): Promise<void> {
        return this.repository.deleteRecord(userId, recordId);
    }
}
