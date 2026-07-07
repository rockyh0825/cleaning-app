import { computeElapsedRatio } from "../computeElapsedRatio";

describe("computeElapsedRatio", () => {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const now = new Date("2026-07-07T00:00:00.000Z").getTime();

  describe("正常系", () => {
    it("周期14日に対し7日経過なら 0.5 を返す", () => {
      const lastCleanedAt = new Date(now - 7 * DAY_MS);

      const result = computeElapsedRatio(lastCleanedAt, 14, now);

      expect(result).toBeCloseTo(0.5);
    });

    it("周期14日に対し掃除直後（0日経過）なら 0 を返す", () => {
      const lastCleanedAt = new Date(now);

      const result = computeElapsedRatio(lastCleanedAt, 14, now);

      expect(result).toBe(0);
    });
  });

  describe("境界値", () => {
    it("ちょうど周期経過なら 1.0 を返す", () => {
      const lastCleanedAt = new Date(now - 14 * DAY_MS);

      const result = computeElapsedRatio(lastCleanedAt, 14, now);

      expect(result).toBeCloseTo(1.0);
    });
  });

  describe("異常系", () => {
    it("lastCleanedAt が null なら Infinity を返す", () => {
      const result = computeElapsedRatio(null, 14, now);

      expect(result).toBe(Infinity);
    });

    it("recommendedCycleDays が 0 なら Infinity を返す", () => {
      const lastCleanedAt = new Date(now - 7 * DAY_MS);

      const result = computeElapsedRatio(lastCleanedAt, 0, now);

      expect(result).toBe(Infinity);
    });

    it("recommendedCycleDays が負値なら Infinity を返す", () => {
      const lastCleanedAt = new Date(now - 7 * DAY_MS);

      const result = computeElapsedRatio(lastCleanedAt, -5, now);

      expect(result).toBe(Infinity);
    });
  });
});
