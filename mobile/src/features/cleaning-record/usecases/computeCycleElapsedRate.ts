import type { HeatStatus } from "@/shared/components/StatusPill";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 状態分類の閾値。heatmap/usecases/resolveHeatStatus の DEFAULT_THRESHOLDS
 * （green: 0.8 / red: 1.0）と同じ値にする。feature 境界を跨ぐ import を避ける
 * ため本ファイルに持つ（CleaningStatusCapabilityImpl の経過率計算と同じ方針）。
 * 変更するときはヒートマップの塗り分けと同時に変えること。
 */
const GREEN_THRESHOLD = 0.8;
const RED_THRESHOLD = 1.0;

/** 表示上の経過率上限。これを超えると「999%+」表記にする */
const MAX_DISPLAY_PERCENT = 999;

/**
 * パーツの「推奨周期に対する経過率」。
 * - measured: 経過率を算出できた（percent は 0 以上の整数）
 * - uncleaned: 掃除記録がない（経過率は定義できないが要掃除として扱う）
 * - noCycle: 周期未設定（0 以下）で経過率を定義できない
 */
export type CycleElapsedRate =
  | { kind: "measured"; percent: number; status: "fresh" | "due" | "overdue" }
  | { kind: "uncleaned" }
  | { kind: "noCycle" };

/**
 * 前回掃除からの経過率（経過日数 ÷ 推奨周期）を求める純粋関数。
 * 現在時刻は引数注入（now: エポックms）でテスト可能にする。
 * 状態分類は表示丸め前の比率で行い、ヒートマップの塗り分けとズレないようにする。
 * 表示 percent は切り捨て（floor）にする。四捨五入だと閾値際で
 * 「80% なのに緑」「100% なのに黄」という表示と状態の食い違いが起きるため。
 * 未来の lastCleanedAt（端末時計のズレ等）は 0% に丸める。
 */
export function computeCycleElapsedRate(
  lastCleanedAt: Date | null,
  recommendedCycleDays: number,
  now: number,
): CycleElapsedRate {
  if (lastCleanedAt === null) return { kind: "uncleaned" };
  if (recommendedCycleDays <= 0) return { kind: "noCycle" };

  const cycleMs = recommendedCycleDays * DAY_MS;
  const ratio = Math.max(0, (now - lastCleanedAt.getTime()) / cycleMs);
  const status =
    ratio < GREEN_THRESHOLD ? "fresh" : ratio < RED_THRESHOLD ? "due" : "overdue";

  return { kind: "measured", percent: Math.floor(ratio * 100), status };
}

/**
 * 経過率をバッジ表示（ラベル + StatusPill の状態）に変換する純粋関数。
 * - measured → 「71%」等。極端な超過は「999%+」に丸めて幅崩れを防ぐ
 * - uncleaned → 「未掃除」。heatmap が未掃除を Infinity → overdue（赤）で
 *   塗るのと整合させ、overdue 状態にする
 * - noCycle → null（経過率が定義できないためバッジを出さない）
 */
export function resolveElapsedRateBadge(
  rate: CycleElapsedRate,
): { label: string; status: HeatStatus } | null {
  switch (rate.kind) {
    case "measured":
      return {
        label:
          rate.percent > MAX_DISPLAY_PERCENT
            ? `${MAX_DISPLAY_PERCENT}%+`
            : `${rate.percent}%`,
        status: rate.status,
      };
    case "uncleaned":
      return { label: "未掃除", status: "overdue" };
    case "noCycle":
      return null;
  }
}
