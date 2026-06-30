import { AddFurnitureUseCase } from '../AddFurnitureUseCase';
import type { FloorPlanRepository } from '../../repositories/FloorPlanRepository';
import type { Furniture, CreateFurnitureInput, RoomWithFurniture } from '../../types';

const mockFurniture: Furniture = {
    id: 'f-1',
    roomId: 'room-1',
    name: 'ソファ',
    presetKey: null,
    gridX: 0,
    gridY: 0,
    gridW: 2,
    gridH: 2,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
};

const mockRoom: RoomWithFurniture = {
    id: 'room-1',
    name: 'リビング',
    type: 'LIVING',
    gridX: 0,
    gridY: 0,
    gridW: 10,
    gridH: 8,
    createdAt: new Date(),
    updatedAt: new Date(),
    furniture: [],
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
} as unknown as FloorPlanRepository;

describe('AddFurnitureUseCase', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (mockRepository.createFurniture as jest.Mock).mockResolvedValue(mockFurniture);
        (mockRepository.getFloorPlan as jest.Mock).mockResolvedValue({ rooms: [mockRoom] });
    });

    it('正常系: 部屋内に家具を追加できる', async () => {
        const useCase = new AddFurnitureUseCase(mockRepository);
        const input: CreateFurnitureInput = {
            name: 'ソファ',
            gridX: 0,
            gridY: 0,
            gridW: 2,
            gridH: 2,
        };

        const result = await useCase.execute('user-1', 'room-1', input);

        expect(mockRepository.createFurniture).toHaveBeenCalledWith('user-1', 'room-1', input);
        expect(result).toEqual(mockFurniture);
    });

    it('境界値: 家具が部屋境界を超える場合はクランプされる', async () => {
        const useCase = new AddFurnitureUseCase(mockRepository);
        // 部屋は 10x8 グリッド (x:0, y:0, w:10, h:8)
        // 家具を x:9, y:7 に w:2, h:2 で配置 → clampWithin でクランプされるべき
        const input: CreateFurnitureInput = {
            name: 'ソファ',
            gridX: 9,
            gridY: 7,
            gridW: 2,
            gridH: 2,
        };

        await useCase.execute('user-1', 'room-1', input);

        const calledWith = (mockRepository.createFurniture as jest.Mock).mock.calls[0][2];
        // x は 10 - 2 = 8 以下にクランプ
        expect(calledWith.gridX).toBeLessThanOrEqual(8);
        // y は 8 - 2 = 6 以下にクランプ
        expect(calledWith.gridY).toBeLessThanOrEqual(6);
    });
});
