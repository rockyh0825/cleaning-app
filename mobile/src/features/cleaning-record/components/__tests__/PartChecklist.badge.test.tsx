import React from "react";
import { StyleSheet, useColorScheme } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";
import { darkTheme, lightTheme } from "@/shared/theme/tokens";
import { PartChecklist } from "../PartChecklist";
import type { Part } from "../../types";

// useAppTheme.test.tsx と同じ方法で OS のカラースキームをモックする
jest.mock("react-native/Libraries/Utilities/useColorScheme");

const mockUseColorScheme = useColorScheme as jest.Mock;

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date(2026, 6, 13, 12, 0);

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

describe("PartChecklist（経過率バッジ）", () => {
  beforeEach(() => {
    mockUseColorScheme.mockReturnValue("light");
  });

  it("shows_percent_badge_with_fresh_pair_when_part_is_within_cycle", () => {
    // Arrange: 7日周期で1日前に掃除 = 14%（fresh）
    const parts = [
      makePart({ lastCleanedAt: new Date(NOW.getTime() - 1 * DAY_MS) }),
    ];

    // Act
    renderWithTheme(
      <PartChecklist parts={parts} onLogCleaning={jest.fn()} now={NOW} />,
    );

    // Assert: 経過率テキストと fresh の塗り＋縁取りペア
    expect(screen.getByText("14%")).toBeTruthy();
    const badgeStyle = StyleSheet.flatten(
      screen.getByTestId("part-elapsed-badge-part-1").props.style,
    );
    expect(badgeStyle.backgroundColor).toBe(lightTheme.colors.heatFresh);
    expect(badgeStyle.borderColor).toBe(lightTheme.colors.heatFreshBorder);
  });

  it("shows_overdue_percent_badge_when_cycle_is_exceeded", () => {
    // Arrange: 7日周期で14日経過 = 200%（overdue）
    const parts = [
      makePart({ lastCleanedAt: new Date(NOW.getTime() - 14 * DAY_MS) }),
    ];

    // Act
    renderWithTheme(
      <PartChecklist parts={parts} onLogCleaning={jest.fn()} now={NOW} />,
    );

    // Assert
    expect(screen.getByText("200%")).toBeTruthy();
    const badgeStyle = StyleSheet.flatten(
      screen.getByTestId("part-elapsed-badge-part-1").props.style,
    );
    expect(badgeStyle.backgroundColor).toBe(lightTheme.colors.heatOverdue);
  });

  it("shows_misouji_badge_as_overdue_when_part_was_never_cleaned", () => {
    // Arrange
    const parts = [makePart({ lastCleanedAt: null })];

    // Act
    renderWithTheme(
      <PartChecklist parts={parts} onLogCleaning={jest.fn()} now={NOW} />,
    );

    // Assert: 未掃除はヒートマップの赤（overdue）と整合するバッジで出す
    expect(screen.getByText("未掃除")).toBeTruthy();
    const badgeStyle = StyleSheet.flatten(
      screen.getByTestId("part-elapsed-badge-part-1").props.style,
    );
    expect(badgeStyle.backgroundColor).toBe(lightTheme.colors.heatOverdue);
  });

  it("hides_badge_when_recommended_cycle_days_is_not_set", () => {
    // Arrange: 周期 0 は経過率を定義できない
    const parts = [
      makePart({
        recommendedCycleDays: 0,
        lastCleanedAt: new Date(NOW.getTime() - 1 * DAY_MS),
      }),
    ];

    // Act
    renderWithTheme(
      <PartChecklist parts={parts} onLogCleaning={jest.fn()} now={NOW} />,
    );

    // Assert
    expect(screen.queryByTestId("part-elapsed-badge-part-1")).toBeNull();
  });

  it("paints_badge_with_dark_heat_tokens_in_dark_mode", () => {
    // Arrange
    mockUseColorScheme.mockReturnValue("dark");
    const parts = [
      makePart({ lastCleanedAt: new Date(NOW.getTime() - 14 * DAY_MS) }),
    ];

    // Act
    renderWithTheme(
      <PartChecklist parts={parts} onLogCleaning={jest.fn()} now={NOW} />,
    );

    // Assert: ダークテーマの heat ペア（text と AA を満たす暗い塗り）で描画する
    const badgeStyle = StyleSheet.flatten(
      screen.getByTestId("part-elapsed-badge-part-1").props.style,
    );
    expect(badgeStyle.backgroundColor).toBe(darkTheme.colors.heatOverdue);
    expect(badgeStyle.borderColor).toBe(darkTheme.colors.heatOverdueBorder);
  });
});
