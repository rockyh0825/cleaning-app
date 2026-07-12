import { QueryClient } from "@tanstack/react-query";
import type { Part } from "../../types";
import {
  buildAddPartMutationOptions,
  buildUpdatePartMutationOptions,
  buildDeletePartMutationOptions,
} from "../useManageParts";

const mockPart: Part = {
  id: "part-1",
  ownerType: "ROOM",
  ownerId: "room-1",
  name: "床",
  recommendedCycleDays: 7,
  lastCleanedAt: null,
  createdAt: new Date("2026-07-01"),
  updatedAt: new Date("2026-07-01"),
};

const mockUseCase = {
  addPart: jest.fn(),
  updatePart: jest.fn(),
  deletePart: jest.fn(),
};

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

describe("useManageParts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("正常系: パーツ追加", () => {
    it("adds_part_with_user_id_and_input_then_invalidates_parts_query", async () => {
      // Arrange
      mockUseCase.addPart.mockResolvedValue(mockPart);
      const queryClient = createQueryClient();
      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      // Act
      const options = buildAddPartMutationOptions(
        queryClient,
        "user-1",
        mockUseCase as never,
      );
      const created = await options.mutationFn({
        ownerType: "ROOM",
        ownerId: "room-1",
        name: "床",
        recommendedCycleDays: 7,
      });
      await options.onSettled!();

      // Assert
      expect(mockUseCase.addPart).toHaveBeenCalledWith("user-1", {
        ownerType: "ROOM",
        ownerId: "room-1",
        name: "床",
        recommendedCycleDays: 7,
      });
      expect(created).toEqual(mockPart);
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["parts"] });
    });
  });

  describe("正常系: パーツ更新", () => {
    it("updates_part_with_part_id_and_input_then_invalidates_parts_query", async () => {
      // Arrange
      const updated = { ...mockPart, name: "窓", recommendedCycleDays: 14 };
      mockUseCase.updatePart.mockResolvedValue(updated);
      const queryClient = createQueryClient();
      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      // Act
      const options = buildUpdatePartMutationOptions(
        queryClient,
        "user-1",
        mockUseCase as never,
      );
      const result = await options.mutationFn({
        partId: "part-1",
        input: { name: "窓", recommendedCycleDays: 14 },
      });
      await options.onSettled!();

      // Assert
      expect(mockUseCase.updatePart).toHaveBeenCalledWith("user-1", "part-1", {
        name: "窓",
        recommendedCycleDays: 14,
      });
      expect(result).toEqual(updated);
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["parts"] });
    });
  });

  describe("正常系: パーツ削除", () => {
    it("deletes_part_by_part_id_then_invalidates_parts_query", async () => {
      // Arrange
      mockUseCase.deletePart.mockResolvedValue(undefined);
      const queryClient = createQueryClient();
      const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

      // Act
      const options = buildDeletePartMutationOptions(
        queryClient,
        "user-1",
        mockUseCase as never,
      );
      await options.mutationFn("part-1");
      await options.onSettled!();

      // Assert
      expect(mockUseCase.deletePart).toHaveBeenCalledWith("user-1", "part-1");
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["parts"] });
    });
  });

  describe("異常系: ユースケースが失敗したとき", () => {
    it("propagates_error_when_add_part_fails", async () => {
      // Arrange
      mockUseCase.addPart.mockRejectedValue(new Error("network error"));
      const queryClient = createQueryClient();

      // Act & Assert
      const options = buildAddPartMutationOptions(
        queryClient,
        "user-1",
        mockUseCase as never,
      );
      await expect(
        options.mutationFn({
          ownerType: "ROOM",
          ownerId: "room-1",
          name: "床",
        }),
      ).rejects.toThrow("network error");
    });
  });
});
