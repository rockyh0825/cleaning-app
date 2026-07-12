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

    it('uses_surface_alt_background_with_muted_label_when_primary_is_disabled', () => {
        // Arrange & Act
        render(<Button label="記録する" onPress={jest.fn()} disabled testID="button" />);

        // Assert
        const buttonStyle = StyleSheet.flatten(screen.getByTestId('button').props.style);
        expect(buttonStyle.backgroundColor).toBe(lightTheme.colors.surfaceAlt);
        const labelStyle = StyleSheet.flatten(screen.getByText('記録する').props.style);
        expect(labelStyle.color).toBe(lightTheme.colors.textMuted);
    });

    it('uses_outline_border_with_muted_label_when_secondary_is_disabled', () => {
        // Arrange & Act
        render(
            <Button
                label="中を修正"
                onPress={jest.fn()}
                variant="secondary"
                disabled
                testID="button"
            />,
        );

        // Assert
        const buttonStyle = StyleSheet.flatten(screen.getByTestId('button').props.style);
        expect(buttonStyle.backgroundColor).toBe(lightTheme.colors.surface);
        expect(buttonStyle.borderColor).toBe(lightTheme.colors.outline);
        const labelStyle = StyleSheet.flatten(screen.getByText('中を修正').props.style);
        expect(labelStyle.color).toBe(lightTheme.colors.textMuted);
    });

    it('keeps_transparent_background_when_ghost_is_disabled', () => {
        // Arrange & Act
        render(
            <Button
                label="キャンセル"
                onPress={jest.fn()}
                variant="ghost"
                disabled
                testID="button"
            />,
        );

        // Assert（透明のはずの ghost が disabled で「箱」にならないこと）
        const buttonStyle = StyleSheet.flatten(screen.getByTestId('button').props.style);
        expect(buttonStyle.backgroundColor).toBe('transparent');
        const labelStyle = StyleSheet.flatten(screen.getByText('キャンセル').props.style);
        expect(labelStyle.color).toBe(lightTheme.colors.textMuted);
    });

    it('keeps_danger_soft_background_when_danger_is_disabled', () => {
        // Arrange & Act
        render(<Button label="削除" onPress={jest.fn()} variant="danger" disabled testID="button" />);

        // Assert（danger の色相を背景で保ったままラベルだけ muted にする）
        const buttonStyle = StyleSheet.flatten(screen.getByTestId('button').props.style);
        expect(buttonStyle.backgroundColor).toBe(lightTheme.colors.dangerSoft);
        const labelStyle = StyleSheet.flatten(screen.getByText('削除').props.style);
        expect(labelStyle.color).toBe(lightTheme.colors.textMuted);
    });

    it('uses_label_as_accessibility_label_when_not_specified', () => {
        // Arrange & Act
        render(<Button label="記録する" onPress={jest.fn()} testID="button" />);

        // Assert
        expect(screen.getByTestId('button').props.accessibilityLabel).toBe('記録する');
    });

    it('prefers_explicit_accessibility_label_over_visible_label', () => {
        // Arrange & Act
        render(
            <Button
                label="＋"
                accessibilityLabel="部屋を追加"
                onPress={jest.fn()}
                testID="button"
            />,
        );

        // Assert
        expect(screen.getByTestId('button').props.accessibilityLabel).toBe('部屋を追加');
    });

    it.each(['primary', 'secondary', 'ghost', 'danger'] as const)(
        'applies_same_border_width_to_%s_variant_so_heights_align',
        (variant) => {
            // Arrange & Act
            render(<Button label="ボタン" onPress={jest.fn()} variant={variant} testID="button" />);

            // Assert（secondary だけ border 分 3px 高くならないよう全バリアントで揃える）
            const buttonStyle = StyleSheet.flatten(screen.getByTestId('button').props.style);
            expect(buttonStyle.borderWidth).toBe(1.5);
            if (variant !== 'secondary') {
                expect(buttonStyle.borderColor).toBe('transparent');
            }
        },
    );
});
