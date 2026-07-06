import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { lightTheme } from '@/shared/theme/tokens';
import { GRID_COLS, GRID_ROWS } from '../../constants';
import { AddRoomModal } from '../AddRoomModal';

describe('AddRoomModal', () => {
    const mockOnSubmit = jest.fn();
    const mockOnCancel = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders_nothing_when_not_visible', () => {
        // Arrange & Act
        render(
            <AddRoomModal
                visible={false}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />,
        );

        // Assert: 追加ボタンが表示されない
        expect(screen.queryByText('追加')).toBeNull();
    });

    it('calls_onSubmit_with_name_and_type_when_submit_pressed', () => {
        // Arrange
        render(
            <AddRoomModal
                visible={true}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />,
        );

        // Act: 部屋名を入力
        const input = screen.getByPlaceholderText('部屋名');
        fireEvent.changeText(input, 'リビング');

        // Act: 追加ボタンを押す
        fireEvent.press(screen.getByText('追加'));

        // Assert
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'リビング' }),
        );
    });

    it('calls_onCancel_when_cancel_pressed', () => {
        // Arrange
        render(
            <AddRoomModal
                visible={true}
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

    it('does_not_submit_when_name_is_empty', () => {
        // Arrange
        render(
            <AddRoomModal
                visible={true}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />,
        );

        // Act: 名前を入力せずに追加ボタンを押す
        fireEvent.press(screen.getByText('追加'));

        // Assert
        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('calls_onSubmit_with_selected_type_when_type_card_is_pressed', () => {
        // Arrange
        render(
            <AddRoomModal
                visible={true}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />,
        );

        // Act: 種別カードをタップして名前を入力し送信
        fireEvent.press(screen.getByTestId('room-type-card-KITCHEN'));
        fireEvent.changeText(screen.getByPlaceholderText('部屋名'), 'キッチン');
        fireEvent.press(screen.getByText('追加'));

        // Assert
        expect(mockOnSubmit).toHaveBeenCalledWith({
            name: 'キッチン',
            type: 'KITCHEN',
            gridW: 4,
            gridH: 4,
        });
    });

    it('renders_type_icon_on_each_type_card', () => {
        // Arrange & Act
        render(
            <AddRoomModal
                visible={true}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />,
        );

        // Assert: 全種別カードにアイコン（絵文字）が表示される
        for (const type of ['LIVING', 'KITCHEN', 'BEDROOM', 'BATHROOM', 'TOILET', 'OTHER'] as const) {
            const card = screen.getByTestId(`room-type-card-${type}`);
            expect(
                within(card).getByText(lightTheme.roomAccents[type].icon),
            ).toBeTruthy();
        }
    });

    it('marks_pressed_type_card_as_selected', () => {
        // Arrange
        render(
            <AddRoomModal
                visible={true}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />,
        );

        // Act
        fireEvent.press(screen.getByTestId('room-type-card-BEDROOM'));

        // Assert: accessibilityState.selected で選択状態が示される
        expect(
            screen.getByTestId('room-type-card-BEDROOM').props.accessibilityState,
        ).toEqual(expect.objectContaining({ selected: true }));
        expect(
            screen.getByTestId('room-type-card-LIVING').props.accessibilityState,
        ).toEqual(expect.objectContaining({ selected: false }));
    });

    it('exposes_type_label_as_accessibility_label_on_each_type_card', () => {
        // Arrange & Act
        render(
            <AddRoomModal
                visible={true}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />,
        );

        // Assert: 各種別カードが種別ラベルを accessibilityLabel として公開する
        const labels = [
            'リビング',
            'キッチン',
            '寝室',
            'バスルーム',
            'トイレ',
            'その他',
        ];
        for (const label of labels) {
            expect(screen.getByLabelText(label)).toBeTruthy();
        }
    });

    it('includes_type_in_onSubmit_call', () => {
        // Arrange
        render(
            <AddRoomModal
                visible={true}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />,
        );

        // Act
        fireEvent.changeText(screen.getByPlaceholderText('部屋名'), 'キッチン');
        fireEvent.press(screen.getByText('追加'));

        // Assert: type が含まれている
        expect(mockOnSubmit).toHaveBeenCalledWith(
            expect.objectContaining({ type: expect.any(String) }),
        );
    });

    it('submits_default_4x4_size_when_size_is_not_changed', () => {
        // Arrange
        render(
            <AddRoomModal
                visible={true}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />,
        );

        // Act: サイズを変更せずに送信
        fireEvent.changeText(screen.getByPlaceholderText('部屋名'), 'リビング');
        fireEvent.press(screen.getByText('追加'));

        // Assert: 既定サイズ 4×4 で送信される
        expect(mockOnSubmit).toHaveBeenCalledWith(
            expect.objectContaining({ gridW: 4, gridH: 4 }),
        );
    });

    it('shows_default_size_4x4_in_steppers', () => {
        // Arrange & Act
        render(
            <AddRoomModal
                visible={true}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />,
        );

        // Assert: 幅・高さの初期値が 4 で表示される
        expect(screen.getByTestId('room-width-value').props.children).toBe(4);
        expect(screen.getByTestId('room-height-value').props.children).toBe(4);
    });

    it('submits_6x5_size_when_steppers_are_incremented', () => {
        // Arrange
        render(
            <AddRoomModal
                visible={true}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />,
        );

        // Act: 幅を 4→6、高さを 4→5 に増やして送信
        fireEvent.press(screen.getByTestId('room-width-stepper-inc'));
        fireEvent.press(screen.getByTestId('room-width-stepper-inc'));
        fireEvent.press(screen.getByTestId('room-height-stepper-inc'));
        fireEvent.changeText(screen.getByPlaceholderText('部屋名'), '寝室');
        fireEvent.press(screen.getByText('追加'));

        // Assert
        expect(mockOnSubmit).toHaveBeenCalledWith(
            expect.objectContaining({ gridW: 6, gridH: 5 }),
        );
    });

    it('does_not_decrement_size_below_one', () => {
        // Arrange
        render(
            <AddRoomModal
                visible={true}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />,
        );

        // Act: 下限を超えて減らそうとする（既定 4 から 10 回）
        for (let i = 0; i < 10; i++) {
            fireEvent.press(screen.getByTestId('room-width-stepper-dec'));
            fireEvent.press(screen.getByTestId('room-height-stepper-dec'));
        }

        // Assert: 表示は 1 未満にはならない
        expect(screen.getByTestId('room-width-value').props.children).toBe(1);
        expect(screen.getByTestId('room-height-value').props.children).toBe(1);

        // Act: 送信すると 1×1 が渡る
        fireEvent.changeText(screen.getByPlaceholderText('部屋名'), '物置');
        fireEvent.press(screen.getByText('追加'));

        // Assert
        expect(mockOnSubmit).toHaveBeenCalledWith(
            expect.objectContaining({ gridW: 1, gridH: 1 }),
        );
    });

    it('does_not_increment_size_beyond_canvas_limits', () => {
        // Arrange
        render(
            <AddRoomModal
                visible={true}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />,
        );

        // Act: 上限を超えて増やそうとする
        for (let i = 0; i < GRID_COLS + GRID_ROWS + 10; i++) {
            fireEvent.press(screen.getByTestId('room-width-stepper-inc'));
            fireEvent.press(screen.getByTestId('room-height-stepper-inc'));
        }

        // Assert: 幅はキャンバス列数、高さはキャンバス行数を超えない
        expect(screen.getByTestId('room-width-value').props.children).toBe(
            GRID_COLS,
        );
        expect(screen.getByTestId('room-height-value').props.children).toBe(
            GRID_ROWS,
        );

        // Act: 送信するとクランプ済みのサイズが渡る
        fireEvent.changeText(screen.getByPlaceholderText('部屋名'), '大広間');
        fireEvent.press(screen.getByText('追加'));

        // Assert
        expect(mockOnSubmit).toHaveBeenCalledWith(
            expect.objectContaining({ gridW: GRID_COLS, gridH: GRID_ROWS }),
        );
    });

    it('resets_size_and_name_to_defaults_after_cancel_and_reopen', () => {
        // Arrange
        const { rerender } = render(
            <AddRoomModal
                visible={true}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />,
        );

        // Act: 名前を入力し幅を 4→6 に増やしてからキャンセル
        fireEvent.changeText(screen.getByPlaceholderText('部屋名'), '寝室');
        fireEvent.press(screen.getByTestId('room-width-stepper-inc'));
        fireEvent.press(screen.getByTestId('room-width-stepper-inc'));
        fireEvent.press(screen.getByText('キャンセル'));

        // Act: 同一インスタンスのまま閉じて再表示する
        rerender(
            <AddRoomModal
                visible={false}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />,
        );
        rerender(
            <AddRoomModal
                visible={true}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />,
        );

        // Assert: ステッパーは既定 4×4、名前は空に戻る
        expect(screen.getByTestId('room-width-value').props.children).toBe(4);
        expect(screen.getByTestId('room-height-value').props.children).toBe(4);
        expect(screen.getByPlaceholderText('部屋名').props.value).toBe('');
    });

    it('provides_touch_target_of_at_least_44_on_stepper_buttons', () => {
        // Arrange & Act
        render(
            <AddRoomModal
                visible={true}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />,
        );

        // Assert: 各ステッパーボタンの実効タッチ領域が 44pt 以上ある
        const buttonIds = [
            'room-width-stepper-dec',
            'room-width-stepper-inc',
            'room-height-stepper-dec',
            'room-height-stepper-inc',
        ];
        for (const id of buttonIds) {
            const button = screen.getByTestId(id);
            const style = StyleSheet.flatten(button.props.style);
            const hitSlop = button.props.hitSlop ?? {};
            const effectiveWidth =
                (style.width ?? 0) + (hitSlop.left ?? 0) + (hitSlop.right ?? 0);
            const effectiveHeight =
                (style.height ?? 0) + (hitSlop.top ?? 0) + (hitSlop.bottom ?? 0);
            expect(effectiveWidth).toBeGreaterThanOrEqual(44);
            expect(effectiveHeight).toBeGreaterThanOrEqual(44);
        }
    });

    it('resets_size_to_4x4_after_submit', () => {
        // Arrange
        render(
            <AddRoomModal
                visible={true}
                onSubmit={mockOnSubmit}
                onCancel={mockOnCancel}
            />,
        );

        // Act: サイズを変更して送信したあとの表示
        fireEvent.press(screen.getByTestId('room-width-stepper-inc'));
        fireEvent.press(screen.getByTestId('room-height-stepper-inc'));
        fireEvent.changeText(screen.getByPlaceholderText('部屋名'), '書斎');
        fireEvent.press(screen.getByText('追加'));

        // Assert: 次回のために 4×4 に戻る
        expect(screen.getByTestId('room-width-value').props.children).toBe(4);
        expect(screen.getByTestId('room-height-value').props.children).toBe(4);
    });
});
