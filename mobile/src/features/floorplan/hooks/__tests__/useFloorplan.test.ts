import { QueryClient } from '@tanstack/react-query';
import type { Floorplan, Room, CreateRoomInput } from '../../types';
import { buildFloorplanQuery, buildAddRoomMutationOptions } from '../useFloorplan';

const mockRoom: Room = {
    id: 'room-1',
    name: 'リビング',
    type: 'LIVING',
    gridX: 0,
    gridY: 0,
    gridW: 6,
    gridH: 4,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
};

const mockFloorplan: Floorplan = {
    rooms: [{ ...mockRoom, furniture: [] }],
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
};

const addRoomInput: CreateRoomInput = {
    name: 'キッチン',
    type: 'KITCHEN',
    gridX: 0,
    gridY: 4,
    gridW: 4,
    gridH: 3,
};

const addedRoom: Room = {
    id: 'room-2',
    name: 'キッチン',
    type: 'KITCHEN',
    gridX: 0,
    gridY: 4,
    gridW: 4,
    gridH: 3,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
};

describe('useFloorplan', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('正常系: フロアプランを取得して返す', () => {
        it('returns_floor_plan_from_repository', async () => {
            mockRepository.getFloorplan.mockResolvedValue(mockFloorplan);
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false } },
            });

            const query = buildFloorplanQuery('user-1', mockRepository as never);
            const result = await queryClient.fetchQuery(query);

            expect(mockRepository.getFloorplan).toHaveBeenCalledWith('user-1');
            expect(result).toEqual(mockFloorplan);
        });
    });

    describe('正常系: 部屋追加時にキャッシュが楽観的更新される', () => {
        it('updates_cache_optimistically_when_adding_room', async () => {
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
            });
            const mockAddRoomUseCase = { execute: jest.fn().mockResolvedValue(addedRoom) };
            queryClient.setQueryData<Floorplan>(['floorplan', 'user-1'], mockFloorplan);

            const options = buildAddRoomMutationOptions(queryClient, 'user-1', mockAddRoomUseCase);
            await options.onMutate!(addRoomInput);

            const optimistic = queryClient.getQueryData<Floorplan>(['floorplan', 'user-1']);
            expect(optimistic?.rooms).toHaveLength(2);
            expect(optimistic?.rooms[1]?.name).toBe('キッチン');
        });
    });

    describe('異常系: 保存失敗時に楽観的更新がロールバックされる', () => {
        it('rolls_back_cache_when_mutation_fails', async () => {
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
            });
            const mockAddRoomUseCase = {
                execute: jest.fn().mockRejectedValue(new Error('network error')),
            };
            queryClient.setQueryData<Floorplan>(['floorplan', 'user-1'], mockFloorplan);

            const options = buildAddRoomMutationOptions(queryClient, 'user-1', mockAddRoomUseCase);
            const context = await options.onMutate!(addRoomInput);

            const afterOptimistic = queryClient.getQueryData<Floorplan>(['floorplan', 'user-1']);
            expect(afterOptimistic?.rooms).toHaveLength(2);

            options.onError!(new Error('network error'), addRoomInput, context);

            const afterRollback = queryClient.getQueryData<Floorplan>(['floorplan', 'user-1']);
            expect(afterRollback).toEqual(mockFloorplan);
            expect(afterRollback?.rooms).toHaveLength(1);
        });
    });
});
