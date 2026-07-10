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
      // 削除で lastCleanedAt が巻き戻るため、パーツ由来のデータ
      // （パーツ一覧・ヒートマップの掃除状態）も prefix で無効化する
      queryClient.invalidateQueries({ queryKey: ["parts"] });
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
      // cleanedAt の修正で lastCleanedAt が変わり得るため、パーツ由来のデータ
      // （パーツ一覧・ヒートマップの掃除状態）も prefix で無効化する
      queryClient.invalidateQueries({ queryKey: ["parts"] });
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
