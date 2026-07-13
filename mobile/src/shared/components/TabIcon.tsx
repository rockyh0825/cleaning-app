import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

/** タブ名（expo-router のルート名と対応） */
export const TAB_ICON_NAMES = ['floor-plan', 'heatmap', 'history'] as const;

export type TabIconName = (typeof TAB_ICON_NAMES)[number];

type Props = {
    name: TabIconName;
    /** タブバーの tintColor（アクティブ = primary / 非アクティブ = textMuted） */
    color: string;
    size?: number;
};

/**
 * タブバー用のラインアイコン（Fresh Air トーン: 細い線のシンプルな図形）。
 * 絵文字と違い tintColor がそのまま線色になるため、
 * アクティブ/非アクティブの状態がテーマトークンと連動する。
 */
export function TabIcon({ name, color, size = 24 }: Props) {
    const strokeProps = {
        stroke: color,
        strokeWidth: 1.8,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        fill: 'none',
    } as const;

    return (
        <Svg
            testID={`tab-icon-${name}`}
            width={size}
            height={size}
            viewBox="0 0 24 24"
        >
            {name === 'floor-plan' && (
                <>
                    {/* 家の輪郭（屋根 + 壁） */}
                    <Path
                        testID="tab-icon-floor-plan-stroke-outline"
                        d="M4 11.5 L12 4.5 L20 11.5 M6 10 V19.5 H18 V10"
                        {...strokeProps}
                    />
                    {/* ドア */}
                    <Path
                        testID="tab-icon-floor-plan-stroke-door"
                        d="M10 19.5 V14.5 H14 V19.5"
                        {...strokeProps}
                    />
                </>
            )}
            {name === 'heatmap' && (
                <Path
                    testID="tab-icon-heatmap-stroke-flame"
                    d="M12 4.5 C13.8 7.3 16.6 9 16.6 12.6 A4.6 4.6 0 0 1 7.4 12.6 C7.4 10.8 8.2 9.4 9.3 8.2 C9.7 9.5 10.4 10.4 11.4 11.1 C10.9 8.7 11.2 6.5 12 4.5 Z"
                    {...strokeProps}
                />
            )}
            {name === 'history' && (
                <>
                    {/* 文字盤 */}
                    <Circle
                        testID="tab-icon-history-stroke-face"
                        cx={12}
                        cy={12}
                        r={7.75}
                        {...strokeProps}
                    />
                    {/* 針（短針 + 長針） */}
                    <Path
                        testID="tab-icon-history-stroke-hands"
                        d="M12 8 V12 L15 13.7"
                        {...strokeProps}
                    />
                </>
            )}
        </Svg>
    );
}
