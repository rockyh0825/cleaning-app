import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { State } from 'react-native-gesture-handler';
import {
    fireGestureHandler,
    getByGestureTestId,
} from 'react-native-gesture-handler/jest-utils';
import { StyleSheet } from 'react-native';
import { lightTheme } from '@/shared/theme/tokens';
import { FurnitureItem } from '../FurnitureItem';
import type { Rect } from '@/shared/utils/grid';
import type { Furniture } from '../../types';

describe('FurnitureItem', () => {
    // 所属部屋: (2,3) 起点の 6×4。家具座標はキャンバス絶対座標
    const roomBounds: Rect = { x: 2, y: 3, w: 6, h: 4 };

    const testFurniture: Furniture = {
        id: 'furn-1',
        roomId: 'room-1',
        name: 'ソファ',
        gridX: 2,
        gridY: 3,
        gridW: 1,
        gridH: 1,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    };

    it('renders_furniture_name', () => {
        // Arrange & Act
        render(
            <FurnitureItem
                furniture={testFurniture}
                cellSize={40}
                selected={false}
                onPress={jest.fn()}
                bounds={roomBounds}
            />,
        );

        // Assert
        expect(screen.getByText('ソファ')).toBeTruthy();
    });

    it('uses_surface_token_for_card_background_color', () => {
        // Arrange & Act: サーフェス調カード（リテラル色ではなくトークン参照であること）
        render(
            <FurnitureItem
                furniture={testFurniture}
                cellSize={40}
                selected={false}
                onPress={jest.fn()}
                bounds={roomBounds}
            />,
        );

        // Assert
        const item = screen.getByTestId('furniture-item-furn-1');
        const style = StyleSheet.flatten(item.props.style);
        expect(style.backgroundColor).toBe(lightTheme.colors.surface);
        expect(style.borderColor).toBe(lightTheme.colors.outline);
    });

    it('uses_primary_token_for_selected_border_color', () => {
        // Arrange & Act
        render(
            <FurnitureItem
                furniture={testFurniture}
                cellSize={40}
                selected={true}
                onPress={jest.fn()}
                bounds={roomBounds}
            />,
        );

        // Assert
        const item = screen.getByTestId('furniture-item-furn-1');
        const style = StyleSheet.flatten(item.props.style);
        expect(style.borderColor).toBe(lightTheme.colors.primary);
    });

    it('calls_onPress_when_tapped', async () => {
        // Arrange
        const mockOnPress = jest.fn();

        render(
            <FurnitureItem
                furniture={testFurniture}
                cellSize={40}
                selected={false}
                onPress={mockOnPress}
                bounds={roomBounds}
            />,
        );

        // Act: タップジェスチャーを発火（GestureDetector 置き換え後の選択操作）
        fireGestureHandler(getByGestureTestId('furniture-tap-furn-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE },
            { state: State.END },
        ]);

        // Assert: runOnJS 経由のためコールバックは非同期に呼ばれる
        await waitFor(() => {
            expect(mockOnPress).toHaveBeenCalledTimes(1);
        });
    });

    it('calls_onDragEnd_with_snapped_rect_when_drag_commits', async () => {
        // Arrange: cellSize=40 で 56px（1.4 セル分）ドラッグ → 1 セル移動にスナップ
        const mockOnDragEnd = jest.fn();

        render(
            <FurnitureItem
                furniture={testFurniture}
                cellSize={40}
                selected={false}
                onPress={jest.fn()}
                bounds={roomBounds}
                onDragEnd={mockOnDragEnd}
            />,
        );

        // Act
        fireGestureHandler(getByGestureTestId('furniture-pan-furn-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: 56, translationY: 0 },
            { state: State.END, translationX: 56, translationY: 0 },
        ]);

        // Assert: runOnJS 経由のためコールバックは非同期に呼ばれる
        await waitFor(() => {
            expect(mockOnDragEnd).toHaveBeenCalledWith({ x: 3, y: 3, w: 1, h: 1 });
        });
    });

    it('clamps_to_room_bounds_when_dragged_outside', async () => {
        // Arrange: 右へ 400px（10 セル分）→ 部屋右端 x = 2 + 6 - 1 = 7 にクランプ
        const mockOnDragEnd = jest.fn();

        render(
            <FurnitureItem
                furniture={testFurniture}
                cellSize={40}
                selected={false}
                onPress={jest.fn()}
                bounds={roomBounds}
                onDragEnd={mockOnDragEnd}
            />,
        );

        // Act
        fireGestureHandler(getByGestureTestId('furniture-pan-furn-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: 400, translationY: 0 },
            { state: State.END, translationX: 400, translationY: 0 },
        ]);

        // Assert
        await waitFor(() => {
            expect(mockOnDragEnd).toHaveBeenCalledWith({ x: 7, y: 3, w: 1, h: 1 });
        });
    });

    it('does_not_call_onDragEnd_when_drag_does_not_move', async () => {
        // Arrange
        const mockOnDragEnd = jest.fn();

        render(
            <FurnitureItem
                furniture={testFurniture}
                cellSize={40}
                selected={false}
                onPress={jest.fn()}
                bounds={roomBounds}
                onDragEnd={mockOnDragEnd}
            />,
        );

        // Act: 移動量 0 のドラッグ
        fireGestureHandler(getByGestureTestId('furniture-pan-furn-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: 0, translationY: 0 },
            { state: State.END, translationX: 0, translationY: 0 },
        ]);

        // Assert: 非同期呼び出しの取りこぼしを防ぐためタスクキューを流してから検証する
        await new Promise((resolve) => setImmediate(resolve));
        await new Promise((resolve) => setImmediate(resolve));
        expect(mockOnDragEnd).not.toHaveBeenCalled();
    });
});
