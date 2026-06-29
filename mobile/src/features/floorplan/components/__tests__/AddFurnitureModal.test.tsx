import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AddFurnitureModal } from '../AddFurnitureModal';

describe('AddFurnitureModal', () => {
    const mockOnSubmit = jest.fn();
    const mockOnCancel = jest.fn();
    const testRoomId = 'room-123';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders_nothing_when_not_visible', () => {
        // Arrange & Act
        render(
            <AddFurnitureModal
                visible={false}
                roomId={testRoomId}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />,
        );

        // Assert
        expect(screen.queryByText('追加')).toBeNull();
    });

    it('calls_onSubmit_with_name_when_submit_pressed', () => {
        // Arrange
        render(
            <AddFurnitureModal
                visible={true}
                roomId={testRoomId}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />,
        );

        // Act
        const input = screen.getByPlaceholderText('家具名');
        fireEvent.changeText(input, 'ソファ');
        fireEvent.press(screen.getByText('追加'));

        // Assert
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith({ name: 'ソファ' });
    });

    it('calls_onCancel_when_cancel_pressed', () => {
        // Arrange
        render(
            <AddFurnitureModal
                visible={true}
                roomId={testRoomId}
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
            <AddFurnitureModal
                visible={true}
                roomId={testRoomId}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />,
        );

        // Act: 名前を入力せずに追加ボタンを押す
        fireEvent.press(screen.getByText('追加'));

        // Assert
        expect(mockOnSubmit).not.toHaveBeenCalled();
    });
});
