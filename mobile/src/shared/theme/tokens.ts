import type { TextStyle, ViewStyle } from 'react-native';
import { RoomType } from '@/shared/api/models/RoomType';

// palette: 生値。コンポーネントからは直接参照せず semantic tokens 経由で使う
// 「Fresh Air」パレット: 清潔感のあるティール + 緑バイアスのニュートラル
const palette = {
    white: '#FFFFFF',
    // ニュートラル（ミント微含みのオフホワイト〜ダークグリーン）
    mint50: '#F6FAF9',
    mint100: '#EEF5F3',
    sage200: '#E2ECE9',
    sage300: '#9AB0AB',
    sage500: '#5B6E6B',
    sage900: '#14231F',
    night950: '#0C1413',
    night900: '#182220',
    night800: '#1D2B28',
    night700: '#26362F',
    // ブランド（ティール = 水・清潔さ）
    // teal600 は白ラベルと 5.01:1（WCAG AA）を確保するトーン
    teal600: '#0C7D72',
    teal300: '#3FC1B3',
    tealSoft: '#D7F0EC',
    tealSoftDark: '#143B36',
    tealInk: '#06211D',
    // 注意・削除（コーラル）
    // coral600 はライトの dangerSoft #FBE9E5 上で 4.74:1（WCAG AA）を確保するトーン
    coral600: '#BD3926',
    coral300: '#EF8271',
    coralSoft: '#FBE9E5',
    coralSoftDark: '#3A1F1A',
    // ヒートマップ状態色（塗り + 縁取りのペア）
    // *FillDark はダークテーマの text #E8F1EE と 4.5:1 以上（WCAG AA）を確保する暗さにする
    freshFill: '#7BDDB0',
    freshBorder: '#3BAE7E',
    freshFillDark: '#236E4E',
    freshBorderDark: '#57C795',
    dueFill: '#F6CE67',
    dueBorder: '#C79A2A',
    dueFillDark: '#7D6015',
    dueBorderDark: '#E0B54D',
    overdueFill: '#F49382',
    overdueBorder: '#CE5643',
    overdueFillDark: '#9E4635',
    overdueBorderDark: '#EF8271',
    neutralFill: '#E7EDEB',
    neutralBorder: '#C2CFCB',
    neutralFillDark: '#22302D',
    neutralBorderDark: '#435650',
    // 部屋アクセント用
    gray700: '#334155',
    amber100: '#FEF3C7',
    amber300: '#FCD34D',
    amber900: '#78350F',
    emerald100: '#D1FAE5',
    emerald300: '#6EE7B7',
    emerald900: '#064E3B',
    sky100: '#E0F2FE',
    sky300: '#7DD3FC',
    sky900: '#0C4A6E',
    violet100: '#EDE9FE',
    violet300: '#C4B5FD',
    violet900: '#4C1D95',
    rose100: '#FFE4E6',
    rose300: '#FDA4AF',
    rose900: '#881337',
    stone100: '#F5F5F4',
    stone300: '#D6D3D1',
    stone800: '#292524',
} as const;

export type RoomAccent = {
    fill: string;
    accent: string;
    icon: string;
};

export type AppTheme = {
    mode: 'light' | 'dark';
    colors: {
        background: string;
        surface: string;
        surfaceAlt: string;
        text: string;
        textMuted: string;
        primary: string;
        // primary 背景上のコンテンツ色（ボタンラベル等）
        onPrimary: string;
        // 選択行・アクティブチップなど primary の淡い背景
        primarySoft: string;
        danger: string;
        // 削除ボタンなど danger の淡い背景
        dangerSoft: string;
        outline: string;
        gridLine: string;
        overlay: string;
        // ヒートマップの状態色（経過割合 → 状態）。resolveHeatStatus の状態と対応する。
        // Fill は塗り、Border は縁取り。色覚多様性でも輪郭で判別できるよう必ずペアで使う
        heatFresh: string;
        heatFreshBorder: string;
        heatDue: string;
        heatDueBorder: string;
        heatOverdue: string;
        heatOverdueBorder: string;
        heatNeutral: string;
        heatNeutralBorder: string;
    };
    roomAccents: Record<RoomType, RoomAccent>;
    spacing: { xs: number; sm: number; md: number; lg: number; xl: number };
    radius: { sm: number; md: number; lg: number };
    typography: {
        display: TextStyle;
        title: TextStyle;
        body: TextStyle;
        caption: TextStyle;
        label: TextStyle;
        number: TextStyle;
    };
    elevation: { card: ViewStyle; sheet: ViewStyle };
};

// テーマ間で共通の寸法・文字トークン
const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
const radius = { sm: 4, md: 8, lg: 16 } as const;
const typography: AppTheme['typography'] = {
    display: { fontSize: 26, fontWeight: '800', lineHeight: 34 },
    title: { fontSize: 20, fontWeight: '700', lineHeight: 28 },
    body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
    caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
    label: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
    // 数字が並ぶ箇所（経過率・時刻・件数）は桁揃えのため tabular-nums を使う
    number: { fontSize: 24, fontWeight: '700', lineHeight: 30, fontVariant: ['tabular-nums'] },
};

// 部屋種別アイコン（絵文字）はライト／ダーク共通
const roomIcons: Record<RoomType, string> = {
    [RoomType.Living]: '🛋️',
    [RoomType.Kitchen]: '🍳',
    [RoomType.Bedroom]: '🛏️',
    [RoomType.Bathroom]: '🛁',
    [RoomType.Toilet]: '🚽',
    [RoomType.Other]: '📦',
};

export const lightTheme: AppTheme = {
    mode: 'light',
    colors: {
        background: palette.mint50,
        surface: palette.white,
        surfaceAlt: palette.mint100,
        text: palette.sage900,
        textMuted: palette.sage500,
        primary: palette.teal600,
        onPrimary: palette.white,
        primarySoft: palette.tealSoft,
        danger: palette.coral600,
        dangerSoft: palette.coralSoft,
        outline: palette.sage200,
        gridLine: palette.sage200,
        overlay: 'rgba(20, 35, 31, 0.45)',
        heatFresh: palette.freshFill,
        heatFreshBorder: palette.freshBorder,
        heatDue: palette.dueFill,
        heatDueBorder: palette.dueBorder,
        heatOverdue: palette.overdueFill,
        heatOverdueBorder: palette.overdueBorder,
        heatNeutral: palette.neutralFill,
        heatNeutralBorder: palette.neutralBorder,
    },
    roomAccents: {
        [RoomType.Living]: {
            fill: palette.amber100,
            accent: palette.amber900,
            icon: roomIcons[RoomType.Living],
        },
        [RoomType.Kitchen]: {
            fill: palette.emerald100,
            accent: palette.emerald900,
            icon: roomIcons[RoomType.Kitchen],
        },
        [RoomType.Bedroom]: {
            fill: palette.violet100,
            accent: palette.violet900,
            icon: roomIcons[RoomType.Bedroom],
        },
        [RoomType.Bathroom]: {
            fill: palette.sky100,
            accent: palette.sky900,
            icon: roomIcons[RoomType.Bathroom],
        },
        [RoomType.Toilet]: {
            fill: palette.rose100,
            accent: palette.rose900,
            icon: roomIcons[RoomType.Toilet],
        },
        [RoomType.Other]: {
            fill: palette.stone100,
            accent: palette.gray700,
            icon: roomIcons[RoomType.Other],
        },
    },
    spacing,
    radius,
    typography,
    elevation: {
        card: {
            shadowColor: palette.sage900,
            shadowOpacity: 0.08,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
        },
        sheet: {
            shadowColor: palette.sage900,
            shadowOpacity: 0.16,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: -4 },
            elevation: 12,
        },
    },
};

export const darkTheme: AppTheme = {
    mode: 'dark',
    colors: {
        background: palette.night950,
        surface: palette.night900,
        surfaceAlt: palette.night800,
        text: '#E8F1EE',
        textMuted: palette.sage300,
        primary: palette.teal300,
        onPrimary: palette.tealInk,
        primarySoft: palette.tealSoftDark,
        danger: palette.coral300,
        dangerSoft: palette.coralSoftDark,
        outline: palette.night700,
        gridLine: palette.night700,
        overlay: 'rgba(0, 0, 0, 0.6)',
        heatFresh: palette.freshFillDark,
        heatFreshBorder: palette.freshBorderDark,
        heatDue: palette.dueFillDark,
        heatDueBorder: palette.dueBorderDark,
        heatOverdue: palette.overdueFillDark,
        heatOverdueBorder: palette.overdueBorderDark,
        heatNeutral: palette.neutralFillDark,
        heatNeutralBorder: palette.neutralBorderDark,
    },
    roomAccents: {
        [RoomType.Living]: {
            fill: '#3A2E14',
            accent: palette.amber300,
            icon: roomIcons[RoomType.Living],
        },
        [RoomType.Kitchen]: {
            fill: '#0B2E22',
            accent: palette.emerald300,
            icon: roomIcons[RoomType.Kitchen],
        },
        [RoomType.Bedroom]: {
            fill: '#2A1E4D',
            accent: palette.violet300,
            icon: roomIcons[RoomType.Bedroom],
        },
        [RoomType.Bathroom]: {
            fill: '#0E2A3D',
            accent: palette.sky300,
            icon: roomIcons[RoomType.Bathroom],
        },
        [RoomType.Toilet]: {
            fill: '#3D1620',
            accent: palette.rose300,
            icon: roomIcons[RoomType.Toilet],
        },
        [RoomType.Other]: {
            fill: palette.stone800,
            accent: palette.stone300,
            icon: roomIcons[RoomType.Other],
        },
    },
    spacing,
    radius,
    typography,
    elevation: {
        card: {
            shadowColor: '#000000',
            shadowOpacity: 0.4,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
        },
        sheet: {
            shadowColor: '#000000',
            shadowOpacity: 0.5,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: -4 },
            elevation: 12,
        },
    },
};
