import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Card } from '../Card';
import { lightTheme } from '@/shared/theme/tokens';

describe('Card', () => {
    it('renders_children', () => {
        // Arrange & Act
        render(
            <Card>
                <Text>キッチン</Text>
            </Card>,
        );

        // Assert
        expect(screen.getByText('キッチン')).toBeTruthy();
    });

    it('uses_surface_background_with_outline_border', () => {
        // Arrange & Act
        render(
            <Card testID="card">
                <Text>キッチン</Text>
            </Card>,
        );

        // Assert
        const cardStyle = StyleSheet.flatten(screen.getByTestId('card').props.style);
        expect(cardStyle.backgroundColor).toBe(lightTheme.colors.surface);
        expect(cardStyle.borderColor).toBe(lightTheme.colors.outline);
    });

    it('merges_custom_style_when_provided', () => {
        // Arrange & Act
        render(
            <Card testID="card" style={{ marginTop: 99 }}>
                <Text>キッチン</Text>
            </Card>,
        );

        // Assert
        const cardStyle = StyleSheet.flatten(screen.getByTestId('card').props.style);
        expect(cardStyle.marginTop).toBe(99);
    });
});
