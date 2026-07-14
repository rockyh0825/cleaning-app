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
        rotation: 0,
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

    describe('内包家具の追従とクランプ（Requirement 2.3）', () => {
        it('正常系: 部屋の移動のみ（サイズ不変）では家具の相対座標は不変で updateFurniture を呼ばない（追従）', async () => {
            // Arrange: 部屋 (2,2) 5x4 を (10,10) へ移動。家具は相対 (3,2) 1x1
            const furniture = makeFurniture({ id: 'furn-move', gridX: 3, gridY: 2 });
            (mockRepository.getFloorPlan as jest.Mock).mockResolvedValue({
                rooms: [{ ...mockRoom, furniture: [furniture] }],
            });
            const useCase = new UpdateRoomUseCase(mockRepository);

            // Act: 位置だけ変更（サイズは 5x4 のまま）
            await useCase.execute('user-1', 'room-1', { gridX: 10, gridY: 10 });

            // Assert: 相対座標は変わらない＝家具は部屋に追従する（保存座標を書き換えない）
            expect(mockRepository.updateFurniture).not.toHaveBeenCalled();
        });

        it('正常系: 部屋の縮小ではみ出す家具のみ 0 起点の相対境界でクランプして updateFurniture が呼ばれる', async () => {
            // Arrange: 部屋 (2,2) 5x4 → 3x3 に縮小。家具は相対 (4,3) 1x1 で新相対境界 {0,0,3,3} の外
            const furnitureOut = makeFurniture({ id: 'furn-out', gridX: 4, gridY: 3 });
            (mockRepository.getFloorPlan as jest.Mock).mockResolvedValue({
                rooms: [{ ...mockRoom, furniture: [furnitureOut] }],
            });
            const useCase = new UpdateRoomUseCase(mockRepository);

            // Act
            await useCase.execute('user-1', 'room-1', { gridW: 3, gridH: 3 });

            // Assert: 相対の右下端 (3-1, 3-1) = (2,2) にクランプされる
            expect(mockRepository.updateFurniture).toHaveBeenCalledTimes(1);
            expect(mockRepository.updateFurniture).toHaveBeenCalledWith('user-1', 'furn-out', {
                gridX: 2,
                gridY: 2,
            });
        });

        it('正常系: 新しい部屋矩形に収まっている家具は updateFurniture を呼ばない', async () => {
            // Arrange: 家具は相対 (1,1) 1x1 で縮小後の相対境界 {0,0,3,3} に収まる
            const furnitureIn = makeFurniture({ id: 'furn-in', gridX: 1, gridY: 1 });
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
            // Arrange: 相対座標。in (1,1) は収まる、out (4,1) は幅方向にはみ出す
            const furnitureIn = makeFurniture({ id: 'furn-in', gridX: 1, gridY: 1 });
            const furnitureOut = makeFurniture({ id: 'furn-out', gridX: 4, gridY: 1 });
            (mockRepository.getFloorPlan as jest.Mock).mockResolvedValue({
                rooms: [{ ...mockRoom, furniture: [furnitureIn, furnitureOut] }],
            });
            const useCase = new UpdateRoomUseCase(mockRepository);

            // Act
            await useCase.execute('user-1', 'room-1', { gridW: 3, gridH: 3 });

            // Assert: out のみ x=2 にクランプ
            expect(mockRepository.updateFurniture).toHaveBeenCalledTimes(1);
            expect(mockRepository.updateFurniture).toHaveBeenCalledWith('user-1', 'furn-out', {
                gridX: 2,
                gridY: 1,
            });
        });

        it('正常系: 家具が新しい部屋矩形より大きい場合は押し戻した上で部屋サイズまで縮小される（2段階クランプ）', async () => {
            // Arrange: 家具は相対 (1,1) 4x3 で縮小後の相対境界 {0,0,3,3} に
            // 押し戻しだけでは収まらない → ②縮小が発動する
            const bigFurniture = makeFurniture({ id: 'furn-big', gridX: 1, gridY: 1, gridW: 4, gridH: 3 });
            (mockRepository.getFloorPlan as jest.Mock).mockResolvedValue({
                rooms: [{ ...mockRoom, furniture: [bigFurniture] }],
            });
            const useCase = new UpdateRoomUseCase(mockRepository);

            // Act
            await useCase.execute('user-1', 'room-1', { gridW: 3, gridH: 3 });

            // Assert: 位置は左上へ押し戻され、サイズは部屋いっぱい（3x3）に縮む
            expect(mockRepository.updateFurniture).toHaveBeenCalledTimes(1);
            expect(mockRepository.updateFurniture).toHaveBeenCalledWith('user-1', 'furn-big', {
                gridX: 0,
                gridY: 0,
                gridW: 3,
                gridH: 3,
            });
        });

        it('正常系: 収まらない軸だけ縮小され、収まる軸のサイズは保たれる', async () => {
            // Arrange: 家具は相対 (1,1) 4x2。縮小後の境界 {0,0,3,3} に対して
            // 幅 4 は縮小が必要、高さ 2 は押し戻しのみで収まる
            const wideFurniture = makeFurniture({ id: 'furn-wide', gridX: 1, gridY: 1, gridW: 4, gridH: 2 });
            (mockRepository.getFloorPlan as jest.Mock).mockResolvedValue({
                rooms: [{ ...mockRoom, furniture: [wideFurniture] }],
            });
            const useCase = new UpdateRoomUseCase(mockRepository);

            // Act
            await useCase.execute('user-1', 'room-1', { gridW: 3, gridH: 3 });

            // Assert: 幅のみ 3 に縮み、高さ 2 は不変。x は 0 へ押し戻し
            expect(mockRepository.updateFurniture).toHaveBeenCalledTimes(1);
            expect(mockRepository.updateFurniture).toHaveBeenCalledWith('user-1', 'furn-wide', {
                gridX: 0,
                gridY: 1,
                gridW: 3,
                gridH: 2,
            });
        });

        it('正常系: 位置が変わらずサイズだけ縮む場合はサイズのみ更新される', async () => {
            // Arrange: 家具は相対 (0,0) 5x4 で部屋いっぱい → 3x3 に縮小
            const fullFurniture = makeFurniture({ id: 'furn-full', gridX: 0, gridY: 0, gridW: 5, gridH: 4 });
            (mockRepository.getFloorPlan as jest.Mock).mockResolvedValue({
                rooms: [{ ...mockRoom, furniture: [fullFurniture] }],
            });
            const useCase = new UpdateRoomUseCase(mockRepository);

            // Act
            await useCase.execute('user-1', 'room-1', { gridW: 3, gridH: 3 });

            // Assert: 位置 (0,0) は不変のため送らず、サイズだけ更新する
            expect(mockRepository.updateFurniture).toHaveBeenCalledTimes(1);
            expect(mockRepository.updateFurniture).toHaveBeenCalledWith('user-1', 'furn-full', {
                gridW: 3,
                gridH: 3,
            });
        });

        it('境界値: 部屋を最小 1x1 まで縮小しても家具は 1x1 で残る', async () => {
            // Arrange
            const furniture = makeFurniture({ id: 'furn-min', gridX: 2, gridY: 1, gridW: 3, gridH: 2 });
            (mockRepository.getFloorPlan as jest.Mock).mockResolvedValue({
                rooms: [{ ...mockRoom, furniture: [furniture] }],
            });
            const useCase = new UpdateRoomUseCase(mockRepository);

            // Act
            await useCase.execute('user-1', 'room-1', { gridW: 1, gridH: 1 });

            // Assert
            expect(mockRepository.updateFurniture).toHaveBeenCalledTimes(1);
            expect(mockRepository.updateFurniture).toHaveBeenCalledWith('user-1', 'furn-min', {
                gridX: 0,
                gridY: 0,
                gridW: 1,
                gridH: 1,
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

        it('正常系: 移動＋縮小の複合では移動成分は相対座標に影響せず新サイズ相対境界にクランプされる', async () => {
            // Arrange: 部屋 (2,2) 5x4。家具は相対 (4,3) 1x1
            const furniture = makeFurniture({ id: 'furn-move-resize', gridX: 4, gridY: 3 });
            (mockRepository.getFloorPlan as jest.Mock).mockResolvedValue({
                rooms: [{ ...mockRoom, furniture: [furniture] }],
            });
            const useCase = new UpdateRoomUseCase(mockRepository);

            // Act: 移動 (10,10) と縮小 3x3 を同時に指定
            await useCase.execute('user-1', 'room-1', { gridX: 10, gridY: 10, gridW: 3, gridH: 3 });

            // Assert: 移動成分は相対座標に影響せず、相対境界 {0,0,3,3} の右下端 (2,2) にクランプ
            expect(mockRepository.updateFurniture).toHaveBeenCalledTimes(1);
            expect(mockRepository.updateFurniture).toHaveBeenCalledWith('user-1', 'furn-move-resize', {
                gridX: 2,
                gridY: 2,
            });
        });

        it('正常系: 部屋の拡大では収まったままの家具に updateFurniture を呼ばない（不要更新なし）', async () => {
            // Arrange: 部屋 (2,2) 5x4 を 8x6 に拡大。家具は相対 (4,3) 1x1 で拡大後も収まる
            const furniture = makeFurniture({ id: 'furn-expand', gridX: 4, gridY: 3 });
            (mockRepository.getFloorPlan as jest.Mock).mockResolvedValue({
                rooms: [{ ...mockRoom, furniture: [furniture] }],
            });
            const useCase = new UpdateRoomUseCase(mockRepository);

            // Act: gridW/gridH を増やすのみ
            await useCase.execute('user-1', 'room-1', { gridW: 8, gridH: 6 });

            // Assert: 相対座標は境界内のまま＝不要な更新は発生しない
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
