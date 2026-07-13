/**
 * expo-haptics の Jest 手動モック（node_modules パッケージは __mocks__ に
 * 置くだけで全テストに自動適用される）。
 * jest-expo プリセットを使っていないため、実モジュールを読み込むと
 * expo-modules-core のネイティブ初期化で落ちる。テストでは触覚は不要なので
 * 解決済み Promise を返すスタブに差し替える。
 */
export const selectionAsync = jest.fn(() => Promise.resolve());
export const notificationAsync = jest.fn(() => Promise.resolve());
export const impactAsync = jest.fn(() => Promise.resolve());

export const NotificationFeedbackType = {
  Success: "success",
  Warning: "warning",
  Error: "error",
} as const;

export const ImpactFeedbackStyle = {
  Light: "light",
  Medium: "medium",
  Heavy: "heavy",
  Soft: "soft",
  Rigid: "rigid",
} as const;
