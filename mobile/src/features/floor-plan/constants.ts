// 間取りキャンバスのグリッド寸法（サーバー仕様と揃える）
export const GRID_COLS = 20;
export const GRID_ROWS = 20;

// 家具追加モーダルのプリセット定義。
// key はサーバーに presetKey として保存される識別子（例: "sink"）
export type FurniturePreset = {
    key: string;
    label: string;
    icon: string;
    // グリッド単位の既定サイズ（w=横, h=縦）。プリセット選択時の初期サイズに使う
    defaultSize: { w: number; h: number };
};

export const FURNITURE_PRESETS: FurniturePreset[] = [
    { key: 'sofa', label: 'ソファ', icon: '🛋️', defaultSize: { w: 2, h: 1 } },
    { key: 'bed', label: 'ベッド', icon: '🛏️', defaultSize: { w: 2, h: 3 } },
    { key: 'table', label: 'テーブル', icon: '🪑', defaultSize: { w: 2, h: 2 } },
    { key: 'tv', label: 'テレビ', icon: '📺', defaultSize: { w: 2, h: 1 } },
    { key: 'bookshelf', label: '本棚', icon: '📚', defaultSize: { w: 1, h: 1 } },
    { key: 'fridge', label: '冷蔵庫', icon: '🧊', defaultSize: { w: 1, h: 1 } },
];
