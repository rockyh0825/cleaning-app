import {
    fitsWithin,
    isQuarterTurn,
    nextRotation,
    rotateClockwise,
    rotationTransform,
} from '../rotation';
import type { Rotation } from '../../types';

describe('nextRotation', () => {
    it('advances_clockwise_by_90_degrees', () => {
        // Arrange & Act & Assert
        expect(nextRotation(0)).toBe(90);
        expect(nextRotation(90)).toBe(180);
        expect(nextRotation(180)).toBe(270);
    });

    it('wraps_around_to_zero_after_270', () => {
        // Arrange & Act & Assert: 270 の次は 360 ではなく 0
        expect(nextRotation(270)).toBe(0);
    });
});

describe('isQuarterTurn', () => {
    it('returns_true_for_90_and_270_because_artwork_axes_swap', () => {
        // Arrange & Act & Assert
        expect(isQuarterTurn(90)).toBe(true);
        expect(isQuarterTurn(270)).toBe(true);
    });

    it('returns_false_for_0_and_180_because_artwork_axes_are_kept', () => {
        // Arrange & Act & Assert
        expect(isQuarterTurn(0)).toBe(false);
        expect(isQuarterTurn(180)).toBe(false);
    });
});

describe('rotateClockwise', () => {
    /** 中心ピボットが可逆であることの不変条件。どこから始めても4タップで元に戻る */
    function rotateTimes(
        furniture: { gridX: number; gridY: number; gridW: number; gridH: number; rotation: Rotation },
        times: number,
    ) {
        let current = furniture;
        for (let i = 0; i < times; i++) current = { ...current, ...rotateClockwise(current) };
        return current;
    }

    it('swaps_the_occupied_size_on_every_step', () => {
        // Arrange
        const furniture = { gridX: 4, gridY: 4, gridW: 3, gridH: 1, rotation: 0 } as const;

        // Act
        const result = rotateClockwise(furniture);

        // Assert: 占有矩形は常に回転後の軸平行矩形
        expect(result.gridW).toBe(1);
        expect(result.gridH).toBe(3);
        expect(result.rotation).toBe(90);
    });

    it('pivots_around_the_center_so_the_furniture_spins_in_place', () => {
        // Arrange: 3x1 を (1,2) に置くと中心は (2.5, 2.5)
        const furniture = { gridX: 1, gridY: 2, gridW: 3, gridH: 1, rotation: 0 } as const;

        // Act
        const result = rotateClockwise(furniture);

        // Assert: 中心 (2.5,2.5) を保ったまま 1x3 になる = (2,1)
        expect(result).toEqual({ rotation: 90, gridW: 1, gridH: 3, gridX: 2, gridY: 1 });
    });

    it('returns_to_the_original_position_and_size_after_four_steps', () => {
        // Arrange: 左上ピボット＋クランプ時代に家具が1セル歩いて余白を残したケース（回帰）
        const original = { gridX: 1, gridY: 2, gridW: 3, gridH: 1, rotation: 0 } as const;

        // Act
        const result = rotateTimes(original, 4);

        // Assert
        expect(result).toEqual(original);
    });

    it('returns_to_the_original_position_after_four_steps_when_the_side_lengths_differ_by_an_odd_number', () => {
        // Arrange: 2x1 は中心が半セルずれるため丸めが必要（境界値）。丸め方向を誤ると1タップ毎に歩く
        const original = { gridX: 5, gridY: 5, gridW: 2, gridH: 1, rotation: 0 } as const;

        // Act
        const result = rotateTimes(original, 4);

        // Assert
        expect(result).toEqual(original);
    });

    it('returns_to_the_original_position_after_two_steps_because_180_degrees_keeps_the_footprint', () => {
        // Arrange: 180 度は占有矩形が元と一致するため位置も元どおりでなければならない
        const original = { gridX: 5, gridY: 5, gridW: 2, gridH: 1, rotation: 0 } as const;

        // Act
        const result = rotateTimes(original, 2);

        // Assert
        expect(result).toEqual({ ...original, rotation: 180 });
    });

    it('keeps_the_position_unchanged_for_a_square_footprint', () => {
        // Arrange: 正方形は縦横が同じなので中心ピボットでも動かない
        const furniture = { gridX: 3, gridY: 7, gridW: 2, gridH: 2, rotation: 90 } as const;

        // Act
        const result = rotateClockwise(furniture);

        // Assert
        expect(result).toEqual({ rotation: 180, gridW: 2, gridH: 2, gridX: 3, gridY: 7 });
    });

    it('rotates_out_of_the_room_instead_of_refusing_so_the_furniture_is_never_stuck', () => {
        // Arrange: 部屋 4x2 の 3x1 は構造的に回せない（異常系）。それでも回転は成立させる
        const furniture = { gridX: 0, gridY: 0, gridW: 3, gridH: 1, rotation: 0 } as const;

        // Act
        const result = rotateClockwise(furniture);

        // Assert: 拒否せず 1x3 を返す。部屋に収まるかの判定は fitsWithin の責務
        expect(result).toEqual({ rotation: 90, gridW: 1, gridH: 3, gridX: 1, gridY: -1 });
    });
});

describe('fitsWithin', () => {
    it('returns_true_when_the_footprint_is_inside_the_room', () => {
        // Arrange & Act & Assert
        expect(fitsWithin({ gridX: 0, gridY: 0, gridW: 3, gridH: 1 }, { gridW: 4, gridH: 2 })).toBe(true);
    });

    it('returns_true_when_the_footprint_exactly_fills_the_room', () => {
        // Arrange & Act & Assert: 境界値。ぴったりは収まっている
        expect(fitsWithin({ gridX: 0, gridY: 0, gridW: 4, gridH: 2 }, { gridW: 4, gridH: 2 })).toBe(true);
    });

    it('returns_false_when_the_footprint_pokes_out_of_the_right_edge', () => {
        // Arrange & Act & Assert
        expect(fitsWithin({ gridX: 2, gridY: 0, gridW: 3, gridH: 1 }, { gridW: 4, gridH: 2 })).toBe(false);
    });

    it('returns_false_when_the_footprint_pokes_out_of_the_top_edge', () => {
        // Arrange & Act & Assert: 中心ピボットは負の座標も生む
        expect(fitsWithin({ gridX: 1, gridY: -1, gridW: 1, gridH: 3 }, { gridW: 4, gridH: 2 })).toBe(false);
    });

    it('returns_false_when_the_footprint_is_taller_than_the_room', () => {
        // Arrange & Act & Assert: 部屋 4x2 に 1x3 は置き場所を問わず収まらない
        expect(fitsWithin({ gridX: 0, gridY: 0, gridW: 1, gridH: 3 }, { gridW: 4, gridH: 2 })).toBe(false);
    });
});

describe('rotationTransform', () => {
    it('returns_undefined_when_not_rotated', () => {
        // Arrange & Act & Assert: 0 度は transform 不要
        expect(rotationTransform(0, 80, 120)).toBeUndefined();
    });

    it('translates_by_width_when_rotated_90_to_keep_glyph_inside_footprint', () => {
        // Arrange & Act: フットプリント 120x80（素材は 80x120）
        const result = rotationTransform(90, 120, 80);

        // Assert: rotate(90) は x を負側へ飛ばすため width ぶん押し戻す
        expect(result).toBe('translate(120, 0) rotate(90)');
    });

    it('translates_by_both_axes_when_rotated_180', () => {
        // Arrange & Act
        const result = rotationTransform(180, 80, 120);

        // Assert
        expect(result).toBe('translate(80, 120) rotate(180)');
    });

    it('translates_by_height_when_rotated_270', () => {
        // Arrange & Act
        const result = rotationTransform(270, 120, 80);

        // Assert: rotate(270) は y を負側へ飛ばすため height ぶん押し戻す
        expect(result).toBe('translate(0, 80) rotate(270)');
    });
});
