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
    };

    it('uses_theme_tokens_for_handle_colors', () => {
        // Arrange & Act: リテラル色ではなくテーマトークン参照であること（ダークモード対応）
        render(<ResizeHandle {...roomProps} cellSize={40} onCommit={jest.fn()} />);

        // Assert
        const handle = screen.getByTestId('resize-handle-room-1');
        const style = StyleSheet.flatten(handle.props.style);
        expect(style.backgroundColor).toBe(lightTheme.colors.primary);
        expect(style.borderColor).toBe(lightTheme.colors.surface);
    });

    it('calls_onCommit_with_new_grid_size_when_resize_drag_commits', async () => {
        // Arrange: cellSize=40 で右へ 56px（1.4 セル分）→ 幅が 1 セル拡大
        const mockOnCommit = jest.fn();

        render(
            <ResizeHandle {...roomProps} cellSize={40} onCommit={mockOnCommit} />,
        );

        // Act
        fireGestureHandler(getByGestureTestId('room-resize-room-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: 56, translationY: 0 },
            { state: State.END, translationX: 56, translationY: 0 },
        ]);

        // Assert: runOnJS 経由のためコールバックは非同期に呼ばれる
        await waitFor(() => {
            expect(mockOnCommit).toHaveBeenCalledWith({ w: 6, h: 4 });
        });
    });

    it('commits_one_x_one_when_drag_shrinks_below_minimum_size', async () => {
        // Arrange: 5x4 を左上へ大きく縮めるドラッグ → 最小 1x1 で確定
        const mockOnCommit = jest.fn();

        render(
            <ResizeHandle {...roomProps} cellSize={40} onCommit={mockOnCommit} />,
        );

        // Act: -8 セル分（-320px）縮める
        fireGestureHandler(getByGestureTestId('room-resize-room-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: -320, translationY: -320 },
            { state: State.END, translationX: -320, translationY: -320 },
        ]);

        // Assert
        await waitFor(() => {
            expect(mockOnCommit).toHaveBeenCalledWith({ w: 1, h: 1 });
        });
    });

    it('does_not_call_onCommit_when_size_does_not_change', async () => {
        // Arrange
        const mockOnCommit = jest.fn();

        render(
            <ResizeHandle {...roomProps} cellSize={40} onCommit={mockOnCommit} />,
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

    it('clamps_size_to_canvas_edge_when_drag_extends_beyond_bounds', async () => {
        // Arrange: (2,2) の対象はキャンバス 20x20 内で最大 18x18 まで
        const mockOnCommit = jest.fn();

        render(
            <ResizeHandle {...roomProps} cellSize={40} onCommit={mockOnCommit} />,
        );

        // Act: +20 セル分（800px）広げる
        fireGestureHandler(getByGestureTestId('room-resize-room-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: 800, translationY: 800 },
            { state: State.END, translationX: 800, translationY: 800 },
        ]);

        // Assert
        await waitFor(() => {
            expect(mockOnCommit).toHaveBeenCalledWith({ w: 18, h: 18 });
        });
    });

    it('clamps_size_to_arbitrary_max_bounds_for_non_room_targets', async () => {
        // Arrange: 家具ケース。所属部屋 (2,2)〜4×4 内の家具 (3,3,1,1) は
        // 右下端 6 まで広げられる → 最大 3×3
        const mockOnCommit = jest.fn();

        render(
            <ResizeHandle
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
            expect(mockOnCommit).toHaveBeenCalledWith({ w: 3, h: 3 });
        });
    });
});
