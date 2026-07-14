import { UpdateFurnitureUseCase } from '../UpdateFurnitureUseCase';
import type { FloorPlanRepository } from '../../repositories/FloorPlanRepository';
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
    rotation: 0,
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
    getFloorPlan: jest.fn(),
    listRooms: jest.fn(),
    createRoom: jest.fn(),
    updateRoom: jest.fn(),
    deleteRoom: jest.fn(),
    createFurniture: jest.fn(),
    updateFurniture: jest.fn(),
    deleteFurniture: jest.fn(),
} as unknown as FloorPlanRepository;

describe('UpdateFurnitureUseCase', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (mockRepository.getFloorPlan as jest.Mock).mockResolvedValue({ rooms: [mockRoom] });
        (mockRepository.updateFurniture as jest.Mock).mockResolvedValue(mockFurniture);
    });

    it('正常系: 名前のみの更新はフロアプランを取得せずそのまま repository に委譲する', async () => {
        const useCase = new UpdateFurnitureUseCase(mockRepository);
        const input: UpdateFurnitureInput = { name: '新しい名前' };

        await useCase.execute('user-1', 'f-1', input);

        expect(mockRepository.getFloorPlan).not.toHaveBeenCalled();
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

    it('does_not_fetch_floor_plan_when_only_rotation_changes', async () => {
        // Arrange: 回転のみ（サイズ据え置き）は占有矩形が動かないのでクランプ不要
        const useCase = new UpdateFurnitureUseCase(mockRepository);
        const input: UpdateFurnitureInput = { rotation: 90 };

        // Act
        await useCase.execute('user-1', 'f-1', input);

        // Assert
        expect(mockRepository.getFloorPlan).not.toHaveBeenCalled();
        expect(mockRepository.updateFurniture).toHaveBeenCalledWith('user-1', 'f-1', input);
    });

    it('clamps_position_when_rotated_footprint_overflows_the_room', async () => {
        // Arrange: 部屋 10x8。1x5 の家具を x=9 に置き 90 度回すと占有は 5x1 → 右端は x=5 まで
        (mockRepository.getFloorPlan as jest.Mock).mockResolvedValue({
            rooms: [
                {
                    ...mockRoom,
                    furniture: [{ ...mockFurniture, gridX: 9, gridY: 0, gridW: 1, gridH: 5 }],
                },
            ],
        });
        const useCase = new UpdateFurnitureUseCase(mockRepository);
        const input: UpdateFurnitureInput = { rotation: 90, gridW: 5, gridH: 1 };

        // Act
        await useCase.execute('user-1', 'f-1', input);

        // Assert
        const calledWith = (mockRepository.updateFurniture as jest.Mock).mock.calls[0][2];
        expect(calledWith.gridX).toBe(5);
        expect(calledWith.gridW).toBe(5);
        expect(calledWith.gridH).toBe(1);
    });

    it('shrinks_furniture_when_rotated_size_exceeds_the_room', async () => {
        // Arrange: 部屋 4x8。1x8 の家具を 90 度回すと占有 8x1 だが幅 4 に収まらない
        (mockRepository.getFloorPlan as jest.Mock).mockResolvedValue({
            rooms: [
                {
                    ...mockRoom,
                    gridW: 4,
                    furniture: [{ ...mockFurniture, gridX: 0, gridY: 0, gridW: 1, gridH: 8 }],
                },
            ],
        });
        const useCase = new UpdateFurnitureUseCase(mockRepository);
        const input: UpdateFurnitureInput = { rotation: 90, gridW: 8, gridH: 1 };

        // Act
        await useCase.execute('user-1', 'f-1', input);

        // Assert: 部屋幅まで縮む
        const calledWith = (mockRepository.updateFurniture as jest.Mock).mock.calls[0][2];
        expect(calledWith.gridW).toBe(4);
        expect(calledWith.gridH).toBe(1);
    });

    it('keeps_rotation_in_payload_when_grid_is_clamped', async () => {
        // Arrange: クランプ経路を通っても rotation が欠落しないこと
        const useCase = new UpdateFurnitureUseCase(mockRepository);
        const input: UpdateFurnitureInput = { rotation: 270, gridX: 9, gridY: 7 };

        // Act
        await useCase.execute('user-1', 'f-1', input);

        // Assert
        const calledWith = (mockRepository.updateFurniture as jest.Mock).mock.calls[0][2];
        expect(calledWith.rotation).toBe(270);
        expect(calledWith.gridX).toBe(8);
    });

    it('境界値: 非原点の部屋でも家具座標は 0 起点の相対でクランプされる', async () => {
        // Arrange: 部屋を (5,5) に移す。家具の相対 (9,7) は相対境界 {0,0,10,8} を超える
        (mockRepository.getFloorPlan as jest.Mock).mockResolvedValue({
            rooms: [{ ...mockRoom, gridX: 5, gridY: 5 }],
        });
        const useCase = new UpdateFurnitureUseCase(mockRepository);
        const input: UpdateFurnitureInput = { gridX: 9, gridY: 7 };

        // Act
        await useCase.execute('user-1', 'f-1', input);

        // Assert: 相対境界で x=8, y=6 にクランプ（部屋の絶対位置は加味しない）
        const calledWith = (mockRepository.updateFurniture as jest.Mock).mock.calls[0][2];
        expect(calledWith.gridX).toBe(8);
        expect(calledWith.gridY).toBe(6);
    });
});
