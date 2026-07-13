import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { PartChecklist } from "../PartChecklist";
import { hapticSelection } from "@/shared/haptics/haptics";
import type { Part } from "../../types";

// ネイティブモジュール（expo-haptics）を読み込まないようラッパーごとモックする
jest.mock("@/shared/haptics/haptics", () => ({
  hapticSelection: jest.fn(),
  hapticSuccess: jest.fn(),
  hapticError: jest.fn(),
}));

const mockHapticSelection = hapticSelection as jest.Mock;

const makePart = (overrides: Partial<Part> = {}): Part => ({
  id: "part-1",
  ownerType: "ROOM",
  ownerId: "room-1",
  name: "キッチン床",
  recommendedCycleDays: 7,
  lastCleanedAt: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  ...overrides,
});

describe("PartChecklist（ハプティクス）", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("triggers_selection_haptic_when_part_is_checked", () => {
    // Arrange
    render(<PartChecklist parts={[makePart()]} onLogCleaning={jest.fn()} />);

    // Act
    fireEvent.press(screen.getByTestId("part-item-part-1"));

    // Assert
    expect(mockHapticSelection).toHaveBeenCalledTimes(1);
  });

  it("triggers_selection_haptic_when_part_is_unchecked", () => {
    // Arrange: チェック済みの状態から
    render(<PartChecklist parts={[makePart()]} onLogCleaning={jest.fn()} />);
    fireEvent.press(screen.getByTestId("part-item-part-1"));

    // Act: もう一度タップして選択解除
    fireEvent.press(screen.getByTestId("part-item-part-1"));

    // Assert: 解除時も選択変更のフィードバックを出す
    expect(mockHapticSelection).toHaveBeenCalledTimes(2);
  });

  it("does_not_trigger_selection_haptic_when_edit_button_is_pressed", () => {
    // Arrange: 編集は選択状態を変えない操作
    render(
      <PartChecklist
        parts={[makePart()]}
        onLogCleaning={jest.fn()}
        onEditPart={jest.fn()}
      />,
    );

    // Act
    fireEvent.press(screen.getByTestId("part-edit-part-1"));

    // Assert
    expect(mockHapticSelection).not.toHaveBeenCalled();
  });
});
