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

    it('exposes_pill_as_single_accessible_text_element', () => {
        // Arrange & Act
        render(<StatusPill status="fresh" testID="pill" />);

        // Assert
        const pill = screen.getByTestId('pill');
        expect(pill.props.accessible).toBe(true);
        expect(pill.props.accessibilityRole).toBe('text');
    });

    it('announces_status_name_together_with_custom_label', () => {
        // Arrange & Act（カスタムラベルでも状態情報が読み上げから消えないこと）
        render(<StatusPill status="overdue" label="130%" testID="pill" />);

        // Assert
        expect(screen.getByTestId('pill').props.accessibilityLabel).toBe('要掃除 130%');
    });

    it('announces_status_name_only_when_no_custom_label', () => {
        // Arrange & Act
        render(<StatusPill status="due" testID="pill" />);

        // Assert
        expect(screen.getByTestId('pill').props.accessibilityLabel).toBe('そろそろ');
    });
});
