// 家具グリフのパラメトリック描画ヘルパー。
// グリフは viewBox を引き伸ばさず、幅・高さから部品の個数と位置を計算する
// （クッション・五徳・背表紙など「数えられる部品」は個数を増減し、
//  蛇口・アームレストなど「器具」は固定サイズを保つ）。

export type Slot = { start: number; size: number };

// 浮動小数点の除算誤差（例: 1 / 0.2 = 4.999...）で個数が 1 個欠けるのを防ぐ
const DIVISION_EPSILON = 1e-9;

/**
 * 繰り返し部品の個数 = floor(スパン ÷ 基準スパン)。最低 1 個。
 * スパン・基準スパンが非正・非有限の場合も 1 に丸めて描画を破綻させない。
 */
export function repeatCount(span: number, baseSpan: number): number {
    if (!Number.isFinite(span) || span <= 0) return 1;
    if (!Number.isFinite(baseSpan) || baseSpan <= 0) return 1;
    return Math.max(1, Math.floor(span / baseSpan + DIVISION_EPSILON));
}

/**
 * 区間 [start, end] を count 個のスロットへ gap 付きで等分する。
 * 区間が潰れている・count が非正のときは空リスト。
 * gap 合計が区間を超える場合はサイズ 0 に丸めて負値を出さない。
 */
export function spreadSlots(
    start: number,
    end: number,
    count: number,
    gap: number,
): Slot[] {
    if (count <= 0) return [];
    if (end <= start) return [];
    const range = end - start;
    const size = Math.max(0, (range - gap * (count - 1)) / count);
    const slots: Slot[] = [];
    for (let i = 0; i < count; i++) {
        slots.push({ start: start + i * (size + gap), size });
    }
    return slots;
}
