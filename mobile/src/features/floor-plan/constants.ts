// 間取りキャンバスのグリッド寸法（サーバー仕様と揃える）
export const GRID_COLS = 20;
export const GRID_ROWS = 20;

// 家具追加モーダルのプリセット定義。
// key はサーバーに presetKey として保存される識別子（例: "sink"）
export type FurniturePreset = {
    key: string;
    label: string;
    icon: string;
};

export const FURNITURE_PRESETS: FurniturePreset[] = [
    { key: 'sofa', label: 'ソファ', icon: '🛋️' },
    { key: 'bed', label: 'ベッド', icon: '🛏️' },
    { key: 'table', label: 'テーブル', icon: '🪑' },
    { key: 'tv', label: 'テレビ', icon: '📺' },
    { key: 'bookshelf', label: '本棚', icon: '📚' },
    { key: 'fridge', label: '冷蔵庫', icon: '🧊' },
];
