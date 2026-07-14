import React from 'react';
import { useColorScheme } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/shared/theme/ThemeProvider';
import { FurnitureGlyph } from '../FurnitureGlyph';
import { getGlyphPalette, GLYPH_SILHOUETTE_FILL } from '../palette';

// useAppTheme.test.tsx と同じ方法で OS のカラースキームをモックする
jest.mock('react-native/Libraries/Utilities/useColorScheme');

const mockUseColorScheme = useColorScheme as jest.Mock;

function renderWithTheme(ui: React.ReactElement) {
    return render(<ThemeProvider>{ui}</ThemeProvider>);
}

/**
 * react-native-svg は fill/stroke を processColor 済みの
 * { type: 0, payload: uint32(ARGB) } に変換する。hex → その形へ変換する
 */
function svgColor(hex: string) {
    const rgb = parseInt(hex.slice(1), 16);
    return { type: 0, payload: ((0xff << 24) | rgb) >>> 0 };
}

const TRANSPARENT_PAYLOAD = 0;

/** 回転テストのセルサイズ（px） */
const CELL = 40;

/**
 * react-native-svg は transform 文字列を matrix [a, b, c, d, e, f] へ解決する。
 * matrix は (x, y) → (a·x + c·y + e, b·x + d·y + f) の写像。
 */
function applyMatrix(matrix: number[], x: number, y: number) {
    const [a, b, c, d, e, f] = matrix;
    return { x: a * x + c * y + e, y: b * x + d * y + f };
}

/** localW×localH の素材矩形を matrix で写した外接矩形 */
function mappedBounds(matrix: number[], localW: number, localH: number) {
    const corners = [
        applyMatrix(matrix, 0, 0),
        applyMatrix(matrix, localW, 0),
        applyMatrix(matrix, 0, localH),
        applyMatrix(matrix, localW, localH),
    ];
    const xs = corners.map((p) => p.x);
    const ys = corners.map((p) => p.y);
    return {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
    };
}

beforeEach(() => {
    mockUseColorScheme.mockReturnValue('light');
});

// 承認済みデザイン（issue #148）の家具カタログ 18 プリセット + 汎用 1 種 = 19 グリフ
const ALL_PRESET_KEYS = [
    // リビング・寝室
    'sofa',
    'bed',
    'table',
    'tv',
    'bookshelf',
    'chair',
    'desk',
    'rug',
    'closet',
    'plant',
    // キッチン
    'fridge',
    'stove',
    'sink',
    'shelf',
    // 水まわり
    'bathtub',
    'washer',
    'toilet',
    'washbasin',
] as const;

describe('FurnitureGlyph', () => {
    describe('プリセットの解決とフォールバック', () => {
        it.each(ALL_PRESET_KEYS)(
            'renders_dedicated_glyph_for_preset_%s',
            (key) => {
                // Arrange & Act
                renderWithTheme(
                    <FurnitureGlyph
                        presetKey={key}
                        gridW={2}
                        gridH={2}
                        cellSize={40}
                    />,
                );

                // Assert: 専用グリフが描かれ、汎用フォールバックにならない
                expect(screen.getByTestId(`furniture-glyph-${key}`)).toBeTruthy();
                expect(screen.queryByTestId('furniture-glyph-generic')).toBeNull();
            },
        );

        it.each(ALL_PRESET_KEYS)(
            'renders_glyph_%s_even_at_minimum_one_by_one_cell_size',
            (key) => {
                // Arrange & Act: 最小 1×1 セルでも描画がクラッシュしない（境界値）
                renderWithTheme(
                    <FurnitureGlyph
                        presetKey={key}
                        gridW={1}
                        gridH={1}
                        cellSize={40}
                    />,
                );

                // Assert
                expect(screen.getByTestId(`furniture-glyph-${key}`)).toBeTruthy();
            },
        );

        it('renders_sofa_glyph_when_preset_key_is_sofa', () => {
            // Arrange & Act
            renderWithTheme(
                <FurnitureGlyph presetKey="sofa" gridW={2} gridH={1} cellSize={40} />,
            );

            // Assert
            expect(screen.getByTestId('furniture-glyph-sofa')).toBeTruthy();
        });

        it('renders_generic_glyph_when_preset_key_is_unknown', () => {
            // Arrange & Act: 後からプリセットを増やしても未知キーで壊れない
            renderWithTheme(
                <FurnitureGlyph
                    presetKey="hologram-projector"
                    gridW={1}
                    gridH={1}
                    cellSize={40}
                />,
            );

            // Assert
            expect(screen.getByTestId('furniture-glyph-generic')).toBeTruthy();
        });

        it('renders_generic_glyph_when_preset_key_is_null_or_missing', () => {
            // Arrange & Act: 自由入力（presetKey なし）は汎用グリフ
            renderWithTheme(
                <FurnitureGlyph presetKey={null} gridW={1} gridH={1} cellSize={40} />,
            );

            // Assert
            expect(screen.getByTestId('furniture-glyph-generic')).toBeTruthy();
        });

        it('renders_nothing_when_size_is_not_positive', () => {
            // Arrange & Act: 異常値（0 セル・0px）では何も描かずクラッシュしない
            renderWithTheme(
                <FurnitureGlyph presetKey="sofa" gridW={0} gridH={1} cellSize={40} />,
            );

            // Assert
            expect(screen.queryByTestId('furniture-glyph-sofa')).toBeNull();
        });
    });

    describe('パラメトリック描画（ソファで代表）', () => {
        it('draws_two_cushions_for_two_cell_wide_sofa', () => {
            // Arrange & Act
            renderWithTheme(
                <FurnitureGlyph presetKey="sofa" gridW={2} gridH={1} cellSize={40} />,
            );

            // Assert: クッション個数 = floor(幅 2 ÷ 基準幅 1) = 2
            expect(screen.getByTestId('furniture-glyph-sofa-cushion-0')).toBeTruthy();
            expect(screen.getByTestId('furniture-glyph-sofa-cushion-1')).toBeTruthy();
            expect(screen.queryByTestId('furniture-glyph-sofa-cushion-2')).toBeNull();
        });

        it('increases_cushion_count_when_sofa_gets_wider', () => {
            // Arrange & Act: 4 セル幅 → クッション 4 個（間延びしない）
            renderWithTheme(
                <FurnitureGlyph presetKey="sofa" gridW={4} gridH={1} cellSize={40} />,
            );

            // Assert
            expect(screen.getByTestId('furniture-glyph-sofa-cushion-3')).toBeTruthy();
            expect(screen.queryByTestId('furniture-glyph-sofa-cushion-4')).toBeNull();
        });

        it('keeps_armrest_width_fixed_regardless_of_sofa_width', () => {
            // Arrange: 2 セル幅と 4 セル幅で 2 回描画する
            renderWithTheme(
                <FurnitureGlyph presetKey="sofa" gridW={2} gridH={1} cellSize={40} />,
            );
            const narrow = screen.getByTestId(
                'furniture-glyph-sofa-armrest-left',
            ).props.width;
            screen.unmount();

            // Act
            renderWithTheme(
                <FurnitureGlyph presetKey="sofa" gridW={4} gridH={1} cellSize={40} />,
            );
            const wide = screen.getByTestId(
                'furniture-glyph-sofa-armrest-left',
            ).props.width;

            // Assert: アームレストは「器具」なので固定サイズを保つ
            expect(wide).toBe(narrow);
        });
    });

    describe('回転', () => {
        it('does_not_apply_transform_when_rotation_is_zero', () => {
            // Arrange & Act
            renderWithTheme(
                <FurnitureGlyph
                    presetKey="bed"
                    gridW={2}
                    gridH={3}
                    cellSize={40}
                    rotation={0}
                />,
            );

            // Assert: 未回転は transform 不要
            expect(
                screen.getByTestId('furniture-glyph-bed-rotation').props.matrix,
            ).toBeUndefined();
        });

        // 素材（未回転で設計されたアートワーク）がフットプリント矩形にちょうど
        // 収まることを、実際に適用される matrix で検証する。
        // translate の押し戻しを誤ると素材が領域外へずれるため、この4隅の検査で捕まる。
        it.each([
            // [rotation, 占有W, 占有H, 素材W, 素材H]（セル数）
            [90, 3, 2, 2, 3],
            [180, 2, 3, 2, 3],
            [270, 3, 2, 2, 3],
        ])(
            'maps_artwork_exactly_onto_footprint_when_rotated_%s',
            (rotation, gridW, gridH, localGridW, localGridH) => {
                // Arrange & Act
                renderWithTheme(
                    <FurnitureGlyph
                        presetKey="bed"
                        gridW={gridW}
                        gridH={gridH}
                        cellSize={CELL}
                        rotation={rotation as 90 | 180 | 270}
                    />,
                );

                // Assert: 素材矩形の写像がフットプリント [0,占有W]×[0,占有H] と一致する
                const { matrix } = screen.getByTestId(
                    'furniture-glyph-bed-rotation',
                ).props;
                const bounds = mappedBounds(
                    matrix,
                    localGridW * CELL,
                    localGridH * CELL,
                );
                expect(bounds.minX).toBeCloseTo(0);
                expect(bounds.minY).toBeCloseTo(0);
                expect(bounds.maxX).toBeCloseTo(gridW * CELL);
                expect(bounds.maxY).toBeCloseTo(gridH * CELL);
            },
        );

        it('keeps_svg_size_equal_to_footprint_when_rotated', () => {
            // Arrange & Act: 回転しても Svg 自体は占有矩形（3x2 セル = 120x80 px）のまま
            renderWithTheme(
                <FurnitureGlyph
                    presetKey="bed"
                    gridW={3}
                    gridH={2}
                    cellSize={40}
                    rotation={90}
                />,
            );

            // Assert
            const svg = screen.getByTestId('furniture-glyph-bed');
            expect(svg.props.width).toBe(120);
            expect(svg.props.height).toBe(80);
        });

        it('swaps_artwork_axes_so_parametric_parts_follow_the_long_side_when_rotated_90', () => {
            // Arrange & Act: 占有 1x4 のソファを 90 度回すと素材は 4x1（横長）になる
            renderWithTheme(
                <FurnitureGlyph
                    presetKey="sofa"
                    gridW={1}
                    gridH={4}
                    cellSize={40}
                    rotation={90}
                />,
            );

            // Assert: クッションは素材の幅 4 に追従して 4 個
            expect(screen.getByTestId('furniture-glyph-sofa-cushion-3')).toBeTruthy();
            expect(screen.queryByTestId('furniture-glyph-sofa-cushion-4')).toBeNull();
        });

        it('keeps_artwork_axes_when_rotated_180', () => {
            // Arrange & Act: 180 度は縦横が入れ替わらない（境界値）
            renderWithTheme(
                <FurnitureGlyph
                    presetKey="sofa"
                    gridW={4}
                    gridH={1}
                    cellSize={40}
                    rotation={180}
                />,
            );

            // Assert: 素材の幅は 4 のままなのでクッションは 4 個
            expect(screen.getByTestId('furniture-glyph-sofa-cushion-3')).toBeTruthy();
            expect(screen.queryByTestId('furniture-glyph-sofa-cushion-4')).toBeNull();
        });

        it('defaults_to_unrotated_when_rotation_is_omitted', () => {
            // Arrange & Act: rotation 省略時は 0 度扱い
            renderWithTheme(
                <FurnitureGlyph presetKey="bed" gridW={2} gridH={3} cellSize={40} />,
            );

            // Assert
            expect(
                screen.getByTestId('furniture-glyph-bed-rotation').props.matrix,
            ).toBeUndefined();
        });
    });

    describe('パラメトリック描画（コンロ・本棚・浴槽・シンク）', () => {
        it('draws_one_burner_per_cell_of_stove_width', () => {
            // Arrange & Act: 3 セル幅のコンロ → 五徳 3 口
            renderWithTheme(
                <FurnitureGlyph presetKey="stove" gridW={3} gridH={1} cellSize={40} />,
            );

            // Assert
            expect(screen.getByTestId('furniture-glyph-stove-burner-2')).toBeTruthy();
            expect(screen.queryByTestId('furniture-glyph-stove-burner-3')).toBeNull();
        });

        it('keeps_burner_radius_fixed_when_stove_gets_wider', () => {
            // Arrange: 2 セル幅で描画して五徳の半径を控える
            renderWithTheme(
                <FurnitureGlyph presetKey="stove" gridW={2} gridH={1} cellSize={40} />,
            );
            const narrow = screen.getByTestId('furniture-glyph-stove-burner-0')
                .props.r;
            screen.unmount();

            // Act: 4 セル幅で再描画
            renderWithTheme(
                <FurnitureGlyph presetKey="stove" gridW={4} gridH={1} cellSize={40} />,
            );
            const wide = screen.getByTestId('furniture-glyph-stove-burner-0')
                .props.r;

            // Assert: 五徳は「器具」なので固定サイズを保つ
            expect(wide).toBe(narrow);
        });

        it('adds_more_book_spines_when_bookshelf_gets_wider', () => {
            // Arrange: 1 セル幅の背表紙数を数える
            renderWithTheme(
                <FurnitureGlyph
                    presetKey="bookshelf"
                    gridW={1}
                    gridH={1}
                    cellSize={40}
                />,
            );
            const narrowCount = screen.getAllByTestId(
                /furniture-glyph-bookshelf-spine-/,
            ).length;
            screen.unmount();

            // Act: 2 セル幅で再描画
            renderWithTheme(
                <FurnitureGlyph
                    presetKey="bookshelf"
                    gridW={2}
                    gridH={1}
                    cellSize={40}
                />,
            );
            const wideCount = screen.getAllByTestId(
                /furniture-glyph-bookshelf-spine-/,
            ).length;

            // Assert: 幅に応じて背表紙が増える（引き伸ばさない）
            expect(narrowCount).toBeGreaterThanOrEqual(1);
            expect(wideCount).toBeGreaterThan(narrowCount);
        });

        it('draws_one_ripple_per_cell_of_bathtub_width', () => {
            // Arrange & Act: 3 セル幅の浴槽 → 波紋 3 つ
            renderWithTheme(
                <FurnitureGlyph
                    presetKey="bathtub"
                    gridW={3}
                    gridH={1}
                    cellSize={40}
                />,
            );

            // Assert
            expect(
                screen.getByTestId('furniture-glyph-bathtub-ripple-2'),
            ).toBeTruthy();
            expect(
                screen.queryByTestId('furniture-glyph-bathtub-ripple-3'),
            ).toBeNull();
        });

        it('keeps_sink_faucet_size_fixed_when_sink_gets_wider', () => {
            // Arrange: 1×1 シンクの蛇口サイズを控える
            renderWithTheme(
                <FurnitureGlyph presetKey="sink" gridW={1} gridH={1} cellSize={40} />,
            );
            const narrow = screen.getByTestId('furniture-glyph-sink-faucet')
                .props.r;
            screen.unmount();

            // Act: 3×2 シンクで再描画
            renderWithTheme(
                <FurnitureGlyph presetKey="sink" gridW={3} gridH={2} cellSize={40} />,
            );
            const wide = screen.getByTestId('furniture-glyph-sink-faucet').props.r;

            // Assert: 蛇口は「器具」なので固定サイズを保つ
            expect(wide).toBe(narrow);
        });
    });

    describe('マテリアル配色とダークモード', () => {
        it('fills_sofa_body_with_fabric_material_color_in_light_mode', () => {
            // Arrange & Act
            renderWithTheme(
                <FurnitureGlyph presetKey="sofa" gridW={2} gridH={1} cellSize={40} />,
            );

            // Assert: 布マテリアル（セージ）で塗られる
            const body = screen.getByTestId('furniture-glyph-sofa-body');
            expect(body.props.fill).toEqual(
                svgColor(getGlyphPalette('light').fabric.fill),
            );
        });

        it('uses_dimmed_steel_fill_for_fridge_when_color_scheme_is_dark', () => {
            // Arrange: ダークモードでは明るいスチール面がまぶしくならないよう暗色化する
            mockUseColorScheme.mockReturnValue('dark');

            // Act
            renderWithTheme(
                <FurnitureGlyph presetKey="fridge" gridW={1} gridH={1} cellSize={40} />,
            );

            // Assert: ダーク用の値が使われ、ライトの値とは異なる
            const body = screen.getByTestId('furniture-glyph-fridge-body');
            const dark = getGlyphPalette('dark').steel.fill;
            expect(dark).not.toBe(getGlyphPalette('light').steel.fill);
            expect(body.props.fill).toEqual(svgColor(dark));
        });
    });

    describe('ヒートマップのシルエット表示', () => {
        it('makes_body_transparent_and_parts_translucent_when_silhouette', () => {
            // Arrange & Act: 状態色（Animated.View の背景）を透過しつつ部品だけ残す
            renderWithTheme(
                <FurnitureGlyph
                    presetKey="sofa"
                    gridW={2}
                    gridH={1}
                    cellSize={40}
                    silhouette
                />,
            );

            // Assert: ボディは透明（状態色がそのまま見える）
            const body = screen.getByTestId('furniture-glyph-sofa-body');
            expect(body.props.fill.payload).toBe(TRANSPARENT_PAYLOAD);
            // クッションは半透明シルエット色
            const cushion = screen.getByTestId('furniture-glyph-sofa-cushion-0');
            expect(cushion.props.fill).toEqual(
                expect.objectContaining({ type: 0 }),
            );
            expect(cushion.props.fill).not.toEqual(
                svgColor(getGlyphPalette('light').fabric.pad),
            );
        });

        it('exposes_a_single_silhouette_fill_constant_for_all_parts', () => {
            // Arrange & Act & Assert: シルエット色は状態色に依存しない半透明の 1 色
            expect(GLYPH_SILHOUETTE_FILL).toMatch(/rgba\(/);
        });
    });
});
