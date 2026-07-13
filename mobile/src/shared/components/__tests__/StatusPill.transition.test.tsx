import React from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { StatusPill } from '../StatusPill';
import { lightTheme } from '@/shared/theme/tokens';
import { COLOR_TRANSITION_DURATION_MS } from '@/shared/utils/colorTransition';

// interpolateColor の出力（rgba 文字列）と比較するためのヘルパー
function hexToRgba(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, 1)`;
}

describe('StatusPill（状態色トランジション）', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('settles_fill_and_border_on_new_status_colors_after_status_changes', () => {
        // Arrange: 要掃除（赤）で表示
        const { rerender } = render(<StatusPill status="overdue" testID="pill" />);

        // Act: 記録完了できれい（緑）へ変化し、トランジション時間を経過させる
        rerender(<StatusPill status="fresh" testID="pill" />);
        act(() => {
            jest.advanceTimersByTime(COLOR_TRANSITION_DURATION_MS + 100);
        });

        // Assert: 最終的に fresh の塗り・縁取り（トークンの生値）へ収束する
        expect(screen.getByTestId('pill')).toHaveAnimatedStyle({
            backgroundColor: lightTheme.colors.heatFresh,
            borderColor: lightTheme.colors.heatFreshBorder,
        });
    });

    it('shows_intermediate_color_midway_through_the_transition', () => {
        // Arrange
        const { rerender } = render(<StatusPill status="overdue" testID="pill" />);

        // Act: 半分だけ時間を進める
        rerender(<StatusPill status="fresh" testID="pill" />);
        act(() => {
            jest.advanceTimersByTime(Math.floor(COLOR_TRANSITION_DURATION_MS / 2));
        });

        // Assert: 中間色（起点でも目標でもない色）で描画されている＝瞬時切替でない
        const style = screen.getByTestId('pill').props.jestAnimatedStyle
            .value as { backgroundColor?: string };
        expect(style.backgroundColor).toBeDefined();
        expect(style.backgroundColor).not.toBe(lightTheme.colors.heatOverdue);
        expect(style.backgroundColor).not.toBe(lightTheme.colors.heatFresh);
        expect(style.backgroundColor).not.toBe(
            hexToRgba(lightTheme.colors.heatOverdue),
        );
        expect(style.backgroundColor).not.toBe(
            hexToRgba(lightTheme.colors.heatFresh),
        );
    });

    it('keeps_status_colors_stable_when_status_does_not_change', () => {
        // Arrange & Act: 同じ status で再レンダリングしても色は動かない
        const { rerender } = render(<StatusPill status="due" testID="pill" />);
        rerender(<StatusPill status="due" testID="pill" />);
        act(() => {
            jest.advanceTimersByTime(COLOR_TRANSITION_DURATION_MS + 100);
        });

        // Assert
        expect(screen.getByTestId('pill')).toHaveAnimatedStyle({
            backgroundColor: lightTheme.colors.heatDue,
            borderColor: lightTheme.colors.heatDueBorder,
        });
    });
});
