// 間取りキャンバスのグリッド寸法（サーバー仕様と揃える）
export const GRID_COLS = 20;
export const GRID_ROWS = 20;

// 家具追加モーダルのカテゴリタブ（承認済みデザイン issue #148 のグルーピング）
export type FurnitureCategory = 'living' | 'kitchen' | 'water';

export const FURNITURE_CATEGORIES: { key: FurnitureCategory; label: string }[] = [
    { key: 'living', label: 'リビング・寝室' },
    { key: 'kitchen', label: 'キッチン' },
    { key: 'water', label: '水まわり' },
];

// 家具追加モーダルのプリセット定義。
// key はサーバーに presetKey として保存される識別子（例: "sink"）で、
// FurnitureGlyph のトップダウン・グリフと 1:1 に対応する
export type FurniturePreset = {
    key: string;
    label: string;
    category: FurnitureCategory;
    // グリッド単位の既定サイズ（w=横, h=縦）。プリセット選択時の初期サイズに使う
    defaultSize: { w: number; h: number };
};

export const FURNITURE_PRESETS: FurniturePreset[] = [
    // リビング・寝室
    { key: 'sofa', label: 'ソファ', category: 'living', defaultSize: { w: 2, h: 1 } },
    { key: 'bed', label: 'ベッド', category: 'living', defaultSize: { w: 2, h: 3 } },
    { key: 'table', label: 'テーブル', category: 'living', defaultSize: { w: 2, h: 2 } },
    { key: 'tv', label: 'テレビ', category: 'living', defaultSize: { w: 2, h: 1 } },
    { key: 'bookshelf', label: '本棚', category: 'living', defaultSize: { w: 1, h: 1 } },
    { key: 'chair', label: '椅子', category: 'living', defaultSize: { w: 1, h: 1 } },
    { key: 'desk', label: 'デスク', category: 'living', defaultSize: { w: 2, h: 1 } },
    { key: 'rug', label: 'ラグ', category: 'living', defaultSize: { w: 2, h: 2 } },
    { key: 'closet', label: 'クローゼット', category: 'living', defaultSize: { w: 2, h: 1 } },
    { key: 'plant', label: '観葉植物', category: 'living', defaultSize: { w: 1, h: 1 } },
    // キッチン
    { key: 'fridge', label: '冷蔵庫', category: 'kitchen', defaultSize: { w: 1, h: 1 } },
    { key: 'stove', label: 'コンロ', category: 'kitchen', defaultSize: { w: 2, h: 1 } },
    { key: 'sink', label: 'シンク', category: 'kitchen', defaultSize: { w: 1, h: 1 } },
    { key: 'shelf', label: '棚', category: 'kitchen', defaultSize: { w: 2, h: 1 } },
    // 水まわり
    { key: 'bathtub', label: '浴槽', category: 'water', defaultSize: { w: 2, h: 1 } },
    { key: 'washer', label: '洗濯機', category: 'water', defaultSize: { w: 1, h: 1 } },
    { key: 'toilet', label: 'トイレ', category: 'water', defaultSize: { w: 1, h: 1 } },
    { key: 'washbasin', label: '洗面台', category: 'water', defaultSize: { w: 1, h: 1 } },
];
