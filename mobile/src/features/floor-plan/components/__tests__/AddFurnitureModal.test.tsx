import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { FURNITURE_PRESETS } from '../../constants';
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

        // Assert: 自由名称は 1×1
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith({
            name: 'ソファ',
            gridW: 1,
            gridH: 1,
        });
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

    it('calls_onSubmit_with_presetKey_when_preset_chip_selected_and_submitted', () => {
        // Arrange
        render(
            <AddFurnitureModal
                visible={true}
                roomId={testRoomId}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />,
        );

        // Act: プリセットチップを選択して送信
        fireEvent.press(screen.getByTestId('furniture-preset-chip-sofa'));
        fireEvent.press(screen.getByText('追加'));

        // Assert: プリセット名・presetKey・既定サイズ付きで送信される
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith({
            name: 'ソファ',
            presetKey: 'sofa',
            gridW: 2,
            gridH: 1,
        });
    });

    it('calls_onSubmit_with_bed_default_size_when_bed_preset_selected', () => {
        // Arrange
        render(
            <AddFurnitureModal
                visible={true}
                roomId={testRoomId}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />,
        );

        // Act: ベッドプリセットを選択して送信
        fireEvent.press(screen.getByTestId('furniture-preset-chip-bed'));
        fireEvent.press(screen.getByText('追加'));

        // Assert: ベッドの既定サイズ 2×3 が付与される
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith({
            name: 'ベッド',
            presetKey: 'bed',
            gridW: 2,
            gridH: 3,
        });
    });

    it('calls_onSubmit_without_presetKey_when_free_name_entered_after_preset_selection', () => {
        // Arrange
        render(
            <AddFurnitureModal
                visible={true}
                roomId={testRoomId}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />,
        );

        // Act: プリセット選択後に名前を書き換えると自由名称扱いになる
        fireEvent.press(screen.getByTestId('furniture-preset-chip-sofa'));
        fireEvent.changeText(screen.getByPlaceholderText('家具名'), '観葉植物');
        fireEvent.press(screen.getByText('追加'));

        // Assert: presetKey は付かず、サイズは 1×1 に戻る
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith({
            name: '観葉植物',
            gridW: 1,
            gridH: 1,
        });
    });

    it('renders_icon_and_accessibility_label_on_each_preset_chip', () => {
        // Arrange & Act
        render(
            <AddFurnitureModal
                visible={true}
                roomId={testRoomId}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />,
        );

        // Assert: 全プリセットチップにアイコンが表示され、
        // ラベルが accessibilityLabel として公開される（E2E のテキストマッチ用）
        for (const preset of FURNITURE_PRESETS) {
            const chip = screen.getByTestId(`furniture-preset-chip-${preset.key}`);
            expect(within(chip).getByText(preset.icon)).toBeTruthy();
            expect(chip.props.accessibilityLabel).toBe(preset.label);
        }
    });

    it('marks_selected_preset_chip_as_selected', () => {
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
        fireEvent.press(screen.getByTestId('furniture-preset-chip-bed'));

        // Assert
        expect(
            screen.getByTestId('furniture-preset-chip-bed').props.accessibilityState,
        ).toEqual(expect.objectContaining({ selected: true }));
        expect(
            screen.getByTestId('furniture-preset-chip-sofa').props.accessibilityState,
        ).toEqual(expect.objectContaining({ selected: false }));
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

    it('defines_a_valid_default_size_for_every_preset', () => {
        // Arrange & Act & Assert: 全プリセットに 1 以上の既定サイズがある
        for (const preset of FURNITURE_PRESETS) {
            expect(preset.defaultSize).toBeDefined();
            expect(preset.defaultSize.w).toBeGreaterThanOrEqual(1);
            expect(preset.defaultSize.h).toBeGreaterThanOrEqual(1);
        }
    });
});
