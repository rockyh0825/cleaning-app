import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { PartChecklist } from "../PartChecklist";
import type { Part } from "../../types";

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

describe("PartChecklist（チェックのスプリング）", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does_not_render_checkmark_before_selection", () => {
    // Arrange & Act
    render(<PartChecklist parts={[makePart()]} onLogCleaning={jest.fn()} />);

    // Assert: 非選択時はチェックマークを描画しない（従来挙動の維持）
    expect(screen.queryByTestId("part-check-part-1")).toBeNull();
    expect(screen.queryByText("✓")).toBeNull();
  });

  it("pops_checkmark_in_with_spring_scale_when_part_is_checked", () => {
    // Arrange
    render(<PartChecklist parts={[makePart()]} onLogCleaning={jest.fn()} />);

    // Act: チェック直後、スプリングの途中まで時間を進める
    fireEvent.press(screen.getByTestId("part-item-part-1"));
    act(() => {
      jest.advanceTimersByTime(32);
    });

    // Assert: スケールが 0 と 1 の中間＝ポップイン中（瞬時表示でない）
    const style = screen.getByTestId("part-check-part-1").props
      .jestAnimatedStyle.value as { transform?: [{ scale: number }] };
    const scale = style.transform?.[0]?.scale;
    expect(scale).toBeGreaterThan(0);
    expect(scale).toBeLessThan(1);
  });

  it("settles_checkmark_at_full_scale_after_spring_completes", () => {
    // Arrange
    render(<PartChecklist parts={[makePart()]} onLogCleaning={jest.fn()} />);

    // Act
    fireEvent.press(screen.getByTestId("part-item-part-1"));
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Assert
    expect(screen.getByTestId("part-check-part-1")).toHaveAnimatedStyle({
      transform: [{ scale: 1 }],
    });
    expect(screen.getByText("✓")).toBeTruthy();
  });

  it("removes_checkmark_when_part_is_unchecked", () => {
    // Arrange
    render(<PartChecklist parts={[makePart()]} onLogCleaning={jest.fn()} />);
    fireEvent.press(screen.getByTestId("part-item-part-1"));
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // Act: もう一度タップして選択解除
    fireEvent.press(screen.getByTestId("part-item-part-1"));

    // Assert: チェックマークは即時に消える
    expect(screen.queryByTestId("part-check-part-1")).toBeNull();
  });
});
