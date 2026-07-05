import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type { CleaningRecord, CreateRecordInput } from "../types";
import { LogCleaningUseCase } from "../usecases/LogCleaningUseCase";
import type { CleaningRecordRepository } from "../repositories/CleaningRecordRepository";

type LogCleaningExecutor = {
  execute: (
    userId: string,
    input: CreateRecordInput,
  ) => Promise<CleaningRecord[]>;
};

export function buildLogCleaningMutationOptions(
  queryClient: QueryClient,
  userId: string,
  useCase: LogCleaningExecutor,
) {
  return {
    mutationFn: (input: CreateRecordInput) => useCase.execute(userId, input),
    onMutate: async (input: CreateRecordInput) => {
      await queryClient.cancelQueries({
        queryKey: ["cleaning-records", { userId }],
      });

      const previous = queryClient.getQueryData<CleaningRecord[]>([
        "cleaning-records",
        { userId },
      ]);

      const optimisticRecords: CleaningRecord[] = input.partIds.map(
        (partId, index) => ({
          id: `optimistic-${Date.now()}-${index}`,
          partId,
          cleanedAt: input.cleanedAt ?? new Date(),
          note: input.note ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      );

      queryClient.setQueryData<CleaningRecord[]>(
        ["cleaning-records", { userId }],
        (old) => [...(old ?? []), ...optimisticRecords],
      );

      return { previous };
    },
    onError: (
      _err: unknown,
      _input: CreateRecordInput,
      context: { previous: CleaningRecord[] | undefined } | undefined,
    ) => {
      queryClient.setQueryData<CleaningRecord[]>(
        ["cleaning-records", { userId }],
        context?.previous,
      );
    },
    onSettled: (
      _data: CleaningRecord[] | undefined,
      _error: unknown,
      _input: CreateRecordInput,
      _context: unknown,
    ) => {
      queryClient.invalidateQueries({
        queryKey: ["cleaning-records", { userId }],
      });
      queryClient.invalidateQueries({ queryKey: ["parts"] });
    },
  };
}

export function useLogCleaning(
  userId: string,
  repository: CleaningRecordRepository,
) {
  const queryClient = useQueryClient();
  const useCase = new LogCleaningUseCase(repository);

  const { mutate, isPending, error } = useMutation(
    buildLogCleaningMutationOptions(queryClient, userId, useCase),
  );

  return { mutate, isPending, error };
}
