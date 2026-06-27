import { AddRoomUseCase } from '../AddRoomUseCase';
import type { LayoutRepository } from '../../repositories/LayoutRepository';
import type { Room, CreateRoomInput } from '../../types';

const mockRoom: Room = {
    id: 'room-1',
    name: 'キッチン',
    type: 'KITCHEN',
    gridX: 0,
    gridY: 0,
    gridW: 4,
    gridH: 3,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
};

const mockRepository = {
    getFloorPlan: jest.fn(),
    listRooms: jest.fn(),
    createRoom: jest.fn(),
    updateRoom: jest.fn(),
    deleteRoom: jest.fn(),
    createFurniture: jest.fn(),
    updateFurniture: jest.fn(),
    deleteFurniture: jest.fn(),
} as unknown as LayoutRepository;

describe('AddRoomUseCase', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (mockRepository.createRoom as jest.Mock).mockResolvedValue(mockRoom);
    });

    it('正常系: リポジトリに委譲して部屋を返す', async () => {
        const useCase = new AddRoomUseCase(mockRepository);
        const input: CreateRoomInput = {
            name: 'キッチン',
            type: 'KITCHEN',
            gridX: 0,
            gridY: 0,
            gridW: 4,
            gridH: 3,
        };

        const result = await useCase.execute('user-1', input);

        expect(mockRepository.createRoom).toHaveBeenCalledWith('user-1', input);
        expect(result).toEqual(mockRoom);
    });
});
