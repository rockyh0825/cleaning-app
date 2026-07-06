import { QueryClient } from '@tanstack/react-query';
import type { FloorPlan, Room, CreateRoomInput, CreateFurnitureInput, Furniture } from '../../types';
import {
    buildFloorPlanQuery,
    buildAddRoomMutationOptions,
    buildAddFurnitureMutationOptions,
    buildUpdateRoomMutationOptions,
    buildUpdateFurnitureMutationOptions,
    buildDeleteFurnitureMutationOptions,
    buildDeleteRoomMutationOptions,
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


    describe('正常系: 部屋更新時にキャッシュが楽観的更新される', () => {
        const secondRoom: Room = {
            id: 'room-2',
            name: 'キッチン',
            type: 'KITCHEN',
            gridX: 10,
            gridY: 10,
            gridW: 4,
            gridH: 3,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
        };
        const twoRoomFloorPlan: FloorPlan = {
            rooms: [
                { ...mockRoom, furniture: [] },
                { ...secondRoom, furniture: [] },
            ],
        };

        it('calls_usecase_with_userId_roomId_and_input', async () => {
            // Arrange
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
            });
            const mockUseCase = { execute: jest.fn().mockResolvedValue(mockRoom) };
            const options = buildUpdateRoomMutationOptions(queryClient, 'user-1', mockUseCase);

            // Act
            await options.mutationFn!({ roomId: 'room-1', input: { gridX: 3, gridY: 2 } });

            // Assert
            expect(mockUseCase.execute).toHaveBeenCalledWith('user-1', 'room-1', {
                gridX: 3,
                gridY: 2,
            });
        });

        it('updates_target_room_coordinates_optimistically_without_touching_others', async () => {
            // Arrange
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
            });
            const mockUseCase = { execute: jest.fn().mockResolvedValue(mockRoom) };
            queryClient.setQueryData<FloorPlan>(['floorPlan', 'user-1'], twoRoomFloorPlan);

            // Act
            const options = buildUpdateRoomMutationOptions(queryClient, 'user-1', mockUseCase);
            await options.onMutate!({ roomId: 'room-1', input: { gridX: 3, gridY: 2, gridW: 7, gridH: 5 } });

            // Assert
            const optimistic = queryClient.getQueryData<FloorPlan>(['floorPlan', 'user-1']);
            const updated = optimistic?.rooms.find((r) => r.id === 'room-1');
            expect(updated?.gridX).toBe(3);
            expect(updated?.gridY).toBe(2);
            expect(updated?.gridW).toBe(7);
            expect(updated?.gridH).toBe(5);
            const untouched = optimistic?.rooms.find((r) => r.id === 'room-2');
            expect(untouched).toEqual(twoRoomFloorPlan.rooms[1]);
        });

        it('keeps_room_furniture_when_updating_room_optimistically', async () => {
            // Arrange
            const furniture: Furniture = {
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
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
            });
            const mockUseCase = { execute: jest.fn().mockResolvedValue(mockRoom) };
            queryClient.setQueryData<FloorPlan>(['floorPlan', 'user-1'], {
                rooms: [{ ...mockRoom, furniture: [furniture] }],
            });

            // Act
            const options = buildUpdateRoomMutationOptions(queryClient, 'user-1', mockUseCase);
            await options.onMutate!({ roomId: 'room-1', input: { gridX: 5 } });

            // Assert
            const optimistic = queryClient.getQueryData<FloorPlan>(['floorPlan', 'user-1']);
            expect(optimistic?.rooms[0]?.furniture).toEqual([furniture]);
            expect(optimistic?.rooms[0]?.gridX).toBe(5);
        });

        it('updates_only_room_name_optimistically_and_keeps_coordinates', async () => {
            // Arrange
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
            });
            const mockUseCase = { execute: jest.fn().mockResolvedValue(mockRoom) };
            queryClient.setQueryData<FloorPlan>(['floorPlan', 'user-1'], twoRoomFloorPlan);

            // Act
            const options = buildUpdateRoomMutationOptions(queryClient, 'user-1', mockUseCase);
            await options.onMutate!({ roomId: 'room-1', input: { name: '和室' } });

            // Assert
            const optimistic = queryClient.getQueryData<FloorPlan>(['floorPlan', 'user-1']);
            const updated = optimistic?.rooms.find((r) => r.id === 'room-1');
            expect(updated).toEqual({ ...twoRoomFloorPlan.rooms[0], name: '和室' });
        });

        it('rolls_back_room_name_when_rename_fails', async () => {
            // Arrange
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
            });
            const mockUseCase = { execute: jest.fn().mockRejectedValue(new Error('network error')) };
            queryClient.setQueryData<FloorPlan>(['floorPlan', 'user-1'], twoRoomFloorPlan);
            const options = buildUpdateRoomMutationOptions(queryClient, 'user-1', mockUseCase);
            const variables = { roomId: 'room-1', input: { name: '和室' } };

            // Act
            const context = await options.onMutate!(variables);
            options.onError!(new Error('network error'), variables, context);

            // Assert
            const afterRollback = queryClient.getQueryData<FloorPlan>(['floorPlan', 'user-1']);
            expect(afterRollback).toEqual(twoRoomFloorPlan);
            expect(afterRollback?.rooms.find((r) => r.id === 'room-1')?.name).toBe('リビング');
        });

        it('rolls_back_to_previous_coordinates_when_update_fails', async () => {
            // Arrange
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
            });
            const mockUseCase = { execute: jest.fn().mockRejectedValue(new Error('network error')) };
            queryClient.setQueryData<FloorPlan>(['floorPlan', 'user-1'], twoRoomFloorPlan);
            const options = buildUpdateRoomMutationOptions(queryClient, 'user-1', mockUseCase);
            const variables = { roomId: 'room-1', input: { gridX: 9 } };

            // Act
            const context = await options.onMutate!(variables);
            options.onError!(new Error('network error'), variables, context);

            // Assert
            const afterRollback = queryClient.getQueryData<FloorPlan>(['floorPlan', 'user-1']);
            expect(afterRollback).toEqual(twoRoomFloorPlan);
            expect(afterRollback?.rooms[0]?.gridX).toBe(0);
        });
    });


    describe('正常系: 家具更新時にキャッシュが楽観的更新される', () => {
        const sofa: Furniture = {
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
        const table: Furniture = {
            id: 'furniture-2',
            roomId: 'room-1',
            name: 'テーブル',
            gridX: 4,
            gridY: 2,
            gridW: 1,
            gridH: 1,
            createdAt: new Date('2024-01-02'),
            updatedAt: new Date('2024-01-02'),
        };
        const furnishedFloorPlan: FloorPlan = {
            rooms: [{ ...mockRoom, furniture: [sofa, table] }],
        };

        it('calls_usecase_with_userId_furnitureId_and_input', async () => {
            // Arrange
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
            });
            const mockUseCase = { execute: jest.fn().mockResolvedValue(sofa) };
            const options = buildUpdateFurnitureMutationOptions(queryClient, 'user-1', mockUseCase);

            // Act
            await options.mutationFn!({ furnitureId: 'furniture-1', input: { gridX: 3, gridY: 2 } });

            // Assert
            expect(mockUseCase.execute).toHaveBeenCalledWith('user-1', 'furniture-1', {
                gridX: 3,
                gridY: 2,
            });
        });

        it('updates_target_furniture_coordinates_optimistically_without_touching_others', async () => {
            // Arrange
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
            });
            const mockUseCase = { execute: jest.fn().mockResolvedValue(sofa) };
            queryClient.setQueryData<FloorPlan>(['floorPlan', 'user-1'], furnishedFloorPlan);

            // Act
            const options = buildUpdateFurnitureMutationOptions(queryClient, 'user-1', mockUseCase);
            await options.onMutate!({ furnitureId: 'furniture-1', input: { gridX: 3, gridY: 2 } });

            // Assert
            const optimistic = queryClient.getQueryData<FloorPlan>(['floorPlan', 'user-1']);
            const updated = optimistic?.rooms[0]?.furniture.find((f) => f.id === 'furniture-1');
            expect(updated?.gridX).toBe(3);
            expect(updated?.gridY).toBe(2);
            const untouched = optimistic?.rooms[0]?.furniture.find((f) => f.id === 'furniture-2');
            expect(untouched).toEqual(table);
        });

        it('updates_only_furniture_name_optimistically_and_keeps_coordinates', async () => {
            // Arrange
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
            });
            const mockUseCase = { execute: jest.fn().mockResolvedValue(sofa) };
            queryClient.setQueryData<FloorPlan>(['floorPlan', 'user-1'], furnishedFloorPlan);

            // Act
            const options = buildUpdateFurnitureMutationOptions(queryClient, 'user-1', mockUseCase);
            await options.onMutate!({ furnitureId: 'furniture-1', input: { name: 'ベッド' } });

            // Assert
            const optimistic = queryClient.getQueryData<FloorPlan>(['floorPlan', 'user-1']);
            const updated = optimistic?.rooms[0]?.furniture.find((f) => f.id === 'furniture-1');
            expect(updated).toEqual({ ...sofa, name: 'ベッド' });
        });

        it('rolls_back_furniture_name_when_rename_fails', async () => {
            // Arrange
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
            });
            const mockUseCase = { execute: jest.fn().mockRejectedValue(new Error('network error')) };
            queryClient.setQueryData<FloorPlan>(['floorPlan', 'user-1'], furnishedFloorPlan);
            const options = buildUpdateFurnitureMutationOptions(queryClient, 'user-1', mockUseCase);
            const variables = { furnitureId: 'furniture-1', input: { name: 'ベッド' } };

            // Act
            const context = await options.onMutate!(variables);
            options.onError!(new Error('network error'), variables, context);

            // Assert
            const afterRollback = queryClient.getQueryData<FloorPlan>(['floorPlan', 'user-1']);
            expect(afterRollback).toEqual(furnishedFloorPlan);
            expect(
                afterRollback?.rooms[0]?.furniture.find((f) => f.id === 'furniture-1')?.name,
            ).toBe('ソファ');
        });

        it('rolls_back_furniture_coordinates_when_update_fails', async () => {
            // Arrange
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
            });
            const mockUseCase = { execute: jest.fn().mockRejectedValue(new Error('network error')) };
            queryClient.setQueryData<FloorPlan>(['floorPlan', 'user-1'], furnishedFloorPlan);
            const options = buildUpdateFurnitureMutationOptions(queryClient, 'user-1', mockUseCase);
            const variables = { furnitureId: 'furniture-1', input: { gridX: 9 } };

            // Act
            const context = await options.onMutate!(variables);
            options.onError!(new Error('network error'), variables, context);

            // Assert
            const afterRollback = queryClient.getQueryData<FloorPlan>(['floorPlan', 'user-1']);
            expect(afterRollback).toEqual(furnishedFloorPlan);
        });
    });


    describe('正常系: 家具削除時にキャッシュが楽観的更新される', () => {
        const sofa: Furniture = {
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
        const table: Furniture = {
            id: 'furniture-2',
            roomId: 'room-1',
            name: 'テーブル',
            gridX: 4,
            gridY: 2,
            gridW: 1,
            gridH: 1,
            createdAt: new Date('2024-01-02'),
            updatedAt: new Date('2024-01-02'),
        };
        const secondRoom: Room = {
            id: 'room-2',
            name: 'キッチン',
            type: 'KITCHEN',
            gridX: 10,
            gridY: 10,
            gridW: 4,
            gridH: 3,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
        };
        const furnishedFloorPlan: FloorPlan = {
            rooms: [
                { ...mockRoom, furniture: [sofa, table] },
                { ...secondRoom, furniture: [] },
            ],
        };

        it('calls_usecase_with_userId_and_furnitureId', async () => {
            // Arrange
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
            });
            const mockUseCase = { execute: jest.fn().mockResolvedValue(undefined) };
            const options = buildDeleteFurnitureMutationOptions(queryClient, 'user-1', mockUseCase);

            // Act
            await options.mutationFn!('furniture-1');

            // Assert
            expect(mockUseCase.execute).toHaveBeenCalledWith('user-1', 'furniture-1');
        });

        it('removes_target_furniture_from_cache_optimistically_without_touching_others', async () => {
            // Arrange
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
            });
            const mockUseCase = { execute: jest.fn().mockResolvedValue(undefined) };
            queryClient.setQueryData<FloorPlan>(['floorPlan', 'user-1'], furnishedFloorPlan);

            // Act
            const options = buildDeleteFurnitureMutationOptions(queryClient, 'user-1', mockUseCase);
            await options.onMutate!('furniture-1');

            // Assert
            const optimistic = queryClient.getQueryData<FloorPlan>(['floorPlan', 'user-1']);
            expect(optimistic?.rooms[0]?.furniture).toEqual([table]);
            expect(optimistic?.rooms[1]).toEqual(furnishedFloorPlan.rooms[1]);
        });

        it('rolls_back_deleted_furniture_when_mutation_fails', async () => {
            // Arrange
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
            });
            const mockUseCase = { execute: jest.fn().mockRejectedValue(new Error('network error')) };
            queryClient.setQueryData<FloorPlan>(['floorPlan', 'user-1'], furnishedFloorPlan);
            const options = buildDeleteFurnitureMutationOptions(queryClient, 'user-1', mockUseCase);

            // Act
            const context = await options.onMutate!('furniture-1');
            options.onError!(new Error('network error'), 'furniture-1', context);

            // Assert
            const afterRollback = queryClient.getQueryData<FloorPlan>(['floorPlan', 'user-1']);
            expect(afterRollback).toEqual(furnishedFloorPlan);
        });

        it('invalidates_floor_plan_query_on_settle', async () => {
            // Arrange
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
            });
            const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
            const mockUseCase = { execute: jest.fn().mockResolvedValue(undefined) };
            const options = buildDeleteFurnitureMutationOptions(queryClient, 'user-1', mockUseCase);

            // Act
            await options.onSettled!();

            // Assert
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['floorPlan', 'user-1'] });
        });
    });

    describe('正常系: 部屋削除時にキャッシュが楽観的更新される', () => {
        const sofa: Furniture = {
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
        const secondRoom: Room = {
            id: 'room-2',
            name: 'キッチン',
            type: 'KITCHEN',
            gridX: 10,
            gridY: 10,
            gridW: 4,
            gridH: 3,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
        };
        const twoRoomFloorPlan: FloorPlan = {
            rooms: [
                { ...mockRoom, furniture: [sofa] },
                { ...secondRoom, furniture: [] },
            ],
        };

        it('calls_usecase_with_userId_and_roomId', async () => {
            // Arrange
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
            });
            const mockUseCase = { execute: jest.fn().mockResolvedValue(undefined) };
            const options = buildDeleteRoomMutationOptions(queryClient, 'user-1', mockUseCase);

            // Act
            await options.mutationFn!('room-1');

            // Assert
            expect(mockUseCase.execute).toHaveBeenCalledWith('user-1', 'room-1');
        });

        it('removes_target_room_from_cache_optimistically_without_touching_others', async () => {
            // Arrange
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
            });
            const mockUseCase = { execute: jest.fn().mockResolvedValue(undefined) };
            queryClient.setQueryData<FloorPlan>(['floorPlan', 'user-1'], twoRoomFloorPlan);

            // Act
            const options = buildDeleteRoomMutationOptions(queryClient, 'user-1', mockUseCase);
            await options.onMutate!('room-1');

            // Assert
            const optimistic = queryClient.getQueryData<FloorPlan>(['floorPlan', 'user-1']);
            expect(optimistic?.rooms).toHaveLength(1);
            expect(optimistic?.rooms[0]).toEqual(twoRoomFloorPlan.rooms[1]);
        });

        it('rolls_back_deleted_room_when_mutation_fails', async () => {
            // Arrange
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
            });
            const mockUseCase = { execute: jest.fn().mockRejectedValue(new Error('network error')) };
            queryClient.setQueryData<FloorPlan>(['floorPlan', 'user-1'], twoRoomFloorPlan);
            const options = buildDeleteRoomMutationOptions(queryClient, 'user-1', mockUseCase);

            // Act
            const context = await options.onMutate!('room-1');
            options.onError!(new Error('network error'), 'room-1', context);

            // Assert
            const afterRollback = queryClient.getQueryData<FloorPlan>(['floorPlan', 'user-1']);
            expect(afterRollback).toEqual(twoRoomFloorPlan);
            expect(afterRollback?.rooms).toHaveLength(2);
        });

        it('invalidates_floor_plan_query_on_settle', async () => {
            // Arrange
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
            });
            const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
            const mockUseCase = { execute: jest.fn().mockResolvedValue(undefined) };
            const options = buildDeleteRoomMutationOptions(queryClient, 'user-1', mockUseCase);

            // Act
            await options.onSettled!();

            // Assert
            expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['floorPlan', 'user-1'] });
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

    describe('#74: userId 未解決時はクエリを実行しない', () => {
        it('disables_query_when_userId_is_empty', () => {
            const query = buildFloorPlanQuery('', mockRepository as never);

            expect(query.enabled).toBe(false);
        });

        it('enables_query_when_userId_is_resolved', () => {
            const query = buildFloorPlanQuery('u1', mockRepository as never);

            expect(query.enabled).toBe(true);
        });
    });

    describe('#76: 同一ミリ秒の連続追加でも楽観的IDが衝突しない', () => {
        it('generates_unique_optimistic_ids_when_adding_rooms_in_same_millisecond', async () => {
            // Arrange
            const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
            });
            const mockUseCase = { execute: jest.fn().mockResolvedValue(addedRoom) };
            queryClient.setQueryData<FloorPlan>(['floorPlan', 'user-1'], mockFloorPlan);
            const options = buildAddRoomMutationOptions(queryClient, 'user-1', mockUseCase);

            // Act
            await options.onMutate!(addRoomInput);
            await options.onMutate!(addRoomInput);

            // Assert
            const optimistic = queryClient.getQueryData<FloorPlan>(['floorPlan', 'user-1']);
            const ids = optimistic!.rooms.map((room) => room.id);
            expect(new Set(ids).size).toBe(ids.length);

            nowSpy.mockRestore();
        });

        it('generates_unique_optimistic_ids_when_adding_furniture_in_same_millisecond', async () => {
            // Arrange
            const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
            const addFurnitureInput: CreateFurnitureInput = {
                name: 'ソファ',
                gridX: 1,
                gridY: 1,
                gridW: 2,
                gridH: 1,
            };
            const queryClient = new QueryClient({
                defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
            });
            const mockUseCase = { execute: jest.fn().mockResolvedValue(mockRoom) };
            queryClient.setQueryData<FloorPlan>(['floorPlan', 'user-1'], mockFloorPlan);
            const options = buildAddFurnitureMutationOptions(queryClient, 'user-1', mockUseCase);

            // Act
            await options.onMutate!({ roomId: 'room-1', input: addFurnitureInput });
            await options.onMutate!({ roomId: 'room-1', input: addFurnitureInput });

            // Assert
            const optimistic = queryClient.getQueryData<FloorPlan>(['floorPlan', 'user-1']);
            const ids = optimistic!.rooms[0]!.furniture.map((furniture) => furniture.id);
            expect(ids).toHaveLength(2);
            expect(new Set(ids).size).toBe(ids.length);

            nowSpy.mockRestore();
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
