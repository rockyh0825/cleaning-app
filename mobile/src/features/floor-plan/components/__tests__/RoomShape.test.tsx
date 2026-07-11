import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { State } from 'react-native-gesture-handler';
import {
    fireGestureHandler,
    getByGestureTestId,
} from 'react-native-gesture-handler/jest-utils';
import { StyleSheet } from 'react-native';
import { lightTheme } from '@/shared/theme/tokens';
import { RoomShape } from '../RoomShape';
import type { Room } from '../../types';

describe('RoomShape', () => {
    const testRoom: Room = {
        id: 'room-1',
        name: 'リビング',
        type: 'LIVING',
        gridX: 0,
        gridY: 0,
        gridW: 5,
        gridH: 4,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    };

    it('calls_onPress_when_tapped', async () => {
        // Arrange
        const mockOnPress = jest.fn();

        render(
            <RoomShape
                room={testRoom}
                cellSize={40}
                selected={false}
                onPress={mockOnPress}
            />,
        );

        // Act: タップジェスチャーを発火（GestureDetector 置き換え後の選択操作）
        fireGestureHandler(getByGestureTestId('room-tap-room-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE },
            { state: State.END },
        ]);

        // Assert: runOnJS 経由のためコールバックは非同期に呼ばれる
        await waitFor(() => {
            expect(mockOnPress).toHaveBeenCalledTimes(1);
        });
    });

    it('renders_move_grip_covering_the_center_area_of_the_room', () => {
        // Arrange & Act: 移動用のグリップは部屋の中央 50% 領域を覆う
        render(
            <RoomShape
                room={testRoom}
                cellSize={40}
                selected={false}
                onPress={jest.fn()}
                onDragEnd={jest.fn()}
            />,
        );

        // Assert: 四つ角のリサイズハンドルと干渉しないよう中央のみに置く
        const grip = screen.getByTestId('room-move-area-room-1');
        const style = StyleSheet.flatten(grip.props.style);
        expect(style.left).toBe('25%');
        expect(style.top).toBe('25%');
        expect(style.width).toBe('50%');
        expect(style.height).toBe('50%');
    });

    it('activates_move_drag_only_after_holding_the_center_grip', () => {
        // Arrange & Act: 触れてすぐ動かしても移動せず、ホールド後にのみ移動が始まる
        render(
            <RoomShape
                room={testRoom}
                cellSize={40}
                selected={false}
                onPress={jest.fn()}
                onDragEnd={jest.fn()}
            />,
        );

        // Assert: pan は長押し（300ms）経過後にアクティブ化する設定であること
        const panGesture = getByGestureTestId('room-pan-room-1');
        expect(panGesture.config.activateAfterLongPress).toBe(300);
    });

    it('calls_onDragEnd_with_snapped_rect_when_drag_commits', async () => {
        // Arrange: cellSize=40 で 56px（1.4 セル分）ドラッグ → 1 セル移動にスナップ
        const mockOnDragEnd = jest.fn();

        render(
            <RoomShape
                room={testRoom}
                cellSize={40}
                selected={false}
                onPress={jest.fn()}
                onDragEnd={mockOnDragEnd}
            />,
        );

        // Act
        fireGestureHandler(getByGestureTestId('room-pan-room-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: 56, translationY: 0 },
            { state: State.END, translationX: 56, translationY: 0 },
        ]);

        // Assert: runOnJS 経由のためコールバックは非同期に呼ばれる
        await waitFor(() => {
            expect(mockOnDragEnd).toHaveBeenCalledWith({ x: 1, y: 0, w: 5, h: 4 });
        });
    });

    it('does_not_call_onDragEnd_when_drag_does_not_move', async () => {
        // Arrange
        const mockOnDragEnd = jest.fn();

        render(
            <RoomShape
                room={testRoom}
                cellSize={40}
                selected={false}
                onPress={jest.fn()}
                onDragEnd={mockOnDragEnd}
            />,
        );

        // Act: 移動量 0 のドラッグ
        fireGestureHandler(getByGestureTestId('room-pan-room-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: 0, translationY: 0 },
            { state: State.END, translationX: 0, translationY: 0 },
        ]);

        // Assert: 非同期呼び出しの取りこぼしを防ぐためタスクキューを流してから検証する
        await new Promise((resolve) => setImmediate(resolve));
        await new Promise((resolve) => setImmediate(resolve));
        expect(mockOnDragEnd).not.toHaveBeenCalled();
    });

    it('renders_room_name', () => {
        // Arrange
        const mockOnPress = jest.fn();

        render(
            <RoomShape
                room={testRoom}
                cellSize={40}
                selected={false}
                onPress={mockOnPress}
            />,
        );

        // Assert: 部屋名が表示されている
        expect(screen.getByText('リビング')).toBeTruthy();
    });

    it('applies_selected_style_when_selected', () => {
        // Arrange
        const mockOnPress = jest.fn();

        render(
            <RoomShape
                room={testRoom}
                cellSize={40}
                selected={true}
                onPress={mockOnPress}
            />,
        );

        // Assert: selected な View が存在する
        const shape = screen.getByTestId('room-shape-room-1');
        expect(shape).toBeTruthy();
    });

    it('shows_room_type_icon_for_kitchen_room', () => {
        // Arrange: KITCHEN の部屋
        const kitchenRoom: Room = { ...testRoom, id: 'room-k', type: 'KITCHEN' };

        // Act
        render(
            <RoomShape
                room={kitchenRoom}
                cellSize={40}
                selected={false}
                onPress={jest.fn()}
            />,
        );

        // Assert: 種別アイコン（絵文字）が表示される
        const icon = screen.getByTestId('room-type-icon-room-k');
        expect(icon).toHaveTextContent(lightTheme.roomAccents.KITCHEN.icon);
    });

    it('applies_selected_style_testid_when_selected', () => {
        // Arrange & Act
        render(
            <RoomShape
                room={testRoom}
                cellSize={40}
                selected={true}
                onPress={jest.fn()}
            />,
        );

        // Assert: 選択スタイル用 testID が付与される
        expect(screen.getByTestId('room-selected-room-1')).toBeTruthy();
    });

    it('does_not_apply_selected_style_testid_when_not_selected', () => {
        // Arrange & Act
        render(
            <RoomShape
                room={testRoom}
                cellSize={40}
                selected={false}
                onPress={jest.fn()}
            />,
        );

        // Assert
        expect(screen.queryByTestId('room-selected-room-1')).toBeNull();
    });

    it('uses_room_accent_fill_token_for_background_color', () => {
        // Arrange & Act: LIVING の部屋（リテラル色ではなくトークン参照であること）
        render(
            <RoomShape
                room={testRoom}
                cellSize={40}
                selected={false}
                onPress={jest.fn()}
            />,
        );

        // Assert
        const shape = screen.getByTestId('room-shape-room-1');
        const style = StyleSheet.flatten(shape.props.style);
        expect(style.backgroundColor).toBe(lightTheme.roomAccents.LIVING.fill);
    });

    it('uses_fillColor_for_background_color_when_provided', () => {
        // Arrange & Act: fillColor 指定時は種別色を上書きする（ヒートマップ用）
        render(
            <RoomShape
                room={testRoom}
                cellSize={40}
                selected={false}
                onPress={jest.fn()}
                fillColor="#FF0000"
            />,
        );

        // Assert
        const shape = screen.getByTestId('room-shape-room-1');
        const style = StyleSheet.flatten(shape.props.style);
        expect(style.backgroundColor).toBe('#FF0000');
    });

    it('keeps_room_accent_fill_when_fillColor_is_omitted', () => {
        // Arrange & Act: fillColor 未指定なら従来どおり種別色（回帰）
        render(
            <RoomShape
                room={testRoom}
                cellSize={40}
                selected={false}
                onPress={jest.fn()}
            />,
        );

        // Assert
        const shape = screen.getByTestId('room-shape-room-1');
        const style = StyleSheet.flatten(shape.props.style);
        expect(style.backgroundColor).toBe(lightTheme.roomAccents.LIVING.fill);
    });

    it('shows_resize_handles_on_all_four_corners_when_selected', () => {
        // Arrange & Act
        render(
            <RoomShape
                room={testRoom}
                cellSize={40}
                selected={true}
                onPress={jest.fn()}
                onResizeEnd={jest.fn()}
            />,
        );

        // Assert: 四つ角すべてにハンドルが出る
        expect(screen.getByTestId('resize-handle-room-1-tl')).toBeTruthy();
        expect(screen.getByTestId('resize-handle-room-1-tr')).toBeTruthy();
        expect(screen.getByTestId('resize-handle-room-1-bl')).toBeTruthy();
        expect(screen.getByTestId('resize-handle-room-1-br')).toBeTruthy();
    });

    it('hides_resize_handles_when_not_selected', () => {
        // Arrange & Act
        render(
            <RoomShape
                room={testRoom}
                cellSize={40}
                selected={false}
                onPress={jest.fn()}
                onResizeEnd={jest.fn()}
            />,
        );

        // Assert
        expect(screen.queryByTestId('resize-handle-room-1-br')).toBeNull();
        expect(screen.queryByTestId('resize-handle-room-1-tl')).toBeNull();
    });

    it('disables_pan_gesture_when_dragDisabled', async () => {
        // Arrange: dragDisabled でも onDragEnd を渡した状態にする
        const mockOnDragEnd = jest.fn();
        render(
            <RoomShape
                room={testRoom}
                cellSize={40}
                selected={false}
                onPress={jest.fn()}
                onDragEnd={mockOnDragEnd}
                dragDisabled
            />,
        );

        // Act: 無効化されたジェスチャーへの fireGestureHandler は no-op になる
        fireGestureHandler(getByGestureTestId('room-pan-room-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: 56, translationY: 0 },
            { state: State.END, translationX: 56, translationY: 0 },
        ]);

        // Assert: 非同期呼び出しの取りこぼしを防ぐためタスクキューを流してから検証する
        await new Promise((resolve) => setImmediate(resolve));
        await new Promise((resolve) => setImmediate(resolve));
        expect(getByGestureTestId('room-pan-room-1').config.enabled).toBe(false);
        expect(mockOnDragEnd).not.toHaveBeenCalled();
    });

    it('keeps_pan_gesture_enabled_when_dragDisabled_is_omitted', () => {
        // Arrange & Act: dragDisabled 未指定なら従来どおりドラッグ可能（後方互換）
        render(
            <RoomShape
                room={testRoom}
                cellSize={40}
                selected={false}
                onPress={jest.fn()}
                onDragEnd={jest.fn()}
            />,
        );

        // Assert
        expect(getByGestureTestId('room-pan-room-1').config.enabled).toBe(true);
    });

    it('calls_onPress_on_tap_even_when_dragDisabled', async () => {
        // Arrange: dragDisabled はドラッグのみ無効化し、タップ（選択導線）は残す
        const mockOnPress = jest.fn();
        render(
            <RoomShape
                room={testRoom}
                cellSize={40}
                selected={false}
                onPress={mockOnPress}
                dragDisabled
            />,
        );

        // Act
        fireGestureHandler(getByGestureTestId('room-tap-room-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE },
            { state: State.END },
        ]);

        // Assert: runOnJS 経由のためコールバックは非同期に呼ばれる
        await waitFor(() => {
            expect(mockOnPress).toHaveBeenCalledTimes(1);
        });
    });

    it('raises_room_above_sibling_furniture_when_selected', () => {
        // Arrange & Act: 家具はキャンバス上で部屋の後に描画される絶対配置の兄弟のため、
        // 選択中は部屋を前面に出さないと中央の移動グリップが家具に覆われて操作できない
        render(
            <RoomShape
                room={testRoom}
                cellSize={40}
                selected={true}
                onPress={jest.fn()}
                onDragEnd={jest.fn()}
            />,
        );

        // Assert
        const shape = screen.getByTestId('room-shape-room-1');
        const style = StyleSheet.flatten(shape.props.style);
        expect(style.zIndex).toBeGreaterThan(0);
    });

    it('keeps_default_stacking_below_furniture_when_not_selected', () => {
        // Arrange & Act: 非選択時は従来どおり家具が部屋の上に描画される（家具操作を阻害しない）
        render(
            <RoomShape
                room={testRoom}
                cellSize={40}
                selected={false}
                onPress={jest.fn()}
                onDragEnd={jest.fn()}
            />,
        );

        // Assert
        const shape = screen.getByTestId('room-shape-room-1');
        const style = StyleSheet.flatten(shape.props.style);
        expect(style.zIndex ?? 0).toBe(0);
    });

    it('calls_onResizeEnd_with_new_rect_when_bottom_right_resize_commits', async () => {
        // Arrange: cellSize=40 で右へ 56px（1.4 セル分）→ 幅 5 → 6
        const mockOnResizeEnd = jest.fn();
        render(
            <RoomShape
                room={testRoom}
                cellSize={40}
                selected={true}
                onPress={jest.fn()}
                onResizeEnd={mockOnResizeEnd}
            />,
        );

        // Act
        fireGestureHandler(getByGestureTestId('room-resize-room-1-br'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: 56, translationY: 0 },
            { state: State.END, translationX: 56, translationY: 0 },
        ]);

        // Assert: runOnJS 経由のためコールバックは非同期に呼ばれる。左上は固定
        await waitFor(() => {
            expect(mockOnResizeEnd).toHaveBeenCalledWith({ x: 0, y: 0, w: 6, h: 4 });
        });
    });

    it('calls_onResizeEnd_with_moved_origin_when_top_left_resize_commits', async () => {
        // Arrange: (0,0) 5×4 の左上角を (1,1) へ → 右下 (5,4) 固定で 4×3 に縮む
        const mockOnResizeEnd = jest.fn();
        render(
            <RoomShape
                room={testRoom}
                cellSize={40}
                selected={true}
                onPress={jest.fn()}
                onResizeEnd={mockOnResizeEnd}
            />,
        );

        // Act
        fireGestureHandler(getByGestureTestId('room-resize-room-1-tl'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: 40, translationY: 40 },
            { state: State.END, translationX: 40, translationY: 40 },
        ]);

        // Assert
        await waitFor(() => {
            expect(mockOnResizeEnd).toHaveBeenCalledWith({ x: 1, y: 1, w: 4, h: 3 });
        });
    });
});
