import React from "react";
import { ActivityIndicator, StyleSheet, useColorScheme } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";
import { darkTheme, lightTheme } from "@/shared/theme/tokens";
import { RecordButton } from "../RecordButton";

// useAppTheme.test.tsx と同じ方法で OS のカラースキームをモックする
jest.mock("react-native/Libraries/Utilities/useColorScheme");

const mockUseColorScheme = useColorScheme as jest.Mock;

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("RecordButton（テーマトークン）", () => {
  beforeEach(() => {
    mockUseColorScheme.mockReturnValue("light");
  });

  it("fills_button_with_primary_and_labels_with_on_primary_when_enabled", () => {
    // Arrange & Act
    renderWithTheme(<RecordButton selectedCount={2} onPress={jest.fn()} />);

    // Assert
    const buttonStyle = StyleSheet.flatten(
      screen.getByTestId("record-button").props.style,
    );
    expect(buttonStyle.backgroundColor).toBe(lightTheme.colors.primary);
    const labelStyle = StyleSheet.flatten(
      screen.getByText("記録（2件）").props.style,
    );
    expect(labelStyle.color).toBe(lightTheme.colors.onPrimary);
  });

  it("fills_button_with_surface_alt_and_mutes_label_when_disabled", () => {
    // Arrange & Act: 選択0件 = 無効状態
    renderWithTheme(<RecordButton selectedCount={0} onPress={jest.fn()} />);

    // Assert
    const buttonStyle = StyleSheet.flatten(
      screen.getByTestId("record-button").props.style,
    );
    expect(buttonStyle.backgroundColor).toBe(lightTheme.colors.surfaceAlt);
    const labelStyle = StyleSheet.flatten(
      screen.getByText("記録").props.style,
    );
    expect(labelStyle.color).toBe(lightTheme.colors.textMuted);
  });

  it("colors_loading_indicator_with_muted_token_while_loading", () => {
    // Arrange & Act: ローディング中は surfaceAlt 背景の上に表示される
    renderWithTheme(
      <RecordButton selectedCount={1} onPress={jest.fn()} isLoading />,
    );

    // Assert
    const indicator = screen.UNSAFE_getByType(ActivityIndicator);
    expect(indicator.props.color).toBe(lightTheme.colors.textMuted);
  });

  it("switches_button_colors_to_dark_tokens_when_color_scheme_is_dark", () => {
    // Arrange
    mockUseColorScheme.mockReturnValue("dark");

    // Act
    renderWithTheme(<RecordButton selectedCount={2} onPress={jest.fn()} />);

    // Assert
    const buttonStyle = StyleSheet.flatten(
      screen.getByTestId("record-button").props.style,
    );
    expect(buttonStyle.backgroundColor).toBe(darkTheme.colors.primary);
    const labelStyle = StyleSheet.flatten(
      screen.getByText("記録（2件）").props.style,
    );
    expect(labelStyle.color).toBe(darkTheme.colors.onPrimary);
  });
});
