import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { FloorPlanRepository } from '../repositories/FloorPlanRepository';
import type { FloorPlan, CreateRoomInput, Room } from '../types';
import { AddRoomUseCase } from '../usecases/AddRoomUseCase';
import { DeleteRoomUseCase } from '../usecases/DeleteRoomUseCase';

type AddRoomExecutor = { execute: (userId: string, input: CreateRoomInput) => Promise<Room> };

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

export function useFloorPlan(userId: string, repository: FloorPlanRepository) {
    const queryClient = useQueryClient();

    const floorplan = useQuery(buildFloorPlanQuery(userId, repository));

    const addRoom = useMutation(
        buildAddRoomMutationOptions(queryClient, userId, new AddRoomUseCase(repository)),
    );

    const deleteRoom = useMutation({
        mutationFn: (roomId: string) => new DeleteRoomUseCase(repository).execute(userId, roomId),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['floorPlan', userId] });
        },
    });

    return { floorplan, addRoom, deleteRoom };
}
