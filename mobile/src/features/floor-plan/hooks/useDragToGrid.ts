import { Gesture } from "react-native-gesture-handler";
import {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
} from "react-native-reanimated";
import type { Point, Rect } from "@/shared/utils/grid";
import { clampWithin, pxOffsetToGridDelta } from "@/shared/utils/grid";

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

export type UseDragToGridParams = {
    rect: Rect;
    bounds: Rect;
    cellSize: number;
    scale?: number;
    /** ドラッグ確定時にスナップ・クランプ済みのグリッド矩形を受け取る */
    onCommit: (rect: Rect) => void;
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
}: UseDragToGridParams) {
    const translationX = useSharedValue(0);
    const translationY = useSharedValue(0);

    function commit(offsetPx: Point) {
        const committed = commitDrag({ rect, offsetPx, cellSize, scale, bounds });
        if (committed) onCommit(committed);
    }

    const gesture = Gesture.Pan()
        .onUpdate((event) => {
            translationX.value = event.translationX;
            translationY.value = event.translationY;
        })
        .onEnd((event) => {
            runOnJS(commit)({ x: event.translationX, y: event.translationY });
        })
        .onFinalize(() => {
            translationX.value = 0;
            translationY.value = 0;
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translationX.value },
            { translateY: translationY.value },
        ],
    }));

    return { gesture, animatedStyle };
}
