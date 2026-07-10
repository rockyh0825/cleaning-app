// unit プロジェクト（node 環境）では RN ネイティブモジュールを読み込めないため、
// フック本体が import するライブラリをモックし、純関数 commitDrag のみを検証する
jest.mock('react-native-gesture-handler', () => ({
    Gesture: { Pan: jest.fn() },
}));
jest.mock('react-native-reanimated', () => ({
    useSharedValue: jest.fn(),
    useAnimatedStyle: jest.fn(),
    runOnJS: (fn: unknown) => fn,
}));

import { commitDrag, previewOffset, snapDragRect } from '../useDragToGrid';

describe('commitDrag', () => {
    const bounds = { x: 0, y: 0, w: 20, h: 20 };
    const cellSize = 30;

    it('commits_one_cell_move_when_offset_is_one_point_four_cells', () => {
        // Arrange
        const rect = { x: 2, y: 2, w: 4, h: 4 };
        const offsetPx = { x: cellSize * 1.4, y: 0 };

        // Act
        const result = commitDrag({ rect, offsetPx, cellSize, bounds });

        // Assert
        expect(result).toEqual({ x: 3, y: 2, w: 4, h: 4 });
    });

    it('commits_rect_clamped_to_bounds_when_dragged_three_cells_outside', () => {
        // Arrange: (14,14) の 4x4 を右下へ 3 セル分 → (17,17) は境界超え → (16,16) にクランプ
        const rect = { x: 14, y: 14, w: 4, h: 4 };
        const offsetPx = { x: cellSize * 3, y: cellSize * 3 };

        // Act
        const result = commitDrag({ rect, offsetPx, cellSize, bounds });

        // Assert
        expect(result).toEqual({ x: 16, y: 16, w: 4, h: 4 });
    });

    it('returns_null_when_offset_is_zero', () => {
        // Arrange
        const rect = { x: 2, y: 2, w: 4, h: 4 };
        const offsetPx = { x: 0, y: 0 };

        // Act
        const result = commitDrag({ rect, offsetPx, cellSize, bounds });

        // Assert
        expect(result).toBeNull();
    });

    it('returns_null_when_clamped_position_equals_original', () => {
        // Arrange: 右端 (16,2) の 4x4 をさらに右へ 3 セル分 → クランプ後も (16,2) のまま
        const rect = { x: 16, y: 2, w: 4, h: 4 };
        const offsetPx = { x: cellSize * 3, y: 0 };

        // Act
        const result = commitDrag({ rect, offsetPx, cellSize, bounds });

        // Assert
        expect(result).toBeNull();
    });

    it('halves_px_to_grid_conversion_when_scale_is_two', () => {
        // Arrange: ズーム 2x では画面上 1 セルが cellSize*2 px になる
        const rect = { x: 2, y: 2, w: 4, h: 4 };
        const offsetPx = { x: cellSize * 2, y: 0 };

        // Act
        const result = commitDrag({ rect, offsetPx, cellSize, scale: 2, bounds });

        // Assert
        expect(result).toEqual({ x: 3, y: 2, w: 4, h: 4 });
    });
});

describe('snapDragRect', () => {
    const bounds = { x: 0, y: 0, w: 20, h: 20 };
    const cellSize = 30;

    it('returns_snapped_rect_when_offset_is_one_point_four_cells', () => {
        // Arrange: commitDrag と同じ丸め結果になること（プレビューと確定の一致）
        const rect = { x: 2, y: 2, w: 4, h: 4 };
        const offsetPx = { x: cellSize * 1.4, y: 0 };

        // Act
        const result = snapDragRect({ rect, offsetPx, cellSize, bounds });

        // Assert
        expect(result).toEqual({ x: 3, y: 2, w: 4, h: 4 });
    });

    it('returns_current_rect_instead_of_null_when_offset_is_zero', () => {
        // Arrange: commitDrag は null を返すが、プレビューは常に現在サイズを表示する
        const rect = { x: 2, y: 2, w: 4, h: 4 };
        const offsetPx = { x: 0, y: 0 };

        // Act
        const result = snapDragRect({ rect, offsetPx, cellSize, bounds });

        // Assert
        expect(result).toEqual({ x: 2, y: 2, w: 4, h: 4 });
    });

    it('clamps_to_bounds_when_dragged_outside', () => {
        // Arrange: リサイズ空間の読み替え（x=幅, y=高さ, w=h=0）。5x4 を +20 セル拡大
        // → (2,2) 起点でキャンバス 20 まで最大 18x18
        const rect = { x: 5, y: 4, w: 0, h: 0 };
        const offsetPx = { x: cellSize * 20, y: cellSize * 20 };
        const sizeBounds = { x: 1, y: 1, w: 20 - 2 - 1, h: 20 - 2 - 1 };

        // Act
        const result = snapDragRect({ rect, offsetPx, cellSize, bounds: sizeBounds });

        // Assert
        expect(result).toEqual({ x: 18, y: 18, w: 0, h: 0 });
    });
});

describe('previewOffset', () => {
    it('returns_offset_unchanged_when_scale_is_one', () => {
        // Arrange
        const offsetPx = { x: 80, y: -40 };

        // Act
        const result = previewOffset(offsetPx, 1);

        // Assert
        expect(result).toEqual({ x: 80, y: -40 });
    });

    it('halves_offset_when_scale_is_two_so_preview_matches_finger', () => {
        // Arrange: scale 変換の外側で指が 80px 動くと、内側では 40px が見かけ 80px になる
        const offsetPx = { x: 80, y: -40 };

        // Act
        const result = previewOffset(offsetPx, 2);

        // Assert
        expect(result).toEqual({ x: 40, y: -20 });
    });

    it('doubles_offset_when_scale_is_half', () => {
        // Arrange
        const offsetPx = { x: 80, y: -40 };

        // Act
        const result = previewOffset(offsetPx, 0.5);

        // Assert
        expect(result).toEqual({ x: 160, y: -80 });
    });

    it('treats_zero_or_non_finite_scale_as_identity', () => {
        // Arrange
        const offsetPx = { x: 80, y: -40 };

        // Act & Assert: ゼロ除算・NaN を返さず等倍として扱う
        expect(previewOffset(offsetPx, 0)).toEqual({ x: 80, y: -40 });
        expect(previewOffset(offsetPx, NaN)).toEqual({ x: 80, y: -40 });
        expect(previewOffset(offsetPx, Infinity)).toEqual({ x: 80, y: -40 });
    });
});
