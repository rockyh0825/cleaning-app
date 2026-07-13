import { withAlpha } from '../color';

describe('withAlpha', () => {
    it('converts_six_digit_hex_to_rgba_with_given_alpha', () => {
        // Arrange & Act
        const result = withAlpha('#FFFFFF', 0.9);

        // Assert
        expect(result).toBe('rgba(255, 255, 255, 0.9)');
    });

    it('converts_lowercase_six_digit_hex_to_rgba', () => {
        // Arrange & Act
        const result = withAlpha('#0c7d72', 0.5);

        // Assert
        expect(result).toBe('rgba(12, 125, 114, 0.5)');
    });

    it('expands_three_digit_shorthand_hex_before_converting', () => {
        // Arrange & Act: #FA0 → #FFAA00
        const result = withAlpha('#FA0', 0.25);

        // Assert
        expect(result).toBe('rgba(255, 170, 0, 0.25)');
    });

    it('clamps_alpha_into_zero_to_one_range', () => {
        // Arrange & Act & Assert: 範囲外の alpha は 0〜1 に丸める
        expect(withAlpha('#FFFFFF', 1.5)).toBe('rgba(255, 255, 255, 1)');
        expect(withAlpha('#FFFFFF', -0.5)).toBe('rgba(255, 255, 255, 0)');
    });

    it('returns_color_unchanged_when_not_a_hex_string', () => {
        // Arrange & Act & Assert: hex 以外はフェイルセーフでそのまま返す
        expect(withAlpha('rgba(20, 35, 31, 0.45)', 0.9)).toBe(
            'rgba(20, 35, 31, 0.45)',
        );
        expect(withAlpha('tomato', 0.9)).toBe('tomato');
        expect(withAlpha('#12345', 0.9)).toBe('#12345');
    });
});
