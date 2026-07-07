const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * パーツ単位の「推奨周期に対する経過割合」を求める純粋関数。
 *
 * - lastCleanedAt が null（未掃除）→ Infinity
 * - recommendedCycleDays が 0 以下（周期未設定・不正）→ Infinity
 * - それ以外 → (now - lastCleanedAt) / (recommendedCycleDays * 1日)
 *
 * 1.0 で「ちょうど周期経過」、1.0 超で期限超過を表す。
 */
export function computeElapsedRatio(
  lastCleanedAt: Date | null,
  recommendedCycleDays: number,
  now: number,
): number {
  if (lastCleanedAt === null) return Infinity;
  if (recommendedCycleDays <= 0) return Infinity;

  const cycleMs = recommendedCycleDays * DAY_MS;
  return (now - lastCleanedAt.getTime()) / cycleMs;
}
