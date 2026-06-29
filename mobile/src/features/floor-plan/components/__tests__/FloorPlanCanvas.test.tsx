import React from 'react';
import { render } from '@testing-library/react-native';
import { FloorPlanCanvas } from '../FloorPlanCanvas';
import type { FloorPlan } from '../../types';

jest.mock('@shopify/react-native-skia');

describe('FloorPlanCanvas', () => {
    const emptyFloorPlan: FloorPlan = { rooms: [] };

    const floorplanWithRoom: FloorPlan = {
        rooms: [
            {
                id: 'room-1',
                name: 'リビング',
                type: 'LIVING',
                gridX: 0,
                gridY: 0,
                gridW: 5,
                gridH: 4,
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01'),
                furniture: [
                    {
                        id: 'furn-1',
                        roomId: 'room-1',
                        name: 'ソファ',
                        gridX: 0,
                        gridY: 0,
                        gridW: 2,
                        gridH: 1,
                        createdAt: new Date('2024-01-01'),
                        updatedAt: new Date('2024-01-01'),
                    },
                ],
            },
        ],
    };

    it('renders_without_crashing_with_empty_floor_plan', () => {
        // Arrange & Act & Assert
        const { toJSON } = render(
            <FloorPlanCanvas floorPlan={emptyFloorPlan} />,
        );

        expect(toJSON()).toBeTruthy();
    });

    it('renders_without_crashing_with_rooms_and_furniture', () => {
        // Arrange & Act
        const { toJSON } = render(
            <FloorPlanCanvas
                floorPlan={floorplanWithRoom}
                onRoomPress={jest.fn()}
                onFurniturePress={jest.fn()}
            />,
        );

        // Assert
        expect(toJSON()).toBeTruthy();
    });

    it('renders_with_custom_cell_size', () => {
        // Arrange & Act & Assert
        const { toJSON } = render(
            <FloorPlanCanvas floorPlan={emptyFloorPlan} cellSize={60} />,
        );

        expect(toJSON()).toBeTruthy();
    });
});
