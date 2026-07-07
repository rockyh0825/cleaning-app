/**
 * ヒートマップのエリア状態。
 * - fresh: 十分に新しい（緑）
 * - due: そろそろ掃除時期（黄）
 * - overdue: 推奨周期を超過（赤）
 * - neutral: 判定対象なし（パーツ0件など。呼び出し側が付与する）
 */
export type HeatStatus = "fresh" | "due" | "overdue" | "neutral";

/** 経過割合を状態に分類する閾値。green 未満で fresh、red 未満で due、それ以上で overdue。 */
export type HeatThresholds = {
  green: number;
  red: number;
};

export const DEFAULT_THRESHOLDS = {
  green: 0.8,
  red: 1.0,
} as const satisfies HeatThresholds;

/**
 * 経過割合（computeElapsedRatio の結果）を色状態に分類する純粋関数。
 * neutral は「判定できるパーツが無い」ケースを表すため呼び出し側が付与し、
 * ここでは fresh / due / overdue のいずれかを返す。
 */
export function resolveHeatStatus(
  ratio: number,
  thresholds: HeatThresholds = DEFAULT_THRESHOLDS,
): Exclude<HeatStatus, "neutral"> {
  if (ratio < thresholds.green) return "fresh";
  if (ratio < thresholds.red) return "due";
  return "overdue";
}
