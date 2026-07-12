import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { StatusPill } from '../StatusPill';
import { lightTheme } from '@/shared/theme/tokens';

describe('StatusPill', () => {
    it.each([
        ['fresh', 'きれい'],
        ['due', 'そろそろ'],
        ['overdue', '要掃除'],
        ['neutral', '記録なし'],
    ] as const)('renders_default_label_for_%s_status', (status, expectedLabel) => {
        // Arrange & Act
        render(<StatusPill status={status} />);

        // Assert
        expect(screen.getByText(expectedLabel)).toBeTruthy();
    });

    it('renders_custom_label_when_provided', () => {
        // Arrange & Act
        render(<StatusPill status="overdue" label="130%" />);

        // Assert
        expect(screen.getByText('130%')).toBeTruthy();
        expect(screen.queryByText('要掃除')).toBeNull();
    });

    it('uses_heat_fill_and_border_pair_for_status', () => {
        // Arrange & Act
        render(<StatusPill status="fresh" testID="pill" />);

        // Assert
        const pillStyle = StyleSheet.flatten(screen.getByTestId('pill').props.style);
        expect(pillStyle.backgroundColor).toBe(lightTheme.colors.heatFresh);
        expect(pillStyle.borderColor).toBe(lightTheme.colors.heatFreshBorder);
    });

    it('uses_neutral_heat_pair_for_neutral_status', () => {
        // Arrange & Act
        render(<StatusPill status="neutral" testID="pill" />);

        // Assert
        const pillStyle = StyleSheet.flatten(screen.getByTestId('pill').props.style);
        expect(pillStyle.backgroundColor).toBe(lightTheme.colors.heatNeutral);
        expect(pillStyle.borderColor).toBe(lightTheme.colors.heatNeutralBorder);
    });
});
