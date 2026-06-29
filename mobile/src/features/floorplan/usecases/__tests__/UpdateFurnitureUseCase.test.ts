import { UpdateFurnitureUseCase } from '../UpdateFurnitureUseCase';
import type { FloorplanRepository } from '../../repositories/FloorplanRepository';
import type { Furniture, RoomWithFurniture, UpdateFurnitureInput } from '../../types';

const mockFurniture: Furniture = {
    id: 'f-1',
    roomId: 'room-1',
    name: 'ソファ',
    presetKey: null,
    gridX: 2,
    gridY: 2,
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
    furniture: [mockFurniture],
};

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

describe('UpdateFurnitureUseCase', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (mockRepository.getFloorplan as jest.Mock).mockResolvedValue({ rooms: [mockRoom] });
        (mockRepository.updateFurniture as jest.Mock).mockResolvedValue(mockFurniture);
    });

    it('正常系: 名前のみの更新はフロアプランを取得せずそのまま repository に委譲する', async () => {
        const useCase = new UpdateFurnitureUseCase(mockRepository);
        const input: UpdateFurnitureInput = { name: '新しい名前' };

        await useCase.execute('user-1', 'f-1', input);

        expect(mockRepository.getFloorplan).not.toHaveBeenCalled();
        expect(mockRepository.updateFurniture).toHaveBeenCalledWith('user-1', 'f-1', input);
    });

    it('境界値: 座標が部屋境界内に収まる場合はクランプせずそのまま渡る', async () => {
        const useCase = new UpdateFurnitureUseCase(mockRepository);
        const input: UpdateFurnitureInput = { gridX: 1, gridY: 1 };

        await useCase.execute('user-1', 'f-1', input);

        const calledWith = (mockRepository.updateFurniture as jest.Mock).mock.calls[0][2];
        expect(calledWith.gridX).toBe(1);
        expect(calledWith.gridY).toBe(1);
    });

    it('境界値: 家具の座標が部屋境界を超える場合は部屋内に収まるよう調整される', async () => {
        const useCase = new UpdateFurnitureUseCase(mockRepository);
        // 部屋は 10x8、家具の w:2 h:2 を維持するので、右端は x=8、下端は y=6 まで
        const input: UpdateFurnitureInput = { gridX: 9, gridY: 7 };

        await useCase.execute('user-1', 'f-1', input);

        const calledWith = (mockRepository.updateFurniture as jest.Mock).mock.calls[0][2];
        expect(calledWith.gridX).toBe(8);
        expect(calledWith.gridY).toBe(6);
    });

    it('境界値: 部屋サイズを超える gridW/gridH は部屋サイズにクランプされる', async () => {
        const useCase = new UpdateFurnitureUseCase(mockRepository);
        // 部屋は 10x8。gridW: 15, gridH: 10 は超過 → w: 10, h: 8 にクランプされるべき
        const input: UpdateFurnitureInput = { gridW: 15, gridH: 10 };

        await useCase.execute('user-1', 'f-1', input);

        const calledWith = (mockRepository.updateFurniture as jest.Mock).mock.calls[0][2];
        expect(calledWith.gridW).toBe(10);
        expect(calledWith.gridH).toBe(8);
    });
});
