import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SelectionActions } from '../SelectionActions';

describe('SelectionActions', () => {
    it('renders_target_name', () => {
        // Arrange & Act
        render(
            <SelectionActions targetName="リビング" onRename={jest.fn()} onDelete={jest.fn()} />,
        );

        // Assert
        expect(screen.getByText('リビング')).toBeTruthy();
    });

    it('calls_onRename_when_rename_button_pressed', () => {
        // Arrange
        const mockOnRename = jest.fn();
        render(
            <SelectionActions
                targetName="リビング"
                onRename={mockOnRename}
                onDelete={jest.fn()}
            />,
        );

        // Act
        fireEvent.press(screen.getByTestId('selection-rename'));

        // Assert
        expect(mockOnRename).toHaveBeenCalledTimes(1);
    });

    it('calls_onDelete_when_delete_button_pressed', () => {
        // Arrange
        const mockOnDelete = jest.fn();
        render(
            <SelectionActions
                targetName="リビング"
                onRename={jest.fn()}
                onDelete={mockOnDelete}
            />,
        );

        // Act
        fireEvent.press(screen.getByTestId('selection-delete'));

        // Assert
        expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });

    it('calls_onDismiss_when_dismiss_button_pressed', () => {
        // Arrange
        const mockOnDismiss = jest.fn();
        render(
            <SelectionActions
                targetName="リビング"
                onRename={jest.fn()}
                onDelete={jest.fn()}
                onDismiss={mockOnDismiss}
            />,
        );

        // Act
        fireEvent.press(screen.getByTestId('selection-dismiss'));

        // Assert
        expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('does_not_render_dismiss_button_when_onDismiss_is_not_provided', () => {
        // Arrange & Act
        render(
            <SelectionActions targetName="リビング" onRename={jest.fn()} onDelete={jest.fn()} />,
        );

        // Assert
        expect(screen.queryByTestId('selection-dismiss')).toBeNull();
    });

    it('calls_onEditInterior_when_edit_interior_button_pressed', () => {
        // Arrange: 部屋選択時のみ「部屋の中を修正」を出す（間取り画面から詳細への導線）
        const mockOnEditInterior = jest.fn();
        render(
            <SelectionActions
                targetName="リビング"
                onRename={jest.fn()}
                onDelete={jest.fn()}
                onEditInterior={mockOnEditInterior}
            />,
        );

        // Act
        fireEvent.press(screen.getByTestId('selection-edit-interior'));

        // Assert
        expect(mockOnEditInterior).toHaveBeenCalledTimes(1);
        expect(screen.getByText('部屋の中を修正')).toBeTruthy();
    });

    it('does_not_render_edit_interior_button_when_onEditInterior_is_not_provided', () => {
        // Arrange & Act: 家具選択（部屋詳細画面）ではこの導線を出さない
        render(
            <SelectionActions targetName="ソファ" onRename={jest.fn()} onDelete={jest.fn()} />,
        );

        // Assert
        expect(screen.queryByTestId('selection-edit-interior')).toBeNull();
    });

    it('renders_custom_rename_label_when_provided', () => {
        // Arrange & Act: 部屋選択時は「部屋の名称を修正」の文言に差し替えられる
        render(
            <SelectionActions
                targetName="リビング"
                onRename={jest.fn()}
                onDelete={jest.fn()}
                renameLabel="部屋の名称を修正"
            />,
        );

        // Assert
        expect(screen.getByText('部屋の名称を修正')).toBeTruthy();
        expect(screen.queryByText('名称変更')).toBeNull();
    });

    it('exposes_accessible_buttons_for_rename_and_delete', () => {
        // Arrange & Act
        render(
            <SelectionActions targetName="ソファ" onRename={jest.fn()} onDelete={jest.fn()} />,
        );

        // Assert
        expect(screen.getByLabelText('名称変更')).toBeTruthy();
        expect(screen.getByLabelText('削除')).toBeTruthy();
    });
});
