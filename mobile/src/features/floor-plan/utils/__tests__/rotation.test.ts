import {
    isQuarterTurn,
    nextRotation,
    rotateClockwise,
    rotationTransform,
} from '../rotation';

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
    it('swaps_grid_size_and_advances_rotation_when_rotated_once', () => {
        // Arrange: 2x3 の未回転の家具
        const furniture = { gridW: 2, gridH: 3, rotation: 0 } as const;

        // Act
        const result = rotateClockwise(furniture);

        // Assert: 占有矩形は 3x2 に入れ替わる
        expect(result).toEqual({ rotation: 90, gridW: 3, gridH: 2 });
    });

    it('swaps_grid_size_on_every_step_including_180', () => {
        // Arrange: 90 度（3x2）から更に 90 度回すと 180 度（2x3）へ戻る
        const furniture = { gridW: 3, gridH: 2, rotation: 90 } as const;

        // Act
        const result = rotateClockwise(furniture);

        // Assert
        expect(result).toEqual({ rotation: 180, gridW: 2, gridH: 3 });
    });

    it('returns_to_original_rotation_and_size_after_four_steps', () => {
        // Arrange: 4 回まわすと元に戻る（回転が可逆であることの不変条件）
        const original = { gridW: 2, gridH: 3, rotation: 0 } as const;

        // Act
        const result = [1, 2, 3, 4].reduce(
            (furniture) => rotateClockwise(furniture),
            original as { gridW: number; gridH: number; rotation: 0 | 90 | 180 | 270 },
        );

        // Assert
        expect(result).toEqual(original);
    });

    it('keeps_square_footprint_unchanged_in_size_when_rotated', () => {
        // Arrange: 正方形は入れ替えても寸法が変わらない（境界値）
        const furniture = { gridW: 2, gridH: 2, rotation: 180 } as const;

        // Act
        const result = rotateClockwise(furniture);

        // Assert
        expect(result).toEqual({ rotation: 270, gridW: 2, gridH: 2 });
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
