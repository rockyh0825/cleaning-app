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
});
