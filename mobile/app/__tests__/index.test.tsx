import React from 'react';
import { render, screen } from '@testing-library/react-native';
import RootIndex from '../index';

// expo-router をモック（Redirect は遷移先を testID 付きで可視化する）
jest.mock('expo-router', () => {
    const { Text } = require('react-native');
    return {
        Redirect: ({ href }: { href: string }) => (
            <Text testID="redirect">{href}</Text>
        ),
    };
});

describe('RootIndex', () => {
    it('redirects_to_floor_plan_screen', () => {
        // Arrange & Act
        render(<RootIndex />);

        // Assert
        expect(screen.getByTestId('redirect').props.children).toBe('/floor-plan');
    });
});
