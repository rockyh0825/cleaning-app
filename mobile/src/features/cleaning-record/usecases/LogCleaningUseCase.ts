import type { CleaningRecordRepository } from '../repositories/CleaningRecordRepository';
import type { CleaningRecord, CreateRecordInput } from '../types';

export class LogCleaningUseCase {
    constructor(private readonly repository: CleaningRecordRepository) {}

    async execute(userId: string, input: CreateRecordInput): Promise<CleaningRecord[]> {
        return this.repository.createRecords(userId, input);
    }
}
