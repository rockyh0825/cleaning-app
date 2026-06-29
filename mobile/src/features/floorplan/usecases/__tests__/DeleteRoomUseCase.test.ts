import { DeleteRoomUseCase } from '../DeleteRoomUseCase';
import type { FloorplanRepository } from '../../repositories/FloorplanRepository';

const mockRepository = {
    getFloorplan: jest.fn(),
    listRooms: jest.fn(),
    createRoom: jest.fn(),
    updateRoom: jest.fn(),
    deleteRoom: jest.fn(),
    createFurniture: jest.fn(),
    updateFurniture: jest.fn(),
    deleteFurniture: jest.fn(),
} as unknown as FloorplanRepository;

describe('DeleteRoomUseCase', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (mockRepository.deleteRoom as jest.Mock).mockResolvedValue(undefined);
    });

    it('正常系: リポジトリに削除を委譲する', async () => {
        const useCase = new DeleteRoomUseCase(mockRepository);

        await useCase.execute('user-1', 'room-1');

        expect(mockRepository.deleteRoom).toHaveBeenCalledWith('user-1', 'room-1');
    });
});
