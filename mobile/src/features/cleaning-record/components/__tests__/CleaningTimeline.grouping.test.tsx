import React from "react";
import { StyleSheet, useColorScheme } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";
import { darkTheme } from "@/shared/theme/tokens";
import { CleaningTimeline } from "../CleaningTimeline";
import type { CleaningRecord } from "../../types";

// useAppTheme.test.tsx と同じ方法で OS のカラースキームをモックする
jest.mock("react-native/Libraries/Utilities/useColorScheme");

const mockUseColorScheme = useColorScheme as jest.Mock;

const NOW = new Date(2026, 6, 13, 12, 0); // 2026/07/13 12:00

const makeRecord = (
  id: string,
  cleanedAt: Date,
  overrides: Partial<CleaningRecord> = {},
): CleaningRecord => ({
  id,
  partId: "part-1",
  cleanedAt,
  note: null,
  createdAt: cleanedAt,
  updatedAt: cleanedAt,
  ...overrides,
});

describe("CleaningTimeline（日付グルーピング）", () => {
  beforeEach(() => {
    mockUseColorScheme.mockReturnValue("light");
  });

  it("groups_records_under_kyou_and_kinou_section_headers", () => {
    // Arrange
    const records = [
      makeRecord("r-today", new Date(2026, 6, 13, 9, 30)),
      makeRecord("r-yesterday", new Date(2026, 6, 12, 20, 15)),
    ];

    // Act
    render(
      <CleaningTimeline records={records} partNamesById={{}} now={NOW} />,
    );

    // Assert
    expect(screen.getByText("今日")).toBeTruthy();
    expect(screen.getByText("昨日")).toBeTruthy();
  });

  it("labels_older_sections_with_absolute_date_and_relative_suffix", () => {
    // Arrange: 3日前の記録
    const records = [makeRecord("r-old", new Date(2026, 6, 10, 9, 0))];

    // Act
    render(
      <CleaningTimeline records={records} partNamesById={{}} now={NOW} />,
    );

    // Assert: 絶対日付が必要な文脈なので相対を併記する
    expect(screen.getByText("2026/07/10（3日前）")).toBeTruthy();
  });

  it("shows_time_of_day_instead_of_full_datetime_on_each_row", () => {
    // Arrange: 日付はセクション見出しが持つため、行内は時刻のみにする
    const records = [makeRecord("r-today", new Date(2026, 6, 13, 9, 5))];

    // Act
    render(
      <CleaningTimeline records={records} partNamesById={{}} now={NOW} />,
    );

    // Assert
    const dateText = screen.getByTestId("timeline-item-date");
    expect(dateText.props.children).toBe("09:05");
  });

  it("renders_one_header_per_day_even_with_multiple_records", () => {
    // Arrange: 同じ日の記録2件
    const records = [
      makeRecord("r-1", new Date(2026, 6, 13, 9, 0)),
      makeRecord("r-2", new Date(2026, 6, 13, 18, 0)),
    ];

    // Act
    render(
      <CleaningTimeline records={records} partNamesById={{}} now={NOW} />,
    );

    // Assert
    expect(screen.getAllByText("今日")).toHaveLength(1);
    expect(screen.getAllByTestId("timeline-item")).toHaveLength(2);
  });

  it("paints_section_headers_with_muted_token_in_dark_mode", () => {
    // Arrange
    mockUseColorScheme.mockReturnValue("dark");
    const records = [makeRecord("r-today", new Date(2026, 6, 13, 9, 0))];

    // Act
    render(
      <ThemeProvider>
        <CleaningTimeline records={records} partNamesById={{}} now={NOW} />
      </ThemeProvider>,
    );

    // Assert: ダークテーマでも textMuted トークンで描画される
    const headerStyle = StyleSheet.flatten(
      screen.getByText("今日").props.style,
    );
    expect(headerStyle.color).toBe(darkTheme.colors.textMuted);
  });
});
