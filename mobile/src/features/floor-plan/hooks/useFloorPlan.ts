import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { FloorPlanRepository } from '../repositories/FloorPlanRepository';
import type { FloorPlan, CreateRoomInput, CreateFurnitureInput, Furniture, Room } from '../types';
import { AddRoomUseCase } from '../usecases/AddRoomUseCase';
import { AddFurnitureUseCase } from '../usecases/AddFurnitureUseCase';
import { DeleteRoomUseCase } from '../usecases/DeleteRoomUseCase';

type AddRoomExecutor = { execute: (userId: string, input: CreateRoomInput) => Promise<Room> };
type AddFurnitureExecutor = {
    execute: (userId: string, roomId: string, input: CreateFurnitureInput) => Promise<Furniture>;
};
type AddFurnitureVariables = { roomId: string; input: CreateFurnitureInput };

export function buildFloorPlanQuery(userId: string, repository: Pick<FloorPlanRepository, 'getFloorPlan'>) {
    return {
        queryKey: ['floorPlan', userId] as const,
        queryFn: () => repository.getFloorPlan(userId),
    };
}

export function buildAddRoomMutationOptions(
    queryClient: QueryClient,
    userId: string,
    useCase: AddRoomExecutor,
) {
    return {
        mutationFn: (input: CreateRoomInput) => useCase.execute(userId, input),
        onMutate: async (input: CreateRoomInput) => {
            await queryClient.cancelQueries({ queryKey: ['floorPlan', userId] });
            const previous = queryClient.getQueryData<FloorPlan>(['floorPlan', userId]);
            queryClient.setQueryData<FloorPlan>(['floorPlan', userId], (old) => ({
                rooms: [
                    ...(old?.rooms ?? []),
                    {
                        id: `optimistic-${Date.now()}`,
                        name: input.name,
                        type: input.type,
                        gridX: input.gridX,
                        gridY: input.gridY,
                        gridW: input.gridW,
                        gridH: input.gridH,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        furniture: [],
                    },
                ],
            }));
            return { previous };
        },
        onError: (
            _err: unknown,
            _input: CreateRoomInput,
            context: { previous: FloorPlan | undefined } | undefined,
        ) => {
            queryClient.setQueryData<FloorPlan>(['floorPlan', userId], context?.previous);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['floorPlan', userId] });
        },
    };
}

export function buildAddFurnitureMutationOptions(
    queryClient: QueryClient,
    userId: string,
    useCase: AddFurnitureExecutor,
) {
    return {
        mutationFn: ({ roomId, input }: AddFurnitureVariables) =>
            useCase.execute(userId, roomId, input),
        onMutate: async ({ roomId, input }: AddFurnitureVariables) => {
            await queryClient.cancelQueries({ queryKey: ['floorPlan', userId] });
            const previous = queryClient.getQueryData<FloorPlan>(['floorPlan', userId]);
            queryClient.setQueryData<FloorPlan>(['floorPlan', userId], (old) => ({
                rooms: (old?.rooms ?? []).map((room) =>
                    room.id === roomId
                        ? {
                              ...room,
                              furniture: [
                                  ...room.furniture,
                                  {
                                      id: `optimistic-${Date.now()}`,
                                      roomId,
                                      name: input.name,
                                      presetKey: input.presetKey,
                                      gridX: input.gridX,
                                      gridY: input.gridY,
                                      gridW: input.gridW,
                                      gridH: input.gridH,
                                      createdAt: new Date(),
                                      updatedAt: new Date(),
                                  },
                              ],
                          }
                        : room,
                ),
            }));
            return { previous };
        },
        onError: (
            _err: unknown,
            _variables: AddFurnitureVariables,
            context: { previous: FloorPlan | undefined } | undefined,
        ) => {
            queryClient.setQueryData<FloorPlan>(['floorPlan', userId], context?.previous);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['floorPlan', userId] });
        },
    };
}

export function useFloorPlan(userId: string, repository: FloorPlanRepository) {
    const queryClient = useQueryClient();

    const floorPlan = useQuery(buildFloorPlanQuery(userId, repository));

    const addRoom = useMutation(
        buildAddRoomMutationOptions(queryClient, userId, new AddRoomUseCase(repository)),
    );

    const addFurniture = useMutation(
        buildAddFurnitureMutationOptions(queryClient, userId, new AddFurnitureUseCase(repository)),
    );

    const deleteRoom = useMutation({
        mutationFn: (roomId: string) => new DeleteRoomUseCase(repository).execute(userId, roomId),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['floorPlan', userId] });
        },
    });

    return { floorPlan, addRoom, addFurniture, deleteRoom };
}
