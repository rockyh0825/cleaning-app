/**
 * FloorPlanCapabilityImpl のテスト。
 * FloorPlanRepository をモックし、getRooms() が正しく部屋一覧を返すことを検証する。
 */

import { FloorPlanCapabilityImpl } from '../FloorPlanCapabilityImpl';
import type { FloorPlanRepository } from '../FloorPlanRepository';
import type { RoomWithFurniture } from '../../types';

// --- テスト用フィクスチャ ---

const makeRoomWithFurniture = (overrides: Partial<RoomWithFurniture> = {}): RoomWithFurniture => ({
    id: 'room-1',
    name: 'テストルーム',
    type: 'BEDROOM',
    gridX: 0,
    gridY: 0,
    gridW: 4,
    gridH: 4,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    furniture: [],
    ...overrides,
});

// --- モック FloorPlanRepository ---

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

describe('FloorPlanCapabilityImpl', () => {
    const userId = 'user-uuid-1';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getRooms', () => {
        it('正常系: getFloorPlan を経由して部屋一覧を返す', async () => {
            // Arrange
            const rooms: RoomWithFurniture[] = [
                makeRoomWithFurniture({ id: 'room-1', name: 'リビング' }),
                makeRoomWithFurniture({ id: 'room-2', name: 'キッチン', type: 'KITCHEN' }),
            ];
            (mockRepository.getFloorPlan as jest.Mock).mockResolvedValue({ rooms });
            const capability = new FloorPlanCapabilityImpl(mockRepository);

            // Act
            const result = await capability.getRooms(userId);

            // Assert
            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('room-1');
            expect(result[1].id).toBe('room-2');
        });

        it('正常系: getFloorPlan に userId が正しく渡される', async () => {
            // Arrange
            (mockRepository.getFloorPlan as jest.Mock).mockResolvedValue({ rooms: [] });
            const capability = new FloorPlanCapabilityImpl(mockRepository);

            // Act
            await capability.getRooms(userId);

            // Assert
            expect(mockRepository.getFloorPlan).toHaveBeenCalledWith(userId);
        });

        it('正常系: 部屋が存在しないとき空配列を返す', async () => {
            // Arrange
            (mockRepository.getFloorPlan as jest.Mock).mockResolvedValue({ rooms: [] });
            const capability = new FloorPlanCapabilityImpl(mockRepository);

            // Act
            const result = await capability.getRooms(userId);

            // Assert
            expect(result).toHaveLength(0);
        });

        it('正常系: 家具を持つ部屋を正しく返す', async () => {
            // Arrange
            const roomWithFurniture = makeRoomWithFurniture({
                furniture: [
                    {
                        id: 'furniture-1',
                        roomId: 'room-1',
                        name: 'ベッド',
                        presetKey: 'bed',
                        gridX: 0,
                        gridY: 0,
                        gridW: 2,
                        gridH: 3,
                        rotation: 0,
                        createdAt: new Date('2024-01-01'),
                        updatedAt: new Date('2024-01-01'),
                    },
                ],
            });
            (mockRepository.getFloorPlan as jest.Mock).mockResolvedValue({ rooms: [roomWithFurniture] });
            const capability = new FloorPlanCapabilityImpl(mockRepository);

            // Act
            const result = await capability.getRooms(userId);

            // Assert
            expect(result[0].furniture).toHaveLength(1);
            expect(result[0].furniture[0].id).toBe('furniture-1');
        });
    });
});
