import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { FloorplanRepository } from '../repositories/FloorplanRepository';
import type { Floorplan, CreateRoomInput, Room } from '../types';
import { AddRoomUseCase } from '../usecases/AddRoomUseCase';
import { DeleteRoomUseCase } from '../usecases/DeleteRoomUseCase';

type AddRoomExecutor = { execute: (userId: string, input: CreateRoomInput) => Promise<Room> };

export function buildFloorplanQuery(userId: string, repository: Pick<FloorplanRepository, 'getFloorplan'>) {
    return {
        queryKey: ['floorplan', userId] as const,
        queryFn: () => repository.getFloorplan(userId),
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
            await queryClient.cancelQueries({ queryKey: ['floorplan', userId] });
            const previous = queryClient.getQueryData<Floorplan>(['floorplan', userId]);
            queryClient.setQueryData<Floorplan>(['floorplan', userId], (old) => ({
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
            context: { previous: Floorplan | undefined } | undefined,
        ) => {
            queryClient.setQueryData<Floorplan>(['floorplan', userId], context?.previous);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['floorplan', userId] });
        },
    };
}

export function useFloorplan(userId: string, repository: FloorplanRepository) {
    const queryClient = useQueryClient();

    const floorplan = useQuery(buildFloorplanQuery(userId, repository));

    const addRoom = useMutation(
        buildAddRoomMutationOptions(queryClient, userId, new AddRoomUseCase(repository)),
    );

    const deleteRoom = useMutation({
        mutationFn: (roomId: string) => new DeleteRoomUseCase(repository).execute(userId, roomId),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['floorplan', userId] });
        },
    });

    return { floorplan, addRoom, deleteRoom };
}
