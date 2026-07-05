import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { FloatingActionButton } from '../FloatingActionButton';

describe('FloatingActionButton', () => {
    it('calls_onPress_when_pressed', () => {
        // Arrange
        const mockOnPress = jest.fn();
        render(
            <FloatingActionButton
                onPress={mockOnPress}
                accessibilityLabel="部屋を追加"
            />,
        );

        // Act
        fireEvent.press(screen.getByTestId('fab'));

        // Assert
        expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('renders_custom_label_when_provided', () => {
        // Arrange & Act
        render(
            <FloatingActionButton
                onPress={jest.fn()}
                label="＋"
                accessibilityLabel="部屋を追加"
            />,
        );

        // Assert
        expect(screen.getByText('＋')).toBeTruthy();
        expect(screen.getByLabelText('部屋を追加')).toBeTruthy();
    });
});
