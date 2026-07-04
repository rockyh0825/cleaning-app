import { UpdateRoomUseCase } from '../UpdateRoomUseCase';
import type { FloorPlanRepository } from '../../repositories/FloorPlanRepository';
import type { Furniture, Room, RoomWithFurniture, UpdateRoomInput } from '../../types';

function makeFurniture(overrides: Partial<Furniture> & { id: string }): Furniture {
    return {
        roomId: 'room-1',
        name: 'ソファ',
        presetKey: null,
        gridX: 2,
        gridY: 2,
        gridW: 1,
        gridH: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        ...overrides,
    };
}

const mockRoom: RoomWithFurniture = {
    id: 'room-1',
    name: 'リビング',
    type: 'LIVING',
    gridX: 2,
    gridY: 2,
    gridW: 5,
    gridH: 4,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
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

describe('UpdateRoomUseCase', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (mockRepository.getFloorPlan as jest.Mock).mockResolvedValue({ rooms: [mockRoom] });
        (mockRepository.updateRoom as jest.Mock).mockResolvedValue(mockRoom as Room);
    });

    it('正常系: キャンバス内の座標はそのまま repository.updateRoom に渡る', async () => {
        const useCase = new UpdateRoomUseCase(mockRepository);
        const input: UpdateRoomInput = { gridX: 10, gridY: 8 };

        await useCase.execute('user-1', 'room-1', input);

        const calledWith = (mockRepository.updateRoom as jest.Mock).mock.calls[0][2];
        expect(calledWith.gridX).toBe(10);
        expect(calledWith.gridY).toBe(8);
    });

    it('正常系: 名前のみの更新はフロアプランを取得せずそのまま repository に委譲する', async () => {
        const useCase = new UpdateRoomUseCase(mockRepository);
        const input: UpdateRoomInput = { name: '新しいリビング' };

        await useCase.execute('user-1', 'room-1', input);

        expect(mockRepository.getFloorPlan).not.toHaveBeenCalled();
        expect(mockRepository.updateRoom).toHaveBeenCalledWith('user-1', 'room-1', input);
    });

    it('境界値: キャンバス(20x20)をはみ出す座標は境界内にクランプされる', async () => {
        const useCase = new UpdateRoomUseCase(mockRepository);
        // 部屋は 5x4 のまま → 右端は x=15、下端は y=16 まで
        const input: UpdateRoomInput = { gridX: 18, gridY: 19 };

        await useCase.execute('user-1', 'room-1', input);

        const calledWith = (mockRepository.updateRoom as jest.Mock).mock.calls[0][2];
        expect(calledWith.gridX).toBe(15);
        expect(calledWith.gridY).toBe(16);
    });

    it('境界値: 負の座標は 0 にクランプされる', async () => {
        const useCase = new UpdateRoomUseCase(mockRepository);
        const input: UpdateRoomInput = { gridX: -3, gridY: -1 };

        await useCase.execute('user-1', 'room-1', input);

        const calledWith = (mockRepository.updateRoom as jest.Mock).mock.calls[0][2];
        expect(calledWith.gridX).toBe(0);
        expect(calledWith.gridY).toBe(0);
    });

    it('境界値: gridW/gridH に 0 を渡すと 1 に補正される', async () => {
        const useCase = new UpdateRoomUseCase(mockRepository);
        const input: UpdateRoomInput = { gridW: 0, gridH: 0 };

        await useCase.execute('user-1', 'room-1', input);

        const calledWith = (mockRepository.updateRoom as jest.Mock).mock.calls[0][2];
        expect(calledWith.gridW).toBe(1);
        expect(calledWith.gridH).toBe(1);
    });

    it('境界値: キャンバスサイズを超える gridW/gridH はキャンバスサイズにクランプされる', async () => {
        const useCase = new UpdateRoomUseCase(mockRepository);
        const input: UpdateRoomInput = { gridW: 25, gridH: 30 };

        await useCase.execute('user-1', 'room-1', input);

        const calledWith = (mockRepository.updateRoom as jest.Mock).mock.calls[0][2];
        expect(calledWith.gridW).toBe(20);
        expect(calledWith.gridH).toBe(20);
    });

    it('異常系: 対象の部屋がフロアプランに存在しない場合は入力をそのまま委譲する', async () => {
        const useCase = new UpdateRoomUseCase(mockRepository);
        const input: UpdateRoomInput = { gridX: 18 };

        await useCase.execute('user-1', 'unknown-room', input);

        expect(mockRepository.updateRoom).toHaveBeenCalledWith('user-1', 'unknown-room', input);
    });

    describe('内包家具のクランプ（Requirement 2.3）', () => {
        it('正常系: 部屋の縮小ではみ出す家具は新しい部屋矩形内にクランプして updateFurniture が呼ばれる', async () => {
            // Arrange: 部屋 (2,2) 5x4 → 3x3 に縮小。家具 (6,5) 1x1 は新矩形 (2,2)-(5,5) の外
            const furnitureOut = makeFurniture({ id: 'furn-out', gridX: 6, gridY: 5 });
            (mockRepository.getFloorPlan as jest.Mock).mockResolvedValue({
                rooms: [{ ...mockRoom, furniture: [furnitureOut] }],
            });
            const useCase = new UpdateRoomUseCase(mockRepository);

            // Act
            await useCase.execute('user-1', 'room-1', { gridW: 3, gridH: 3 });

            // Assert: 右下端 (2+3-1, 2+3-1) = (4,4) にクランプされる
            expect(mockRepository.updateFurniture).toHaveBeenCalledTimes(1);
            expect(mockRepository.updateFurniture).toHaveBeenCalledWith('user-1', 'furn-out', {
                gridX: 4,
                gridY: 4,
            });
        });

        it('正常系: 新しい部屋矩形に収まっている家具は updateFurniture を呼ばない', async () => {
            // Arrange: 家具 (2,2) 1x1 は縮小後の矩形 (2,2) 3x3 に収まる
            const furnitureIn = makeFurniture({ id: 'furn-in', gridX: 2, gridY: 2 });
            (mockRepository.getFloorPlan as jest.Mock).mockResolvedValue({
                rooms: [{ ...mockRoom, furniture: [furnitureIn] }],
            });
            const useCase = new UpdateRoomUseCase(mockRepository);

            // Act
            await useCase.execute('user-1', 'room-1', { gridW: 3, gridH: 3 });

            // Assert
            expect(mockRepository.updateFurniture).not.toHaveBeenCalled();
        });

        it('正常系: はみ出す家具と収まる家具が混在する場合ははみ出す家具のみ更新される', async () => {
            // Arrange
            const furnitureIn = makeFurniture({ id: 'furn-in', gridX: 2, gridY: 2 });
            const furnitureOut = makeFurniture({ id: 'furn-out', gridX: 6, gridY: 2 });
            (mockRepository.getFloorPlan as jest.Mock).mockResolvedValue({
                rooms: [{ ...mockRoom, furniture: [furnitureIn, furnitureOut] }],
            });
            const useCase = new UpdateRoomUseCase(mockRepository);

            // Act
            await useCase.execute('user-1', 'room-1', { gridW: 3, gridH: 3 });

            // Assert
            expect(mockRepository.updateFurniture).toHaveBeenCalledTimes(1);
            expect(mockRepository.updateFurniture).toHaveBeenCalledWith('user-1', 'furn-out', {
                gridX: 4,
                gridY: 2,
            });
        });

        it('境界値: 家具が新しい部屋矩形より大きい場合は部屋の左上に揃える（clampWithin の仕様）', async () => {
            // Arrange: 家具 (3,3) 4x3 は縮小後の矩形 (2,2) 3x3 より幅が大きい
            const bigFurniture = makeFurniture({ id: 'furn-big', gridX: 3, gridY: 3, gridW: 4, gridH: 3 });
            (mockRepository.getFloorPlan as jest.Mock).mockResolvedValue({
                rooms: [{ ...mockRoom, furniture: [bigFurniture] }],
            });
            const useCase = new UpdateRoomUseCase(mockRepository);

            // Act
            await useCase.execute('user-1', 'room-1', { gridW: 3, gridH: 3 });

            // Assert: 左上 (2,2) に揃う
            expect(mockRepository.updateFurniture).toHaveBeenCalledTimes(1);
            expect(mockRepository.updateFurniture).toHaveBeenCalledWith('user-1', 'furn-big', {
                gridX: 2,
                gridY: 2,
            });
        });

        it('正常系: 家具が無い部屋のリサイズでは updateFurniture を呼ばない', async () => {
            // Arrange: mockRoom は furniture: []
            const useCase = new UpdateRoomUseCase(mockRepository);

            // Act
            await useCase.execute('user-1', 'room-1', { gridW: 3, gridH: 3 });

            // Assert
            expect(mockRepository.updateFurniture).not.toHaveBeenCalled();
        });

        it('正常系: 名前のみの更新では updateFurniture を呼ばない', async () => {
            // Arrange
            const furnitureOut = makeFurniture({ id: 'furn-out', gridX: 6, gridY: 5 });
            (mockRepository.getFloorPlan as jest.Mock).mockResolvedValue({
                rooms: [{ ...mockRoom, furniture: [furnitureOut] }],
            });
            const useCase = new UpdateRoomUseCase(mockRepository);

            // Act
            await useCase.execute('user-1', 'room-1', { name: '新しいリビング' });

            // Assert
            expect(mockRepository.updateFurniture).not.toHaveBeenCalled();
        });
    });
});
