import { repeatCount, spreadSlots } from '../parametric';

describe('repeatCount', () => {
    it('returns_floor_of_span_divided_by_base_span', () => {
        // Arrange & Act & Assert: クッション等「数えられる部品」は floor(幅÷基準幅)
        expect(repeatCount(2, 1)).toBe(2);
        expect(repeatCount(3, 1)).toBe(3);
        expect(repeatCount(5, 2)).toBe(2);
    });

    it('returns_at_least_one_even_when_span_is_smaller_than_base', () => {
        // Arrange & Act & Assert: 家具が基準幅より小さくても部品は最低 1 個描く
        expect(repeatCount(0.5, 1)).toBe(1);
        expect(repeatCount(1, 2)).toBe(1);
    });

    it('is_robust_against_floating_point_division_error', () => {
        // Arrange: 1 / 0.2 は二進浮動小数点で 4.999... になる
        // Act & Assert: 誤差で 1 個欠けない
        expect(repeatCount(1, 0.2)).toBe(5);
    });

    it('returns_one_for_non_finite_or_non_positive_span', () => {
        // Arrange & Act & Assert: 異常値でも描画が破綻しないよう 1 に丸める
        expect(repeatCount(0, 1)).toBe(1);
        expect(repeatCount(-2, 1)).toBe(1);
        expect(repeatCount(Number.NaN, 1)).toBe(1);
        expect(repeatCount(Number.POSITIVE_INFINITY, 1)).toBe(1);
        expect(repeatCount(2, 0)).toBe(1);
    });
});

describe('spreadSlots', () => {
    it('divides_range_into_equal_slots_with_gaps_between', () => {
        // Arrange & Act: 区間 [0,100] を gap 10 で 2 分割
        const slots = spreadSlots(0, 100, 2, 10);

        // Assert: 各スロット幅 = (100 - 10) / 2 = 45
        expect(slots).toEqual([
            { start: 0, size: 45 },
            { start: 55, size: 45 },
        ]);
    });

    it('returns_single_full_width_slot_when_count_is_one', () => {
        // Arrange & Act
        const slots = spreadSlots(10, 90, 1, 8);

        // Assert: gap は入らず区間全体が 1 スロット
        expect(slots).toEqual([{ start: 10, size: 80 }]);
    });

    it('returns_empty_list_when_count_is_zero_or_negative', () => {
        // Arrange & Act & Assert
        expect(spreadSlots(0, 100, 0, 10)).toEqual([]);
        expect(spreadSlots(0, 100, -1, 10)).toEqual([]);
    });

    it('returns_empty_list_when_range_is_empty_or_inverted', () => {
        // Arrange & Act & Assert: 極端な縮小で区間が潰れても描画部品を出さない
        expect(spreadSlots(50, 50, 2, 10)).toEqual([]);
        expect(spreadSlots(80, 20, 2, 10)).toEqual([]);
    });

    it('clamps_slot_size_to_zero_when_gaps_exceed_range', () => {
        // Arrange & Act: gap 合計が区間より大きい → サイズ 0 に丸めて負値を出さない
        const slots = spreadSlots(0, 10, 3, 20);

        // Assert
        expect(slots).toHaveLength(3);
        for (const slot of slots) {
            expect(slot.size).toBe(0);
        }
    });
});
