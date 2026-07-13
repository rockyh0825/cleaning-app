import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { TabIcon, TAB_ICON_NAMES } from '../TabIcon';

/**
 * react-native-svg は stroke/fill を processColor 済みの
 * { type: 0, payload: uint32(ARGB) } に変換する。hex → その形へ変換する
 * （FurnitureGlyph.test.tsx と同じヘルパー）
 */
function svgColor(hex: string) {
    const rgb = parseInt(hex.slice(1), 16);
    return { type: 0, payload: ((0xff << 24) | rgb) >>> 0 };
}

describe('TabIcon', () => {
    it.each(TAB_ICON_NAMES)('renders_svg_icon_for_%s_tab', (name) => {
        // Arrange & Act
        render(<TabIcon name={name} color="#123456" />);

        // Assert
        expect(screen.getByTestId(`tab-icon-${name}`)).toBeTruthy();
    });

    it.each(TAB_ICON_NAMES)(
        'strokes_%s_icon_with_the_given_tint_color',
        (name) => {
            // Arrange & Act: タブバーの tintColor（アクティブ/非アクティブ）が線色になる
            render(<TabIcon name={name} color="#0C7D72" />);

            // Assert: すべての描画要素が指定色の線で描かれる（塗りに依存しない線画）
            const strokes = screen.getAllByTestId(
                new RegExp(`^tab-icon-${name}-stroke-`),
            );
            expect(strokes.length).toBeGreaterThan(0);
            for (const element of strokes) {
                expect(element.props.stroke).toEqual(svgColor('#0C7D72'));
            }
        },
    );

    it('applies_size_prop_to_svg_dimensions', () => {
        // Arrange & Act
        render(<TabIcon name="heatmap" color="#123456" size={30} />);

        // Assert
        const svg = screen.getByTestId('tab-icon-heatmap');
        expect(svg.props.width).toBe(30);
        expect(svg.props.height).toBe(30);
    });
});
