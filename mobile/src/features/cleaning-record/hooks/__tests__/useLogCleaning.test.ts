import { QueryClient } from "@tanstack/react-query";
import type { CleaningRecord, CreateRecordInput } from "../../types";
import { buildLogCleaningMutationOptions } from "../useLogCleaning";

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
  cleanedAt: new Date("2024-01-01"),
  note: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

const mockUseCase = {
  execute: jest.fn(),
};

const createRecordInput: CreateRecordInput = {
  partIds: ["part-1", "part-2"],
};

describe("useLogCleaning", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("正常系: mutate 後に cleaning-records クエリが invalidate される", () => {
    it("invalidates_cleaning_records_query_after_logging_cleaning", async () => {
      mockUseCase.execute.mockResolvedValue([mockRecord1, mockRecord2]);
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      const options = buildLogCleaningMutationOptions(
        queryClient,
        "user-1",
        mockUseCase as never,
      );
      await options.mutationFn({ partIds: ["part-1", "part-2"] });
      await options.onSettled!(
        [mockRecord1, mockRecord2],
        null,
        { partIds: ["part-1", "part-2"] },
        undefined,
      );

      expect(mockUseCase.execute).toHaveBeenCalledWith("user-1", {
        partIds: ["part-1", "part-2"],
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ["cleaning-records", { userId: "user-1" }],
      });
    });
  });

  describe("正常系: mutate 後に parts クエリが invalidate される", () => {
    it("invalidates_parts_query_after_logging_cleaning", async () => {
      // Arrange
      mockUseCase.execute.mockResolvedValue([mockRecord1]);
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      // Act
      const options = buildLogCleaningMutationOptions(
        queryClient,
        "user-1",
        mockUseCase as never,
      );
      await options.mutationFn({ partIds: ["part-1"] });
      await options.onSettled!(
        [mockRecord1],
        null,
        { partIds: ["part-1"] },
        undefined,
      );

      // Assert: 最終掃除日時（lastCleanedAt）を反映するため parts も invalidate する
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["parts"] });
    });
  });

  describe("正常系: 楽観的更新が即座にキャッシュに反映される", () => {
    it("applies_optimistic_records_to_cache_before_mutation_completes", async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
      queryClient.setQueryData<CleaningRecord[]>(
        ["cleaning-records", { userId: "user-1" }],
        [],
      );

      const options = buildLogCleaningMutationOptions(
        queryClient,
        "user-1",
        mockUseCase as never,
      );
      await options.onMutate!({ partIds: ["part-1", "part-2"] });

      const optimistic = queryClient.getQueryData<CleaningRecord[]>([
        "cleaning-records",
        { userId: "user-1" },
      ]);
      expect(optimistic).toHaveLength(2);
      expect(optimistic![0]!.partId).toBe("part-1");
      expect(optimistic![1]!.partId).toBe("part-2");
      expect(optimistic![0]!.id).toMatch(/^optimistic-/);
    });
  });

  describe("異常系: 記録失敗時に楽観的更新がロールバックされる", () => {
    it("rolls_back_optimistic_update_when_mutation_fails", async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
      const existingRecords: CleaningRecord[] = [mockRecord1];
      queryClient.setQueryData<CleaningRecord[]>(
        ["cleaning-records", { userId: "user-1" }],
        existingRecords,
      );

      const options = buildLogCleaningMutationOptions(
        queryClient,
        "user-1",
        mockUseCase as never,
      );
      const context = await options.onMutate!({ partIds: ["part-2"] });

      // 楽観的更新後: 2件
      const afterOptimistic = queryClient.getQueryData<CleaningRecord[]>([
        "cleaning-records",
        { userId: "user-1" },
      ]);
      expect(afterOptimistic).toHaveLength(2);

      // 失敗時にロールバック
      options.onError!(
        new Error("network error"),
        { partIds: ["part-2"] },
        context,
      );

      const afterRollback = queryClient.getQueryData<CleaningRecord[]>([
        "cleaning-records",
        { userId: "user-1" },
      ]);
      expect(afterRollback).toEqual(existingRecords);
      expect(afterRollback).toHaveLength(1);
    });
  });
});
