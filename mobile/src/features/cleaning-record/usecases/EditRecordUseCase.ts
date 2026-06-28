import type { CleaningRecordRepository } from '../repositories/CleaningRecordRepository';
import type { CleaningRecord, UpdateRecordInput } from '../types';

export class EditRecordUseCase {
    constructor(private readonly repository: CleaningRecordRepository) {}

    async execute(userId: string, recordId: string, input: UpdateRecordInput): Promise<CleaningRecord> {
        return this.repository.updateRecord(userId, recordId, input);
    }
}
