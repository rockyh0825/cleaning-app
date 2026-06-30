/* eslint-disable boundaries/dependencies */
/**
 * CleaningStatusCapabilityImpl のテスト。
 * テストとして実装クラスを直接ロードするため boundaries/dependencies を無効化している。
 * CleaningRecordRepository は shared/api に依存するため、テスト内でモックインターフェースを定義して切り離す。
 */

// --- テスト用型定義 ---

type OwnerType = "ROOM" | "FURNITURE";

interface MockPart {
  id: string;
  ownerType: OwnerType;
  ownerId: string;
  name: string;
  recommendedCycleDays: number;
  lastCleanedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface MockOverdueArea {
  areaId: string;
  partId: string;
  elapsedRatio: number;
}

interface MockRepository {
  listParts(userId: string): Promise<MockPart[]>;
}

// --- CleaningStatusCapabilityImpl を動的ロード（shared/api 依存を回避） ---

const { CleaningStatusCapabilityImpl } =
  require("../../features/cleaning-record/repositories/CleaningStatusCapabilityImpl") as {
    CleaningStatusCapabilityImpl: new (repo: MockRepository) => {
      getOverdueAreas(userId: string): Promise<MockOverdueArea[]>;
      getLastCleanedAt(userId: string, areaId: string): Promise<Date | null>;
    };
  };

// --- テスト用ファクトリ ---

const makePart = (overrides: Partial<MockPart> = {}): MockPart => ({
  id: "part-1",
  ownerType: "ROOM",
  ownerId: "area-1",
  name: "床",
  recommendedCycleDays: 7,
  lastCleanedAt: null,
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
  ...overrides,
});

const makeRepository = (parts: MockPart[]): MockRepository => ({
  listParts: jest.fn().mockResolvedValue(parts),
});

// 固定の「現在時刻」として使う基準日
const NOW = new Date("2024-07-01T00:00:00Z");

describe("CleaningStatusCapabilityImpl", () => {
  const userId = "user-uuid-1";

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("getOverdueAreas", () => {
    it("returns_overdue_parts_when_elapsed_ratio_exceeds_1", async () => {
      // Arrange
      // recommendedCycleDays=7、最終掃除は 8 日前 → elapsedRatio = 8/7 > 1.0
      const lastCleanedAt = new Date("2024-06-23T00:00:00Z"); // 8日前
      const repo = makeRepository([
        makePart({
          id: "part-1",
          ownerId: "area-1",
          recommendedCycleDays: 7,
          lastCleanedAt,
        }),
      ]);
      const impl = new CleaningStatusCapabilityImpl(repo);

      // Act
      const result = await impl.getOverdueAreas(userId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].partId).toBe("part-1");
      expect(result[0].areaId).toBe("area-1");
      expect(result[0].elapsedRatio).toBeGreaterThan(1.0);
    });

    it("excludes_parts_within_recommended_cycle", async () => {
      // Arrange
      // recommendedCycleDays=7、最終掃除は 3 日前 → elapsedRatio = 3/7 < 1.0（除外）
      const lastCleanedAt = new Date("2024-06-28T00:00:00Z"); // 3日前
      const repo = makeRepository([
        makePart({
          id: "part-1",
          ownerId: "area-1",
          recommendedCycleDays: 7,
          lastCleanedAt,
        }),
      ]);
      const impl = new CleaningStatusCapabilityImpl(repo);

      // Act
      const result = await impl.getOverdueAreas(userId);

      // Assert
      expect(result).toHaveLength(0);
    });

    it("treats_never_cleaned_parts_as_overdue", async () => {
      // Arrange
      // lastCleanedAt = null → 未掃除 → 常に期限超過
      const repo = makeRepository([
        makePart({ id: "part-1", ownerId: "area-1", lastCleanedAt: null }),
      ]);
      const impl = new CleaningStatusCapabilityImpl(repo);

      // Act
      const result = await impl.getOverdueAreas(userId);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].partId).toBe("part-1");
      expect(result[0].elapsedRatio).toBe(Infinity);
    });

    it("returns_empty_array_when_no_parts_exist", async () => {
      // Arrange
      const repo = makeRepository([]);
      const impl = new CleaningStatusCapabilityImpl(repo);

      // Act
      const result = await impl.getOverdueAreas(userId);

      // Assert
      expect(result).toHaveLength(0);
    });

    it("calls_repository_with_correct_userId", async () => {
      // Arrange
      const repo = makeRepository([]);
      const impl = new CleaningStatusCapabilityImpl(repo);

      // Act
      await impl.getOverdueAreas(userId);

      // Assert
      expect(repo.listParts as jest.Mock).toHaveBeenCalledWith(userId);
    });
  });

  describe("getLastCleanedAt", () => {
    it("returns_latest_cleaned_at_for_parts_in_area", async () => {
      // Arrange
      const older = new Date("2024-06-20T00:00:00Z");
      const newer = new Date("2024-06-28T00:00:00Z");
      const repo = makeRepository([
        makePart({ id: "part-1", ownerId: "area-1", lastCleanedAt: older }),
        makePart({ id: "part-2", ownerId: "area-1", lastCleanedAt: newer }),
        makePart({
          id: "part-3",
          ownerId: "area-2",
          lastCleanedAt: new Date("2024-07-01T00:00:00Z"),
        }),
      ]);
      const impl = new CleaningStatusCapabilityImpl(repo);

      // Act
      const result = await impl.getLastCleanedAt(userId, "area-1");

      // Assert
      expect(result).toEqual(newer);
    });

    it("returns_null_when_no_parts_exist_in_area", async () => {
      // Arrange
      const repo = makeRepository([
        makePart({
          id: "part-1",
          ownerId: "area-2",
          lastCleanedAt: new Date("2024-06-28T00:00:00Z"),
        }),
      ]);
      const impl = new CleaningStatusCapabilityImpl(repo);

      // Act
      const result = await impl.getLastCleanedAt(userId, "area-1");

      // Assert
      expect(result).toBeNull();
    });

    it("returns_null_when_all_parts_in_area_have_never_been_cleaned", async () => {
      // Arrange
      const repo = makeRepository([
        makePart({ id: "part-1", ownerId: "area-1", lastCleanedAt: null }),
        makePart({ id: "part-2", ownerId: "area-1", lastCleanedAt: null }),
      ]);
      const impl = new CleaningStatusCapabilityImpl(repo);

      // Act
      const result = await impl.getLastCleanedAt(userId, "area-1");

      // Assert
      expect(result).toBeNull();
    });

    it("returns_non_null_date_when_only_some_parts_have_been_cleaned", async () => {
      // Arrange
      const cleanedDate = new Date("2024-06-25T00:00:00Z");
      const repo = makeRepository([
        makePart({ id: "part-1", ownerId: "area-1", lastCleanedAt: null }),
        makePart({
          id: "part-2",
          ownerId: "area-1",
          lastCleanedAt: cleanedDate,
        }),
      ]);
      const impl = new CleaningStatusCapabilityImpl(repo);

      // Act
      const result = await impl.getLastCleanedAt(userId, "area-1");

      // Assert
      expect(result).toEqual(cleanedDate);
    });
  });
});

export {};
