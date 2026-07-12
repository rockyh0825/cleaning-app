import React from "react";
import { StyleSheet, useColorScheme } from "react-native";
import { render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";
import { darkTheme } from "@/shared/theme/tokens";
import { PartEditorSheet } from "../PartEditorSheet";

// useAppTheme.test.tsx と同じ方法で OS のカラースキームをモックする
jest.mock("react-native/Libraries/Utilities/useColorScheme");

const mockUseColorScheme = useColorScheme as jest.Mock;

describe("PartEditorSheet（テーマトークン）", () => {
  it("labels_submit_button_with_on_primary_token_when_color_scheme_is_dark", () => {
    // Arrange: ダークでは surface(night900) だと primary 背景上で読めないため
    // onPrimary(tealInk) が使われることを検証する
    mockUseColorScheme.mockReturnValue("dark");

    // Act
    render(
      <ThemeProvider>
        <PartEditorSheet
          visible
          part={null}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      </ThemeProvider>,
    );

    // Assert
    const labelStyle = StyleSheet.flatten(screen.getByText("追加").props.style);
    expect(labelStyle.color).toBe(darkTheme.colors.onPrimary);
  });
});
