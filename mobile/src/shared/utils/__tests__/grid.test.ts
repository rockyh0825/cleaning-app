import { clampWithin, rectsOverlap, snapToGrid } from '../grid';
import type { Point, Rect } from '../grid';

describe('snapToGrid', () => {
    it('snaps_point_to_nearest_grid_cell_when_within_half_cell', () => {
        // Arrange
        const point: Point = { x: 14, y: 6 };

        // Act
        const result = snapToGrid(point, 10);

        // Assert
        expect(result).toEqual({ x: 10, y: 10 });
    });

    it('snaps_to_next_cell_when_past_half_cell_boundary', () => {
        // Arrange
        const point: Point = { x: 16, y: 25 };

        // Act
        const result = snapToGrid(point, 10);

        // Assert
        expect(result).toEqual({ x: 20, y: 30 });
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

    it('works_with_non_zero_parent_origin', () => {
        // Arrange
        const child: Rect = { x: 0, y: 0, w: 3, h: 3 };
        const parent: Rect = { x: 5, y: 5, w: 10, h: 10 };

        // Act
        const result = clampWithin(child, parent);

        // Assert
        expect(result.x).toBeGreaterThanOrEqual(parent.x);
        expect(result.y).toBeGreaterThanOrEqual(parent.y);
    });
});
