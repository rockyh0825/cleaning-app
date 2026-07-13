import {
    ReduceMotion,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

/** 押下中の縮小スケール。押した実感を出しつつレイアウトを乱さない控えめな値 */
export const PRESSED_SCALE = 0.96;

/**
 * プレスフィードバック用のスプリング設定。
 * 素早い操作に追従できるよう硬め（高 stiffness）・強め減衰にする。
 * OS の「視差効果を減らす」設定では即座に目標スケールへ切り替える。
 */
export const PRESS_SPRING_CONFIG = {
    damping: 18,
    stiffness: 320,
    mass: 0.7,
    reduceMotion: ReduceMotion.System,
} as const;

/** テストでスプリングの収束を待つための目安時間（ms） */
export const PRESS_SPRING_SETTLE_MS = 1000;

/**
 * ボタン押下のスプリングスケールを提供する共通フック。
 * 返り値の animatedStyle を Animated.View に、pressIn / pressOut を
 * onPressIn / onPressOut に渡して使う。
 */
export function usePressScale() {
    const scale = useSharedValue(1);

    const pressIn = () => {
        scale.value = withSpring(PRESSED_SCALE, PRESS_SPRING_CONFIG);
    };

    const pressOut = () => {
        scale.value = withSpring(1, PRESS_SPRING_CONFIG);
    };

    // 依存配列は Babel プラグイン無しの環境（ts-jest でのテスト実行）でも動くよう明示する
    const animatedStyle = useAnimatedStyle(
        () => ({
            transform: [{ scale: scale.value }],
        }),
        [scale],
    );

    return { animatedStyle, pressIn, pressOut };
}
