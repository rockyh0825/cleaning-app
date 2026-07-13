import { QueryClient } from "@tanstack/react-query";
import { buildLogCleaningMutationOptions } from "../useLogCleaning";
import { hapticSuccess, hapticError } from "@/shared/haptics/haptics";
import type { CleaningRecord } from "../../types";

// ネイティブモジュール（expo-haptics）を読み込まないようラッパーごとモックする
jest.mock("@/shared/haptics/haptics", () => ({
  hapticSelection: jest.fn(),
  hapticSuccess: jest.fn(),
  hapticError: jest.fn(),
}));

const mockHapticSuccess = hapticSuccess as jest.Mock;
const mockHapticError = hapticError as jest.Mock;

const mockRecord: CleaningRecord = {
  id: "record-1",
  partId: "part-1",
  cleanedAt: new Date("2024-01-01"),
  note: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

const mockUseCase = {
  execute: jest.fn(),
};

function buildOptions(queryClient: QueryClient) {
  return buildLogCleaningMutationOptions(
    queryClient,
    "user-1",
    mockUseCase as never,
  );
}

describe("useLogCleaning（ハプティクス）", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("triggers_success_haptic_when_logging_succeeds", () => {
    // Arrange
    const queryClient = new QueryClient();
    const options = buildOptions(queryClient);

    // Act: 記録成功
    options.onSuccess!(
      [mockRecord],
      { partIds: ["part-1"] },
      { previous: undefined },
    );

    // Assert
    expect(mockHapticSuccess).toHaveBeenCalledTimes(1);
    expect(mockHapticError).not.toHaveBeenCalled();
  });

  it("triggers_error_haptic_when_logging_fails", () => {
    // Arrange
    const queryClient = new QueryClient();
    const options = buildOptions(queryClient);

    // Act: 記録失敗（ロールバック経路）
    options.onError!(
      new Error("network error"),
      { partIds: ["part-1"] },
      { previous: undefined },
    );

    // Assert
    expect(mockHapticError).toHaveBeenCalledTimes(1);
    expect(mockHapticSuccess).not.toHaveBeenCalled();
  });

  it("still_rolls_back_optimistic_records_when_logging_fails", () => {
    // Arrange: 楽観更新済みのキャッシュ
    const queryClient = new QueryClient();
    const options = buildOptions(queryClient);
    const previous: CleaningRecord[] = [mockRecord];
    queryClient.setQueryData(
      ["cleaning-records", { userId: "user-1" }],
      [mockRecord, { ...mockRecord, id: "optimistic-1" }],
    );

    // Act
    options.onError!(new Error("network error"), { partIds: ["part-1"] }, {
      previous,
    });

    // Assert: ハプティクス追加後もロールバックが維持される
    expect(
      queryClient.getQueryData(["cleaning-records", { userId: "user-1" }]),
    ).toEqual(previous);
  });
});
