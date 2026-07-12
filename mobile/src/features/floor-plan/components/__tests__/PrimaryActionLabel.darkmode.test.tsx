import React from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/shared/theme/ThemeProvider';
import { darkTheme } from '@/shared/theme/tokens';
import { RenameSheet } from '../RenameSheet';
import { RenameScreen } from '../RenameScreen';
import { AddRoomModal } from '../AddRoomModal';
import { AddFurnitureModal } from '../AddFurnitureModal';

// useAppTheme.test.tsx と同じ方法で OS のカラースキームをモックする
jest.mock('react-native/Libraries/Utilities/useColorScheme');

const mockUseColorScheme = useColorScheme as jest.Mock;

function renderWithTheme(ui: React.ReactElement) {
    return render(<ThemeProvider>{ui}</ThemeProvider>);
}

// primary 背景のボタンラベルに surface（ダークでは night900）を使うと
// ほぼ読めなくなるため、onPrimary（tealInk）が使われることを検証する
describe('primary ボタンのラベル色（ダークモード）', () => {
    beforeEach(() => {
        mockUseColorScheme.mockReturnValue('dark');
    });

    it('labels_rename_sheet_submit_with_on_primary_token_when_color_scheme_is_dark', () => {
        // Arrange & Act
        renderWithTheme(
            <RenameSheet
                visible
                initialName="リビング"
                onSubmit={jest.fn()}
                onClose={jest.fn()}
            />,
        );

        // Assert
        const labelStyle = StyleSheet.flatten(screen.getByText('変更').props.style);
        expect(labelStyle.color).toBe(darkTheme.colors.onPrimary);
    });

    it('labels_rename_screen_submit_with_on_primary_token_when_color_scheme_is_dark', () => {
        // Arrange & Act
        renderWithTheme(
            <RenameScreen
                visible
                title="部屋の名称を修正"
                initialName="リビング"
                onSubmit={jest.fn()}
                onClose={jest.fn()}
            />,
        );

        // Assert
        const labelStyle = StyleSheet.flatten(screen.getByText('保存').props.style);
        expect(labelStyle.color).toBe(darkTheme.colors.onPrimary);
    });

    it('labels_add_room_submit_with_on_primary_token_when_color_scheme_is_dark', () => {
        // Arrange & Act
        renderWithTheme(
            <AddRoomModal visible onSubmit={jest.fn()} onCancel={jest.fn()} />,
        );

        // Assert
        const labelStyle = StyleSheet.flatten(screen.getByText('追加').props.style);
        expect(labelStyle.color).toBe(darkTheme.colors.onPrimary);
    });

    it('labels_add_furniture_submit_with_on_primary_token_when_color_scheme_is_dark', () => {
        // Arrange & Act
        renderWithTheme(
            <AddFurnitureModal
                visible
                roomId="room-1"
                onSubmit={jest.fn()}
                onCancel={jest.fn()}
            />,
        );

        // Assert
        const labelStyle = StyleSheet.flatten(screen.getByText('追加').props.style);
        expect(labelStyle.color).toBe(darkTheme.colors.onPrimary);
    });
});
