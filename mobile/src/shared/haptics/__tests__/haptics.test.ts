import * as ExpoHaptics from "expo-haptics";
import { hapticSelection, hapticSuccess, hapticError } from "../haptics";

// node 環境（unit プロジェクト）でネイティブモジュールを読み込まないよう factory でモックする
jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: {
    Success: "success",
    Warning: "warning",
    Error: "error",
  },
}));

const mockSelectionAsync = ExpoHaptics.selectionAsync as jest.Mock;
const mockNotificationAsync = ExpoHaptics.notificationAsync as jest.Mock;

describe("haptics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectionAsync.mockResolvedValue(undefined);
    mockNotificationAsync.mockResolvedValue(undefined);
  });

  it("triggers_selection_feedback_when_hapticSelection_called", () => {
    // Act
    hapticSelection();

    // Assert
    expect(mockSelectionAsync).toHaveBeenCalledTimes(1);
  });

  it("triggers_success_notification_feedback_when_hapticSuccess_called", () => {
    // Act
    hapticSuccess();

    // Assert
    expect(mockNotificationAsync).toHaveBeenCalledTimes(1);
    expect(mockNotificationAsync).toHaveBeenCalledWith(
      ExpoHaptics.NotificationFeedbackType.Success,
    );
  });

  it("triggers_error_notification_feedback_when_hapticError_called", () => {
    // Act
    hapticError();

    // Assert
    expect(mockNotificationAsync).toHaveBeenCalledTimes(1);
    expect(mockNotificationAsync).toHaveBeenCalledWith(
      ExpoHaptics.NotificationFeedbackType.Error,
    );
  });

  it("swallows_rejection_when_haptics_are_unsupported", async () => {
    // Arrange: Web やハプティクス非対応端末では Promise が reject される
    mockSelectionAsync.mockRejectedValue(new Error("unsupported"));
    mockNotificationAsync.mockRejectedValue(new Error("unsupported"));

    // Act & Assert: 同期的に throw せず、未処理の rejection も発生しない
    expect(() => {
      hapticSelection();
      hapticSuccess();
      hapticError();
    }).not.toThrow();
    // マイクロタスクを流し、catch 済みであることを確認する
    await new Promise(process.nextTick);
  });
});
