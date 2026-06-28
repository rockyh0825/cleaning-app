import { DeleteRecordUseCase } from '../DeleteRecordUseCase';
import type { CleaningRecordRepository } from '../../repositories/CleaningRecordRepository';

const mockRepository = {
    createRecords: jest.fn(),
    listRecords: jest.fn(),
    updateRecord: jest.fn(),
    deleteRecord: jest.fn(),
    createPart: jest.fn(),
    updatePart: jest.fn(),
    deletePart: jest.fn(),
} as unknown as CleaningRecordRepository;

describe('DeleteRecordUseCase', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (mockRepository.deleteRecord as jest.Mock).mockResolvedValue(undefined);
    });

    it('正常系: deleteRecord を userId と recordId で呼び出す', async () => {
        const useCase = new DeleteRecordUseCase(mockRepository);

        await useCase.execute('user-1', 'record-1');

        expect(mockRepository.deleteRecord).toHaveBeenCalledWith('user-1', 'record-1');
    });
});

export {};
