import { QueryClient, QueryObserver } from "@tanstack/react-query";
import type { Part } from "../../types";
import { buildPartListQuery, filterPartsByOwner } from "../usePartList";

const mockPart1: Part = {
  id: "part-1",
  ownerType: "ROOM",
  ownerId: "room-1",
  name: "エアコンフィルター",
  recommendedCycleDays: 14,
  lastCleanedAt: null,
  createdAt: new Date("2026-07-01"),
  updatedAt: new Date("2026-07-01"),
};

const mockPart2: Part = {
  id: "part-2",
  ownerType: "ROOM",
  ownerId: "room-1",
  name: "床",
  recommendedCycleDays: 7,
  lastCleanedAt: null,
  createdAt: new Date("2026-07-01"),
  updatedAt: new Date("2026-07-01"),
};

const mockPartOther: Part = {
  id: "part-other",
  ownerType: "ROOM",
  ownerId: "room-2",
  name: "別の部屋のパーツ",
  recommendedCycleDays: 7,
  lastCleanedAt: null,
  createdAt: new Date("2026-07-01"),
  updatedAt: new Date("2026-07-01"),
};

const mockRepository = {
  listParts: jest.fn(),
};

describe("usePartList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("正常系: パーツリストを取得して返す", () => {
    it("returns_parts_list_when_parts_are_fetched", async () => {
      // Arrange
      mockRepository.listParts.mockResolvedValue([mockPart1, mockPart2]);
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });

      // Act
      const query = buildPartListQuery("user-1", mockRepository as never);
      const result = await queryClient.fetchQuery(query);

      // Assert
      expect(mockRepository.listParts).toHaveBeenCalledWith("user-1");
      expect(result).toEqual([mockPart1, mockPart2]);
    });

    it("includes_userId_in_queryKey", () => {
      // Arrange & Act
      const query = buildPartListQuery("user-1", mockRepository as never);

      // Assert
      expect(query.queryKey).toEqual(["parts", { userId: "user-1" }]);
    });
  });

  describe("正常系: ownerId でパーツをフィルタリングする", () => {
    it("returns_only_parts_owned_by_the_given_area", () => {
      // Arrange & Act
      const filtered = filterPartsByOwner(
        [mockPart1, mockPart2, mockPartOther],
        "room-1",
      );

      // Assert
      expect(filtered).toEqual([mockPart1, mockPart2]);
    });

    it("returns_empty_list_when_parts_are_undefined", () => {
      // Arrange & Act
      const filtered = filterPartsByOwner(undefined, "room-1");

      // Assert
      expect(filtered).toEqual([]);
    });
  });

  describe("異常系: userId が未解決（空文字）のとき", () => {
    it("does_not_call_listParts_when_userId_is_empty", async () => {
      // Arrange
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      const query = buildPartListQuery("", mockRepository as never);

      // Act: QueryObserver は enabled を尊重してフェッチを判断する
      const observer = new QueryObserver(queryClient, query);
      const unsubscribe = observer.subscribe(() => {});
      await new Promise((resolve) => setTimeout(resolve, 0));
      unsubscribe();

      // Assert
      expect(mockRepository.listParts).not.toHaveBeenCalled();
    });

    it("calls_listParts_when_userId_is_resolved", async () => {
      // Arrange
      mockRepository.listParts.mockResolvedValue([mockPart1]);
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      const query = buildPartListQuery("user-1", mockRepository as never);

      // Act
      const observer = new QueryObserver(queryClient, query);
      const unsubscribe = observer.subscribe(() => {});
      await new Promise((resolve) => setTimeout(resolve, 0));
      unsubscribe();

      // Assert
      expect(mockRepository.listParts).toHaveBeenCalledWith("user-1");
    });
  });
});
