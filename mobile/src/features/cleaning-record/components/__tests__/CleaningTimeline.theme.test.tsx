import React from "react";
import { StyleSheet, useColorScheme } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";
import { darkTheme, lightTheme } from "@/shared/theme/tokens";
import { CleaningTimeline } from "../CleaningTimeline";
import type { CleaningRecord } from "../../types";

// useAppTheme.test.tsx と同じ方法で OS のカラースキームをモックする
jest.mock("react-native/Libraries/Utilities/useColorScheme");

const mockUseColorScheme = useColorScheme as jest.Mock;

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

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("CleaningTimeline（テーマトークン）", () => {
  beforeEach(() => {
    mockUseColorScheme.mockReturnValue("light");
  });

  it("paints_timeline_items_with_surface_and_text_tokens", () => {
    // Arrange & Act
    renderWithTheme(<CleaningTimeline records={[makeRecord()]} />);

    // Assert: 行の面・区切り線・日付・パーツIDがトークンで塗られる
    const itemStyle = StyleSheet.flatten(
      screen.getByTestId("timeline-item").props.style,
    );
    expect(itemStyle.backgroundColor).toBe(lightTheme.colors.surface);
    expect(itemStyle.borderBottomColor).toBe(lightTheme.colors.outline);
    const dateStyle = StyleSheet.flatten(
      screen.getByTestId("timeline-item-date").props.style,
    );
    expect(dateStyle.color).toBe(lightTheme.colors.text);
    const partIdStyle = StyleSheet.flatten(
      screen.getByText(/パーツ:/).props.style,
    );
    expect(partIdStyle.color).toBe(lightTheme.colors.textMuted);
  });

  it("uses_danger_soft_pair_for_delete_button", () => {
    // Arrange & Act
    renderWithTheme(
      <CleaningTimeline records={[makeRecord()]} onDelete={jest.fn()} />,
    );

    // Assert: shared/components/Button の danger バリアントと同じ配色
    const buttonStyle = StyleSheet.flatten(
      screen.getByTestId("delete-button-record-1").props.style,
    );
    expect(buttonStyle.backgroundColor).toBe(lightTheme.colors.dangerSoft);
    const labelStyle = StyleSheet.flatten(screen.getByText("削除").props.style);
    expect(labelStyle.color).toBe(lightTheme.colors.danger);
  });

  it("uses_primary_soft_background_with_text_label_for_edit_button", () => {
    // Arrange & Act
    renderWithTheme(
      <CleaningTimeline records={[makeRecord()]} onUpdateNote={jest.fn()} />,
    );

    // Assert: primarySoft 上の通常テキストは primary を使わず text にする（4.19:1 のため）
    const buttonStyle = StyleSheet.flatten(
      screen.getByTestId("edit-button-record-1").props.style,
    );
    expect(buttonStyle.backgroundColor).toBe(lightTheme.colors.primarySoft);
    const labelStyle = StyleSheet.flatten(screen.getByText("修正").props.style);
    expect(labelStyle.color).toBe(lightTheme.colors.text);
  });

  it("uses_primary_pair_for_save_button_and_tokens_for_note_editor", () => {
    // Arrange: 編集モードに入る
    renderWithTheme(
      <CleaningTimeline records={[makeRecord()]} onUpdateNote={jest.fn()} />,
    );

    // Act
    fireEvent.press(screen.getByTestId("edit-button-record-1"));

    // Assert: 保存は primary/onPrimary、入力欄とキャンセルもトークン化される
    const saveStyle = StyleSheet.flatten(
      screen.getByTestId("save-note-button-record-1").props.style,
    );
    expect(saveStyle.backgroundColor).toBe(lightTheme.colors.primary);
    const saveLabelStyle = StyleSheet.flatten(
      screen.getByText("保存").props.style,
    );
    expect(saveLabelStyle.color).toBe(lightTheme.colors.onPrimary);
    const inputStyle = StyleSheet.flatten(
      screen.getByTestId("note-input-record-1").props.style,
    );
    expect(inputStyle.borderColor).toBe(lightTheme.colors.outline);
    expect(inputStyle.color).toBe(lightTheme.colors.text);
    const cancelLabelStyle = StyleSheet.flatten(
      screen.getByText("キャンセル").props.style,
    );
    expect(cancelLabelStyle.color).toBe(lightTheme.colors.textMuted);
  });

  it("mutes_empty_state_text_with_text_muted_token", () => {
    // Arrange & Act
    renderWithTheme(<CleaningTimeline records={[]} />);

    // Assert
    const emptyStyle = StyleSheet.flatten(
      screen.getByText("履歴がありません").props.style,
    );
    expect(emptyStyle.color).toBe(lightTheme.colors.textMuted);
  });

  it("paints_items_with_dark_tokens_when_color_scheme_is_dark", () => {
    // Arrange
    mockUseColorScheme.mockReturnValue("dark");

    // Act
    renderWithTheme(
      <CleaningTimeline records={[makeRecord()]} onDelete={jest.fn()} />,
    );

    // Assert: ダークテーマの surface / dangerSoft に切り替わる
    const itemStyle = StyleSheet.flatten(
      screen.getByTestId("timeline-item").props.style,
    );
    expect(itemStyle.backgroundColor).toBe(darkTheme.colors.surface);
    const deleteStyle = StyleSheet.flatten(
      screen.getByTestId("delete-button-record-1").props.style,
    );
    expect(deleteStyle.backgroundColor).toBe(darkTheme.colors.dangerSoft);
  });
});
