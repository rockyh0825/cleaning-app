import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { BottomSheet } from '../BottomSheet';

describe('BottomSheet', () => {
    it('renders_children_when_visible', () => {
        // Arrange & Act
        render(
            <BottomSheet visible={true} onClose={jest.fn()}>
                <Text>シートの中身</Text>
            </BottomSheet>,
        );

        // Assert
        expect(screen.getByText('シートの中身')).toBeTruthy();
    });

    it('does_not_render_children_when_not_visible', () => {
        // Arrange & Act
        render(
            <BottomSheet visible={false} onClose={jest.fn()}>
                <Text>シートの中身</Text>
            </BottomSheet>,
        );

        // Assert
        expect(screen.queryByText('シートの中身')).toBeNull();
    });

    it('calls_onClose_when_overlay_is_pressed', () => {
        // Arrange
        const mockOnClose = jest.fn();
        render(
            <BottomSheet visible={true} onClose={mockOnClose}>
                <Text>シートの中身</Text>
            </BottomSheet>,
        );

        // Act
        fireEvent.press(screen.getByTestId('bottom-sheet-overlay'));

        // Assert
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does_not_call_onClose_when_sheet_content_is_pressed', () => {
        // Arrange: シート本体のタップで閉じてはいけない
        const mockOnClose = jest.fn();
        render(
            <BottomSheet visible={true} onClose={mockOnClose}>
                <Text>シートの中身</Text>
            </BottomSheet>,
        );

        // Act
        fireEvent.press(screen.getByTestId('bottom-sheet-content'));

        // Assert
        expect(mockOnClose).not.toHaveBeenCalled();
    });
});
