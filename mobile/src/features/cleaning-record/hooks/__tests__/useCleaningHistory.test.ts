import { QueryClient, QueryObserver } from "@tanstack/react-query";
import type {
  CleaningRecord,
  ListRecordsParams,
  UpdateRecordInput,
} from "../../types";
import {
  buildCleaningHistoryQuery,
  buildDeleteRecordMutationOptions,
  buildUpdateRecordMutationOptions,
} from "../useCleaningHistory";

const mockRecord1: CleaningRecord = {
  id: "record-1",
  partId: "part-1",
  cleanedAt: new Date("2024-01-01"),
  note: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

const mockRecord2: CleaningRecord = {
  id: "record-2",
  partId: "part-2",
  cleanedAt: new Date("2024-01-02"),
  note: "メモ",
  createdAt: new Date("2024-01-02"),
  updatedAt: new Date("2024-01-02"),
};

const mockRepository = {
  createRecords: jest.fn(),
  listRecords: jest.fn(),
  updateRecord: jest.fn(),
  deleteRecord: jest.fn(),
  createPart: jest.fn(),
  updatePart: jest.fn(),
  deletePart: jest.fn(),
};

describe("useCleaningHistory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("正常系: 履歴リストを取得して返す", () => {
    it("returns_records_list_when_history_is_fetched", async () => {
      mockRepository.listRecords.mockResolvedValue([mockRecord1, mockRecord2]);
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });

      const query = buildCleaningHistoryQuery(
        "user-1",
        {},
        mockRepository as never,
      );
      const result = await queryClient.fetchQuery(query);

      expect(mockRepository.listRecords).toHaveBeenCalledWith("user-1", {});
      expect(result).toEqual([mockRecord1, mockRecord2]);
    });
  });

  describe("正常系: partId 指定時にフィルタリングパラメータが渡る", () => {
    it("passes_partId_filter_param_when_partId_is_specified", async () => {
      mockRepository.listRecords.mockResolvedValue([mockRecord1]);
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      const params: ListRecordsParams = { partId: "part-1" };

      const query = buildCleaningHistoryQuery(
        "user-1",
        params,
        mockRepository as never,
      );
      const result = await queryClient.fetchQuery(query);

      expect(mockRepository.listRecords).toHaveBeenCalledWith("user-1", {
        partId: "part-1",
      });
      expect(result).toEqual([mockRecord1]);
    });
  });

  describe("正常系: queryKey に userId と partId が含まれる", () => {
    it("includes_partId_in_queryKey_when_specified", () => {
      const params: ListRecordsParams = { partId: "part-1" };
      const query = buildCleaningHistoryQuery(
        "user-1",
        params,
        mockRepository as never,
      );

      expect(query.queryKey).toEqual([
        "cleaning-records",
        { userId: "user-1", partId: "part-1" },
      ]);
    });

    it("excludes_partId_from_queryKey_when_not_specified", () => {
      const query = buildCleaningHistoryQuery(
        "user-1",
        {},
        mockRepository as never,
      );

      expect(query.queryKey).toEqual([
        "cleaning-records",
        { userId: "user-1" },
      ]);
    });
  });

  describe("異常系: userId が未解決（空文字）のとき", () => {
    it("does_not_call_listRecords_when_userId_is_empty", async () => {
      // Arrange
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      const query = buildCleaningHistoryQuery("", {}, mockRepository as never);

      // Act: QueryObserver は enabled を尊重してフェッチを判断する
      const observer = new QueryObserver(queryClient, query);
      const unsubscribe = observer.subscribe(() => {});
      await new Promise((resolve) => setTimeout(resolve, 0));
      unsubscribe();

      // Assert
      expect(mockRepository.listRecords).not.toHaveBeenCalled();
    });

    it("calls_listRecords_when_userId_is_resolved", async () => {
      // Arrange
      mockRepository.listRecords.mockResolvedValue([mockRecord1]);
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      const query = buildCleaningHistoryQuery(
        "user-1",
        {},
        mockRepository as never,
      );

      // Act
      const observer = new QueryObserver(queryClient, query);
      const unsubscribe = observer.subscribe(() => {});
      await new Promise((resolve) => setTimeout(resolve, 0));
      unsubscribe();

      // Assert
      expect(mockRepository.listRecords).toHaveBeenCalledWith("user-1", {});
    });
  });

  describe("正常系: 記録削除後にクエリが invalidate される", () => {
    it("invalidates_cleaning_records_query_after_deleting_record", async () => {
      mockRepository.deleteRecord.mockResolvedValue(undefined);
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
      queryClient.setQueryData(
        ["cleaning-records", { userId: "user-1" }],
        [mockRecord1, mockRecord2],
      );
      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      const options = buildDeleteRecordMutationOptions(
        queryClient,
        "user-1",
        mockRepository as never,
      );
      await options.mutationFn("record-1");
      options.onSettled!();

      expect(mockRepository.deleteRecord).toHaveBeenCalledWith(
        "user-1",
        "record-1",
      );
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["cleaning-records", { userId: "user-1" }],
      });
    });

    it("invalidates_parts_query_after_deleting_record", async () => {
      // Arrange: 削除で lastCleanedAt が巻き戻るため parts 由来のデータも古くなる
      mockRepository.deleteRecord.mockResolvedValue(undefined);
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      // Act
      const options = buildDeleteRecordMutationOptions(
        queryClient,
        "user-1",
        mockRepository as never,
      );
      await options.mutationFn("record-1");
      options.onSettled!();

      // Assert: パーツ一覧・ヒートマップの掃除状態（['parts'] prefix）を最新化する
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["parts"] });
    });
  });

  describe("正常系: 記録更新後にクエリが invalidate される", () => {
    it("invalidates_cleaning_records_query_after_updating_record", async () => {
      const updatedRecord = { ...mockRecord1, note: "更新済み" };
      mockRepository.updateRecord.mockResolvedValue(updatedRecord);
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      const options = buildUpdateRecordMutationOptions(
        queryClient,
        "user-1",
        mockRepository as never,
      );
      await options.mutationFn({
        recordId: "record-1",
        input: { note: "更新済み" },
      });
      options.onSettled!();

      expect(mockRepository.updateRecord).toHaveBeenCalledWith(
        "user-1",
        "record-1",
        { note: "更新済み" },
      );
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["cleaning-records", { userId: "user-1" }],
      });
    });

    it("invalidates_parts_query_after_updating_record", async () => {
      // Arrange: cleanedAt の修正で lastCleanedAt が変わり得るため parts も無効化する
      mockRepository.updateRecord.mockResolvedValue(mockRecord1);
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      // Act
      const options = buildUpdateRecordMutationOptions(
        queryClient,
        "user-1",
        mockRepository as never,
      );
      await options.mutationFn({
        recordId: "record-1",
        input: { cleanedAt: new Date("2024-01-03") },
      });
      options.onSettled!();

      // Assert: パーツ一覧・ヒートマップの掃除状態（['parts'] prefix）を最新化する
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["parts"] });
    });
  });
});
