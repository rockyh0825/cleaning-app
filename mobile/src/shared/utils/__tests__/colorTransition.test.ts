import {
  initialColorTransition,
  nextColorTransition,
  COLOR_TRANSITION_DURATION_MS,
} from "../colorTransition";

describe("colorTransition", () => {
  describe("initialColorTransition", () => {
    it("returns_transition_with_same_from_and_to_for_initial_color", () => {
      // Arrange & Act
      const transition = initialColorTransition("#F49382");

      // Assert: 初期状態は from = to（マウント時にアニメーションしない）
      expect(transition).toEqual({ from: "#F49382", to: "#F49382" });
    });
  });

  describe("nextColorTransition", () => {
    it("keeps_transition_unchanged_when_color_is_same_as_current_target", () => {
      // Arrange
      const current = initialColorTransition("#F49382");

      // Act
      const result = nextColorTransition(current, "#F49382");

      // Assert: 同色なら再アニメーションしない
      expect(result.changed).toBe(false);
      expect(result.transition).toEqual(current);
    });

    it("starts_transition_from_current_target_when_color_changes", () => {
      // Arrange: 赤（要掃除）で表示中
      const current = initialColorTransition("#F49382");

      // Act: 緑（きれい）へ変化
      const result = nextColorTransition(current, "#7BDDB0");

      // Assert: 直前の色から新しい色へのクロスフェードになる
      expect(result.changed).toBe(true);
      expect(result.transition).toEqual({ from: "#F49382", to: "#7BDDB0" });
    });

    it("retargets_from_previous_target_when_color_changes_mid_transition", () => {
      // Arrange: 赤→緑 のトランジション中
      const midFlight = { from: "#F49382", to: "#7BDDB0" };

      // Act: さらに黄へ変化（連続記録などで再ターゲット）
      const result = nextColorTransition(midFlight, "#F6CE67");

      // Assert: 進行中の目標色（緑）を起点に黄へ遷移する
      expect(result.changed).toBe(true);
      expect(result.transition).toEqual({ from: "#7BDDB0", to: "#F6CE67" });
    });

    it("treats_differently_cased_hex_as_a_color_change", () => {
      // Arrange: 比較は文字列の完全一致（テーマトークンは表記が一定である前提）
      const current = initialColorTransition("#f49382");

      // Act
      const result = nextColorTransition(current, "#F49382");

      // Assert
      expect(result.changed).toBe(true);
      expect(result.transition).toEqual({ from: "#f49382", to: "#F49382" });
    });

    it("returns_to_original_color_when_toggled_back", () => {
      // Arrange: 赤→緑 が完了した状態
      const afterGreen = nextColorTransition(
        initialColorTransition("#F49382"),
        "#7BDDB0",
      ).transition;

      // Act: 記録削除などで赤へ戻る
      const result = nextColorTransition(afterGreen, "#F49382");

      // Assert
      expect(result.changed).toBe(true);
      expect(result.transition).toEqual({ from: "#7BDDB0", to: "#F49382" });
    });
  });

  describe("COLOR_TRANSITION_DURATION_MS", () => {
    it("is_a_positive_duration_short_enough_for_ui_feedback", () => {
      // Assert: 体感で「滑らか」かつ操作を妨げない範囲（0 < d <= 1000ms）
      expect(COLOR_TRANSITION_DURATION_MS).toBeGreaterThan(0);
      expect(COLOR_TRANSITION_DURATION_MS).toBeLessThanOrEqual(1000);
    });
  });
});
