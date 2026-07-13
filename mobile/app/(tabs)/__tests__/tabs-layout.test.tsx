import React from 'react';
import { View } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import TabsLayout from '../_layout';

/**
 * react-native-svg は stroke を processColor 済みの
 * { type: 0, payload: uint32(ARGB) } に変換する（FurnitureGlyph.test.tsx と同じ）
 */
function svgColor(hex: string) {
    const rgb = parseInt(hex.slice(1), 16);
    return { type: 0, payload: ((0xff << 24) | rgb) >>> 0 };
}

const TINT = '#123456';

// expo-router の Tabs をモックし、各 Screen の tabBarIcon をタブバーと同じ
// 契約（{ color, size, focused }）で描画してアイコン配線だけを検証する
jest.mock('expo-router', () => {
    const ReactActual = jest.requireActual<typeof React>('react');
    const { View: RNView } = jest.requireActual<{ View: typeof View }>(
        'react-native',
    );
    function Tabs({ children }: { children: React.ReactNode }) {
        return ReactActual.createElement(RNView, null, children);
    }
    Tabs.Screen = function Screen({
        name,
        options,
    }: {
        name: string;
        options?: {
            tabBarIcon?: (args: {
                color: string;
                size: number;
                focused: boolean;
            }) => React.ReactNode;
        };
    }) {
        return ReactActual.createElement(
            RNView,
            { testID: `tab-screen-${name}` },
            options?.tabBarIcon?.({ color: '#123456', size: 24, focused: false }),
        );
    };
    return { Tabs };
});

describe('TabsLayout（タブバーアイコン）', () => {
    it('renders_svg_tab_icons_for_all_three_tabs', () => {
        // Arrange & Act
        render(<TabsLayout />);

        // Assert: 絵文字ではなく SVG の TabIcon が3タブぶん描画される
        expect(screen.getByTestId('tab-icon-floor-plan')).toBeTruthy();
        expect(screen.getByTestId('tab-icon-heatmap')).toBeTruthy();
        expect(screen.getByTestId('tab-icon-history')).toBeTruthy();
    });

    it('passes_tab_bar_tint_color_through_to_icon_strokes', () => {
        // Arrange & Act
        render(<TabsLayout />);

        // Assert: タブバーが渡す tintColor がそのまま線色になる
        const flame = screen.getByTestId('tab-icon-heatmap-stroke-flame');
        expect(flame.props.stroke).toEqual(svgColor(TINT));
    });
});
