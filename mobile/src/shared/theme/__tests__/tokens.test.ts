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
    ] as const;

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
});
