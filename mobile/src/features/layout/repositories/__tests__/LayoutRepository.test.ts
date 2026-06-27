/**
 * LayoutRepository のテスト。
 * shared/api は gitignore 対象の生成コードのため、テスト内にスタブ型を定義して依存を切る。
 */

// --- スタブ型 (生成コードを参照しない) ---

type ApiRoomType = 'KITCHEN' | 'BATHROOM' | 'BEDROOM' | 'LIVING' | 'TOILET' | 'OTHER';

interface ApiRoom {
    id: string;
    name: string;
    type: ApiRoomType;
    gridX: number;
    gridY: number;
    gridW: number;
    gridH: number;
    createdAt: Date;
    updatedAt: Date;
}

interface ApiFurniture {
    id: string;
    roomId: string;
    name: string;
    presetKey: string | null | undefined;
    gridX: number;
    gridY: number;
    gridW: number;
    gridH: number;
    createdAt: Date;
    updatedAt: Date;
}

interface ApiRoomWithFurniture extends ApiRoom {
    furniture: ApiFurniture[];
}

interface ApiFloorPlan {
    rooms: ApiRoomWithFurniture[];
}

// --- テスト用ファクトリ ---

const makeApiRoom = (overrides: Partial<ApiRoom> = {}): ApiRoom => ({
    id: 'room-1',
    name: 'テストルーム',
    type: 'BEDROOM',
    gridX: 0,
    gridY: 0,
    gridW: 4,
    gridH: 4,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
});

const makeApiFurniture = (overrides: Partial<ApiFurniture> = {}): ApiFurniture => ({
    id: 'furniture-1',
    roomId: 'room-1',
    name: 'ベッド',
    presetKey: 'bed',
    gridX: 0,
    gridY: 0,
    gridW: 2,
    gridH: 3,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
});

// --- モック API ---

const mockApi = () =>
    ({
        getFloorPlan: jest.fn(),
        listRooms: jest.fn(),
        createRoom: jest.fn(),
        updateRoom: jest.fn(),
        deleteRoom: jest.fn(),
        createFurniture: jest.fn(),
        updateFurniture: jest.fn(),
        deleteFurniture: jest.fn(),
    }) as Record<string, jest.Mock>;

// LayoutRepository を直接 import する（shared/api の型を通じた検証は不要）
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { LayoutRepository } = require('../LayoutRepository') as {
    LayoutRepository: new (api: Record<string, jest.Mock>) => {
        getFloorPlan(userId: string): Promise<{ rooms: (ApiRoomWithFurniture & { furniture: ApiFurniture[] })[] }>;
        listRooms(userId: string): Promise<ApiRoom[]>;
        createRoom(userId: string, input: object): Promise<ApiRoom>;
        updateRoom(userId: string, roomId: string, input: object): Promise<ApiRoom>;
        deleteRoom(userId: string, roomId: string): Promise<void>;
        createFurniture(userId: string, roomId: string, input: object): Promise<ApiFurniture>;
        updateFurniture(userId: string, furnitureId: string, input: object): Promise<ApiFurniture>;
        deleteFurniture(userId: string, furnitureId: string): Promise<void>;
    };
};

describe('LayoutRepository', () => {
    const userId = 'user-uuid-1';

    describe('getFloorPlan', () => {
        it('returns_floor_plan_with_rooms_and_furniture', async () => {
            // Arrange
            const api = mockApi();
            const furniture = makeApiFurniture();
            const floorPlan: ApiFloorPlan = {
                rooms: [{ ...makeApiRoom(), furniture: [furniture] }],
            };
            api.getFloorPlan.mockResolvedValue(floorPlan);
            const repo = new LayoutRepository(api);

            // Act
            const result = await repo.getFloorPlan(userId);

            // Assert
            expect(result.rooms).toHaveLength(1);
            expect(result.rooms[0].id).toBe('room-1');
            expect(result.rooms[0].furniture).toHaveLength(1);
            expect(result.rooms[0].furniture[0].id).toBe('furniture-1');
        });

        it('calls_api_with_correct_user_id', async () => {
            // Arrange
            const api = mockApi();
            api.getFloorPlan.mockResolvedValue({ rooms: [] });
            const repo = new LayoutRepository(api);

            // Act
            await repo.getFloorPlan(userId);

            // Assert
            expect(api.getFloorPlan).toHaveBeenCalledWith({ xUserId: userId });
        });

        it('returns_empty_rooms_when_floor_plan_has_no_rooms', async () => {
            // Arrange
            const api = mockApi();
            api.getFloorPlan.mockResolvedValue({ rooms: [] });
            const repo = new LayoutRepository(api);

            // Act
            const result = await repo.getFloorPlan(userId);

            // Assert
            expect(result.rooms).toHaveLength(0);
        });
    });

    describe('listRooms', () => {
        it('returns_mapped_rooms_list', async () => {
            // Arrange
            const api = mockApi();
            api.listRooms.mockResolvedValue([
                makeApiRoom({ id: 'r1', name: '部屋A' }),
                makeApiRoom({ id: 'r2', name: '部屋B' }),
            ]);
            const repo = new LayoutRepository(api);

            // Act
            const result = await repo.listRooms(userId);

            // Assert
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('r1');
            expect(result[0].name).toBe('部屋A');
        });

        it('returns_empty_list_when_no_rooms_exist', async () => {
            // Arrange
            const api = mockApi();
            api.listRooms.mockResolvedValue([]);
            const repo = new LayoutRepository(api);

            // Act
            const result = await repo.listRooms(userId);

            // Assert
            expect(result).toHaveLength(0);
        });

        it('calls_api_with_correct_user_id', async () => {
            // Arrange
            const api = mockApi();
            api.listRooms.mockResolvedValue([]);
            const repo = new LayoutRepository(api);

            // Act
            await repo.listRooms(userId);

            // Assert
            expect(api.listRooms).toHaveBeenCalledWith({ xUserId: userId });
        });
    });

    describe('createRoom', () => {
        it('returns_created_room_with_mapped_fields', async () => {
            // Arrange
            const api = mockApi();
            api.createRoom.mockResolvedValue(makeApiRoom({ id: 'new-room', name: '新部屋' }));
            const repo = new LayoutRepository(api);
            const input = { name: '新部屋', type: 'BEDROOM', gridX: 0, gridY: 0, gridW: 3, gridH: 3 };

            // Act
            const result = await repo.createRoom(userId, input);

            // Assert
            expect(result.id).toBe('new-room');
            expect(result.name).toBe('新部屋');
        });

        it('calls_api_with_correct_parameters', async () => {
            // Arrange
            const api = mockApi();
            api.createRoom.mockResolvedValue(makeApiRoom());
            const repo = new LayoutRepository(api);
            const input = { name: 'キッチン', type: 'KITCHEN', gridX: 1, gridY: 2, gridW: 4, gridH: 5 };

            // Act
            await repo.createRoom(userId, input);

            // Assert
            expect(api.createRoom).toHaveBeenCalledWith({ xUserId: userId, roomCreate: input });
        });
    });

    describe('updateRoom', () => {
        it('returns_updated_room_with_mapped_fields', async () => {
            // Arrange
            const api = mockApi();
            api.updateRoom.mockResolvedValue(makeApiRoom({ name: '更新後' }));
            const repo = new LayoutRepository(api);

            // Act
            const result = await repo.updateRoom(userId, 'room-1', { name: '更新後' });

            // Assert
            expect(result.name).toBe('更新後');
        });

        it('calls_api_with_correct_parameters', async () => {
            // Arrange
            const api = mockApi();
            api.updateRoom.mockResolvedValue(makeApiRoom());
            const repo = new LayoutRepository(api);
            const input = { gridX: 5 };

            // Act
            await repo.updateRoom(userId, 'room-1', input);

            // Assert
            expect(api.updateRoom).toHaveBeenCalledWith({
                xUserId: userId,
                roomId: 'room-1',
                roomUpdate: input,
            });
        });
    });

    describe('deleteRoom', () => {
        it('calls_api_delete_with_correct_parameters', async () => {
            // Arrange
            const api = mockApi();
            api.deleteRoom.mockResolvedValue(undefined);
            const repo = new LayoutRepository(api);

            // Act
            await repo.deleteRoom(userId, 'room-1');

            // Assert
            expect(api.deleteRoom).toHaveBeenCalledWith({ xUserId: userId, roomId: 'room-1' });
        });
    });

    describe('createFurniture', () => {
        it('returns_created_furniture_with_mapped_fields', async () => {
            // Arrange
            const api = mockApi();
            api.createFurniture.mockResolvedValue(
                makeApiFurniture({ id: 'new-furniture', name: '新家具', roomId: 'room-1' }),
            );
            const repo = new LayoutRepository(api);

            // Act
            const result = await repo.createFurniture(userId, 'room-1', { name: '新家具', gridX: 0, gridY: 0, gridW: 2, gridH: 2 });

            // Assert
            expect(result.id).toBe('new-furniture');
            expect(result.name).toBe('新家具');
            expect(result.roomId).toBe('room-1');
        });

        it('calls_api_with_correct_parameters', async () => {
            // Arrange
            const api = mockApi();
            api.createFurniture.mockResolvedValue(makeApiFurniture());
            const repo = new LayoutRepository(api);
            const input = { name: 'ソファ', presetKey: 'sofa', gridX: 1, gridY: 1, gridW: 3, gridH: 2 };

            // Act
            await repo.createFurniture(userId, 'room-1', input);

            // Assert
            expect(api.createFurniture).toHaveBeenCalledWith({
                xUserId: userId,
                roomId: 'room-1',
                furnitureCreate: input,
            });
        });

        it('maps_null_preset_key_correctly', async () => {
            // Arrange
            const api = mockApi();
            api.createFurniture.mockResolvedValue(makeApiFurniture({ presetKey: null }));
            const repo = new LayoutRepository(api);

            // Act
            const result = await repo.createFurniture(userId, 'room-1', { name: 'カスタム', gridX: 0, gridY: 0, gridW: 1, gridH: 1 });

            // Assert
            expect(result.presetKey).toBeNull();
        });
    });

    describe('updateFurniture', () => {
        it('returns_updated_furniture_with_mapped_fields', async () => {
            // Arrange
            const api = mockApi();
            api.updateFurniture.mockResolvedValue(makeApiFurniture({ name: '更新後' }));
            const repo = new LayoutRepository(api);

            // Act
            const result = await repo.updateFurniture(userId, 'furniture-1', { name: '更新後' });

            // Assert
            expect(result.name).toBe('更新後');
        });

        it('calls_api_with_correct_parameters', async () => {
            // Arrange
            const api = mockApi();
            api.updateFurniture.mockResolvedValue(makeApiFurniture());
            const repo = new LayoutRepository(api);
            const input = { gridX: 3, gridY: 4 };

            // Act
            await repo.updateFurniture(userId, 'furniture-1', input);

            // Assert
            expect(api.updateFurniture).toHaveBeenCalledWith({
                xUserId: userId,
                furnitureId: 'furniture-1',
                furnitureUpdate: input,
            });
        });
    });

    describe('deleteFurniture', () => {
        it('calls_api_delete_with_correct_parameters', async () => {
            // Arrange
            const api = mockApi();
            api.deleteFurniture.mockResolvedValue(undefined);
            const repo = new LayoutRepository(api);

            // Act
            await repo.deleteFurniture(userId, 'furniture-1');

            // Assert
            expect(api.deleteFurniture).toHaveBeenCalledWith({
                xUserId: userId,
                furnitureId: 'furniture-1',
            });
        });
    });
});
