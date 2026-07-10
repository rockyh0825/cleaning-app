import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { RenameScreen } from '../RenameScreen';

describe('RenameScreen', () => {
    const mockOnSubmit = jest.fn();
    const mockOnClose = jest.fn();

    const defaultProps = {
        visible: true,
        title: '部屋の名称を修正',
        initialName: 'リビング',
        onSubmit: mockOnSubmit,
        onClose: mockOnClose,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders_nothing_when_not_visible', () => {
        // Arrange & Act
        render(<RenameScreen {...defaultProps} visible={false} />);

        // Assert
        expect(screen.queryByTestId('rename-input')).toBeNull();
    });

    it('shows_title_and_initial_name_as_input_value', () => {
        // Arrange & Act
        render(<RenameScreen {...defaultProps} />);

        // Assert
        expect(screen.getByText('部屋の名称を修正')).toBeTruthy();
        expect(screen.getByTestId('rename-input').props.value).toBe('リビング');
    });

    it('focuses_the_name_input_so_it_dominates_the_screen', () => {
        // Arrange & Act: 開いた瞬間から入力が主役（キーボードが立ち上がる）
        render(<RenameScreen {...defaultProps} />);

        // Assert
        expect(screen.getByTestId('rename-input').props.autoFocus).toBe(true);
    });

    it('calls_onSubmit_with_trimmed_name_when_save_pressed', () => {
        // Arrange
        render(<RenameScreen {...defaultProps} />);

        // Act
        fireEvent.changeText(screen.getByTestId('rename-input'), '  和室  ');
        fireEvent.press(screen.getByTestId('rename-submit'));

        // Assert
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith('和室');
    });

    it('does_not_submit_when_input_is_whitespace_only', () => {
        // Arrange
        render(<RenameScreen {...defaultProps} />);

        // Act
        fireEvent.changeText(screen.getByTestId('rename-input'), '   ');
        fireEvent.press(screen.getByTestId('rename-submit'));

        // Assert
        expect(mockOnSubmit).not.toHaveBeenCalled();
        expect(
            screen.getByTestId('rename-submit').props.accessibilityState?.disabled,
        ).toBe(true);
    });

    it('calls_onSubmit_when_keyboard_submit_pressed', () => {
        // Arrange
        render(<RenameScreen {...defaultProps} />);

        // Act
        fireEvent.changeText(screen.getByTestId('rename-input'), '和室');
        fireEvent(screen.getByTestId('rename-input'), 'submitEditing');

        // Assert
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith('和室');
    });

    it('does_not_submit_when_keyboard_submit_pressed_with_empty_input', () => {
        // Arrange
        render(<RenameScreen {...defaultProps} />);

        // Act
        fireEvent.changeText(screen.getByTestId('rename-input'), '');
        fireEvent(screen.getByTestId('rename-input'), 'submitEditing');

        // Assert
        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('calls_onClose_when_cancel_pressed', () => {
        // Arrange
        render(<RenameScreen {...defaultProps} />);

        // Act
        fireEvent.press(screen.getByTestId('rename-cancel'));

        // Assert
        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('keeps_edited_input_when_initial_name_changes_while_open', () => {
        // Arrange: 開いた状態で入力を編集する
        const view = render(<RenameScreen {...defaultProps} />);
        fireEvent.changeText(screen.getByTestId('rename-input'), '和室');

        // Act: 開いたまま initialName だけが変わる（バックグラウンド refetch 等）
        view.rerender(<RenameScreen {...defaultProps} initialName="ダイニング" />);

        // Assert: 編集中の入力は破棄されない
        expect(screen.getByTestId('rename-input').props.value).toBe('和室');
    });

    it('resets_input_to_initial_name_when_reopened', () => {
        // Arrange: 開いた状態で入力を変更してから閉じる
        const view = render(<RenameScreen {...defaultProps} />);
        fireEvent.changeText(screen.getByTestId('rename-input'), '和室');
        view.rerender(<RenameScreen {...defaultProps} visible={false} />);

        // Act: 再度開く
        view.rerender(<RenameScreen {...defaultProps} />);

        // Assert
        expect(screen.getByTestId('rename-input').props.value).toBe('リビング');
    });
});
