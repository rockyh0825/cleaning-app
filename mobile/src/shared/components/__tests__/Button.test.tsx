import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Button } from '../Button';
import { lightTheme } from '@/shared/theme/tokens';

describe('Button', () => {
    it('renders_label_and_calls_onPress_when_pressed', () => {
        // Arrange
        const mockOnPress = jest.fn();
        render(<Button label="記録する" onPress={mockOnPress} />);

        // Act
        fireEvent.press(screen.getByText('記録する'));

        // Assert
        expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('does_not_call_onPress_when_disabled', () => {
        // Arrange
        const mockOnPress = jest.fn();
        render(<Button label="記録する" onPress={mockOnPress} disabled testID="button" />);

        // Act
        fireEvent.press(screen.getByTestId('button'));

        // Assert
        expect(mockOnPress).not.toHaveBeenCalled();
    });

    it('exposes_disabled_state_to_accessibility', () => {
        // Arrange & Act
        render(<Button label="記録する" onPress={jest.fn()} disabled testID="button" />);

        // Assert
        expect(screen.getByTestId('button').props.accessibilityState).toEqual(
            expect.objectContaining({ disabled: true }),
        );
    });

    it('uses_primary_background_with_on_primary_label_by_default', () => {
        // Arrange & Act
        render(<Button label="記録する" onPress={jest.fn()} testID="button" />);

        // Assert
        const buttonStyle = StyleSheet.flatten(screen.getByTestId('button').props.style);
        expect(buttonStyle.backgroundColor).toBe(lightTheme.colors.primary);
        const labelStyle = StyleSheet.flatten(screen.getByText('記録する').props.style);
        expect(labelStyle.color).toBe(lightTheme.colors.onPrimary);
    });

    it('uses_soft_danger_background_for_danger_variant', () => {
        // Arrange & Act
        render(<Button label="削除" onPress={jest.fn()} variant="danger" testID="button" />);

        // Assert
        const buttonStyle = StyleSheet.flatten(screen.getByTestId('button').props.style);
        expect(buttonStyle.backgroundColor).toBe(lightTheme.colors.dangerSoft);
        const labelStyle = StyleSheet.flatten(screen.getByText('削除').props.style);
        expect(labelStyle.color).toBe(lightTheme.colors.danger);
    });

    it('uses_primary_border_without_fill_for_secondary_variant', () => {
        // Arrange & Act
        render(<Button label="中を修正" onPress={jest.fn()} variant="secondary" testID="button" />);

        // Assert
        const buttonStyle = StyleSheet.flatten(screen.getByTestId('button').props.style);
        expect(buttonStyle.borderColor).toBe(lightTheme.colors.primary);
        expect(buttonStyle.backgroundColor).toBe(lightTheme.colors.surface);
    });

    it('uses_transparent_background_for_ghost_variant', () => {
        // Arrange & Act
        render(<Button label="キャンセル" onPress={jest.fn()} variant="ghost" testID="button" />);

        // Assert
        const buttonStyle = StyleSheet.flatten(screen.getByTestId('button').props.style);
        expect(buttonStyle.backgroundColor).toBe('transparent');
    });
});
