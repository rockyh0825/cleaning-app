import { useEffect, useRef } from 'react';
import {
    interpolateColor,
    ReduceMotion,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import {
    COLOR_TRANSITION_DURATION_MS,
    initialColorTransition,
    nextColorTransition,
} from '@/shared/utils/colorTransition';

/**
 * 色プロパティの変化を滑らかにクロスフェードさせる animated style を返す共通フック。
 * 状態色（要掃除の赤 → きれいの緑など）が瞬時に切り替わるのを防ぐ。
 * - 遷移の決定は純関数 nextColorTransition（shared/utils/colorTransition）に委譲
 * - OS の「視差効果を減らす」設定では即座に目標色へ切り替える（ReduceMotion.System）
 * - 静的スタイルの後ろに重ねて使う想定（初期値は同色のため見た目は変わらない）
 */
export function useColorTransitionStyle(
    property: 'backgroundColor' | 'borderColor',
    color: string,
) {
    // 遷移状態は JS 側の純関数で管理し、shared value へは結果だけ流す
    const transitionRef = useRef(initialColorTransition(color));
    const fromColor = useSharedValue(color);
    const toColor = useSharedValue(color);
    const progress = useSharedValue(1);

    useEffect(() => {
        const { transition, changed } = nextColorTransition(
            transitionRef.current,
            color,
        );
        transitionRef.current = transition;
        if (!changed) return;
        // progress のリセットを最初に書く。toColor 更新後に progress = 0 より前の
        // UI フレームが挟まると progress === 1 の収束分岐が新色を1フレーム
        // 先出しする理論上の窓ができるため、先に収束分岐を抜けておく
        progress.value = 0;
        fromColor.value = transition.from;
        toColor.value = transition.to;
        progress.value = withTiming(1, {
            duration: COLOR_TRANSITION_DURATION_MS,
            reduceMotion: ReduceMotion.System,
        });
    }, [color, fromColor, toColor, progress]);

    // 依存配列は Babel プラグイン無しの環境（ts-jest でのテスト実行）でも動くよう明示する
    return useAnimatedStyle(
        () => ({
            // 収束後は interpolateColor の rgba 変換を通さずトークンの生値を返す。
            // 静的スタイルと完全一致させ、スタイル検証（テーマテスト）を表現揺れなく保つ
            [property]:
                progress.value === 1
                    ? toColor.value
                    : interpolateColor(
                          progress.value,
                          [0, 1],
                          [fromColor.value, toColor.value],
                      ),
        }),
        [property, progress, fromColor, toColor],
    );
}
