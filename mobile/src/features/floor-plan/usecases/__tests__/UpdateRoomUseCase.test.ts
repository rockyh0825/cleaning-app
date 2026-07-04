import { UpdateRoomUseCase } from '../UpdateRoomUseCase';
import type { FloorPlanRepository } from '../../repositories/FloorPlanRepository';
import type { Room, RoomWithFurniture, UpdateRoomInput } from '../../types';

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
});
