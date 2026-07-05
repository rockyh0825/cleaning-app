import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { lightTheme } from '@/shared/theme/tokens';
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
});
