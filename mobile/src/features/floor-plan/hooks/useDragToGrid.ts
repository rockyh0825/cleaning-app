import { Gesture } from 'react-native-gesture-handler';
import type { GestureType } from 'react-native-gesture-handler';
import {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';
import type { Point, Rect } from '@/shared/utils/grid';
import { clampWithin, pxOffsetToGridDelta } from '@/shared/utils/grid';

export type CommitDragParams = {
    /** ドラッグ対象のグリッド単位の現在矩形 */
    rect: Rect;
    /** ジェスチャー終了時の累積オフセット（px） */
    offsetPx: Point;
    /** 1 セルの画面上サイズ（px、scale=1 のとき） */
    cellSize: number;
    /** ズーム倍率（省略時 1） */
    scale?: number;
    /** グリッド単位の可動域（部屋: キャンバス、家具: 所属部屋） */
    bounds: Rect;
};

/**
 * ドラッグ終了時の確定計算。px オフセットをグリッド差分に変換し、
 * bounds にクランプした矩形を返す。位置が変わらない場合は null。
 * Reanimated 非依存の純粋関数としてテストする。
 *
 * rect・差分ともグリッド整数座標のため snapToGrid は恒等変換になり省略している。
 * rect が最初から bounds 外にある場合は、移動量 0 でもクランプ後の位置で
 * commit される（不正データの自己修復として意図した挙動）。
 */
export function commitDrag({
    rect,
    offsetPx,
    cellSize,
    scale = 1,
    bounds,
}: CommitDragParams): Rect | null {
    const delta = pxOffsetToGridDelta(offsetPx, cellSize, scale);
    const moved: Rect = {
        x: rect.x + delta.x,
        y: rect.y + delta.y,
        w: rect.w,
        h: rect.h,
    };
    const clamped = clampWithin(moved, bounds);
    if (clamped.x === rect.x && clamped.y === rect.y) return null;
    return clamped;
}

/**
 * ドラッグ中のプレビュー用オフセット変換。対象の Animated.View は scale transform の
 * 掛かったキャンバス内側にあるため、スクリーン px の translation をそのまま入れると
 * 見かけの移動量が scale 倍になる。scale で割って指の移動に一致させる。
 * scale が 0 以下・非有限の場合は等倍として扱う（0 除算・NaN を防ぐ）。
 * Reanimated 非依存の純粋関数としてテストする（UIスレッドでも呼ぶため worklet 指定）。
 */
export function previewOffset(offsetPx: Point, scale: number): Point {
    'worklet';
    const effectiveScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
    return {
        x: offsetPx.x / effectiveScale,
        y: offsetPx.y / effectiveScale,
    };
}

export type UseDragToGridParams = {
    rect: Rect;
    bounds: Rect;
    cellSize: number;
    scale?: number;
    /** ドラッグ確定時にスナップ・クランプ済みのグリッド矩形を受け取る */
    onCommit: (rect: Rect) => void;
    /** jest-utils の getByGestureTestId で参照するテストID */
    testID?: string;
    /** このドラッグの判定が終わるまで待機させる外部ジェスチャー（キャンバスパン等） */
    blocksExternal?: GestureType;
};

/**
 * pan ジェスチャーの px オフセットをグリッド座標に確定させる共通フック。
 * ドラッグ中は shared value による transform プレビューのみ行い（再レンダリングなし）、
 * onEnd で commitDrag を通した確定矩形を onCommit に渡す。
 */
export function useDragToGrid({
    rect,
    bounds,
    cellSize,
    scale = 1,
    onCommit,
    testID,
    blocksExternal,
}: UseDragToGridParams) {
    const translationX = useSharedValue(0);
    const translationY = useSharedValue(0);

    function commit(offsetPx: Point) {
        const committed = commitDrag({ rect, offsetPx, cellSize, scale, bounds });
        if (committed) onCommit(committed);
    }

    const gesture = Gesture.Pan()
        .onUpdate((event) => {
            const preview = previewOffset(
                { x: event.translationX, y: event.translationY },
                scale,
            );
            translationX.value = preview.x;
            translationY.value = preview.y;
        })
        .onEnd((event) => {
            runOnJS(commit)({ x: event.translationX, y: event.translationY });
        })
        .onFinalize(() => {
            translationX.value = 0;
            translationY.value = 0;
        });
    if (testID) gesture.withTestId(testID);
    if (blocksExternal) gesture.blocksExternalGesture(blocksExternal);

    // 依存配列は Babel プラグイン無しの環境（ts-jest でのテスト実行）でも動くよう明示する
    const animatedStyle = useAnimatedStyle(
        () => ({
            transform: [
                { translateX: translationX.value },
                { translateY: translationY.value },
            ],
        }),
        [translationX, translationY],
    );

    return { gesture, animatedStyle };
}
