import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { RenameSheet } from '../RenameSheet';

describe('RenameSheet', () => {
    const mockOnSubmit = jest.fn();
    const mockOnClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders_nothing_when_not_visible', () => {
        // Arrange & Act
        render(
            <RenameSheet
                visible={false}
                initialName="リビング"
                onSubmit={mockOnSubmit}
                onClose={mockOnClose}
            />,
        );

        // Assert
        expect(screen.queryByText('変更')).toBeNull();
    });

    it('shows_initial_name_as_input_value', () => {
        // Arrange & Act
        render(
            <RenameSheet
                visible={true}
                initialName="リビング"
                onSubmit={mockOnSubmit}
                onClose={mockOnClose}
            />,
        );

        // Assert
        expect(screen.getByTestId('rename-input').props.value).toBe('リビング');
    });

    it('calls_onSubmit_with_new_name_when_confirmed', () => {
        // Arrange
        render(
            <RenameSheet
                visible={true}
                initialName="リビング"
                onSubmit={mockOnSubmit}
                onClose={mockOnClose}
            />,
        );

        // Act
        fireEvent.changeText(screen.getByTestId('rename-input'), '和室');
        fireEvent.press(screen.getByText('変更'));

        // Assert
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith('和室');
    });

    it('trims_surrounding_whitespace_before_submit', () => {
        // Arrange
        render(
            <RenameSheet
                visible={true}
                initialName="リビング"
                onSubmit={mockOnSubmit}
                onClose={mockOnClose}
            />,
        );

        // Act
        fireEvent.changeText(screen.getByTestId('rename-input'), '  和室  ');
        fireEvent.press(screen.getByText('変更'));

        // Assert
        expect(mockOnSubmit).toHaveBeenCalledWith('和室');
    });

    it('does_not_submit_when_input_is_whitespace_only', () => {
        // Arrange
        render(
            <RenameSheet
                visible={true}
                initialName="リビング"
                onSubmit={mockOnSubmit}
                onClose={mockOnClose}
            />,
        );

        // Act
        fireEvent.changeText(screen.getByTestId('rename-input'), '   ');
        fireEvent.press(screen.getByText('変更'));

        // Assert
        expect(mockOnSubmit).not.toHaveBeenCalled();
        expect(screen.getByTestId('rename-submit').props.accessibilityState?.disabled).toBe(
            true,
        );
    });

    it('does_not_submit_when_input_is_empty', () => {
        // Arrange
        render(
            <RenameSheet
                visible={true}
                initialName="リビング"
                onSubmit={mockOnSubmit}
                onClose={mockOnClose}
            />,
        );

        // Act
        fireEvent.changeText(screen.getByTestId('rename-input'), '');
        fireEvent.press(screen.getByText('変更'));

        // Assert
        expect(mockOnSubmit).not.toHaveBeenCalled();
        expect(screen.getByTestId('rename-submit').props.accessibilityState?.disabled).toBe(
            true,
        );
    });

    it('calls_onSubmit_when_keyboard_submit_pressed', () => {
        // Arrange
        render(
            <RenameSheet
                visible={true}
                initialName="リビング"
                onSubmit={mockOnSubmit}
                onClose={mockOnClose}
            />,
        );

        // Act
        fireEvent.changeText(screen.getByTestId('rename-input'), '和室');
        fireEvent(screen.getByTestId('rename-input'), 'submitEditing');

        // Assert
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith('和室');
    });

    it('does_not_submit_when_keyboard_submit_pressed_with_whitespace_only', () => {
        // Arrange
        render(
            <RenameSheet
                visible={true}
                initialName="リビング"
                onSubmit={mockOnSubmit}
                onClose={mockOnClose}
            />,
        );

        // Act
        fireEvent.changeText(screen.getByTestId('rename-input'), '   ');
        fireEvent(screen.getByTestId('rename-input'), 'submitEditing');

        // Assert
        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('keeps_edited_input_when_initial_name_changes_while_open', () => {
        // Arrange: 開いた状態で入力を編集する
        const view = render(
            <RenameSheet
                visible={true}
                initialName="リビング"
                onSubmit={mockOnSubmit}
                onClose={mockOnClose}
            />,
        );
        fireEvent.changeText(screen.getByTestId('rename-input'), '和室');

        // Act: 開いたまま initialName だけが変わる（バックグラウンド refetch 等）
        view.rerender(
            <RenameSheet
                visible={true}
                initialName="ダイニング"
                onSubmit={mockOnSubmit}
                onClose={mockOnClose}
            />,
        );

        // Assert: 編集中の入力は破棄されない
        expect(screen.getByTestId('rename-input').props.value).toBe('和室');
    });

    it('calls_onClose_when_cancel_pressed', () => {
        // Arrange
        render(
            <RenameSheet
                visible={true}
                initialName="リビング"
                onSubmit={mockOnSubmit}
                onClose={mockOnClose}
            />,
        );

        // Act
        fireEvent.press(screen.getByText('キャンセル'));

        // Assert
        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('resets_input_to_initial_name_when_reopened', () => {
        // Arrange: 開いた状態で入力を変更してから閉じる
        const view = render(
            <RenameSheet
                visible={true}
                initialName="リビング"
                onSubmit={mockOnSubmit}
                onClose={mockOnClose}
            />,
        );
        fireEvent.changeText(screen.getByTestId('rename-input'), '和室');
        view.rerender(
            <RenameSheet
                visible={false}
                initialName="リビング"
                onSubmit={mockOnSubmit}
                onClose={mockOnClose}
            />,
        );

        // Act: 再度開く
        view.rerender(
            <RenameSheet
                visible={true}
                initialName="リビング"
                onSubmit={mockOnSubmit}
                onClose={mockOnClose}
            />,
        );

        // Assert
        expect(screen.getByTestId('rename-input').props.value).toBe('リビング');
    });
});
