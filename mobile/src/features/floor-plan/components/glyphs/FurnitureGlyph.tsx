import React from 'react';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import { useAppTheme } from '@/shared/theme/useAppTheme';
import type { Rotation } from '../../types';
import { isQuarterTurn, rotationTransform } from '../../utils/rotation';
import {
    getGlyphPalette,
    getSilhouetteGlyphPalette,
    type GlyphPalette,
} from './palette';
import { repeatCount, spreadSlots } from './parametric';

// アートワークは「1 グリッドセル = 60 ユニット」で設計している（デザイン提案の viewBox 準拠）。
// u = cellSize / 60 がユニット→px の換算係数。
// 固定サイズの「器具」（アームレスト・蛇口・五徳など）はユニット寸 × u で描き、
// 「数えられる部品」（クッション等）は repeatCount / spreadSlots で個数・位置を計算する
const UNITS_PER_CELL = 60;

type Props = {
    /** サーバー保存のプリセット識別子。未知・null は汎用グリフにフォールバック */
    presetKey?: string | null;
    /** 回転後の占有幅（セル数） */
    gridW: number;
    /** 回転後の占有高さ（セル数） */
    gridH: number;
    cellSize: number;
    /** 時計回りの回転角（度）。省略時は未回転 */
    rotation?: Rotation;
    /**
     * ヒートマップ表示: 状態色（親の背景）を透過し、部品を半透明シルエットで残す。
     * マテリアル色は使わない
     */
    silhouette?: boolean;
};

/** 各グリフ描画関数に渡すコンテキスト（px 座標系） */
type GlyphCtx = {
    /** 描画領域の幅 px */
    w: number;
    /** 描画領域の高さ px */
    h: number;
    /** アートワークユニット→px 換算係数 */
    u: number;
    gridW: number;
    gridH: number;
    ink: GlyphPalette;
    /** testID プレフィックス（furniture-glyph-<kind>） */
    id: string;
};

export function FurnitureGlyph({
    presetKey,
    gridW,
    gridH,
    cellSize,
    rotation = 0,
    silhouette = false,
}: Props) {
    const theme = useAppTheme();
    // Svg は常に回転後の占有矩形（フットプリント）と同じ大きさ
    const w = gridW * cellSize;
    const h = gridH * cellSize;
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
        return null;
    }
    const kind = presetKey && GLYPH_RENDERERS[presetKey] ? presetKey : 'generic';
    const renderGlyph = GLYPH_RENDERERS[kind];
    // 各レンダラは「未回転の素材」を描く前提で書かれている。90/270 度では
    // フットプリントに対して素材の座標系の縦横が入れ替わるので、入れ替えた寸法を渡す。
    // これによりパラメトリックな部品（クッション等）は素材の長辺に追従したままになる
    const swapsAxes = isQuarterTurn(rotation);
    const ctx: GlyphCtx = {
        w: swapsAxes ? h : w,
        h: swapsAxes ? w : h,
        u: cellSize / UNITS_PER_CELL,
        gridW: swapsAxes ? gridH : gridW,
        gridH: swapsAxes ? gridW : gridH,
        ink: silhouette ? getSilhouetteGlyphPalette() : getGlyphPalette(theme.mode),
        id: `furniture-glyph-${kind}`,
    };
    return (
        <Svg testID={ctx.id} width={w} height={h} pointerEvents="none">
            <G
                testID={`${ctx.id}-rotation`}
                transform={rotationTransform(rotation, w, h)}
            >
                {renderGlyph(ctx)}
            </G>
        </Svg>
    );
}

// ---- 基本セット -------------------------------------------------------------

function renderSofa({ w, h, u, gridW, ink, id }: GlyphCtx) {
    const { fabric } = ink;
    const cushions = spreadSlots(20 * u, w - 20 * u, repeatCount(gridW, 1), 4 * u);
    return (
        <G>
            <Rect
                testID={`${id}-body`}
                x={4 * u}
                y={6 * u}
                width={w - 8 * u}
                height={h - 12 * u}
                rx={10 * u}
                fill={fabric.fill}
                stroke={fabric.stroke}
                strokeWidth={1.5 * u}
            />
            <Rect
                x={16 * u}
                y={9 * u}
                width={w - 32 * u}
                height={11 * u}
                rx={5.5 * u}
                fill={fabric.dark}
            />
            <Rect
                testID={`${id}-armrest-left`}
                x={7 * u}
                y={10 * u}
                width={10 * u}
                height={h - 20 * u}
                rx={5 * u}
                fill={fabric.dark}
            />
            <Rect
                testID={`${id}-armrest-right`}
                x={w - 17 * u}
                y={10 * u}
                width={10 * u}
                height={h - 20 * u}
                rx={5 * u}
                fill={fabric.dark}
            />
            {cushions.map((slot, i) => (
                <Rect
                    key={i}
                    testID={`${id}-cushion-${i}`}
                    x={slot.start}
                    y={23 * u}
                    width={slot.size}
                    height={h - 33 * u}
                    rx={6 * u}
                    fill={fabric.pad}
                    stroke={fabric.padStroke}
                    strokeWidth={u}
                />
            ))}
        </G>
    );
}

function renderBed({ w, h, u, gridW, ink, id }: GlyphCtx) {
    const { wood, bedding } = ink;
    // 掛け布団の上端: 基準は 52 ユニットだが、低いベッドでは枕エリアを確保しつつ潰す
    const duvetTop = Math.min(52 * u, Math.max(42 * u, h * 0.29));
    const pillows = spreadSlots(20 * u, w - 20 * u, repeatCount(gridW, 1), 12 * u);
    const foldW = Math.min(37 * u, w * 0.31);
    const foldH = Math.min(40 * u, h - duvetTop - 9 * u);
    return (
        <G>
            <Rect
                testID={`${id}-body`}
                x={2 * u}
                y={2 * u}
                width={w - 4 * u}
                height={h - 4 * u}
                rx={9 * u}
                fill={wood.fill}
                stroke={wood.stroke}
                strokeWidth={1.5 * u}
            />
            <Rect
                x={9 * u}
                y={9 * u}
                width={w - 18 * u}
                height={h - 18 * u}
                rx={6 * u}
                fill={bedding.sheet}
                stroke={bedding.sheetStroke}
                strokeWidth={u}
            />
            {pillows.map((slot, i) => (
                <Rect
                    key={i}
                    testID={`${id}-pillow-${i}`}
                    x={slot.start}
                    y={17 * u}
                    width={slot.size}
                    height={23 * u}
                    rx={7 * u}
                    fill={bedding.pillow}
                    stroke={bedding.pillowStroke}
                    strokeWidth={u}
                />
            ))}
            <Rect
                x={9 * u}
                y={duvetTop}
                width={w - 18 * u}
                height={Math.max(0, h - 9 * u - duvetTop)}
                rx={6 * u}
                fill={bedding.duvet}
                stroke={bedding.duvetStroke}
                strokeWidth={u}
            />
            {foldH > 4 * u && (
                <Path
                    d={`M ${9 * u} ${duvetTop} L ${9 * u + foldW} ${duvetTop} L ${9 * u} ${duvetTop + foldH} Z`}
                    fill={bedding.fold}
                    stroke={bedding.duvetStroke}
                    strokeWidth={u}
                />
            )}
            {h - duvetTop > 20 * u && (
                <Line
                    x1={9 * u}
                    y1={duvetTop + 14 * u}
                    x2={w - 9 * u}
                    y2={duvetTop + 14 * u}
                    stroke={bedding.line}
                    strokeWidth={1.5 * u}
                />
            )}
        </G>
    );
}

function renderTable({ w, h, u, ink, id }: GlyphCtx) {
    const { wood } = ink;
    // 木目ラインは高さに応じて本数を増やす（40 ユニットごとに 1 本）
    const grainCount = repeatCount(h, 40 * u);
    const grains = Array.from({ length: grainCount }, (_, i) => {
        return 19 * u + (h - 38 * u) * ((i + 1) / (grainCount + 1));
    });
    return (
        <G>
            <Rect
                testID={`${id}-body`}
                x={10 * u}
                y={10 * u}
                width={w - 20 * u}
                height={h - 20 * u}
                rx={16 * u}
                fill={wood.fill}
                stroke={wood.stroke}
                strokeWidth={1.5 * u}
            />
            <Rect
                x={19 * u}
                y={19 * u}
                width={w - 38 * u}
                height={h - 38 * u}
                rx={11 * u}
                fill="none"
                stroke={wood.grain}
                strokeWidth={1.5 * u}
            />
            {grains.map((y, i) => (
                <Line
                    key={i}
                    x1={26 * u}
                    y1={y}
                    x2={w - 26 * u}
                    y2={y}
                    stroke={wood.grain}
                    strokeWidth={1.5 * u}
                />
            ))}
        </G>
    );
}

function renderTv({ w, h, u, ink, id }: GlyphCtx) {
    const { wood, panel } = ink;
    return (
        <G>
            <Rect
                testID={`${id}-body`}
                x={6 * u}
                y={20 * u}
                width={w - 12 * u}
                height={h - 26 * u}
                rx={8 * u}
                fill={wood.fill}
                stroke={wood.stroke}
                strokeWidth={1.5 * u}
            />
            <Circle cx={24 * u} cy={h - 22 * u} r={5 * u} fill={wood.detail} />
            <Rect
                x={w - 30 * u}
                y={h - 28 * u}
                width={14 * u}
                height={12 * u}
                rx={3 * u}
                fill={wood.detail}
            />
            <Rect
                x={16 * u}
                y={8 * u}
                width={w - 32 * u}
                height={12 * u}
                rx={3 * u}
                fill={panel.fill}
                stroke={panel.stroke}
                strokeWidth={u}
            />
            <Rect
                x={21 * u}
                y={11 * u}
                width={26 * u}
                height={3 * u}
                rx={1.5 * u}
                fill={panel.glare}
            />
        </G>
    );
}

function renderBookshelf({ w, h, u, ink, id }: GlyphCtx) {
    const { wood, books } = ink;
    // 背表紙は 12 ユニットごとに 1 冊。y と高さのゆらぎで「本らしさ」を出す
    const spineSlots = spreadSlots(12 * u, w - 12 * u, repeatCount(w, 12 * u), 2 * u);
    const yJitter = [1, 3, 0, 4, 1];
    return (
        <G>
            <Rect
                testID={`${id}-body`}
                x={4 * u}
                y={4 * u}
                width={w - 8 * u}
                height={h - 8 * u}
                rx={5 * u}
                fill={wood.deepFill}
                stroke={wood.deepStroke}
                strokeWidth={1.5 * u}
            />
            <Rect
                x={10 * u}
                y={10 * u}
                width={w - 20 * u}
                height={h - 20 * u}
                rx={2 * u}
                fill={wood.inner}
            />
            {spineSlots.map((slot, i) => {
                const top = (12 + yJitter[i % yJitter.length]) * u;
                return (
                    <Rect
                        key={i}
                        testID={`${id}-spine-${i}`}
                        x={slot.start}
                        y={top}
                        width={slot.size}
                        height={Math.max(0, h - 13 * u - top)}
                        rx={1.5 * u}
                        fill={books[i % books.length]}
                    />
                );
            })}
        </G>
    );
}

function renderChair({ w, h, u, ink, id }: GlyphCtx) {
    const { fabric } = ink;
    return (
        <G>
            <Rect
                x={8 * u}
                y={6 * u}
                width={w - 16 * u}
                height={10 * u}
                rx={5 * u}
                fill={fabric.dark}
            />
            <Rect
                testID={`${id}-body`}
                x={10 * u}
                y={14 * u}
                width={w - 20 * u}
                height={h - 20 * u}
                rx={10 * u}
                fill={fabric.pad}
                stroke={fabric.padStroke}
                strokeWidth={1.5 * u}
            />
            <Rect
                x={17 * u}
                y={21 * u}
                width={w - 34 * u}
                height={h - 34 * u}
                rx={7 * u}
                fill={fabric.light}
                stroke={fabric.padStroke}
                strokeWidth={u}
            />
        </G>
    );
}

function renderDesk({ w, h, u, ink, id }: GlyphCtx) {
    const { wood, panel, accent } = ink;
    const cx = w / 2;
    // マグは「小物」だが、狭いデスクでは端からはみ出さない位置に寄せる
    const mugCx = Math.min(cx + 38 * u, w - 12 * u);
    return (
        <G>
            <Rect
                testID={`${id}-body`}
                x={4 * u}
                y={8 * u}
                width={w - 8 * u}
                height={h - 16 * u}
                rx={6 * u}
                fill={wood.fill}
                stroke={wood.stroke}
                strokeWidth={1.5 * u}
            />
            <Rect
                x={cx - 22 * u}
                y={16 * u}
                width={44 * u}
                height={h - 32 * u}
                rx={4 * u}
                fill={wood.grain}
            />
            <Rect
                x={cx - 12 * u}
                y={21 * u}
                width={24 * u}
                height={Math.max(0, h - 42 * u)}
                rx={2 * u}
                fill={panel.fill}
            />
            <Circle
                cx={mugCx}
                cy={h / 2}
                r={5 * u}
                fill={accent.terracotta}
                stroke={accent.terracottaStroke}
                strokeWidth={u}
            />
            <Rect
                x={12 * u}
                y={18 * u}
                width={14 * u}
                height={h - 36 * u}
                rx={2 * u}
                fill={wood.grain}
            />
        </G>
    );
}

function renderRug({ w, h, u, ink, id }: GlyphCtx) {
    const { rug } = ink;
    const cx = w / 2;
    const cy = h / 2;
    return (
        <G>
            <Rect
                testID={`${id}-body`}
                x={6 * u}
                y={6 * u}
                width={w - 12 * u}
                height={h - 12 * u}
                rx={18 * u}
                fill={rug.fill}
                stroke={rug.stroke}
                strokeWidth={1.5 * u}
            />
            <Rect
                x={18 * u}
                y={18 * u}
                width={w - 36 * u}
                height={h - 36 * u}
                rx={12 * u}
                fill="none"
                stroke={rug.stroke}
                strokeWidth={1.5 * u}
                strokeDasharray={[6 * u, 5 * u]}
            />
            <Path
                d={`M ${cx} ${cy - 14 * u} L ${cx + 14 * u} ${cy} L ${cx} ${cy + 14 * u} L ${cx - 14 * u} ${cy} Z`}
                fill={rug.stroke}
                opacity={0.55}
            />
        </G>
    );
}

function renderCloset({ w, h, u, gridW, ink, id }: GlyphCtx) {
    const { wood } = ink;
    // 扉は 1 セルごとに 1 枚（最低 2 枚で「両開き」を保つ）
    const doorCount = Math.max(2, repeatCount(gridW, 1));
    const doors = spreadSlots(4 * u, w - 4 * u, doorCount, 0);
    const cy = h / 2;
    return (
        <G>
            <Rect
                testID={`${id}-body`}
                x={4 * u}
                y={6 * u}
                width={w - 8 * u}
                height={h - 12 * u}
                rx={6 * u}
                fill={wood.deepFill}
                stroke={wood.deepStroke}
                strokeWidth={1.5 * u}
            />
            {doors.slice(1).map((slot, i) => (
                <Line
                    key={i}
                    x1={slot.start}
                    y1={6 * u}
                    x2={slot.start}
                    y2={h - 6 * u}
                    stroke={wood.deepStroke}
                    strokeWidth={1.5 * u}
                />
            ))}
            {doors.map((slot, i) => (
                <Line
                    key={`hanger-${i}`}
                    x1={slot.start + 8 * u}
                    y1={14 * u}
                    x2={slot.start + slot.size - 8 * u}
                    y2={14 * u}
                    stroke={wood.inner}
                    strokeWidth={2 * u}
                />
            ))}
            <Rect
                x={w / 2 - 10 * u}
                y={cy - 6 * u}
                width={5 * u}
                height={12 * u}
                rx={2.5 * u}
                fill={wood.handle}
            />
            <Rect
                x={w / 2 + 5 * u}
                y={cy - 6 * u}
                width={5 * u}
                height={12 * u}
                rx={2.5 * u}
                fill={wood.handle}
            />
        </G>
    );
}

function renderPlant({ w, h, u, ink, id }: GlyphCtx) {
    const { green } = ink;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.max(6 * u, Math.min(w, h) / 2 - 12 * u);
    const veinAngles = [270, 330, 30, 90, 150, 210];
    return (
        <G>
            <Circle
                testID={`${id}-body`}
                cx={cx}
                cy={cy}
                r={r}
                fill={green.fill}
                stroke={green.stroke}
                strokeWidth={1.5 * u}
            />
            {veinAngles.map((deg, i) => {
                const rad = (deg * Math.PI) / 180;
                return (
                    <Line
                        key={i}
                        x1={cx}
                        y1={cy}
                        x2={cx + Math.cos(rad) * (r - u)}
                        y2={cy + Math.sin(rad) * (r - u)}
                        stroke={green.stroke}
                        strokeWidth={1.5 * u}
                    />
                );
            })}
            <Circle cx={cx} cy={cy} r={4 * u} fill={green.core} />
        </G>
    );
}

// ---- キッチン ---------------------------------------------------------------

function renderStove({ w, h, u, gridW, ink, id }: GlyphCtx) {
    const { appliance } = ink;
    // 五徳（バーナー）は 1 セルごとに 1 口。リング径は「器具」なので固定
    const burners = spreadSlots(10 * u, w - 10 * u, repeatCount(gridW, 1), 6 * u);
    const burnerR = 15 * u;
    const cy = 6 * u + (h - 12 * u) / 2;
    return (
        <G>
            <Rect
                testID={`${id}-body`}
                x={4 * u}
                y={6 * u}
                width={w - 8 * u}
                height={h - 12 * u}
                rx={6 * u}
                fill={appliance.fill}
                stroke={appliance.stroke}
                strokeWidth={1.5 * u}
            />
            {burners.map((slot, i) => {
                const cx = slot.start + slot.size / 2;
                return (
                    <G key={i}>
                        <Circle
                            testID={`${id}-burner-${i}`}
                            cx={cx}
                            cy={cy}
                            r={burnerR}
                            fill={appliance.inner}
                            stroke={appliance.ring}
                            strokeWidth={1.5 * u}
                        />
                        <Circle
                            cx={cx}
                            cy={cy}
                            r={burnerR * (8 / 15)}
                            fill="none"
                            stroke={appliance.ring}
                            strokeWidth={1.5 * u}
                        />
                        <Circle cx={cx} cy={cy} r={2 * u} fill={appliance.ring} />
                    </G>
                );
            })}
            <Rect
                x={w / 2 - 4 * u}
                y={h - 14 * u}
                width={8 * u}
                height={4 * u}
                rx={2 * u}
                fill={appliance.ring}
            />
        </G>
    );
}

function renderSink({ w, h, u, ink, id }: GlyphCtx) {
    const { steel } = ink;
    const cx = w / 2;
    return (
        <G>
            <Rect
                testID={`${id}-body`}
                x={4 * u}
                y={4 * u}
                width={w - 8 * u}
                height={h - 8 * u}
                rx={6 * u}
                fill={steel.fill}
                stroke={steel.stroke}
                strokeWidth={1.5 * u}
            />
            <Rect
                x={12 * u}
                y={18 * u}
                width={w - 24 * u}
                height={h - 30 * u}
                rx={6 * u}
                fill={steel.basin}
                stroke={steel.basinStroke}
                strokeWidth={u}
            />
            <Circle
                cx={cx}
                cy={18 * u + (h - 30 * u) / 2}
                r={3.5 * u}
                fill={steel.part}
            />
            <Circle
                testID={`${id}-faucet`}
                cx={cx}
                cy={10 * u}
                r={3 * u}
                fill={steel.part}
            />
            <Rect
                x={cx - 2 * u}
                y={10 * u}
                width={4 * u}
                height={9 * u}
                rx={2 * u}
                fill={steel.part}
            />
        </G>
    );
}

function renderShelf({ w, h, u, ink, id }: GlyphCtx) {
    const { wood, accent } = ink;
    // 仕切りは 40 ユニットごとに 1 区画。区画内の小物は 3 種を循環させる
    const sections = spreadSlots(10 * u, w - 10 * u, repeatCount(w, 40 * u), 0);
    const cy = h / 2;
    return (
        <G>
            <Rect
                testID={`${id}-body`}
                x={4 * u}
                y={6 * u}
                width={w - 8 * u}
                height={h - 12 * u}
                rx={5 * u}
                fill={wood.deepFill}
                stroke={wood.deepStroke}
                strokeWidth={1.5 * u}
            />
            <Rect
                x={10 * u}
                y={12 * u}
                width={w - 20 * u}
                height={h - 24 * u}
                rx={2 * u}
                fill={wood.inner}
            />
            {sections.slice(1).map((slot, i) => (
                <Line
                    key={i}
                    x1={slot.start}
                    y1={12 * u}
                    x2={slot.start}
                    y2={h - 12 * u}
                    stroke={wood.deepStroke}
                    strokeWidth={1.5 * u}
                />
            ))}
            {sections.map((slot, i) => {
                const cx = slot.start + slot.size / 2;
                const variant = i % 3;
                if (variant === 0) {
                    const r = Math.min(7 * u, slot.size / 2 - 2 * u);
                    if (r <= 0) return null;
                    return <Circle key={`item-${i}`} cx={cx} cy={cy} r={r} fill={accent.sage} />;
                }
                if (variant === 1) {
                    const itemW = Math.min(18 * u, slot.size - 4 * u);
                    if (itemW <= 0) return null;
                    return (
                        <Rect
                            key={`item-${i}`}
                            x={cx - itemW / 2}
                            y={cy - 10 * u}
                            width={itemW}
                            height={20 * u}
                            rx={3 * u}
                            fill={accent.yellow}
                        />
                    );
                }
                const r = Math.min(8 * u, slot.size / 2 - 2 * u);
                if (r <= 0) return null;
                return <Circle key={`item-${i}`} cx={cx} cy={cy} r={r} fill={accent.terracotta} />;
            })}
        </G>
    );
}

// ---- 水まわり ---------------------------------------------------------------

function renderBathtub({ w, h, u, gridW, ink, id }: GlyphCtx) {
    const { ceramic, water, steel } = ink;
    const cy = h / 2;
    // 波紋は 1 セルごとに 1 つ（固定サイズの「揺らぎ」を等間隔に置く）
    const ripples = spreadSlots(20 * u, w - 34 * u, repeatCount(gridW, 1), 6 * u);
    return (
        <G>
            <Rect
                testID={`${id}-body`}
                x={4 * u}
                y={4 * u}
                width={w - 8 * u}
                height={h - 8 * u}
                rx={15 * u}
                fill={ceramic.fill}
                stroke={ceramic.stroke}
                strokeWidth={1.5 * u}
            />
            <Rect
                x={13 * u}
                y={12 * u}
                width={w - 26 * u}
                height={h - 24 * u}
                rx={11 * u}
                fill={water.fill}
                stroke={water.stroke}
                strokeWidth={u}
            />
            {ripples.map((slot, i) => {
                const startX = slot.start + slot.size / 2 - 7 * u;
                const y = cy + (i % 2 === 0 ? 3 * u : -4 * u);
                return (
                    <Path
                        key={i}
                        testID={`${id}-ripple-${i}`}
                        d={`M ${startX} ${y} q ${7 * u} ${-5 * u} ${14 * u} 0`}
                        fill="none"
                        stroke={water.stroke}
                        strokeWidth={2 * u}
                    />
                );
            })}
            <Circle cx={w - 22 * u} cy={cy} r={3.5 * u} fill={steel.part} />
            <Rect
                x={8 * u}
                y={cy - 6 * u}
                width={7 * u}
                height={12 * u}
                rx={3.5 * u}
                fill={steel.part}
            />
        </G>
    );
}

function renderWasher({ w, h, u, ink, id }: GlyphCtx) {
    const { steel, ceramic } = ink;
    const cx = w / 2;
    const drumCy = (21 * u + h - 4 * u) / 2;
    const drumR = Math.min(14 * u, (h - 25 * u) / 2, (w - 20 * u) / 2);
    return (
        <G>
            <Rect
                testID={`${id}-body`}
                x={6 * u}
                y={4 * u}
                width={w - 12 * u}
                height={h - 8 * u}
                rx={8 * u}
                fill={steel.fill}
                stroke={steel.stroke}
                strokeWidth={1.5 * u}
            />
            <Rect
                x={11 * u}
                y={8 * u}
                width={w - 22 * u}
                height={9 * u}
                rx={3 * u}
                fill={steel.basin}
            />
            <Circle cx={17 * u} cy={12.5 * u} r={2.5 * u} fill={steel.part} />
            <Rect
                x={w - 24 * u}
                y={11 * u}
                width={10 * u}
                height={3 * u}
                rx={1.5 * u}
                fill={steel.part}
            />
            {drumR > 2 * u && (
                <G>
                    <Circle
                        cx={cx}
                        cy={drumCy}
                        r={drumR}
                        fill={steel.detail}
                        stroke={steel.basinStroke}
                        strokeWidth={1.5 * u}
                    />
                    <Circle
                        cx={cx}
                        cy={drumCy}
                        r={drumR * 0.6}
                        fill={steel.basin}
                        stroke={steel.basinStroke}
                        strokeWidth={1.5 * u}
                    />
                    <Path
                        d={`M ${cx - 8 * u} ${drumCy - 6 * u} A ${10 * u} ${10 * u} 0 0 1 ${cx} ${drumCy - 10 * u}`}
                        fill="none"
                        stroke={ceramic.bowl}
                        strokeWidth={2.5 * u}
                        strokeLinecap="round"
                    />
                </G>
            )}
        </G>
    );
}

function renderToilet({ w, h, u, ink, id }: GlyphCtx) {
    const { ceramic } = ink;
    const cx = w / 2;
    const bowlCy = (20 * u + h - 3 * u) / 2;
    const bowlRx = Math.max(4 * u, (w - 28 * u) / 2);
    const bowlRy = Math.max(4 * u, (h - 25 * u) / 2);
    return (
        <G>
            <Rect
                testID={`${id}-body`}
                x={12 * u}
                y={5 * u}
                width={w - 24 * u}
                height={13 * u}
                rx={4 * u}
                fill={ceramic.fill}
                stroke={ceramic.stroke}
                strokeWidth={1.5 * u}
            />
            <Ellipse
                cx={cx}
                cy={bowlCy}
                rx={bowlRx}
                ry={bowlRy}
                fill={ceramic.bowl}
                stroke={ceramic.stroke}
                strokeWidth={1.5 * u}
            />
            <Ellipse
                cx={cx}
                cy={bowlCy + u}
                rx={Math.max(2 * u, bowlRx - 6 * u)}
                ry={Math.max(2 * u, bowlRy - 6 * u)}
                fill={ceramic.fill}
                stroke={ceramic.inner}
                strokeWidth={1.5 * u}
            />
        </G>
    );
}

function renderWashbasin({ w, h, u, ink, id }: GlyphCtx) {
    const { ceramic, steel } = ink;
    const cx = w / 2;
    const bowlCy = (h + 6 * u) / 2;
    const bowlRx = Math.max(4 * u, (w - 30 * u) / 2);
    const bowlRy = Math.max(4 * u, (h - 36 * u) / 2);
    return (
        <G>
            <Rect
                testID={`${id}-body`}
                x={4 * u}
                y={10 * u}
                width={w - 8 * u}
                height={h - 14 * u}
                rx={6 * u}
                fill={ceramic.fill}
                stroke={ceramic.stroke}
                strokeWidth={1.5 * u}
            />
            <Ellipse
                cx={cx}
                cy={bowlCy}
                rx={bowlRx}
                ry={bowlRy}
                fill={steel.detail}
                stroke={steel.basinStroke}
                strokeWidth={1.5 * u}
            />
            <Circle cx={cx} cy={bowlCy + 2 * u} r={3 * u} fill={steel.part} />
            <Circle
                testID={`${id}-faucet`}
                cx={cx}
                cy={16 * u}
                r={3 * u}
                fill={steel.part}
            />
            <Rect
                x={cx - 2 * u}
                y={16 * u}
                width={4 * u}
                height={8 * u}
                rx={2 * u}
                fill={steel.part}
            />
        </G>
    );
}

function renderFridge({ w, h, u, ink, id }: GlyphCtx) {
    const { steel } = ink;
    // 冷凍室ドアの奥行きは固定だが、極端に低い家具では比率で潰す
    const dividerY = Math.min(26 * u, h * 0.45);
    return (
        <G>
            <Rect
                testID={`${id}-body`}
                x={7 * u}
                y={4 * u}
                width={w - 14 * u}
                height={h - 8 * u}
                rx={7 * u}
                fill={steel.fill}
                stroke={steel.stroke}
                strokeWidth={1.5 * u}
            />
            <Line
                x1={7 * u}
                y1={dividerY}
                x2={w - 7 * u}
                y2={dividerY}
                stroke={steel.stroke}
                strokeWidth={1.5 * u}
            />
            <Rect
                x={12 * u}
                y={dividerY - 8 * u}
                width={11 * u}
                height={4 * u}
                rx={2 * u}
                fill={steel.part}
            />
            <Rect
                x={12 * u}
                y={dividerY + 4 * u}
                width={11 * u}
                height={4 * u}
                rx={2 * u}
                fill={steel.part}
            />
            <Rect
                x={w - 30 * u}
                y={10 * u}
                width={16 * u}
                height={3 * u}
                rx={1.5 * u}
                fill={steel.detail}
            />
        </G>
    );
}

// ---- 汎用フォールバック ------------------------------------------------------

function renderGeneric({ w, h, u, ink, id }: GlyphCtx) {
    const { generic } = ink;
    const cx = w / 2;
    const cy = h / 2;
    return (
        <G>
            <Rect
                testID={`${id}-body`}
                x={4 * u}
                y={4 * u}
                width={w - 8 * u}
                height={h - 8 * u}
                rx={10 * u}
                fill={generic.fill}
                stroke={generic.stroke}
                strokeWidth={1.5 * u}
            />
            <Rect
                x={14 * u}
                y={14 * u}
                width={w - 28 * u}
                height={h - 28 * u}
                rx={6 * u}
                fill="none"
                stroke={generic.inner}
                strokeWidth={1.5 * u}
                strokeDasharray={[5 * u, 4 * u]}
            />
            <Circle
                cx={cx}
                cy={cy - 6 * u}
                r={7 * u}
                fill="none"
                stroke={generic.part}
                strokeWidth={2 * u}
            />
            <Rect
                x={cx - 14 * u}
                y={cy + 10 * u}
                width={28 * u}
                height={5 * u}
                rx={2.5 * u}
                fill={generic.bar}
            />
        </G>
    );
}

// presetKey → グリフ描画の対応表。未知キーは generic にフォールバックする
const GLYPH_RENDERERS: Record<string, (ctx: GlyphCtx) => React.ReactElement> = {
    // リビング・寝室
    sofa: renderSofa,
    bed: renderBed,
    table: renderTable,
    tv: renderTv,
    bookshelf: renderBookshelf,
    chair: renderChair,
    desk: renderDesk,
    rug: renderRug,
    closet: renderCloset,
    plant: renderPlant,
    // キッチン
    fridge: renderFridge,
    stove: renderStove,
    sink: renderSink,
    shelf: renderShelf,
    // 水まわり
    bathtub: renderBathtub,
    washer: renderWasher,
    toilet: renderToilet,
    washbasin: renderWashbasin,
    // 汎用フォールバック
    generic: renderGeneric,
};
