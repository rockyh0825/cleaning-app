import { ManagePartUseCase } from '../ManagePartUseCase';
import type { CleaningRecordRepository } from '../../repositories/CleaningRecordRepository';
import type { Part, CreatePartInput } from '../../types';

const mockPart: Part = {
    id: 'part-1',
    ownerType: 'ROOM',
    ownerId: 'room-1',
    name: '床',
    recommendedCycleDays: 7,
    lastCleanedAt: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
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

describe('ManagePartUseCase', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (mockRepository.createPart as jest.Mock).mockResolvedValue(mockPart);
    });

    it('正常系: addPart が createPart を正しい引数で呼び出し、Part を返す', async () => {
        const useCase = new ManagePartUseCase(mockRepository);
        const input: CreatePartInput = {
            ownerType: 'ROOM',
            ownerId: 'room-1',
            name: '床',
            recommendedCycleDays: 7,
        };

        const result = await useCase.addPart('user-1', input);

        expect(mockRepository.createPart).toHaveBeenCalledWith('user-1', input);
        expect(result).toEqual(mockPart);
    });
});

export {};
