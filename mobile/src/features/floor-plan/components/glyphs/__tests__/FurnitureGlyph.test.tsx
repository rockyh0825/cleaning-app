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
