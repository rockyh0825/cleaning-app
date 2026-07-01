import React from 'react';
import { render } from '@testing-library/react-native';
import IndexScreen from '../index';

jest.mock('expo-router', () => ({
    Redirect: ({ href }: { href: string }) => {
        const { Text } = require('react-native');
        return <Text testID="redirect">{href}</Text>;
    },
}));

describe('Root index screen', () => {
    it('redirects_to_the_floor_plan_screen', () => {
        // Act
        const { getByTestId } = render(<IndexScreen />);

        // Assert
        expect(getByTestId('redirect').props.children).toBe('/floor-plan');
    });
});
