import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react-native";
import { CleaningTimeline } from "../CleaningTimeline";
import type { CleaningRecord } from "../../types";

const makeRecord = (
  overrides: Partial<CleaningRecord> = {},
): CleaningRecord => ({
  id: "record-1",
  partId: "part-1",
  cleanedAt: new Date("2024-06-01T10:00:00Z"),
  note: null,
  createdAt: new Date("2024-06-01T10:00:00Z"),
  updatedAt: new Date("2024-06-01T10:00:00Z"),
  ...overrides,
});

describe("CleaningTimeline", () => {
  it("displays_records_in_descending_order_of_cleaned_at", () => {
    // Arrange
    const records: CleaningRecord[] = [
      makeRecord({
        id: "record-old",
        cleanedAt: new Date("2024-05-01T12:00:00Z"),
      }),
      makeRecord({
        id: "record-new",
        cleanedAt: new Date("2024-06-15T12:00:00Z"),
      }),
      makeRecord({
        id: "record-mid",
        cleanedAt: new Date("2024-06-01T12:00:00Z"),
      }),
    ];
    const onDelete = jest.fn();

    // Act
    render(<CleaningTimeline records={records} onDelete={onDelete} />);

    // Assert: 削除ボタンの testID（record-id を含む）で表示順（新→古）を検証する
    const items = screen.getAllByTestId("timeline-item");
    expect(items).toHaveLength(3);
    within(items[0]).getByTestId("delete-button-record-new");
    within(items[1]).getByTestId("delete-button-record-mid");
    within(items[2]).getByTestId("delete-button-record-old");
  });

  it("calls_onDelete_with_record_id_when_delete_button_pressed", () => {
    // Arrange
    const records: CleaningRecord[] = [
      makeRecord({ id: "record-1", partId: "part-1" }),
    ];
    const onDelete = jest.fn();

    // Act
    render(<CleaningTimeline records={records} onDelete={onDelete} />);
    fireEvent.press(screen.getByTestId("delete-button-record-1"));

    // Assert
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith("record-1");
  });

  it("shows_empty_state_message_when_records_list_is_empty", () => {
    // Arrange
    const records: CleaningRecord[] = [];

    // Act
    render(<CleaningTimeline records={records} />);

    // Assert
    expect(screen.getByTestId("empty-state")).toBeTruthy();
    expect(screen.getByText("履歴がありません")).toBeTruthy();
  });
});
