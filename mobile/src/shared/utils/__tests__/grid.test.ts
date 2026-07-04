import { clampWithin, findFreePosition, pxOffsetToGridDelta, rectsOverlap, snapToGrid } from '../grid';
import type { Point, Rect } from '../grid';

describe('snapToGrid', () => {
    it('snaps_down_to_lower_cell_when_below_half_cell_boundary', () => {
        // Arrange: x=14 は境界 15 未満 → 10 にスナップ
        const point: Point = { x: 14, y: 4 };

        // Act
        const result = snapToGrid(point, 10);

        // Assert
        expect(result).toEqual({ x: 10, y: 0 });
    });

    it('snaps_up_to_upper_cell_when_above_half_cell_boundary', () => {
        // Arrange: x=16 は境界 15 超 → 20 にスナップ
        const point: Point = { x: 16, y: 6 };

        // Act
        const result = snapToGrid(point, 10);

        // Assert
        expect(result).toEqual({ x: 20, y: 10 });
    });

    it('snaps_up_when_exactly_on_half_cell_boundary', () => {
        // Arrange: x=5 は Math.round(0.5) = 1 なので 10 にスナップ (round half up)
        const point: Point = { x: 5, y: 15 };

        // Act
        const result = snapToGrid(point, 10);

        // Assert
        expect(result).toEqual({ x: 10, y: 20 });
    });

    it('returns_same_point_when_already_on_grid_boundary', () => {
        // Arrange
        const point: Point = { x: 20, y: 30 };

        // Act
        const result = snapToGrid(point, 10);

        // Assert
        expect(result).toEqual({ x: 20, y: 30 });
    });

    it('returns_origin_when_point_is_zero', () => {
        // Arrange
        const point: Point = { x: 0, y: 0 };

        // Act
        const result = snapToGrid(point, 10);

        // Assert
        expect(result).toEqual({ x: 0, y: 0 });
    });

    it('returns_point_unchanged_when_cell_size_is_zero', () => {
        // Arrange
        const point: Point = { x: 15, y: 25 };

        // Act
        const result = snapToGrid(point, 0);

        // Assert
        expect(result).toEqual({ x: 15, y: 25 });
    });

    it('returns_point_unchanged_when_cell_size_is_infinity', () => {
        // Arrange
        const point: Point = { x: 15, y: 25 };

        // Act
        const result = snapToGrid(point, Infinity);

        // Assert
        expect(result).toEqual({ x: 15, y: 25 });
    });

    it('returns_point_unchanged_when_cell_size_is_nan', () => {
        // Arrange
        const point: Point = { x: 15, y: 25 };

        // Act
        const result = snapToGrid(point, NaN);

        // Assert
        expect(result).toEqual({ x: 15, y: 25 });
    });

    it('snaps_negative_coordinates_to_nearest_grid_cell', () => {
        // Arrange
        const point: Point = { x: -14, y: -6 };

        // Act
        const result = snapToGrid(point, 10);

        // Assert
        expect(result).toEqual({ x: -10, y: -10 });
    });
});

describe('rectsOverlap', () => {
    it('returns_true_when_rects_overlap_in_center', () => {
        // Arrange
        const a: Rect = { x: 0, y: 0, w: 10, h: 10 };
        const b: Rect = { x: 5, y: 5, w: 10, h: 10 };

        // Act & Assert
        expect(rectsOverlap(a, b)).toBe(true);
    });

    it('returns_true_when_one_rect_is_fully_inside_another', () => {
        // Arrange
        const outer: Rect = { x: 0, y: 0, w: 20, h: 20 };
        const inner: Rect = { x: 5, y: 5, w: 5, h: 5 };

        // Act & Assert
        expect(rectsOverlap(outer, inner)).toBe(true);
    });

    it('returns_false_when_rects_are_completely_separate_horizontally', () => {
        // Arrange
        const a: Rect = { x: 0, y: 0, w: 5, h: 10 };
        const b: Rect = { x: 10, y: 0, w: 5, h: 10 };

        // Act & Assert
        expect(rectsOverlap(a, b)).toBe(false);
    });

    it('returns_false_when_rects_are_completely_separate_vertically', () => {
        // Arrange
        const a: Rect = { x: 0, y: 0, w: 10, h: 5 };
        const b: Rect = { x: 0, y: 10, w: 10, h: 5 };

        // Act & Assert
        expect(rectsOverlap(a, b)).toBe(false);
    });

    it('returns_false_when_rects_share_only_an_edge_horizontally', () => {
        // Arrange
        const a: Rect = { x: 0, y: 0, w: 10, h: 10 };
        const b: Rect = { x: 10, y: 0, w: 10, h: 10 };

        // Act & Assert
        expect(rectsOverlap(a, b)).toBe(false);
    });

    it('returns_false_when_rects_share_only_an_edge_vertically', () => {
        // Arrange
        const a: Rect = { x: 0, y: 0, w: 10, h: 10 };
        const b: Rect = { x: 0, y: 10, w: 10, h: 10 };

        // Act & Assert
        expect(rectsOverlap(a, b)).toBe(false);
    });

    it('returns_false_when_rects_share_only_a_corner', () => {
        // Arrange
        const a: Rect = { x: 0, y: 0, w: 5, h: 5 };
        const b: Rect = { x: 5, y: 5, w: 5, h: 5 };

        // Act & Assert
        expect(rectsOverlap(a, b)).toBe(false);
    });

    it('is_commutative_when_order_of_rects_is_reversed', () => {
        // Arrange
        const a: Rect = { x: 0, y: 0, w: 10, h: 10 };
        const b: Rect = { x: 5, y: 5, w: 10, h: 10 };

        // Act & Assert
        expect(rectsOverlap(a, b)).toBe(rectsOverlap(b, a));
    });
});

describe('clampWithin', () => {
    it('returns_child_unchanged_when_already_within_parent', () => {
        // Arrange
        const child: Rect = { x: 2, y: 2, w: 3, h: 3 };
        const parent: Rect = { x: 0, y: 0, w: 10, h: 10 };

        // Act
        const result = clampWithin(child, parent);

        // Assert
        expect(result).toEqual({ x: 2, y: 2, w: 3, h: 3 });
    });

    it('clamps_child_to_right_edge_when_overflowing_right', () => {
        // Arrange
        const child: Rect = { x: 8, y: 0, w: 5, h: 5 };
        const parent: Rect = { x: 0, y: 0, w: 10, h: 10 };

        // Act
        const result = clampWithin(child, parent);

        // Assert
        expect(result).toEqual({ x: 5, y: 0, w: 5, h: 5 });
    });

    it('clamps_child_to_bottom_edge_when_overflowing_bottom', () => {
        // Arrange
        const child: Rect = { x: 0, y: 8, w: 5, h: 5 };
        const parent: Rect = { x: 0, y: 0, w: 10, h: 10 };

        // Act
        const result = clampWithin(child, parent);

        // Assert
        expect(result).toEqual({ x: 0, y: 5, w: 5, h: 5 });
    });

    it('clamps_child_to_left_edge_when_x_is_negative', () => {
        // Arrange
        const child: Rect = { x: -3, y: 0, w: 5, h: 5 };
        const parent: Rect = { x: 0, y: 0, w: 10, h: 10 };

        // Act
        const result = clampWithin(child, parent);

        // Assert
        expect(result).toEqual({ x: 0, y: 0, w: 5, h: 5 });
    });

    it('clamps_child_to_top_edge_when_y_is_negative', () => {
        // Arrange
        const child: Rect = { x: 0, y: -3, w: 5, h: 5 };
        const parent: Rect = { x: 0, y: 0, w: 10, h: 10 };

        // Act
        const result = clampWithin(child, parent);

        // Assert
        expect(result).toEqual({ x: 0, y: 0, w: 5, h: 5 });
    });

    it('preserves_child_size_when_clamping', () => {
        // Arrange
        const child: Rect = { x: 20, y: 20, w: 4, h: 6 };
        const parent: Rect = { x: 0, y: 0, w: 10, h: 10 };

        // Act
        const result = clampWithin(child, parent);

        // Assert
        expect(result.w).toBe(4);
        expect(result.h).toBe(6);
    });

    it('places_child_at_parent_origin_when_child_is_larger_than_parent', () => {
        // Arrange
        const child: Rect = { x: 0, y: 0, w: 20, h: 20 };
        const parent: Rect = { x: 0, y: 0, w: 10, h: 10 };

        // Act
        const result = clampWithin(child, parent);

        // Assert
        expect(result.x).toBe(parent.x);
        expect(result.y).toBe(parent.y);
    });

    it('clamps_child_to_parent_origin_when_child_is_outside_non_zero_parent', () => {
        // Arrange: child が parent 左上より外に出ている → parent.x/y に揃える
        const child: Rect = { x: 0, y: 0, w: 3, h: 3 };
        const parent: Rect = { x: 5, y: 5, w: 10, h: 10 };

        // Act
        const result = clampWithin(child, parent);

        // Assert
        expect(result.x).toBe(parent.x);
        expect(result.y).toBe(parent.y);
    });
});

describe('findFreePosition', () => {
    const bounds: Rect = { x: 0, y: 0, w: 20, h: 20 };

    it('returns_origin_when_there_are_no_obstacles', () => {
        // Arrange
        const size = { w: 3, h: 3 };

        // Act
        const result = findFreePosition(size, [], bounds);

        // Assert
        expect(result).toEqual({ x: 0, y: 0 });
    });

    it('returns_next_free_position_when_origin_is_occupied', () => {
        // Arrange: (0,0) に 3x3 の障害物 → 行優先走査で右隣 (3,0) が最初の空き
        const size = { w: 3, h: 3 };
        const obstacles: Rect[] = [{ x: 0, y: 0, w: 3, h: 3 }];

        // Act
        const result = findFreePosition(size, obstacles, bounds);

        // Assert
        expect(result).toEqual({ x: 3, y: 0 });
    });

    it('scans_row_first_before_moving_to_next_row', () => {
        // Arrange: 1行目が幅いっぱい埋まっている → 2行目の先頭 (0,2) が最初の空き
        const size = { w: 3, h: 3 };
        const obstacles: Rect[] = [{ x: 0, y: 0, w: 20, h: 2 }];

        // Act
        const result = findFreePosition(size, obstacles, bounds);

        // Assert
        expect(result).toEqual({ x: 0, y: 2 });
    });

    it('returns_position_when_size_exactly_fits_remaining_space', () => {
        // Arrange: 左 18 列がすべて埋まり、右端 2 列だけ空き → 2x20 がぴったり収まる
        const size = { w: 2, h: 20 };
        const obstacles: Rect[] = [{ x: 0, y: 0, w: 18, h: 20 }];

        // Act
        const result = findFreePosition(size, obstacles, bounds);

        // Assert
        expect(result).toEqual({ x: 18, y: 0 });
    });

    it('returns_null_when_canvas_is_completely_occupied', () => {
        // Arrange
        const size = { w: 1, h: 1 };
        const obstacles: Rect[] = [{ x: 0, y: 0, w: 20, h: 20 }];

        // Act
        const result = findFreePosition(size, obstacles, bounds);

        // Assert
        expect(result).toBeNull();
    });

    it('returns_null_when_size_is_larger_than_bounds', () => {
        // Arrange
        const size = { w: 21, h: 5 };

        // Act
        const result = findFreePosition(size, [], bounds);

        // Assert
        expect(result).toBeNull();
    });

    it('respects_non_zero_bounds_origin', () => {
        // Arrange: bounds が (5,5) 起点 → 空きが無ければ探索は bounds 内のみ
        const offsetBounds: Rect = { x: 5, y: 5, w: 4, h: 4 };
        const size = { w: 2, h: 2 };
        const obstacles: Rect[] = [{ x: 5, y: 5, w: 2, h: 2 }];

        // Act
        const result = findFreePosition(size, obstacles, offsetBounds);

        // Assert
        expect(result).toEqual({ x: 7, y: 5 });
    });
});

describe('pxOffsetToGridDelta', () => {
    it('returns_one_cell_delta_when_offset_equals_cell_size', () => {
        // Arrange
        const offsetPx: Point = { x: 40, y: -40 };

        // Act
        const result = pxOffsetToGridDelta(offsetPx, 40, 1);

        // Assert
        expect(result).toEqual({ x: 1, y: -1 });
    });

    it('rounds_half_cell_offset_up_per_round_half_up_spec', () => {
        // Arrange: セル半分ちょうど（20px / 40px）→ 四捨五入で 1 セル
        const offsetPx: Point = { x: 20, y: 20 };

        // Act
        const result = pxOffsetToGridDelta(offsetPx, 40, 1);

        // Assert
        expect(result).toEqual({ x: 1, y: 1 });
    });

    it('rounds_below_half_cell_offset_to_zero', () => {
        // Arrange: セル半分未満（19px / 40px）→ 0 セル
        const offsetPx: Point = { x: 19, y: -19 };

        // Act
        const result = pxOffsetToGridDelta(offsetPx, 40, 1);

        // Assert
        expect(result).toEqual({ x: 0, y: -0 });
    });

    it('halves_px_conversion_when_zoomed_2x', () => {
        // Arrange: ズーム2x では 1 セルが画面上 80px → 80px のドラッグで 1 セル
        const offsetPx: Point = { x: 80, y: 80 };

        // Act
        const result = pxOffsetToGridDelta(offsetPx, 40, 2);

        // Assert
        expect(result).toEqual({ x: 1, y: 1 });
    });

    it('returns_zero_delta_when_cell_size_is_zero', () => {
        // Arrange
        const offsetPx: Point = { x: 100, y: 100 };

        // Act
        const result = pxOffsetToGridDelta(offsetPx, 0, 1);

        // Assert
        expect(result).toEqual({ x: 0, y: 0 });
    });

    it('returns_zero_delta_when_scale_is_zero_or_negative', () => {
        // Arrange
        const offsetPx: Point = { x: 100, y: 100 };

        // Act & Assert
        expect(pxOffsetToGridDelta(offsetPx, 40, 0)).toEqual({ x: 0, y: 0 });
        expect(pxOffsetToGridDelta(offsetPx, 40, -1)).toEqual({ x: 0, y: 0 });
    });

    it('defaults_scale_to_1_when_omitted', () => {
        // Arrange
        const offsetPx: Point = { x: 40, y: 40 };

        // Act
        const result = pxOffsetToGridDelta(offsetPx, 40);

        // Assert
        expect(result).toEqual({ x: 1, y: 1 });
    });
});
