import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { FURNITURE_CATEGORIES, FURNITURE_PRESETS } from '../../constants';
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

    it('renders_glyph_preview_and_accessibility_label_on_each_preset_chip', () => {
        // Arrange
        render(
            <AddFurnitureModal
                visible={true}
                roomId={testRoomId}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />,
        );

        // Act & Assert: カテゴリタブを順に開き、全プリセットチップに
        // グリフのプレビューが表示され、ラベルが accessibilityLabel として
        // 公開される（E2E のテキストマッチ用）
        for (const category of FURNITURE_CATEGORIES) {
            fireEvent.press(
                screen.getByTestId(`furniture-category-tab-${category.key}`),
            );
            const presets = FURNITURE_PRESETS.filter(
                (p) => p.category === category.key,
            );
            expect(presets.length).toBeGreaterThan(0);
            for (const preset of presets) {
                const chip = screen.getByTestId(
                    `furniture-preset-chip-${preset.key}`,
                );
                expect(
                    within(chip).getByTestId(`furniture-glyph-${preset.key}`),
                ).toBeTruthy();
                expect(chip.props.accessibilityLabel).toBe(preset.label);
            }
        }
    });

    describe('カテゴリタブ', () => {
        it('shows_living_category_presets_by_default', () => {
            // Arrange & Act
            render(
                <AddFurnitureModal
                    visible={true}
                    roomId={testRoomId}
                    onSubmit={mockOnSubmit}
                    onCancel={mockOnCancel}
                />,
            );

            // Assert: 既定タブは「リビング・寝室」。ソファ・ベッドが見え、
            // キッチン・水まわりのプリセットは見えない
            const livingTab = screen.getByTestId('furniture-category-tab-living');
            expect(livingTab.props.accessibilityState).toEqual(
                expect.objectContaining({ selected: true }),
            );
            expect(screen.getByTestId('furniture-preset-chip-sofa')).toBeTruthy();
            expect(screen.getByTestId('furniture-preset-chip-bed')).toBeTruthy();
            expect(screen.queryByTestId('furniture-preset-chip-fridge')).toBeNull();
            expect(screen.queryByTestId('furniture-preset-chip-bathtub')).toBeNull();
        });

        it('switches_to_kitchen_presets_when_kitchen_tab_pressed', () => {
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
            fireEvent.press(screen.getByTestId('furniture-category-tab-kitchen'));

            // Assert
            expect(screen.getByTestId('furniture-preset-chip-fridge')).toBeTruthy();
            expect(screen.getByTestId('furniture-preset-chip-stove')).toBeTruthy();
            expect(screen.queryByTestId('furniture-preset-chip-sofa')).toBeNull();
        });

        it('switches_to_water_presets_when_water_tab_pressed', () => {
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
            fireEvent.press(screen.getByTestId('furniture-category-tab-water'));

            // Assert
            expect(screen.getByTestId('furniture-preset-chip-bathtub')).toBeTruthy();
            expect(screen.getByTestId('furniture-preset-chip-toilet')).toBeTruthy();
            expect(screen.queryByTestId('furniture-preset-chip-sofa')).toBeNull();
        });

        it('submits_preset_from_non_default_tab_with_its_default_size', () => {
            // Arrange
            render(
                <AddFurnitureModal
                    visible={true}
                    roomId={testRoomId}
                    onSubmit={mockOnSubmit}
                    onCancel={mockOnCancel}
                />,
            );

            // Act: 水まわりタブの浴槽を選択して送信
            fireEvent.press(screen.getByTestId('furniture-category-tab-water'));
            fireEvent.press(screen.getByTestId('furniture-preset-chip-bathtub'));
            fireEvent.press(screen.getByText('追加'));

            // Assert
            expect(mockOnSubmit).toHaveBeenCalledTimes(1);
            expect(mockOnSubmit).toHaveBeenCalledWith({
                name: '浴槽',
                presetKey: 'bathtub',
                gridW: 2,
                gridH: 1,
            });
        });
    });

    describe('プリセットカタログ（承認済みデザインの18種）', () => {
        it('defines_eighteen_presets_with_unique_keys_across_three_categories', () => {
            // Arrange & Act & Assert
            expect(FURNITURE_PRESETS).toHaveLength(18);
            const keys = FURNITURE_PRESETS.map((p) => p.key);
            expect(new Set(keys).size).toBe(18);
            const categories = new Set(FURNITURE_PRESETS.map((p) => p.category));
            expect(categories).toEqual(new Set(['living', 'kitchen', 'water']));
        });
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
