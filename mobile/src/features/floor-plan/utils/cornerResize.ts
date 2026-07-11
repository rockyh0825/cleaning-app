import type { Point, Rect } from '@/shared/utils/grid';

/** リサイズハンドルを置く四つ角。tl=左上, tr=右上, bl=左下, br=右下 */
export type Corner = 'tl' | 'tr' | 'bl' | 'br';

export const CORNERS: readonly Corner[] = ['tl', 'tr', 'bl', 'br'];

/**
 * 矩形の指定した角のグリッド座標を返す。右端・下端はセル境界（x+w / y+h）。
 * ドラッグ対象の「角の点」を useDragToGrid の rect（w=h=0）として使う。
 * UIスレッド（ゴースト描画 worklet）からも呼ぶため worklet 指定。
 */
export function cornerPoint(rect: Rect, corner: Corner): Point {
    'worklet';
    return {
        x: corner === 'tl' || corner === 'bl' ? rect.x : rect.x + rect.w,
        y: corner === 'tl' || corner === 'tr' ? rect.y : rect.y + rect.h,
    };
}

/**
 * 角の点が動ける範囲を clampWithin の parent 形式（Rect）で返す。
 * 対角のアンカーから最小 1×1 を維持しつつ、キャンバス（0〜maxRight/maxBottom）内に収める。
 * position と maxRight/maxBottom は同一空間（部屋: 絶対、家具: 部屋相対 0 基点）で渡す。
 */
export function cornerBounds(
    rect: Rect,
    corner: Corner,
    maxRight: number,
    maxBottom: number,
): Rect {
    'worklet';
    const left = corner === 'tl' || corner === 'bl';
    const top = corner === 'tl' || corner === 'tr';
    // 左側の角: 0〜(右端-1)。右側の角: (左端+1)〜maxRight。y も同様
    const minX = left ? 0 : rect.x + 1;
    const maxX = left ? rect.x + rect.w - 1 : maxRight;
    const minY = top ? 0 : rect.y + 1;
    const maxY = top ? rect.y + rect.h - 1 : maxBottom;
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/**
 * ドラッグ後の角の点から、対角をアンカーとして固定した新しい矩形を返す。
 * point には cornerBounds でクランプ済みの座標を渡す前提（w/h は必ず 1 以上になる）。
 * UIスレッド（ゴースト描画 worklet）からも呼ぶため worklet 指定。
 */
export function rectFromCorner(rect: Rect, corner: Corner, point: Point): Rect {
    'worklet';
    const left = corner === 'tl' || corner === 'bl';
    const top = corner === 'tl' || corner === 'tr';
    const x = left ? point.x : rect.x;
    const y = top ? point.y : rect.y;
    const w = left ? rect.x + rect.w - point.x : point.x - rect.x;
    const h = top ? rect.y + rect.h - point.y : point.y - rect.y;
    return { x, y, w, h };
}
