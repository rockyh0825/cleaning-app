import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import type { Part } from "../../types";
import { PartEditorSheet } from "../PartEditorSheet";

const PART: Part = {
  id: "part-1",
  ownerType: "ROOM",
  ownerId: "room-1",
  name: "床",
  recommendedCycleDays: 7,
  lastCleanedAt: null,
  createdAt: new Date("2026-07-01"),
  updatedAt: new Date("2026-07-01"),
};

describe("PartEditorSheet", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("正常系: 新規追加モード", () => {
    it("submits_trimmed_name_with_default_cycle_days_when_adding", () => {
      // Arrange
      const onSubmit = jest.fn();
      render(
        <PartEditorSheet
          visible
          part={null}
          onSubmit={onSubmit}
          onCancel={jest.fn()}
        />,
      );

      // Act
      fireEvent.changeText(
        screen.getByTestId("part-name-input"),
        "  換気扇  ",
      );
      fireEvent.press(screen.getByTestId("part-editor-submit"));

      // Assert: 名前は trim され、周期は既定値 7 日で送信される
      expect(onSubmit).toHaveBeenCalledWith({
        name: "換気扇",
        recommendedCycleDays: 7,
      });
    });

    it("hides_delete_button_when_adding", () => {
      // Arrange & Act
      render(
        <PartEditorSheet
          visible
          part={null}
          onSubmit={jest.fn()}
          onDelete={jest.fn()}
          onCancel={jest.fn()}
        />,
      );

      // Assert
      expect(screen.queryByTestId("part-editor-delete")).toBeNull();
    });
  });

  describe("正常系: 編集モード", () => {
    it("prefills_existing_values_and_submits_updated_values_when_editing", () => {
      // Arrange
      const onSubmit = jest.fn();
      render(
        <PartEditorSheet
          visible
          part={PART}
          onSubmit={onSubmit}
          onCancel={jest.fn()}
        />,
      );

      // Assert: 既存値がプリフィルされている
      expect(screen.getByTestId("part-name-input").props.value).toBe("床");
      expect(screen.getByTestId("part-cycle-input").props.value).toBe("7");

      // Act: 値を変更して保存
      fireEvent.changeText(screen.getByTestId("part-name-input"), "窓");
      fireEvent.changeText(screen.getByTestId("part-cycle-input"), "14");
      fireEvent.press(screen.getByTestId("part-editor-submit"));

      // Assert
      expect(onSubmit).toHaveBeenCalledWith({
        name: "窓",
        recommendedCycleDays: 14,
      });
    });

    it("calls_on_delete_with_part_id_when_delete_button_is_pressed", () => {
      // Arrange
      const onDelete = jest.fn();
      render(
        <PartEditorSheet
          visible
          part={PART}
          onSubmit={jest.fn()}
          onDelete={onDelete}
          onCancel={jest.fn()}
        />,
      );

      // Act
      fireEvent.press(screen.getByTestId("part-editor-delete"));

      // Assert
      expect(onDelete).toHaveBeenCalledWith("part-1");
    });
  });

  describe("異常系: 入力が不正なとき", () => {
    it("does_not_submit_when_name_is_empty", () => {
      // Arrange
      const onSubmit = jest.fn();
      render(
        <PartEditorSheet
          visible
          part={null}
          onSubmit={onSubmit}
          onCancel={jest.fn()}
        />,
      );

      // Act: 空白のみの名前で保存を押す
      fireEvent.changeText(screen.getByTestId("part-name-input"), "   ");
      fireEvent.press(screen.getByTestId("part-editor-submit"));

      // Assert
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("does_not_submit_when_cycle_days_is_not_a_positive_integer", () => {
      // Arrange
      const onSubmit = jest.fn();
      render(
        <PartEditorSheet
          visible
          part={null}
          onSubmit={onSubmit}
          onCancel={jest.fn()}
        />,
      );
      fireEvent.changeText(screen.getByTestId("part-name-input"), "換気扇");

      // Act & Assert: 0 は不正
      fireEvent.changeText(screen.getByTestId("part-cycle-input"), "0");
      fireEvent.press(screen.getByTestId("part-editor-submit"));
      expect(onSubmit).not.toHaveBeenCalled();

      // Act & Assert: 数値でない入力も不正
      fireEvent.changeText(screen.getByTestId("part-cycle-input"), "abc");
      fireEvent.press(screen.getByTestId("part-editor-submit"));
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe("正常系: キャンセル", () => {
    it("calls_on_cancel_when_cancel_button_is_pressed", () => {
      // Arrange
      const onCancel = jest.fn();
      render(
        <PartEditorSheet
          visible
          part={null}
          onSubmit={jest.fn()}
          onCancel={onCancel}
        />,
      );

      // Act
      fireEvent.press(screen.getByTestId("part-editor-cancel"));

      // Assert
      expect(onCancel).toHaveBeenCalled();
    });
  });
});
