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

    it('commits_new_grid_size_when_resize_handle_drag_ends', async () => {
        // Arrange: 部屋 (2,3)〜6×4 内の 2×2 家具。右へ 56px（1.4 セル）→ 幅 +1
        const mockOnResizeEnd = jest.fn();
        const resizable: Furniture = {
            ...testFurniture,
            gridW: 2,
            gridH: 2,
        };

        render(
            <FurnitureItem
                furniture={resizable}
                cellSize={40}
                selected={true}
                onPress={jest.fn()}
                bounds={roomBounds}
                onResizeEnd={mockOnResizeEnd}
            />,
        );

        // Act
        fireGestureHandler(getByGestureTestId('furniture-resize-furn-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: 56, translationY: 0 },
            { state: State.END, translationX: 56, translationY: 0 },
        ]);

        // Assert: runOnJS 経由のためコールバックは非同期に呼ばれる
        await waitFor(() => {
            expect(mockOnResizeEnd).toHaveBeenCalledWith({ w: 3, h: 2 });
        });
    });

    it('does_not_render_resize_handle_when_not_selected', () => {
        // Arrange & Act
        render(
            <FurnitureItem
                furniture={testFurniture}
                cellSize={40}
                selected={false}
                onPress={jest.fn()}
                bounds={roomBounds}
                onResizeEnd={jest.fn()}
            />,
        );

        // Assert
        expect(screen.queryByTestId('resize-handle-furn-1')).toBeNull();
    });

    it('commits_one_by_one_when_resize_shrinks_below_minimum', async () => {
        // Arrange: 2×2 家具を大きく縮めるドラッグ → 最小 1×1 で確定
        const mockOnResizeEnd = jest.fn();
        const resizable: Furniture = {
            ...testFurniture,
            gridW: 2,
            gridH: 2,
        };

        render(
            <FurnitureItem
                furniture={resizable}
                cellSize={40}
                selected={true}
                onPress={jest.fn()}
                bounds={roomBounds}
                onResizeEnd={mockOnResizeEnd}
            />,
        );

        // Act: -320px（-8 セル）縮める
        fireGestureHandler(getByGestureTestId('furniture-resize-furn-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: -320, translationY: -320 },
            { state: State.END, translationX: -320, translationY: -320 },
        ]);

        // Assert
        await waitFor(() => {
            expect(mockOnResizeEnd).toHaveBeenCalledWith({ w: 1, h: 1 });
        });
    });

    it('clamps_resize_to_room_bounds_when_drag_extends_beyond', async () => {
        // Arrange: 部屋 (2,2)〜4×4 内の家具 (3,3,1,1)。
        // 右下端は部屋の 6 まで → サイズは最大 3×3 に収まる
        const mockOnResizeEnd = jest.fn();
        const innerRoomBounds: Rect = { x: 2, y: 2, w: 4, h: 4 };
        const innerFurniture: Furniture = {
            ...testFurniture,
            gridX: 3,
            gridY: 3,
            gridW: 1,
            gridH: 1,
        };

        render(
            <FurnitureItem
                furniture={innerFurniture}
                cellSize={40}
                selected={true}
                onPress={jest.fn()}
                bounds={innerRoomBounds}
                onResizeEnd={mockOnResizeEnd}
            />,
        );

        // Act: +800px（+20 セル）広げる
        fireGestureHandler(getByGestureTestId('furniture-resize-furn-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: 800, translationY: 800 },
            { state: State.END, translationX: 800, translationY: 800 },
        ]);

        // Assert
        await waitFor(() => {
            expect(mockOnResizeEnd).toHaveBeenCalledWith({ w: 3, h: 3 });
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
