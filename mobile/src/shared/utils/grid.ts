export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };

/**
 * 座標をグリッドセルにスナップする。
 * ドラッグ中に毎フレーム呼ばれる前提で、除算・丸め・乗算で構成する。
 * cellSize が 0 または非有限値の場合は point をそのまま返す。
 */
export function snapToGrid(point: Point, cellSize: number): Point {
    if (!Number.isFinite(cellSize) || cellSize === 0) return point;
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
    'worklet';
    const x = Math.max(parent.x, Math.min(child.x, parent.x + parent.w - child.w));
    const y = Math.max(parent.y, Math.min(child.y, parent.y + parent.h - child.h));
    return { x, y, w: child.w, h: child.h };
}

/**
 * bounds 内を左上から行優先で走査し、既存矩形と重ならない最初の位置を返す。
 * 空きが無い場合や size が bounds に収まらない場合は null。
 * 部屋追加時の自動空き配置に使う。
 */
export function findFreePosition(
    size: { w: number; h: number },
    obstacles: Rect[],
    bounds: Rect,
): Point | null {
    const maxX = bounds.x + bounds.w - size.w;
    const maxY = bounds.y + bounds.h - size.h;

    for (let y = bounds.y; y <= maxY; y++) {
        for (let x = bounds.x; x <= maxX; x++) {
            const candidate: Rect = { x, y, w: size.w, h: size.h };
            if (!obstacles.some((obstacle) => rectsOverlap(candidate, obstacle))) {
                return { x, y };
            }
        }
    }
    return null;
}

/**
 * px単位の累積ドラッグオフセットをグリッド差分（整数セル数）に変換する。
 * scale はズーム倍率（2x では画面上の 1 セルが 2*cellSize px になるため換算が 1/2 になる）。
 * cellSize・scale が 0 以下または非有限値の場合は差分 0 を返す。
 */
export function pxOffsetToGridDelta(offsetPx: Point, cellSize: number, scale = 1): Point {
    'worklet';
    if (!Number.isFinite(cellSize) || cellSize <= 0) return { x: 0, y: 0 };
    if (!Number.isFinite(scale) || scale <= 0) return { x: 0, y: 0 };
    const effectiveCellSize = cellSize * scale;
    return {
        x: Math.round(offsetPx.x / effectiveCellSize),
        y: Math.round(offsetPx.y / effectiveCellSize),
    };
}
