import { DeleteFurnitureUseCase } from '../DeleteFurnitureUseCase';
import type { FloorPlanRepository } from '../../repositories/FloorPlanRepository';

const mockRepository = {
    getFloorPlan: jest.fn(),
    listRooms: jest.fn(),
    createRoom: jest.fn(),
    updateRoom: jest.fn(),
    deleteRoom: jest.fn(),
    createFurniture: jest.fn(),
    updateFurniture: jest.fn(),
    deleteFurniture: jest.fn(),
} as unknown as FloorPlanRepository;

describe('DeleteFurnitureUseCase', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (mockRepository.deleteFurniture as jest.Mock).mockResolvedValue(undefined);
    });

    it('正常系: リポジトリに削除を委譲する', async () => {
        const useCase = new DeleteFurnitureUseCase(mockRepository);

        await useCase.execute('user-1', 'f-1');

        expect(mockRepository.deleteFurniture).toHaveBeenCalledWith('user-1', 'f-1');
    });
});
