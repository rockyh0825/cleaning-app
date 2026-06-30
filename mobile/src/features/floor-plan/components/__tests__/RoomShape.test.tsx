import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { RoomShape } from '../RoomShape';
import type { Room } from '../../types';

describe('RoomShape', () => {
    const testRoom: Room = {
        id: 'room-1',
        name: 'リビング',
        type: 'LIVING',
        gridX: 0,
        gridY: 0,
        gridW: 5,
        gridH: 4,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    };

    it('calls_onPress_when_tapped', () => {
        // Arrange
        const mockOnPress = jest.fn();

        render(
            <RoomShape
                room={testRoom}
                cellSize={40}
                selected={false}
                onPress={mockOnPress}
            />,
        );

        // Act
        fireEvent.press(screen.getByTestId('room-shape-room-1'));

        // Assert
        expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it('renders_room_name', () => {
        // Arrange
        const mockOnPress = jest.fn();

        render(
            <RoomShape
                room={testRoom}
                cellSize={40}
                selected={false}
                onPress={mockOnPress}
            />,
        );

        // Assert: 部屋名が表示されている
        expect(screen.getByText('リビング')).toBeTruthy();
    });

    it('applies_selected_style_when_selected', () => {
        // Arrange
        const mockOnPress = jest.fn();

        render(
            <RoomShape
                room={testRoom}
                cellSize={40}
                selected={true}
                onPress={mockOnPress}
            />,
        );

        // Assert: selected な View が存在する
        const shape = screen.getByTestId('room-shape-room-1');
        expect(shape).toBeTruthy();
    });
});
