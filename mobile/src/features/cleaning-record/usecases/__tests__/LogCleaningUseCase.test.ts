import { LogCleaningUseCase } from '../LogCleaningUseCase';
import type { CleaningRecordRepository } from '../../repositories/CleaningRecordRepository';
import type { CleaningRecord, CreateRecordInput } from '../../types';

const mockRecord: CleaningRecord = {
    id: 'record-1',
    partId: 'part-1',
    cleanedAt: new Date('2024-01-01T10:00:00Z'),
    note: null,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
};

const mockRepository = {
    createRecords: jest.fn(),
    listRecords: jest.fn(),
    updateRecord: jest.fn(),
    deleteRecord: jest.fn(),
    createPart: jest.fn(),
    updatePart: jest.fn(),
    deletePart: jest.fn(),
} as unknown as CleaningRecordRepository;

describe('LogCleaningUseCase', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (mockRepository.createRecords as jest.Mock).mockResolvedValue([mockRecord]);
    });

    it('正常系: createRecords を正しい引数で呼び出し、記録リストを返す', async () => {
        const useCase = new LogCleaningUseCase(mockRepository);
        const input: CreateRecordInput = {
            partIds: ['part-1', 'part-2'],
            cleanedAt: new Date('2024-01-01T10:00:00Z'),
        };

        const result = await useCase.execute('user-1', input);

        expect(mockRepository.createRecords).toHaveBeenCalledWith('user-1', input);
        expect(result).toEqual([mockRecord]);
    });
});

export {};
