import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type { CleaningRecordRepository } from "../repositories/CleaningRecordRepository";
import type {
  CleaningRecord,
  ListRecordsParams,
  UpdateRecordInput,
} from "../types";

type HistoryQueryKey = readonly [
  "cleaning-records",
  { userId: string; partId?: string },
];

type DeleteRecordRepository = Pick<CleaningRecordRepository, "deleteRecord">;
type UpdateRecordRepository = Pick<CleaningRecordRepository, "updateRecord">;

export function buildCleaningHistoryQuery(
  userId: string,
  params: ListRecordsParams,
  repository: Pick<CleaningRecordRepository, "listRecords">,
) {
  const keyParams: { userId: string; partId?: string } = { userId };
  if (params.partId !== undefined) {
    keyParams.partId = params.partId;
  }

  return {
    queryKey: ["cleaning-records", keyParams] as HistoryQueryKey,
    queryFn: () => repository.listRecords(userId, params),
    enabled: userId !== "",
  };
}

export function buildDeleteRecordMutationOptions(
  queryClient: QueryClient,
  userId: string,
  repository: DeleteRecordRepository,
) {
  return {
    mutationFn: (recordId: string) => repository.deleteRecord(userId, recordId),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["cleaning-records", { userId }],
      });
    },
  };
}

type UpdateRecordArgs = {
  recordId: string;
  input: UpdateRecordInput;
};

export function buildUpdateRecordMutationOptions(
  queryClient: QueryClient,
  userId: string,
  repository: UpdateRecordRepository,
) {
  return {
    mutationFn: ({ recordId, input }: UpdateRecordArgs) =>
      repository.updateRecord(userId, recordId, input),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["cleaning-records", { userId }],
      });
    },
  };
}

export function useCleaningHistory(
  userId: string,
  params: ListRecordsParams,
  repository: CleaningRecordRepository,
) {
  const queryClient = useQueryClient();

  const historyQuery = useQuery(
    buildCleaningHistoryQuery(userId, params, repository),
  );

  const deleteRecord = useMutation(
    buildDeleteRecordMutationOptions(queryClient, userId, repository),
  );

  const updateRecord = useMutation(
    buildUpdateRecordMutationOptions(queryClient, userId, repository),
  );

  return {
    records: historyQuery.data ?? ([] as CleaningRecord[]),
    isLoading: historyQuery.isLoading,
    error: historyQuery.error,
    deleteRecord,
    updateRecord,
  };
}
