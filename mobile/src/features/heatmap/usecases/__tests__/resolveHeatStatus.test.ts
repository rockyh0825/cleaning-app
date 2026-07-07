import { DEFAULT_THRESHOLDS, resolveHeatStatus } from "../resolveHeatStatus";

describe("resolveHeatStatus", () => {
  describe("正常系（既定閾値 green=0.8 / red=1.0）", () => {
    it("0.5 は fresh", () => {
      expect(resolveHeatStatus(0.5)).toBe("fresh");
    });

    it("0.9 は due", () => {
      expect(resolveHeatStatus(0.9)).toBe("due");
    });

    it("1.5 は overdue", () => {
      expect(resolveHeatStatus(1.5)).toBe("overdue");
    });

    it("Infinity は overdue", () => {
      expect(resolveHeatStatus(Infinity)).toBe("overdue");
    });
  });

  describe("境界値", () => {
    it("ちょうど green(0.8) は due（fresh ではない）", () => {
      expect(resolveHeatStatus(DEFAULT_THRESHOLDS.green)).toBe("due");
    });

    it("ちょうど red(1.0) は overdue（due ではない）", () => {
      expect(resolveHeatStatus(DEFAULT_THRESHOLDS.red)).toBe("overdue");
    });
  });

  describe("閾値の差し替え", () => {
    it("green=0.5 に差し替えると 0.6 は due になる", () => {
      expect(resolveHeatStatus(0.6, { green: 0.5, red: 1.0 })).toBe("due");
    });

    it("差し替えても 0.4 は fresh のまま", () => {
      expect(resolveHeatStatus(0.4, { green: 0.5, red: 1.0 })).toBe("fresh");
    });
  });
});
