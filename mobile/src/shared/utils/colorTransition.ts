/**
 * 状態色（ヒートマップの赤→緑など）の変化を「from → to のクロスフェード」
 * として表すための純粋な状態遷移ロジック。
 * Reanimated 非依存の純関数としてテストし、アニメーション適用は
 * shared/hooks/useColorTransitionStyle が担う。
 */
export type ColorTransition = {
  /** トランジションの起点色 */
  from: string;
  /** トランジションの目標色 */
  to: string;
};

/**
 * 状態色トランジションの所要時間（ms）。
 * 「変化に気づける」長さと「操作を待たせない」短さのバランスで 350ms にする。
 */
export const COLOR_TRANSITION_DURATION_MS = 350;

/**
 * マウント時の初期状態。from = to のためアニメーションは発生しない。
 */
export function initialColorTransition(color: string): ColorTransition {
  return { from: color, to: color };
}

/**
 * 色プロパティの新しい値を受けて次のトランジションを決める。
 * - 目標色と同じ値なら changed: false（再アニメーションしない）
 * - 変化した場合は「現在の目標色」を起点に新色へ遷移する
 *   （進行中の再ターゲットでも大きく戻らない近似として to を起点に使う）
 * 比較は文字列の完全一致。テーマトークンは表記（大文字小文字）が一定である前提。
 */
export function nextColorTransition(
  current: ColorTransition,
  color: string,
): { transition: ColorTransition; changed: boolean } {
  if (color === current.to) {
    return { transition: current, changed: false };
  }
  return { transition: { from: current.to, to: color }, changed: true };
}
