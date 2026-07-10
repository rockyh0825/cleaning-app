import type { Rect } from '@/shared/utils/grid';
import {
    CORNERS,
    cornerBounds,
    cornerPoint,
    rectFromCorner,
} from '../cornerResize';

describe('cornerResize', () => {
    // 部屋 (2,2) 起点・5×4、キャンバス 20×20 を基本ケースとする
    const rect: Rect = { x: 2, y: 2, w: 5, h: 4 };
    const maxRight = 20;
    const maxBottom = 20;

    describe('cornerPoint', () => {
        it('returns_each_corner_grid_coordinate_of_the_rect', () => {
            // Arrange & Act & Assert: 各角のグリッド座標（右端・下端は x+w / y+h）
            expect(cornerPoint(rect, 'tl')).toEqual({ x: 2, y: 2 });
            expect(cornerPoint(rect, 'tr')).toEqual({ x: 7, y: 2 });
            expect(cornerPoint(rect, 'bl')).toEqual({ x: 2, y: 6 });
            expect(cornerPoint(rect, 'br')).toEqual({ x: 7, y: 6 });
        });
    });

    describe('cornerBounds', () => {
        it('limits_bottom_right_corner_between_min_size_and_canvas_edge', () => {
            // Arrange & Act: 右下角は「左上+1」〜キャンバス端まで動ける
            const bounds = cornerBounds(rect, 'br', maxRight, maxBottom);

            // Assert: x∈[3,20], y∈[3,20]（clampWithin の parent 形式）
            expect(bounds).toEqual({ x: 3, y: 3, w: 17, h: 17 });
        });

        it('limits_top_left_corner_between_origin_and_min_size', () => {
            // Arrange & Act: 左上角は 0〜「右下-1」まで動ける（最小 1×1 を維持）
            const bounds = cornerBounds(rect, 'tl', maxRight, maxBottom);

            // Assert: x∈[0,6], y∈[0,5]
            expect(bounds).toEqual({ x: 0, y: 0, w: 6, h: 5 });
        });

        it('limits_top_right_corner_with_mixed_edges', () => {
            // Arrange & Act: x は右方向（最小幅1〜キャンバス端）、y は上方向（0〜最小高さ1）
            const bounds = cornerBounds(rect, 'tr', maxRight, maxBottom);

            // Assert: x∈[3,20], y∈[0,5]
            expect(bounds).toEqual({ x: 3, y: 0, w: 17, h: 5 });
        });

        it('limits_bottom_left_corner_with_mixed_edges', () => {
            // Arrange & Act
            const bounds = cornerBounds(rect, 'bl', maxRight, maxBottom);

            // Assert: x∈[0,6], y∈[3,20]
            expect(bounds).toEqual({ x: 0, y: 3, w: 6, h: 17 });
        });
    });

    describe('rectFromCorner', () => {
        it('resizes_from_bottom_right_keeping_top_left_anchored', () => {
            // Arrange & Act: 右下角を (9,8) へ → 幅 7・高さ 6
            const next = rectFromCorner(rect, 'br', { x: 9, y: 8 });

            // Assert
            expect(next).toEqual({ x: 2, y: 2, w: 7, h: 6 });
        });

        it('resizes_from_top_left_keeping_bottom_right_anchored', () => {
            // Arrange & Act: 左上角を (1,1) へ → 右下 (7,6) は固定のまま拡大
            const next = rectFromCorner(rect, 'tl', { x: 1, y: 1 });

            // Assert
            expect(next).toEqual({ x: 1, y: 1, w: 6, h: 5 });
        });

        it('resizes_from_top_right_keeping_bottom_left_anchored', () => {
            // Arrange & Act: 右上角を (9,1) へ → 左下 (2,6) は固定
            const next = rectFromCorner(rect, 'tr', { x: 9, y: 1 });

            // Assert
            expect(next).toEqual({ x: 2, y: 1, w: 7, h: 5 });
        });

        it('resizes_from_bottom_left_keeping_top_right_anchored', () => {
            // Arrange & Act: 左下角を (4,8) へ → 右上 (7,2) は固定
            const next = rectFromCorner(rect, 'bl', { x: 4, y: 8 });

            // Assert
            expect(next).toEqual({ x: 4, y: 2, w: 3, h: 6 });
        });

        it('returns_the_original_rect_when_corner_point_is_unmoved', () => {
            // Arrange & Act & Assert: 角座標をそのまま戻すと恒等（プレビュー初期値の整合）
            for (const corner of CORNERS) {
                expect(rectFromCorner(rect, corner, cornerPoint(rect, corner))).toEqual(
                    rect,
                );
            }
        });
    });
});
