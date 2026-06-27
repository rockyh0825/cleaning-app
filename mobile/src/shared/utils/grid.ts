export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };

/**
 * 座標をグリッドセルにスナップする。
 * ドラッグ中に毎フレーム呼ばれる前提で、乗算・丸め・乗算のみで構成する。
 */
export function snapToGrid(point: Point, cellSize: number): Point {
    return {
        x: Math.round(point.x / cellSize) * cellSize,
        y: Math.round(point.y / cellSize) * cellSize,
    };
}

/**
 * 2つの矩形が重なっているか判定する（辺が接するだけの場合は false）。
 * 家具配置時の衝突チェックに使う。
 */
export function rectsOverlap(a: Rect, b: Rect): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/**
 * child 矩形が parent 矩形の内側に収まるよう座標をクランプする。
 * child が parent より大きい場合は parent の左上に揃える。
 */
export function clampWithin(child: Rect, parent: Rect): Rect {
    const x = Math.max(parent.x, Math.min(child.x, parent.x + parent.w - child.w));
    const y = Math.max(parent.y, Math.min(child.y, parent.y + parent.h - child.h));
    return { x, y, w: child.w, h: child.h };
}
