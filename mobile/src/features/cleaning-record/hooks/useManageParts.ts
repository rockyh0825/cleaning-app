import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type { Part, CreatePartInput, UpdatePartInput } from "../types";
import { ManagePartUseCase } from "../usecases/ManagePartUseCase";
import type { CleaningRecordRepository } from "../repositories/CleaningRecordRepository";

type ManagePartExecutor = {
  addPart: (userId: string, input: CreatePartInput) => Promise<Part>;
  updatePart: (
    userId: string,
    partId: string,
    input: UpdatePartInput,
  ) => Promise<Part>;
  deletePart: (userId: string, partId: string) => Promise<void>;
};

export type UpdatePartVariables = {
  partId: string;
  input: UpdatePartInput;
};

export function buildAddPartMutationOptions(
  queryClient: QueryClient,
  userId: string,
  useCase: ManagePartExecutor,
) {
  return {
    mutationFn: (input: CreatePartInput) => useCase.addPart(userId, input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["parts"] });
    },
  };
}

export function buildUpdatePartMutationOptions(
  queryClient: QueryClient,
  userId: string,
  useCase: ManagePartExecutor,
) {
  return {
    mutationFn: ({ partId, input }: UpdatePartVariables) =>
      useCase.updatePart(userId, partId, input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["parts"] });
    },
  };
}

export function buildDeletePartMutationOptions(
  queryClient: QueryClient,
  userId: string,
  useCase: ManagePartExecutor,
) {
  return {
    mutationFn: (partId: string) => useCase.deletePart(userId, partId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["parts"] });
    },
  };
}

/**
 * パーツ（家事する場所）の追加・更新・削除を行うフック。
 * いずれの mutation も完了後に parts クエリを invalidate して一覧へ反映する。
 */
export function useManageParts(
  userId: string,
  repository: CleaningRecordRepository,
) {
  const queryClient = useQueryClient();
  const useCase = new ManagePartUseCase(repository);

  const add = useMutation(
    buildAddPartMutationOptions(queryClient, userId, useCase),
  );
  const update = useMutation(
    buildUpdatePartMutationOptions(queryClient, userId, useCase),
  );
  const remove = useMutation(
    buildDeletePartMutationOptions(queryClient, userId, useCase),
  );

  return {
    addPart: add.mutate,
    updatePart: update.mutate,
    deletePart: remove.mutate,
    isPending: add.isPending || update.isPending || remove.isPending,
    error: add.error ?? update.error ?? remove.error,
  };
}
