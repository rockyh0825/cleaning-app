import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { RecordButton } from "../RecordButton";
import {
  PRESSED_SCALE,
  PRESS_SPRING_SETTLE_MS,
} from "@/shared/hooks/usePressScale";

describe("RecordButton（プレススプリング）", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("scales_down_with_spring_while_pressed", () => {
    // Arrange
    render(<RecordButton selectedCount={1} onPress={jest.fn()} />);

    // Act: 押下してスプリングが収束するまで時間を進める
    fireEvent(screen.getByTestId("record-button"), "pressIn");
    act(() => {
      jest.advanceTimersByTime(PRESS_SPRING_SETTLE_MS);
    });

    // Assert: 押下中は縮小スケールに収束する
    expect(screen.getByTestId("record-button-scale")).toHaveAnimatedStyle({
      transform: [{ scale: PRESSED_SCALE }],
    });
  });

  it("springs_back_to_full_scale_when_released", () => {
    // Arrange
    render(<RecordButton selectedCount={1} onPress={jest.fn()} />);
    fireEvent(screen.getByTestId("record-button"), "pressIn");
    act(() => {
      jest.advanceTimersByTime(PRESS_SPRING_SETTLE_MS);
    });

    // Act: 指を離す
    fireEvent(screen.getByTestId("record-button"), "pressOut");
    act(() => {
      jest.advanceTimersByTime(PRESS_SPRING_SETTLE_MS);
    });

    // Assert: 等倍に戻る
    expect(screen.getByTestId("record-button-scale")).toHaveAnimatedStyle({
      transform: [{ scale: 1 }],
    });
  });

  it("keeps_full_scale_when_disabled_button_is_pressed", () => {
    // Arrange: 選択0件 = 無効状態
    render(<RecordButton selectedCount={0} onPress={jest.fn()} />);

    // Act
    fireEvent(screen.getByTestId("record-button"), "pressIn");
    act(() => {
      jest.advanceTimersByTime(PRESS_SPRING_SETTLE_MS);
    });

    // Assert: 無効時は押下フィードバックを出さない
    expect(screen.getByTestId("record-button-scale")).toHaveAnimatedStyle({
      transform: [{ scale: 1 }],
    });
  });
});
