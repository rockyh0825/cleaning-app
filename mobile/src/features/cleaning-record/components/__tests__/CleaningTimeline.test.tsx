import React from "react";
import {
  render,
  screen,
  fireEvent,
  within,
  waitFor,
} from "@testing-library/react-native";
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

  it("shows_note_input_with_current_note_when_edit_button_pressed", () => {
    // Arrange
    const records: CleaningRecord[] = [
      makeRecord({ id: "record-1", note: "換気扇も掃除した" }),
    ];
    const onUpdateNote = jest.fn();

    // Act
    render(<CleaningTimeline records={records} onUpdateNote={onUpdateNote} />);
    fireEvent.press(screen.getByTestId("edit-button-record-1"));

    // Assert
    const input = screen.getByTestId("note-input-record-1");
    expect(input.props.value).toBe("換気扇も掃除した");
  });

  it("calls_onUpdateNote_with_edited_note_when_save_pressed", async () => {
    // Arrange
    const records: CleaningRecord[] = [
      makeRecord({ id: "record-1", note: null }),
    ];
    const onUpdateNote = jest.fn().mockResolvedValue(undefined);

    // Act
    render(<CleaningTimeline records={records} onUpdateNote={onUpdateNote} />);
    fireEvent.press(screen.getByTestId("edit-button-record-1"));
    fireEvent.changeText(
      screen.getByTestId("note-input-record-1"),
      "ワックスもかけた",
    );
    fireEvent.press(screen.getByTestId("save-note-button-record-1"));

    // Assert
    await waitFor(() => {
      expect(onUpdateNote).toHaveBeenCalledTimes(1);
    });
    expect(onUpdateNote).toHaveBeenCalledWith("record-1", "ワックスもかけた");
  });

  it("closes_edit_ui_when_update_note_succeeds", async () => {
    // Arrange: onUpdateNote が成功（resolve）するケース
    const records: CleaningRecord[] = [
      makeRecord({ id: "record-1", note: "旧メモ" }),
    ];
    const onUpdateNote = jest.fn().mockResolvedValue(undefined);

    // Act
    render(<CleaningTimeline records={records} onUpdateNote={onUpdateNote} />);
    fireEvent.press(screen.getByTestId("edit-button-record-1"));
    fireEvent.changeText(
      screen.getByTestId("note-input-record-1"),
      "新しいメモ",
    );
    fireEvent.press(screen.getByTestId("save-note-button-record-1"));

    // Assert: 成功したら編集UIを閉じる
    // クローズは onUpdateNote の解決後（非同期）に起きるため、CI の遅い環境でも
    // タイムアウトしないよう待ち時間を長めに取る。
    await waitFor(
      () => {
        expect(screen.queryByTestId("note-input-record-1")).toBeNull();
      },
      { timeout: 5000 },
    );
    expect(onUpdateNote).toHaveBeenCalledWith("record-1", "新しいメモ");
  });

  it("keeps_edit_ui_and_draft_when_update_note_fails", async () => {
    // Arrange: onUpdateNote が失敗（reject）するケース
    const records: CleaningRecord[] = [
      makeRecord({ id: "record-1", note: "旧メモ" }),
    ];
    const onUpdateNote = jest.fn().mockRejectedValue(new Error("update failed"));

    // Act
    render(<CleaningTimeline records={records} onUpdateNote={onUpdateNote} />);
    fireEvent.press(screen.getByTestId("edit-button-record-1"));
    fireEvent.changeText(
      screen.getByTestId("note-input-record-1"),
      "失敗しても保持したいメモ",
    );
    fireEvent.press(screen.getByTestId("save-note-button-record-1"));

    // Assert: 失敗したら編集UIを閉じず、入力中のドラフトを保持する
    await waitFor(() => {
      expect(onUpdateNote).toHaveBeenCalledTimes(1);
    });
    const input = screen.getByTestId("note-input-record-1");
    expect(input).toBeTruthy();
    expect(input.props.value).toBe("失敗しても保持したいメモ");
    // 再試行できる（保存ボタンが残っている）
    expect(screen.getByTestId("save-note-button-record-1")).toBeTruthy();
  });

  it("closes_edit_ui_without_saving_when_cancel_pressed", () => {
    // Arrange
    const records: CleaningRecord[] = [
      makeRecord({ id: "record-1", note: "元のメモ" }),
    ];
    const onUpdateNote = jest.fn();

    // Act
    render(<CleaningTimeline records={records} onUpdateNote={onUpdateNote} />);
    fireEvent.press(screen.getByTestId("edit-button-record-1"));
    fireEvent.changeText(
      screen.getByTestId("note-input-record-1"),
      "書き換えたが保存しない",
    );
    fireEvent.press(screen.getByTestId("cancel-note-button-record-1"));

    // Assert
    expect(onUpdateNote).not.toHaveBeenCalled();
    expect(screen.queryByTestId("note-input-record-1")).toBeNull();
    expect(screen.getByText("元のメモ")).toBeTruthy();
  });

  it("hides_other_edit_buttons_while_editing", () => {
    // Arrange
    const records: CleaningRecord[] = [
      makeRecord({
        id: "record-1",
        cleanedAt: new Date("2024-06-02T10:00:00Z"),
      }),
      makeRecord({
        id: "record-2",
        cleanedAt: new Date("2024-06-01T10:00:00Z"),
      }),
    ];
    const onUpdateNote = jest.fn();

    // Act
    render(<CleaningTimeline records={records} onUpdateNote={onUpdateNote} />);
    fireEvent.press(screen.getByTestId("edit-button-record-1"));

    // Assert: 編集中は他の行の「修正」ボタンを表示しない（ドラフトの無警告破棄を防ぐ）
    expect(screen.getByTestId("note-input-record-1")).toBeTruthy();
    expect(screen.queryByTestId("edit-button-record-2")).toBeNull();
  });

  it("shows_edit_buttons_again_when_editing_record_disappears_from_list", () => {
    // Arrange: record-1 の編集を開始する
    const records: CleaningRecord[] = [
      makeRecord({
        id: "record-1",
        cleanedAt: new Date("2024-06-02T10:00:00Z"),
      }),
      makeRecord({
        id: "record-2",
        cleanedAt: new Date("2024-06-01T10:00:00Z"),
      }),
    ];
    const onUpdateNote = jest.fn();
    const { rerender } = render(
      <CleaningTimeline records={records} onUpdateNote={onUpdateNote} />,
    );
    fireEvent.press(screen.getByTestId("edit-button-record-1"));

    // Act: refetch 等で編集中の record-1 がリストから消える
    rerender(
      <CleaningTimeline
        records={records.filter((r) => r.id !== "record-1")}
        onUpdateNote={onUpdateNote}
      />,
    );

    // Assert: stale な編集状態は無効扱いになり、残りの行の「修正」が再び表示される
    expect(screen.getByTestId("edit-button-record-2")).toBeTruthy();
  });

  it("does_not_show_edit_button_when_onUpdateNote_is_not_provided", () => {
    // Arrange
    const records: CleaningRecord[] = [makeRecord({ id: "record-1" })];

    // Act
    render(<CleaningTimeline records={records} />);

    // Assert
    expect(screen.queryByTestId("edit-button-record-1")).toBeNull();
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
