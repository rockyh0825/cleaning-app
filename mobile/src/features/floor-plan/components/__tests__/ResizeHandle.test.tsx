import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen, waitFor } from '@testing-library/react-native';
import { State } from 'react-native-gesture-handler';
import {
    fireGestureHandler,
    getByGestureTestId,
} from 'react-native-gesture-handler/jest-utils';
import { lightTheme } from '@/shared/theme/tokens';
import { GRID_COLS, GRID_ROWS } from '../../constants';
import { ResizeHandle } from '../ResizeHandle';

describe('ResizeHandle', () => {
    // 部屋 (2,2) 起点・5×4。キャンバス 20×20 内でリサイズする想定
    const roomProps = {
        position: { x: 2, y: 2 },
        size: { w: 5, h: 4 },
        maxRight: GRID_COLS,
        maxBottom: GRID_ROWS,
        handleTestID: 'resize-handle-room-1',
        dragTestID: 'room-resize-room-1',
        ghostTestID: 'resize-ghost-room-1',
    } as const;

    it('uses_theme_tokens_for_handle_colors', () => {
        // Arrange & Act: リテラル色ではなくテーマトークン参照であること（ダークモード対応）
        render(
            <ResizeHandle
                {...roomProps}
                corner="br"
                cellSize={40}
                onCommit={jest.fn()}
            />,
        );

        // Assert
        const handle = screen.getByTestId('resize-handle-room-1');
        const style = StyleSheet.flatten(handle.props.style);
        expect(style.backgroundColor).toBe(lightTheme.colors.primary);
        expect(style.borderColor).toBe(lightTheme.colors.surface);
    });

    it('renders_a_non_interactive_snapped_size_ghost_preview', () => {
        // Arrange & Act: ドラッグ中の確定サイズを示すゴースト枠を重ねて表示する
        render(
            <ResizeHandle
                {...roomProps}
                corner="br"
                cellSize={40}
                onCommit={jest.fn()}
            />,
        );

        // Assert: 枠はタッチを奪わず、色はテーマトークン参照（ダークモード対応）
        const ghost = screen.getByTestId('resize-ghost-room-1');
        expect(ghost.props.pointerEvents).toBe('none');
        const style = StyleSheet.flatten(ghost.props.style);
        expect(style.borderColor).toBe(lightTheme.colors.primary);
        expect(style.borderStyle).toBe('dashed');
    });

    it('places_the_handle_at_the_specified_corner', () => {
        // Arrange & Act: 左上角のハンドルは対象の左上端に重ねて表示する
        render(
            <ResizeHandle
                {...roomProps}
                corner="tl"
                cellSize={40}
                onCommit={jest.fn()}
            />,
        );

        // Assert: 半径ぶん外側（-10px）にはみ出して配置される
        const handle = screen.getByTestId('resize-handle-room-1');
        const style = StyleSheet.flatten(handle.props.style);
        expect(style.left).toBe(-10);
        expect(style.top).toBe(-10);
        expect(style.right).toBeUndefined();
        expect(style.bottom).toBeUndefined();
    });

    it('calls_onCommit_with_grown_rect_when_bottom_right_drag_commits', async () => {
        // Arrange: cellSize=40 で右へ 56px（1.4 セル分）→ 幅が 1 セル拡大
        const mockOnCommit = jest.fn();

        render(
            <ResizeHandle
                {...roomProps}
                corner="br"
                cellSize={40}
                onCommit={mockOnCommit}
            />,
        );

        // Act
        fireGestureHandler(getByGestureTestId('room-resize-room-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: 56, translationY: 0 },
            { state: State.END, translationX: 56, translationY: 0 },
        ]);

        // Assert: runOnJS 経由のためコールバックは非同期に呼ばれる。左上は固定
        await waitFor(() => {
            expect(mockOnCommit).toHaveBeenCalledWith({ x: 2, y: 2, w: 6, h: 4 });
        });
    });

    it('commits_one_x_one_when_bottom_right_drag_shrinks_below_minimum_size', async () => {
        // Arrange: 5x4 を左上へ大きく縮めるドラッグ → 最小 1x1 で確定
        const mockOnCommit = jest.fn();

        render(
            <ResizeHandle
                {...roomProps}
                corner="br"
                cellSize={40}
                onCommit={mockOnCommit}
            />,
        );

        // Act: -8 セル分（-320px）縮める
        fireGestureHandler(getByGestureTestId('room-resize-room-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: -320, translationY: -320 },
            { state: State.END, translationX: -320, translationY: -320 },
        ]);

        // Assert
        await waitFor(() => {
            expect(mockOnCommit).toHaveBeenCalledWith({ x: 2, y: 2, w: 1, h: 1 });
        });
    });

    it('does_not_call_onCommit_when_corner_does_not_move', async () => {
        // Arrange
        const mockOnCommit = jest.fn();

        render(
            <ResizeHandle
                {...roomProps}
                corner="br"
                cellSize={40}
                onCommit={mockOnCommit}
            />,
        );

        // Act: セル半分未満（丸めで 0）のドラッグ
        fireGestureHandler(getByGestureTestId('room-resize-room-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: 10, translationY: 10 },
            { state: State.END, translationX: 10, translationY: 10 },
        ]);

        // Assert: 非同期呼び出しの取りこぼしを防ぐためタスクキューを流してから検証する
        await new Promise((resolve) => setImmediate(resolve));
        await new Promise((resolve) => setImmediate(resolve));
        expect(mockOnCommit).not.toHaveBeenCalled();
    });

    it('clamps_rect_to_canvas_edge_when_bottom_right_drag_extends_beyond_bounds', async () => {
        // Arrange: (2,2) の対象はキャンバス 20x20 内で最大 18x18 まで
        const mockOnCommit = jest.fn();

        render(
            <ResizeHandle
                {...roomProps}
                corner="br"
                cellSize={40}
                onCommit={mockOnCommit}
            />,
        );

        // Act: +20 セル分（800px）広げる
        fireGestureHandler(getByGestureTestId('room-resize-room-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: 800, translationY: 800 },
            { state: State.END, translationX: 800, translationY: 800 },
        ]);

        // Assert
        await waitFor(() => {
            expect(mockOnCommit).toHaveBeenCalledWith({ x: 2, y: 2, w: 18, h: 18 });
        });
    });

    it('moves_origin_and_grows_when_top_left_drag_commits', async () => {
        // Arrange: 左上角 (2,2) を (1,1) へ → 右下 (7,6) を固定したまま拡大
        const mockOnCommit = jest.fn();

        render(
            <ResizeHandle
                {...roomProps}
                corner="tl"
                cellSize={40}
                onCommit={mockOnCommit}
            />,
        );

        // Act: 左上へ 1 セル分（-40px）
        fireGestureHandler(getByGestureTestId('room-resize-room-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: -40, translationY: -40 },
            { state: State.END, translationX: -40, translationY: -40 },
        ]);

        // Assert
        await waitFor(() => {
            expect(mockOnCommit).toHaveBeenCalledWith({ x: 1, y: 1, w: 6, h: 5 });
        });
    });

    it('clamps_top_left_drag_to_keep_minimum_one_by_one_size', async () => {
        // Arrange: 左上角を右下へ大きくドラッグ → 右下-1 の (6,5) で止まり 1×1
        const mockOnCommit = jest.fn();

        render(
            <ResizeHandle
                {...roomProps}
                corner="tl"
                cellSize={40}
                onCommit={mockOnCommit}
            />,
        );

        // Act: +20 セル分（800px）
        fireGestureHandler(getByGestureTestId('room-resize-room-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: 800, translationY: 800 },
            { state: State.END, translationX: 800, translationY: 800 },
        ]);

        // Assert
        await waitFor(() => {
            expect(mockOnCommit).toHaveBeenCalledWith({ x: 6, y: 5, w: 1, h: 1 });
        });
    });

    it('clamps_top_left_drag_to_canvas_origin', async () => {
        // Arrange: 左上角をキャンバス外へドラッグ → (0,0) で止まる
        const mockOnCommit = jest.fn();

        render(
            <ResizeHandle
                {...roomProps}
                corner="tl"
                cellSize={40}
                onCommit={mockOnCommit}
            />,
        );

        // Act: -20 セル分（-800px）
        fireGestureHandler(getByGestureTestId('room-resize-room-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: -800, translationY: -800 },
            { state: State.END, translationX: -800, translationY: -800 },
        ]);

        // Assert
        await waitFor(() => {
            expect(mockOnCommit).toHaveBeenCalledWith({ x: 0, y: 0, w: 7, h: 6 });
        });
    });

    it('resizes_horizontally_and_vertically_in_opposite_directions_from_top_right', async () => {
        // Arrange: 右上角 (7,2) を (8,1) へ → 左下 (2,6) を固定し幅 6・高さ 5
        const mockOnCommit = jest.fn();

        render(
            <ResizeHandle
                {...roomProps}
                corner="tr"
                cellSize={40}
                onCommit={mockOnCommit}
            />,
        );

        // Act
        fireGestureHandler(getByGestureTestId('room-resize-room-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: 40, translationY: -40 },
            { state: State.END, translationX: 40, translationY: -40 },
        ]);

        // Assert
        await waitFor(() => {
            expect(mockOnCommit).toHaveBeenCalledWith({ x: 2, y: 1, w: 6, h: 5 });
        });
    });

    it('resizes_horizontally_and_vertically_in_opposite_directions_from_bottom_left', async () => {
        // Arrange: 左下角 (2,6) を (1,7) へ → 右上 (7,2) を固定
        const mockOnCommit = jest.fn();

        render(
            <ResizeHandle
                {...roomProps}
                corner="bl"
                cellSize={40}
                onCommit={mockOnCommit}
            />,
        );

        // Act
        fireGestureHandler(getByGestureTestId('room-resize-room-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: -40, translationY: 40 },
            { state: State.END, translationX: -40, translationY: 40 },
        ]);

        // Assert
        await waitFor(() => {
            expect(mockOnCommit).toHaveBeenCalledWith({ x: 1, y: 2, w: 6, h: 5 });
        });
    });

    it('clamps_rect_to_arbitrary_max_bounds_for_non_room_targets', async () => {
        // Arrange: 家具ケース。所属部屋（部屋相対 0 基点・6×6）内の家具 (3,3,1,1) は
        // 右下端 6 まで広げられる → 最大 3×3
        const mockOnCommit = jest.fn();

        render(
            <ResizeHandle
                corner="br"
                position={{ x: 3, y: 3 }}
                size={{ w: 1, h: 1 }}
                maxRight={6}
                maxBottom={6}
                cellSize={40}
                onCommit={mockOnCommit}
                handleTestID="resize-handle-furn-1"
                dragTestID="furniture-resize-furn-1"
            />,
        );

        // Act: +20 セル分（800px）広げる
        fireGestureHandler(getByGestureTestId('furniture-resize-furn-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: 800, translationY: 800 },
            { state: State.END, translationX: 800, translationY: 800 },
        ]);

        // Assert
        await waitFor(() => {
            expect(mockOnCommit).toHaveBeenCalledWith({ x: 3, y: 3, w: 3, h: 3 });
        });
    });
});
