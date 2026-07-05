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

import { commitDrag, previewOffset } from '../useDragToGrid';

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
