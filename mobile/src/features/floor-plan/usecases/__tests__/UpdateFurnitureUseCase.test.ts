import { UpdateFurnitureUseCase } from '../UpdateFurnitureUseCase';
import { rotateClockwiseWithin } from '../../utils/rotation';
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

    it('shrinks_furniture_to_the_room_width_when_a_resize_exceeds_it', async () => {
        // Arrange: 部屋 4x8。リサイズで 8x1 を要求しても幅 4 には収まらない。
        // （回転経路はサイズを縮めない。縮めてよいのは寸法を直接指定するリサイズだけ）
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
        const input: UpdateFurnitureInput = { gridW: 8, gridH: 1 };

        // Act
        await useCase.execute('user-1', 'f-1', input);

        // Assert: 部屋幅まで縮む
        const calledWith = (mockRepository.updateFurniture as jest.Mock).mock.calls[0][2];
        expect(calledWith.gridW).toBe(4);
        expect(calledWith.gridH).toBe(1);
    });

    it('keeps_rotation_in_payload_when_position_is_clamped', async () => {
        // Arrange: 回転パッチ（角度・サイズ・座標の一式）が位置クランプ経路を通っても
        // rotation が欠落しないこと
        const useCase = new UpdateFurnitureUseCase(mockRepository);
        const input: UpdateFurnitureInput = {
            rotation: 270,
            gridW: 2,
            gridH: 2,
            gridX: 9,
            gridY: 7,
        };

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

/**
 * 回転は「rotateClockwiseWithin でパッチを組み立てて UpdateFurnitureUseCase に流す」
 * 2 段構えのため、痩せ細りのような不具合は単体テストの隙間に落ちる。
 * ここでは両者を実物のまま繋いだ結合テストで一周の可逆性を保証する。
 */
describe('回転の結合: rotateClockwiseWithin + UpdateFurnitureUseCase', () => {
    /** 更新を実際に反映する簡易リポジトリ（回転を繰り返すには状態が要るため） */
    function createStatefulRepository(room: RoomWithFurniture, furniture: Furniture) {
        const state = { ...furniture };
        const repository = {
            getFloorPlan: jest.fn(async () => ({
                rooms: [{ ...room, furniture: [{ ...state }] }],
            })),
            updateFurniture: jest.fn(async (_userId, _id, input: UpdateFurnitureInput) => {
                Object.assign(state, input);
                return { ...state };
            }),
        } as unknown as FloorPlanRepository;
        return { repository, state };
    }

    /** 回転ボタンの 1 タップ相当（拒否された場合は何も更新しない） */
    async function pressRotate(
        useCase: UpdateFurnitureUseCase,
        current: Furniture,
        room: RoomWithFurniture,
    ): Promise<void> {
        const patch = rotateClockwiseWithin(current, room);
        if (!patch) return;
        await useCase.execute('user-1', current.id, patch);
    }

    it('returns_to_the_original_size_after_four_rotations_when_the_room_is_too_tight_to_rotate', async () => {
        // Arrange: 4x2 の部屋に 3x1 のソファ。90 度回すと 1x3 になり高さ 2 に収まらない
        const room: RoomWithFurniture = { ...mockRoom, gridW: 4, gridH: 2, furniture: [] };
        const sofa: Furniture = { ...mockFurniture, gridX: 0, gridY: 0, gridW: 3, gridH: 1 };
        const { repository, state } = createStatefulRepository(room, sofa);
        const useCase = new UpdateFurnitureUseCase(repository);

        // Act: 一周ぶん回す（4 回 = 意味的には無操作）
        for (let i = 0; i < 4; i++) {
            await pressRotate(useCase, { ...state }, room);
        }

        // Assert: 一周して元のサイズ・角度に戻る（セルが永久に失われない）
        expect({ gridW: state.gridW, gridH: state.gridH, rotation: state.rotation }).toEqual({
            gridW: 3,
            gridH: 1,
            rotation: 0,
        });
    });

    it('returns_to_the_original_size_after_four_rotations_when_the_room_has_room_to_rotate', async () => {
        // Arrange: 4x3 の部屋なら 3x1 のソファは 1x3 に回せる
        const room: RoomWithFurniture = { ...mockRoom, gridW: 4, gridH: 3, furniture: [] };
        const sofa: Furniture = { ...mockFurniture, gridX: 0, gridY: 0, gridW: 3, gridH: 1 };
        const { repository, state } = createStatefulRepository(room, sofa);
        const useCase = new UpdateFurnitureUseCase(repository);

        // Act
        for (let i = 0; i < 4; i++) {
            await pressRotate(useCase, { ...state }, room);
        }

        // Assert: 4 回転で元の姿に戻る
        expect({ gridW: state.gridW, gridH: state.gridH, rotation: state.rotation }).toEqual({
            gridW: 3,
            gridH: 1,
            rotation: 0,
        });
    });

    it('does_not_update_anything_when_the_rotation_does_not_fit_the_room', async () => {
        // Arrange: 4x2 の部屋の 3x1 は回せない（異常系）
        const room: RoomWithFurniture = { ...mockRoom, gridW: 4, gridH: 2, furniture: [] };
        const sofa: Furniture = { ...mockFurniture, gridX: 0, gridY: 0, gridW: 3, gridH: 1 };
        const { repository } = createStatefulRepository(room, sofa);
        const useCase = new UpdateFurnitureUseCase(repository);

        // Act
        await pressRotate(useCase, sofa, room);

        // Assert: 回転が拒否されたので repository には一切触れない
        expect(repository.updateFurniture).not.toHaveBeenCalled();
    });

    it('keeps_the_size_and_only_clamps_the_position_when_the_rotated_footprint_overflows', async () => {
        // Arrange: 部屋 10x8。右端 x=9 の 1x5 を回すと 5x1 で右にはみ出す
        const room: RoomWithFurniture = { ...mockRoom, furniture: [] };
        const shelf: Furniture = { ...mockFurniture, gridX: 9, gridY: 0, gridW: 1, gridH: 5 };
        const { repository, state } = createStatefulRepository(room, shelf);
        const useCase = new UpdateFurnitureUseCase(repository);

        // Act
        await pressRotate(useCase, shelf, room);

        // Assert: サイズは 5x1 のまま、位置だけ押し戻される
        expect({ gridX: state.gridX, gridW: state.gridW, gridH: state.gridH }).toEqual({
            gridX: 5,
            gridW: 5,
            gridH: 1,
        });
    });
});

