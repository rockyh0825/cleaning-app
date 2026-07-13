import { renderHook } from "@testing-library/react-native";
import * as Reanimated from "react-native-reanimated";
import { useColorTransitionStyle } from "../useColorTransitionStyle";

// shared value への「書き込み順」を検証するため、reanimated をテスト内モックに差し替える。
// useSharedValue は value への代入を writeLog に記録し、withTiming は目標値をそのまま返す。
jest.mock("react-native-reanimated", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const writeLog: Array<{ target: object; value: unknown }> = [];
  const sharedValues: Array<{ value: unknown }> = [];
  return {
    __esModule: true,
    __writeLog: writeLog,
    __sharedValues: sharedValues,
    ReduceMotion: { System: "system" },
    interpolateColor: (
      progress: number,
      _inputRange: number[],
      [from, to]: string[],
    ) => `interpolate(${from} -> ${to} @ ${progress})`,
    withTiming: (toValue: unknown) => toValue,
    useAnimatedStyle: (factory: () => Record<string, unknown>) => factory(),
    useSharedValue: (initial: unknown) => {
      const ref = React.useRef<{ value: unknown } | null>(null);
      if (ref.current === null) {
        let current = initial;
        const sharedValue = {} as { value: unknown };
        Object.defineProperty(sharedValue, "value", {
          get: () => current,
          set: (next: unknown) => {
            current = next;
            writeLog.push({ target: sharedValue, value: next });
          },
        });
        sharedValues.push(sharedValue);
        ref.current = sharedValue;
      }
      return ref.current;
    },
  };
});

const { __writeLog: writeLog, __sharedValues: sharedValues } =
  Reanimated as unknown as {
    __writeLog: Array<{ target: object; value: unknown }>;
    __sharedValues: Array<{ value: unknown }>;
  };

const RED = "#F49382";
const GREEN = "#7BDDB0";

describe("useColorTransitionStyle", () => {
  beforeEach(() => {
    writeLog.length = 0;
    sharedValues.length = 0;
  });

  it("does_not_write_to_shared_values_on_mount", () => {
    // Arrange & Act: マウント時は from = to のため書き込み（アニメーション）が発生しない
    renderHook(() => useColorTransitionStyle("backgroundColor", RED));

    // Assert
    expect(writeLog).toHaveLength(0);
  });

  it("resets_progress_before_writing_new_target_color_when_color_changes", () => {
    // Arrange: 赤で表示中（フックは fromColor / toColor / progress の順に shared value を作る）
    const { rerender } = renderHook(
      ({ color }: { color: string }) =>
        useColorTransitionStyle("backgroundColor", color),
      { initialProps: { color: RED } },
    );
    expect(sharedValues).toHaveLength(3);
    const [, toColor, progress] = sharedValues;

    // Act: 緑へ変化
    rerender({ color: GREEN });

    // Assert: progress = 0 のリセットが「新しい目標色の書き込み」より先に行われる。
    // 逆順だと、書き込みの間に UI フレームが挟まった場合に progress === 1 の
    // 収束分岐が新色を 1 フレーム先出しする（フラッシュ）理論上の窓ができる
    const resetIndex = writeLog.findIndex(
      (entry) => entry.target === progress && entry.value === 0,
    );
    const newTargetIndex = writeLog.findIndex(
      (entry) => entry.target === toColor && entry.value === GREEN,
    );
    expect(resetIndex).toBeGreaterThanOrEqual(0);
    expect(newTargetIndex).toBeGreaterThanOrEqual(0);
    expect(resetIndex).toBeLessThan(newTargetIndex);
  });
});
