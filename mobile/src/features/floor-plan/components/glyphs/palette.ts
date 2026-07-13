// 家具グリフ専用の描画インク（イラスト用色）。
// UI のセマンティックトークン（tokens.ts）とは役割が違うためここに閉じる。
// マテリアルは 4 系統に限定して統一感を出す:
//   木（テーブル・棚系）/ 布=セージ（ソファ・椅子・ラグ）/
//   スチール・陶器=ブルーグレー（水まわり・家電）/ グリーン（植物）
// ダークモードでは明るい面（白・スチール系）だけを暗色化し、
// 中間トーンのマテリアルは共通値を使う（夜の部屋でもまぶしくならない）。

export type GlyphPalette = {
    wood: {
        fill: string;
        stroke: string;
        deepFill: string;
        deepStroke: string;
        inner: string;
        grain: string;
        detail: string;
        handle: string;
    };
    fabric: {
        fill: string;
        stroke: string;
        dark: string;
        pad: string;
        padStroke: string;
        light: string;
    };
    steel: {
        fill: string;
        stroke: string;
        part: string;
        detail: string;
        basin: string;
        basinStroke: string;
    };
    ceramic: {
        fill: string;
        stroke: string;
        inner: string;
        bowl: string;
    };
    water: {
        fill: string;
        stroke: string;
    };
    appliance: {
        fill: string;
        stroke: string;
        inner: string;
        ring: string;
    };
    green: {
        fill: string;
        stroke: string;
        core: string;
    };
    bedding: {
        sheet: string;
        sheetStroke: string;
        pillow: string;
        pillowStroke: string;
        duvet: string;
        duvetStroke: string;
        fold: string;
        line: string;
    };
    panel: {
        fill: string;
        stroke: string;
        glare: string;
    };
    rug: {
        fill: string;
        stroke: string;
    };
    books: string[];
    accent: {
        sage: string;
        yellow: string;
        terracotta: string;
        terracottaStroke: string;
    };
    generic: {
        fill: string;
        stroke: string;
        inner: string;
        part: string;
        bar: string;
    };
};

// ライト・ダーク共通の中間トーン
const wood = {
    fill: '#D6B98E',
    stroke: '#B39468',
    deepFill: '#C9AE87',
    deepStroke: '#A78C63',
    inner: '#B79C74',
    grain: '#C4A87C',
    detail: '#B49C7D',
    handle: '#8A7050',
} as const;

const fabric = {
    fill: '#9DB4AE',
    stroke: '#6E8A83',
    dark: '#7E9992',
    pad: '#B4CCC5',
    padStroke: '#86A19A',
    light: '#C5D9D3',
} as const;

const appliance = {
    fill: '#3A4550',
    stroke: '#232B33',
    inner: '#2B3440',
    ring: '#5A6B78',
} as const;

const green = {
    fill: '#85AF92',
    stroke: '#5F8A6E',
    core: '#6E9A7C',
} as const;

const panel = {
    fill: '#232B33',
    stroke: '#10151A',
    glare: '#46545F',
} as const;

const books = ['#7E9992', '#B87E6A', '#8CA0BD', '#D4BC6E', '#93856F'] as const;

const accent = {
    sage: '#7E9992',
    yellow: '#D4BC6E',
    terracotta: '#B87E6A',
    terracottaStroke: '#9A6350',
} as const;

const lightPalette: GlyphPalette = {
    wood,
    fabric,
    steel: {
        fill: '#E2E8EA',
        stroke: '#AEBDC2',
        part: '#8C9BA1',
        detail: '#CBD6D9',
        basin: '#C2CDD1',
        basinStroke: '#9FAEB4',
    },
    ceramic: {
        fill: '#E8EDEF',
        stroke: '#AEBDC2',
        inner: '#C7D1D5',
        bowl: '#FFFFFF',
    },
    water: { fill: '#BFE0DD', stroke: '#8FC3BE' },
    appliance,
    green,
    bedding: {
        sheet: '#F6F3ED',
        sheetStroke: '#DFD6C6',
        pillow: '#FFFFFF',
        pillowStroke: '#DCD5C7',
        duvet: '#BFD9D3',
        duvetStroke: '#93B8B0',
        fold: '#DAEAE6',
        line: '#A5C6BF',
    },
    panel,
    rug: { fill: '#DFCDB2', stroke: '#C4AC87' },
    books: [...books],
    accent,
    generic: {
        fill: '#F0F3F1',
        stroke: '#B6C4C0',
        inner: '#CBD6D2',
        part: '#93A7A2',
        bar: '#B6C4C0',
    },
};

const darkPalette: GlyphPalette = {
    wood,
    fabric,
    steel: {
        fill: '#9AA9AF',
        stroke: '#76878E',
        part: '#5E6D73',
        detail: '#8899A0',
        basin: '#7E8C91',
        basinStroke: '#67767C',
    },
    ceramic: {
        fill: '#A3B0B5',
        stroke: '#7C8C92',
        inner: '#8B989D',
        bowl: '#C4CEC8',
    },
    water: { fill: '#6FA5A0', stroke: '#4E827D' },
    appliance,
    green,
    bedding: {
        sheet: '#AEB8B2',
        sheetStroke: '#8C9690',
        pillow: '#C4CEC8',
        pillowStroke: '#97A19B',
        duvet: '#8FB4AC',
        duvetStroke: '#6D948C',
        fold: '#A3C4BC',
        line: '#7DA49B',
    },
    panel,
    rug: { fill: '#9C8D74', stroke: '#77694E' },
    books: [...books],
    accent,
    generic: {
        fill: '#2A3733',
        stroke: '#5C6C67',
        inner: '#46554F',
        part: '#7E938D',
        bar: '#5C6C67',
    },
};

export function getGlyphPalette(mode: 'light' | 'dark'): GlyphPalette {
    return mode === 'dark' ? darkPalette : lightPalette;
}

// ヒートマップ表示時のシルエット色。
// 状態色（Animated.View の背景）の上に半透明の 1 色を重ねるだけにし、
// どの状態色・どのテーマでも破綻しないようにする
export const GLYPH_SILHOUETTE_FILL = 'rgba(20, 35, 31, 0.35)';

const SILHOUETTE_NONE = 'transparent';

// シルエット用パレット: 家具の外形いっぱいの「ボディ」面は透明にして
// 状態色を透過し、内側の部品だけを半透明 1 色で残す。線はすべて消す
let silhouettePalette: GlyphPalette | null = null;

export function getSilhouetteGlyphPalette(): GlyphPalette {
    if (silhouettePalette) return silhouettePalette;
    const part = GLYPH_SILHOUETTE_FILL;
    const none = SILHOUETTE_NONE;
    silhouettePalette = {
        wood: {
            fill: none,
            stroke: none,
            deepFill: none,
            deepStroke: none,
            inner: part,
            grain: none,
            detail: part,
            handle: part,
        },
        fabric: {
            fill: none,
            stroke: none,
            dark: part,
            pad: part,
            padStroke: none,
            light: part,
        },
        steel: {
            fill: none,
            stroke: none,
            part,
            detail: part,
            basin: part,
            basinStroke: none,
        },
        ceramic: { fill: part, stroke: none, inner: part, bowl: part },
        water: { fill: part, stroke: none },
        appliance: { fill: none, stroke: none, inner: part, ring: none },
        green: { fill: part, stroke: none, core: part },
        bedding: {
            sheet: none,
            sheetStroke: none,
            pillow: part,
            pillowStroke: none,
            duvet: part,
            duvetStroke: none,
            fold: none,
            line: none,
        },
        panel: { fill: part, stroke: none, glare: none },
        rug: { fill: none, stroke: none },
        books: [part, part, part, part, part],
        accent: {
            sage: part,
            yellow: part,
            terracotta: part,
            terracottaStroke: none,
        },
        generic: { fill: none, stroke: none, inner: none, part, bar: part },
    };
    return silhouettePalette;
}
