import {
  computeCycleElapsedRate,
  resolveElapsedRateBadge,
} from "../computeCycleElapsedRate";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = new Date(2026, 6, 13, 12, 0).getTime();

function daysAgo(days: number): Date {
  return new Date(NOW - days * DAY_MS);
}

describe("computeCycleElapsedRate", () => {
  describe("正常系: 経過率の算出と状態分類", () => {
    it("returns_zero_percent_fresh_immediately_after_cleaning", () => {
      // Arrange: 掃除直後（経過 0）
      const lastCleanedAt = new Date(NOW);

      // Act
      const rate = computeCycleElapsedRate(lastCleanedAt, 7, NOW);

      // Assert
      expect(rate).toEqual({ kind: "measured", percent: 0, status: "fresh" });
    });

    it("classifies_ratio_below_green_threshold_as_fresh", () => {
      // Arrange: 7日周期で5日経過 = 約71%（< 80%）
      const rate = computeCycleElapsedRate(daysAgo(5), 7, NOW);

      // Assert
      expect(rate).toEqual({ kind: "measured", percent: 71, status: "fresh" });
    });

    it("classifies_ratio_at_green_threshold_as_due", () => {
      // Arrange: 10日周期でちょうど8日経過 = 80%（閾値ちょうどは due）
      const rate = computeCycleElapsedRate(daysAgo(8), 10, NOW);

      // Assert
      expect(rate).toEqual({ kind: "measured", percent: 80, status: "due" });
    });

    it("classifies_ratio_at_100_percent_as_overdue", () => {
      // Arrange: 周期ちょうど経過（100% は超過扱い。heatmap の閾値と同じ）
      const rate = computeCycleElapsedRate(daysAgo(7), 7, NOW);

      // Assert
      expect(rate).toEqual({
        kind: "measured",
        percent: 100,
        status: "overdue",
      });
    });

    it("reports_percent_above_100_when_cycle_is_exceeded", () => {
      // Arrange: 7日周期で14日経過 = 200%
      const rate = computeCycleElapsedRate(daysAgo(14), 7, NOW);

      // Assert
      expect(rate).toEqual({
        kind: "measured",
        percent: 200,
        status: "overdue",
      });
    });

    it("clamps_future_last_cleaned_at_to_zero_percent_fresh", () => {
      // Arrange: 端末時計のズレ等で未来の掃除日時になっているケース
      const rate = computeCycleElapsedRate(daysAgo(-1), 7, NOW);

      // Assert: 負の経過率にせず 0% として扱う
      expect(rate).toEqual({ kind: "measured", percent: 0, status: "fresh" });
    });
  });

  describe("境界・異常系: 経過率が定義できないケース", () => {
    it("returns_uncleaned_when_last_cleaned_at_is_null", () => {
      // Act & Assert
      expect(computeCycleElapsedRate(null, 7, NOW)).toEqual({
        kind: "uncleaned",
      });
    });

    it("returns_no_cycle_when_recommended_cycle_days_is_zero_or_negative", () => {
      // Act & Assert: 周期未設定（0 以下）は経過率を定義できない
      expect(computeCycleElapsedRate(daysAgo(3), 0, NOW)).toEqual({
        kind: "noCycle",
      });
      expect(computeCycleElapsedRate(daysAgo(3), -1, NOW)).toEqual({
        kind: "noCycle",
      });
    });
  });
});

describe("resolveElapsedRateBadge", () => {
  it("renders_percent_label_with_status_for_measured_rate", () => {
    // Act & Assert
    expect(
      resolveElapsedRateBadge({ kind: "measured", percent: 71, status: "fresh" }),
    ).toEqual({ label: "71%", status: "fresh" });
  });

  it("caps_displayed_percent_at_999_plus_for_extreme_overdue", () => {
    // Arrange: 長期間放置で桁が溢れてもバッジ幅が壊れないように上限を付ける
    const badge = resolveElapsedRateBadge({
      kind: "measured",
      percent: 1500,
      status: "overdue",
    });

    // Assert
    expect(badge).toEqual({ label: "999%+", status: "overdue" });
  });

  it("labels_uncleaned_parts_as_misouji_with_overdue_status", () => {
    // Act & Assert: 未掃除は heatmap の Infinity → overdue と整合させる
    expect(resolveElapsedRateBadge({ kind: "uncleaned" })).toEqual({
      label: "未掃除",
      status: "overdue",
    });
  });

  it("returns_null_when_cycle_is_not_set", () => {
    // Act & Assert: 経過率が定義できないパーツにはバッジを出さない
    expect(resolveElapsedRateBadge({ kind: "noCycle" })).toBeNull();
  });
});
