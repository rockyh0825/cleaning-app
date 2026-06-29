import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AddRoomModal } from '../AddRoomModal';

describe('AddRoomModal', () => {
    const mockOnSubmit = jest.fn();
    const mockOnCancel = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders_nothing_when_not_visible', () => {
        // Arrange & Act
        render(
            <AddRoomModal
                visible={false}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />,
        );

        // Assert: 追加ボタンが表示されない
        expect(screen.queryByText('追加')).toBeNull();
    });

    it('calls_onSubmit_with_name_and_type_when_submit_pressed', () => {
        // Arrange
        render(
            <AddRoomModal
                visible={true}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />,
        );

        // Act: 部屋名を入力
        const input = screen.getByPlaceholderText('部屋名');
        fireEvent.changeText(input, 'リビング');

        // Act: 追加ボタンを押す
        fireEvent.press(screen.getByText('追加'));

        // Assert
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'リビング' }),
        );
    });

    it('calls_onCancel_when_cancel_pressed', () => {
        // Arrange
        render(
            <AddRoomModal
                visible={true}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />,
        );

        // Act
        fireEvent.press(screen.getByText('キャンセル'));

        // Assert
        expect(mockOnCancel).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('does_not_submit_when_name_is_empty', () => {
        // Arrange
        render(
            <AddRoomModal
                visible={true}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />,
        );

        // Act: 名前を入力せずに追加ボタンを押す
        fireEvent.press(screen.getByText('追加'));

        // Assert
        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('includes_type_in_onSubmit_call', () => {
        // Arrange
        render(
            <AddRoomModal
                visible={true}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />,
        );

        // Act
        fireEvent.changeText(screen.getByPlaceholderText('部屋名'), 'キッチン');
        fireEvent.press(screen.getByText('追加'));

        // Assert: type が含まれている
        expect(mockOnSubmit).toHaveBeenCalledWith(
            expect.objectContaining({ type: expect.any(String) }),
        );
    });
});
