import type { TextStyle, ViewStyle } from 'react-native';
import { RoomType } from '@/shared/api/models/RoomType';

// palette: 生値。コンポーネントからは直接参照せず semantic tokens 経由で使う
const palette = {
    white: '#FFFFFF',
    gray50: '#F8FAFC',
    gray100: '#F1F5F9',
    gray200: '#E2E8F0',
    gray400: '#94A3B8',
    gray500: '#64748B',
    gray700: '#334155',
    gray800: '#1E293B',
    gray900: '#0F172A',
    gray950: '#020617',
    blue500: '#3B82F6',
    blue400: '#60A5FA',
    red500: '#EF4444',
    red400: '#F87171',
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
        danger: string;
        outline: string;
        gridLine: string;
        overlay: string;
    };
    roomAccents: Record<RoomType, RoomAccent>;
    spacing: { xs: number; sm: number; md: number; lg: number; xl: number };
    radius: { sm: number; md: number; lg: number };
    typography: { title: TextStyle; body: TextStyle; caption: TextStyle; label: TextStyle };
    elevation: { card: ViewStyle; sheet: ViewStyle };
};

// テーマ間で共通の寸法・文字トークン
const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
const radius = { sm: 4, md: 8, lg: 16 } as const;
const typography: AppTheme['typography'] = {
    title: { fontSize: 20, fontWeight: '700', lineHeight: 28 },
    body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
    caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
    label: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
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
        background: palette.gray50,
        surface: palette.white,
        surfaceAlt: palette.gray100,
        text: palette.gray900,
        textMuted: palette.gray500,
        primary: palette.blue500,
        danger: palette.red500,
        outline: palette.gray200,
        gridLine: palette.gray200,
        overlay: 'rgba(15, 23, 42, 0.45)',
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
            shadowColor: palette.gray900,
            shadowOpacity: 0.08,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
        },
        sheet: {
            shadowColor: palette.gray900,
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
        background: palette.gray950,
        surface: palette.gray900,
        surfaceAlt: palette.gray800,
        text: palette.gray50,
        textMuted: palette.gray400,
        primary: palette.blue400,
        danger: palette.red400,
        outline: palette.gray700,
        gridLine: palette.gray800,
        overlay: 'rgba(2, 6, 23, 0.6)',
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
