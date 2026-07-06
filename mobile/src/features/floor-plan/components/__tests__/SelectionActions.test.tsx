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
