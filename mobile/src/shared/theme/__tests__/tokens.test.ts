import { RoomType } from '@/shared/api/models/RoomType';
import { darkTheme, lightTheme } from '../tokens';
import type { AppTheme } from '../tokens';

describe('theme tokens', () => {
    const themes: [string, AppTheme][] = [
        ['light', lightTheme],
        ['dark', darkTheme],
    ];

    const semanticColorKeys = [
        'background',
        'surface',
        'surfaceAlt',
        'text',
        'textMuted',
        'primary',
        'danger',
        'outline',
        'gridLine',
        'overlay',
        'heatFresh',
        'heatDue',
        'heatOverdue',
        'heatNeutral',
    ] as const;

    const heatColorKeys = ['heatFresh', 'heatDue', 'heatOverdue', 'heatNeutral'] as const;

    it.each(themes)('defines_all_semantic_color_tokens_in_%s_theme', (_name, theme) => {
        // Arrange & Act & Assert
        for (const key of semanticColorKeys) {
            expect(theme.colors[key]).toEqual(expect.any(String));
            expect(theme.colors[key].length).toBeGreaterThan(0);
        }
    });

    it.each(themes)('defines_spacing_radius_typography_elevation_in_%s_theme', (_name, theme) => {
        // Assert
        for (const key of ['xs', 'sm', 'md', 'lg', 'xl'] as const) {
            expect(theme.spacing[key]).toEqual(expect.any(Number));
        }
        for (const key of ['sm', 'md', 'lg'] as const) {
            expect(theme.radius[key]).toEqual(expect.any(Number));
        }
        for (const key of ['title', 'body', 'caption', 'label'] as const) {
            expect(theme.typography[key].fontSize).toEqual(expect.any(Number));
        }
        for (const key of ['card', 'sheet'] as const) {
            expect(theme.elevation[key]).toEqual(expect.any(Object));
        }
    });

    it.each(themes)('defines_accent_for_every_room_type_in_%s_theme', (_name, theme) => {
        // Arrange
        const allRoomTypes = Object.values(RoomType);

        // Assert
        for (const roomType of allRoomTypes) {
            const accent = theme.roomAccents[roomType];
            expect(accent).toBeDefined();
            expect(accent.fill).toEqual(expect.any(String));
            expect(accent.accent).toEqual(expect.any(String));
            expect(accent.icon).toEqual(expect.any(String));
            expect(accent.icon.length).toBeGreaterThan(0);
        }
    });

    it('uses_different_background_colors_between_light_and_dark', () => {
        // Assert
        expect(lightTheme.colors.background).not.toBe(darkTheme.colors.background);
    });

    it.each(heatColorKeys)('defines_%s_in_both_light_and_dark_themes', (key) => {
        // Assert
        expect(lightTheme.colors[key]).toEqual(expect.any(String));
        expect(lightTheme.colors[key].length).toBeGreaterThan(0);
        expect(darkTheme.colors[key]).toEqual(expect.any(String));
        expect(darkTheme.colors[key].length).toBeGreaterThan(0);
    });

    it.each(heatColorKeys)('uses_different_%s_value_between_light_and_dark', (key) => {
        // Assert
        expect(lightTheme.colors[key]).not.toBe(darkTheme.colors[key]);
    });

    it.each(themes)('defines_soft_and_on_primary_tokens_in_%s_theme', (_name, theme) => {
        // Assert
        expect(theme.colors.primarySoft).toMatch(/^#[0-9A-F]{6}$/i);
        expect(theme.colors.onPrimary).toMatch(/^#[0-9A-F]{6}$/i);
        expect(theme.colors.dangerSoft).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it.each(themes)('defines_border_pair_for_every_heat_state_in_%s_theme', (_name, theme) => {
        // Arrange
        const heatBorderKeys = [
            'heatFreshBorder',
            'heatDueBorder',
            'heatOverdueBorder',
            'heatNeutralBorder',
        ] as const;

        // Assert
        for (const key of heatBorderKeys) {
            expect(theme.colors[key]).toMatch(/^#[0-9A-F]{6}$/i);
        }
    });

    it.each(themes)('defines_display_and_number_typography_in_%s_theme', (_name, theme) => {
        // Assert
        expect(theme.typography.display.fontSize).toEqual(expect.any(Number));
        expect(theme.typography.display.fontWeight).toBe('800');
        expect(theme.typography.number.fontSize).toEqual(expect.any(Number));
        // 数字の桁揃えのため tabular-nums を指定する
        expect(theme.typography.number.fontVariant).toContain('tabular-nums');
    });

    describe('WCAG AA contrast (>= 4.5:1 for normal text)', () => {
        // WCAG 2.x relative luminance（sRGB）
        function relativeLuminance(hex: string): number {
            const value = hex.replace('#', '');
            const [r, g, b] = [0, 2, 4]
                .map((i) => parseInt(value.slice(i, i + 2), 16) / 255)
                .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        }

        function contrastRatio(a: string, b: string): number {
            const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort(
                (x, y) => y - x,
            );
            return (lighter + 0.05) / (darker + 0.05);
        }

        const AA_NORMAL_TEXT = 4.5;

        it.each([
            ['heatFresh'],
            ['heatDue'],
            ['heatOverdue'],
            ['heatNeutral'],
        ] as const)('keeps_text_readable_on_%s_fill_in_dark_theme', (key) => {
            // Arrange
            const fill = darkTheme.colors[key];
            const text = darkTheme.colors.text;

            // Act
            const ratio = contrastRatio(fill, text);

            // Assert
            expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
        });

        it.each([
            ['heatFresh'],
            ['heatDue'],
            ['heatOverdue'],
            ['heatNeutral'],
        ] as const)('keeps_text_readable_on_%s_fill_in_light_theme', (key) => {
            // Arrange
            const fill = lightTheme.colors[key];
            const text = lightTheme.colors.text;

            // Act
            const ratio = contrastRatio(fill, text);

            // Assert
            expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
        });

        it.each(themes)('keeps_on_primary_readable_on_primary_in_%s_theme', (_name, theme) => {
            // Arrange & Act
            const ratio = contrastRatio(theme.colors.primary, theme.colors.onPrimary);

            // Assert
            expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
        });

        it.each(themes)('keeps_danger_readable_on_danger_soft_in_%s_theme', (_name, theme) => {
            // Arrange & Act（danger ボタン/削除チップのラベル = danger on dangerSoft）
            const ratio = contrastRatio(theme.colors.danger, theme.colors.dangerSoft);

            // Assert
            expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
        });

        it.each(themes)('keeps_primary_readable_on_surface_in_%s_theme', (_name, theme) => {
            // Arrange & Act（secondary ボタンのラベル = primary on surface）
            const ratio = contrastRatio(theme.colors.primary, theme.colors.surface);

            // Assert
            expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
        });

        it.each([
            ['heatFresh', 'heatFreshBorder'],
            ['heatDue', 'heatDueBorder'],
            ['heatOverdue', 'heatOverdueBorder'],
        ] as const)(
            'keeps_%s_fill_distinguishable_from_its_border_in_dark_theme',
            (fillKey, borderKey) => {
                // Arrange & Act（塗りと縁取りのペアが判別できること）
                const ratio = contrastRatio(darkTheme.colors[fillKey], darkTheme.colors[borderKey]);

                // Assert
                expect(ratio).toBeGreaterThanOrEqual(1.5);
            },
        );
    });
});
