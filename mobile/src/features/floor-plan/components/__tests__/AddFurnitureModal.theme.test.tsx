import React from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/shared/theme/ThemeProvider';
import { darkTheme, lightTheme } from '@/shared/theme/tokens';
import { AddFurnitureModal } from '../AddFurnitureModal';

// useAppTheme.test.tsx と同じ方法で OS のカラースキームをモックする
jest.mock('react-native/Libraries/Utilities/useColorScheme');

const mockUseColorScheme = useColorScheme as jest.Mock;

function renderWithTheme(ui: React.ReactElement) {
    return render(<ThemeProvider>{ui}</ThemeProvider>);
}

function renderModal() {
    return renderWithTheme(
        <AddFurnitureModal
            visible
            roomId="room-1"
            onSubmit={jest.fn()}
            onCancel={jest.fn()}
        />,
    );
}

describe('AddFurnitureModal（テーマトークン）', () => {
    beforeEach(() => {
        mockUseColorScheme.mockReturnValue('light');
    });

    it('uses_text_label_on_primary_soft_for_active_category_tab', () => {
        // Arrange & Act: 既定のアクティブタブは「リビング・寝室」
        renderModal();

        // Assert: primarySoft 上の通常テキストは primary を使わず text にする
        // （primary は 4.19:1 で WCAG AA 未達。CleaningTimeline と同じ規約）
        const tabStyle = StyleSheet.flatten(
            screen.getByTestId('furniture-category-tab-living').props.style,
        );
        expect(tabStyle.backgroundColor).toBe(lightTheme.colors.primarySoft);
        const labelStyle = StyleSheet.flatten(
            screen.getByText('リビング・寝室').props.style,
        );
        expect(labelStyle.color).toBe(lightTheme.colors.text);
    });

    it('keeps_text_muted_label_for_inactive_category_tabs', () => {
        // Arrange & Act
        renderModal();

        // Assert: 非アクティブタブは surface 面 + textMuted のまま
        const tabStyle = StyleSheet.flatten(
            screen.getByTestId('furniture-category-tab-kitchen').props.style,
        );
        expect(tabStyle.backgroundColor).toBe(lightTheme.colors.surface);
        const labelStyle = StyleSheet.flatten(
            screen.getByText('キッチン').props.style,
        );
        expect(labelStyle.color).toBe(lightTheme.colors.textMuted);
    });

    it('uses_dark_text_token_for_active_category_tab_when_color_scheme_is_dark', () => {
        // Arrange
        mockUseColorScheme.mockReturnValue('dark');

        // Act
        renderModal();

        // Assert: ダークテーマでも primarySoft 上は text トークン
        const labelStyle = StyleSheet.flatten(
            screen.getByText('リビング・寝室').props.style,
        );
        expect(labelStyle.color).toBe(darkTheme.colors.text);
    });
});
