import { QueryClient } from '@tanstack/react-query';
import type { FloorPlan, Room, CreateRoomInput, CreateFurnitureInput, Furniture } from '../../types';
import {
    buildFloorPlanQuery,
    buildAddRoomMutationOptions,
    buildAddFurnitureMutationOptions,
} from '../useFloorPlan';

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

const mockFloorPlan: FloorPlan = {
    rooms: [{ ...mockRoom, furniture: [] }],
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

describe('useFloorPlan', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('正常系: フロアプランを取得して返す', () => {
        it('returns_floor_plan_from_repository', async () => {
            mockRepository.getFloorPlan.mockResolvedValue(mockFloorPlan);
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false } },
            });

            const query = buildFloorPlanQuery('user-1', mockRepository as never);
            const result = await queryClient.fetchQuery(query);

            expect(mockRepository.getFloorPlan).toHaveBeenCalledWith('user-1');
            expect(result).toEqual(mockFloorPlan);
        });
    });

    describe('正常系: 部屋追加時にキャッシュが楽観的更新される', () => {
        it('updates_cache_optimistically_when_adding_room', async () => {
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
            });
            const mockAddRoomUseCase = { execute: jest.fn().mockResolvedValue(addedRoom) };
            queryClient.setQueryData<FloorPlan>(['floorPlan', 'user-1'], mockFloorPlan);

            const options = buildAddRoomMutationOptions(queryClient, 'user-1', mockAddRoomUseCase);
            await options.onMutate!(addRoomInput);

            const optimistic = queryClient.getQueryData<FloorPlan>(['floorPlan', 'user-1']);
            expect(optimistic?.rooms).toHaveLength(2);
            expect(optimistic?.rooms[1]?.name).toBe('キッチン');
        });
    });

    describe('正常系: 家具追加時にキャッシュが楽観的更新される', () => {
        const addFurnitureInput: CreateFurnitureInput = {
            name: 'ソファ',
            gridX: 1,
            gridY: 1,
            gridW: 2,
            gridH: 1,
        };

        const addedFurniture: Furniture = {
            id: 'furniture-1',
            roomId: 'room-1',
            name: 'ソファ',
            gridX: 1,
            gridY: 1,
            gridW: 2,
            gridH: 1,
            createdAt: new Date('2024-01-02'),
            updatedAt: new Date('2024-01-02'),
        };

        it('calls_usecase_with_userId_roomId_and_input', async () => {
            // Arrange
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
            });
            const mockUseCase = { execute: jest.fn().mockResolvedValue(addedFurniture) };
            const options = buildAddFurnitureMutationOptions(queryClient, 'user-1', mockUseCase);

            // Act
            await options.mutationFn!({ roomId: 'room-1', input: addFurnitureInput });

            // Assert
            expect(mockUseCase.execute).toHaveBeenCalledWith('user-1', 'room-1', addFurnitureInput);
        });

        it('updates_room_furniture_optimistically_when_adding_furniture', async () => {
            // Arrange
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
            });
            const mockUseCase = { execute: jest.fn().mockResolvedValue(addedFurniture) };
            queryClient.setQueryData<FloorPlan>(['floorPlan', 'user-1'], mockFloorPlan);

            // Act
            const options = buildAddFurnitureMutationOptions(queryClient, 'user-1', mockUseCase);
            await options.onMutate!({ roomId: 'room-1', input: addFurnitureInput });

            // Assert
            const optimistic = queryClient.getQueryData<FloorPlan>(['floorPlan', 'user-1']);
            expect(optimistic?.rooms[0]?.furniture).toHaveLength(1);
            expect(optimistic?.rooms[0]?.furniture[0]?.name).toBe('ソファ');
        });

        it('rolls_back_furniture_cache_when_mutation_fails', async () => {
            // Arrange
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
            });
            const mockUseCase = { execute: jest.fn().mockRejectedValue(new Error('network error')) };
            queryClient.setQueryData<FloorPlan>(['floorPlan', 'user-1'], mockFloorPlan);
            const options = buildAddFurnitureMutationOptions(queryClient, 'user-1', mockUseCase);
            const variables = { roomId: 'room-1', input: addFurnitureInput };

            // Act
            const context = await options.onMutate!(variables);
            options.onError!(new Error('network error'), variables, context);

            // Assert
            const afterRollback = queryClient.getQueryData<FloorPlan>(['floorPlan', 'user-1']);
            expect(afterRollback).toEqual(mockFloorPlan);
            expect(afterRollback?.rooms[0]?.furniture).toHaveLength(0);
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
            queryClient.setQueryData<FloorPlan>(['floorPlan', 'user-1'], mockFloorPlan);

            const options = buildAddRoomMutationOptions(queryClient, 'user-1', mockAddRoomUseCase);
            const context = await options.onMutate!(addRoomInput);

            const afterOptimistic = queryClient.getQueryData<FloorPlan>(['floorPlan', 'user-1']);
            expect(afterOptimistic?.rooms).toHaveLength(2);

            options.onError!(new Error('network error'), addRoomInput, context);

            const afterRollback = queryClient.getQueryData<FloorPlan>(['floorPlan', 'user-1']);
            expect(afterRollback).toEqual(mockFloorPlan);
            expect(afterRollback?.rooms).toHaveLength(1);
        });
    });

    describe('正常系: 家具追加時にユースケースを実行しキャッシュを再取得する', () => {
        it('executes_use_case_with_user_and_room_id_and_invalidates_cache_on_settle', async () => {
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
            });
            const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
            const addedFurniture: Furniture = {
                id: 'furniture-1',
                roomId: 'room-1',
                name: '本棚',
                gridX: 0,
                gridY: 0,
                gridW: 1,
                gridH: 1,
                createdAt: new Date('2024-01-03'),
                updatedAt: new Date('2024-01-03'),
            };
            const mockAddFurnitureUseCase = {
                execute: jest.fn().mockResolvedValue(addedFurniture),
            };
            const input: CreateFurnitureInput = {
                name: '本棚',
                gridX: 0,
                gridY: 0,
                gridW: 1,
                gridH: 1,
            };

            const options = buildAddFurnitureMutationOptions(
                queryClient,
                'user-1',
                mockAddFurnitureUseCase,
            );
            const result = await (options.mutationFn as (v: {
                roomId: string;
                input: CreateFurnitureInput;
            }) => Promise<Furniture>)({ roomId: 'room-1', input });
            await options.onSettled!();

            expect(mockAddFurnitureUseCase.execute).toHaveBeenCalledWith('user-1', 'room-1', input);
            expect(result).toEqual(addedFurniture);
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['floorPlan', 'user-1'] });
        });
    });
});
