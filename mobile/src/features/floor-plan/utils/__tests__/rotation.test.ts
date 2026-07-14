import {
    isQuarterTurn,
    nextRotation,
    rotateClockwiseWithin,
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

describe('rotateClockwiseWithin', () => {
    /** 十分に広い部屋（クランプも拒否も起きない） */
    const spaciousRoom = { gridW: 10, gridH: 10 } as const;

    it('swaps_grid_size_and_advances_rotation_when_rotated_once', () => {
        // Arrange: 2x3 の未回転の家具
        const furniture = { gridX: 0, gridY: 0, gridW: 2, gridH: 3, rotation: 0 } as const;

        // Act
        const result = rotateClockwiseWithin(furniture, spaciousRoom);

        // Assert: 占有矩形は 3x2 に入れ替わる
        expect(result).toEqual({ rotation: 90, gridW: 3, gridH: 2, gridX: 0, gridY: 0 });
    });

    it('swaps_grid_size_on_every_step_including_180', () => {
        // Arrange: 90 度（3x2）から更に 90 度回すと 180 度（2x3）へ戻る
        const furniture = { gridX: 1, gridY: 1, gridW: 3, gridH: 2, rotation: 90 } as const;

        // Act
        const result = rotateClockwiseWithin(furniture, spaciousRoom);

        // Assert
        expect(result).toEqual({ rotation: 180, gridW: 2, gridH: 3, gridX: 1, gridY: 1 });
    });

    it('wraps_around_to_zero_rotation_after_270', () => {
        // Arrange: 270 度（3x2）の次は 0 度・2x3（境界値）
        const furniture = { gridX: 0, gridY: 0, gridW: 3, gridH: 2, rotation: 270 } as const;

        // Act
        const result = rotateClockwiseWithin(furniture, spaciousRoom);

        // Assert
        expect(result).toEqual({ rotation: 0, gridW: 2, gridH: 3, gridX: 0, gridY: 0 });
    });

    it('keeps_square_footprint_unchanged_in_size_when_rotated', () => {
        // Arrange: 正方形は入れ替えても寸法が変わらない（境界値）
        const furniture = { gridX: 0, gridY: 0, gridW: 2, gridH: 2, rotation: 180 } as const;

        // Act
        const result = rotateClockwiseWithin(furniture, spaciousRoom);

        // Assert
        expect(result).toEqual({ rotation: 270, gridW: 2, gridH: 2, gridX: 0, gridY: 0 });
    });

    it('returns_to_original_rotation_and_size_after_four_steps', () => {
        // Arrange: 4 回まわすと元に戻る（回転が可逆であることの不変条件）
        const original = { gridX: 0, gridY: 0, gridW: 2, gridH: 3, rotation: 0 } as const;

        // Act
        const result = [1, 2, 3, 4].reduce<{
            gridX: number;
            gridY: number;
            gridW: number;
            gridH: number;
            rotation: Rotation;
        }>(
            (furniture) => rotateClockwiseWithin(furniture, spaciousRoom)!,
            original,
        );

        // Assert
        expect(result).toEqual(original);
    });

    it('clamps_position_so_the_rotated_footprint_stays_inside_the_room', () => {
        // Arrange: 部屋 10x8。1x5 の家具を右端 x=9 に置くと、90 度回した 5x1 は右へはみ出す
        const furniture = { gridX: 9, gridY: 0, gridW: 1, gridH: 5, rotation: 0 } as const;

        // Act
        const result = rotateClockwiseWithin(furniture, { gridW: 10, gridH: 8 });

        // Assert: サイズは入れ替えたまま、位置だけ右端 x=5 へ押し戻す
        expect(result).toEqual({ rotation: 90, gridW: 5, gridH: 1, gridX: 5, gridY: 0 });
    });

    it('returns_null_when_the_rotated_size_does_not_fit_the_room', () => {
        // Arrange: 部屋 4x2。3x1 のソファを回すと 1x3 になり高さ 2 に収まらない（異常系）
        const furniture = { gridX: 0, gridY: 0, gridW: 3, gridH: 1, rotation: 0 } as const;

        // Act
        const result = rotateClockwiseWithin(furniture, { gridW: 4, gridH: 2 });

        // Assert: 縮めるくらいなら回さない（回転は不可逆な情報欠損を起こしてはならない）
        expect(result).toBeNull();
    });

    it('returns_null_when_the_rotated_width_alone_exceeds_the_room', () => {
        // Arrange: 部屋 4x8。1x8 の家具を回すと 8x1 で幅 4 に収まらない（異常系）
        const furniture = { gridX: 0, gridY: 0, gridW: 1, gridH: 8, rotation: 0 } as const;

        // Act
        const result = rotateClockwiseWithin(furniture, { gridW: 4, gridH: 8 });

        // Assert
        expect(result).toBeNull();
    });

    it('rotates_when_the_swapped_size_exactly_fills_the_room_width', () => {
        // Arrange: 部屋 3x3。2x3 の家具を回した 3x2 は幅がちょうど部屋幅と一致する（境界値）
        const furniture = { gridX: 0, gridY: 0, gridW: 2, gridH: 3, rotation: 0 } as const;

        // Act
        const result = rotateClockwiseWithin(furniture, { gridW: 3, gridH: 3 });

        // Assert: ちょうど収まる場合は拒否しない
        expect(result).toEqual({ rotation: 90, gridW: 3, gridH: 2, gridX: 0, gridY: 0 });
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
