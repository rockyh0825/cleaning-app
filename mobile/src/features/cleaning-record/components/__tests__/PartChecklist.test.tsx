import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
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

describe("PartChecklist", () => {
  it("displays_part_names_in_the_list", () => {
    // Arrange
    const parts: Part[] = [
      makePart({ id: "part-1", name: "キッチン床" }),
      makePart({ id: "part-2", name: "リビング床" }),
    ];
    const onLogCleaning = jest.fn();

    // Act
    render(<PartChecklist parts={parts} onLogCleaning={onLogCleaning} />);

    // Assert
    expect(screen.getByText("キッチン床")).toBeTruthy();
    expect(screen.getByText("リビング床")).toBeTruthy();
  });

  it("adds_part_to_selection_when_tapped", () => {
    // Arrange
    const parts: Part[] = [makePart({ id: "part-1", name: "キッチン床" })];
    const onLogCleaning = jest.fn();

    // Act
    render(<PartChecklist parts={parts} onLogCleaning={onLogCleaning} />);
    fireEvent.press(screen.getByText("キッチン床"));

    // Assert: 記録ボタンが有効になっていること（選択済み）
    const recordButton = screen.getByTestId("record-button");
    expect(recordButton.props.accessibilityState?.disabled).toBe(false);
  });

  it("calls_onLogCleaning_with_selected_part_ids_when_record_button_pressed", () => {
    // Arrange
    const parts: Part[] = [
      makePart({ id: "part-1", name: "キッチン床" }),
      makePart({ id: "part-2", name: "リビング床" }),
    ];
    const onLogCleaning = jest.fn();

    // Act
    render(<PartChecklist parts={parts} onLogCleaning={onLogCleaning} />);
    fireEvent.press(screen.getByText("キッチン床"));
    fireEvent.press(screen.getByTestId("record-button"));

    // Assert
    expect(onLogCleaning).toHaveBeenCalledTimes(1);
    expect(onLogCleaning).toHaveBeenCalledWith(["part-1"]);
  });

  it("displays_last_cleaned_datetime_when_part_has_lastCleanedAt", () => {
    // Arrange
    const parts: Part[] = [
      makePart({
        id: "part-1",
        name: "キッチン床",
        lastCleanedAt: new Date(2024, 2, 15, 9, 5),
      }),
    ];
    const onLogCleaning = jest.fn();

    // Act
    render(<PartChecklist parts={parts} onLogCleaning={onLogCleaning} />);

    // Assert
    expect(screen.getByText("最終掃除: 2024/03/15 09:05")).toBeTruthy();
  });

  it("displays_unrecorded_label_when_part_has_no_lastCleanedAt", () => {
    // Arrange
    const parts: Part[] = [
      makePart({ id: "part-1", name: "キッチン床", lastCleanedAt: null }),
    ];
    const onLogCleaning = jest.fn();

    // Act
    render(<PartChecklist parts={parts} onLogCleaning={onLogCleaning} />);

    // Assert
    expect(screen.getByText("最終掃除: 未記録")).toBeTruthy();
  });

  it("disables_record_button_when_no_parts_selected", () => {
    // Arrange
    const parts: Part[] = [makePart({ id: "part-1", name: "キッチン床" })];
    const onLogCleaning = jest.fn();

    // Act
    render(<PartChecklist parts={parts} onLogCleaning={onLogCleaning} />);

    // Assert: 未選択時は無効
    const recordButton = screen.getByTestId("record-button");
    expect(recordButton.props.accessibilityState?.disabled).toBe(true);
  });
});
