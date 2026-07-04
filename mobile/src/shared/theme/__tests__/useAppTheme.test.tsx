import React from 'react';
import { Text, useColorScheme } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '../ThemeProvider';
import { useAppTheme } from '../useAppTheme';
import { darkTheme, lightTheme } from '../tokens';

jest.mock('react-native/Libraries/Utilities/useColorScheme');

const mockUseColorScheme = useColorScheme as jest.Mock;

function ThemeProbe() {
    const theme = useAppTheme();
    return <Text testID="theme-background">{theme.colors.background}</Text>;
}

describe('useAppTheme', () => {
    it('returns_light_theme_when_color_scheme_is_light', () => {
        // Arrange
        mockUseColorScheme.mockReturnValue('light');

        // Act
        render(
            <ThemeProvider>
                <ThemeProbe />
            </ThemeProvider>,
        );

        // Assert
        expect(screen.getByTestId('theme-background')).toHaveTextContent(
            lightTheme.colors.background,
        );
    });

    it('returns_dark_theme_when_color_scheme_is_dark', () => {
        // Arrange
        mockUseColorScheme.mockReturnValue('dark');

        // Act
        render(
            <ThemeProvider>
                <ThemeProbe />
            </ThemeProvider>,
        );

        // Assert
        expect(screen.getByTestId('theme-background')).toHaveTextContent(
            darkTheme.colors.background,
        );
    });

    it('returns_light_theme_when_color_scheme_is_null', () => {
        // Arrange
        mockUseColorScheme.mockReturnValue(null);

        // Act
        render(
            <ThemeProvider>
                <ThemeProbe />
            </ThemeProvider>,
        );

        // Assert
        expect(screen.getByTestId('theme-background')).toHaveTextContent(
            lightTheme.colors.background,
        );
    });
});
