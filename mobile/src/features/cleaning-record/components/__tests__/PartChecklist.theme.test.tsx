import React from "react";
import { StyleSheet, useColorScheme } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";
import { darkTheme, lightTheme } from "@/shared/theme/tokens";
import { PartChecklist } from "../PartChecklist";
import type { Part } from "../../types";

// useAppTheme.test.tsx と同じ方法で OS のカラースキームをモックする
jest.mock("react-native/Libraries/Utilities/useColorScheme");

const mockUseColorScheme = useColorScheme as jest.Mock;

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

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("PartChecklist（テーマトークン）", () => {
  beforeEach(() => {
    mockUseColorScheme.mockReturnValue("light");
  });

  it("paints_rows_with_surface_and_text_tokens", () => {
    // Arrange & Act
    renderWithTheme(
      <PartChecklist parts={[makePart()]} onLogCleaning={jest.fn()} />,
    );

    // Assert: 行の面・区切り線・本文・補足がトークンで塗られる
    const itemStyle = StyleSheet.flatten(
      screen.getByTestId("part-item-part-1").props.style,
    );
    expect(itemStyle.backgroundColor).toBe(lightTheme.colors.surface);
    expect(itemStyle.borderBottomColor).toBe(lightTheme.colors.outline);
    const nameStyle = StyleSheet.flatten(
      screen.getByText("キッチン床").props.style,
    );
    expect(nameStyle.color).toBe(lightTheme.colors.text);
    const lastCleanedStyle = StyleSheet.flatten(
      screen.getByText(/最終掃除/).props.style,
    );
    expect(lastCleanedStyle.color).toBe(lightTheme.colors.textMuted);
  });

  it("highlights_selected_row_with_primary_soft_and_checkmark_with_on_primary", () => {
    // Arrange
    renderWithTheme(
      <PartChecklist parts={[makePart()]} onLogCleaning={jest.fn()} />,
    );

    // Act: 行をタップして選択状態にする
    fireEvent.press(screen.getByTestId("part-item-part-1"));

    // Assert: 選択行は primarySoft、チェックマークは primary 上の onPrimary
    const itemStyle = StyleSheet.flatten(
      screen.getByTestId("part-item-part-1").props.style,
    );
    expect(itemStyle.backgroundColor).toBe(lightTheme.colors.primarySoft);
    const checkmarkStyle = StyleSheet.flatten(
      screen.getByText("✓").props.style,
    );
    expect(checkmarkStyle.color).toBe(lightTheme.colors.onPrimary);
  });

  it("mutes_edit_button_label_with_text_muted_token", () => {
    // Arrange & Act
    renderWithTheme(
      <PartChecklist
        parts={[makePart()]}
        onLogCleaning={jest.fn()}
        onEditPart={jest.fn()}
      />,
    );

    // Assert
    const editLabelStyle = StyleSheet.flatten(
      screen.getByText("編集").props.style,
    );
    expect(editLabelStyle.color).toBe(lightTheme.colors.textMuted);
  });

  it("paints_rows_with_dark_surface_token_when_color_scheme_is_dark", () => {
    // Arrange
    mockUseColorScheme.mockReturnValue("dark");

    // Act
    renderWithTheme(
      <PartChecklist parts={[makePart()]} onLogCleaning={jest.fn()} />,
    );

    // Assert: ダークテーマの surface / text に切り替わる
    const itemStyle = StyleSheet.flatten(
      screen.getByTestId("part-item-part-1").props.style,
    );
    expect(itemStyle.backgroundColor).toBe(darkTheme.colors.surface);
    const nameStyle = StyleSheet.flatten(
      screen.getByText("キッチン床").props.style,
    );
    expect(nameStyle.color).toBe(darkTheme.colors.text);
  });
});
