import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { State } from 'react-native-gesture-handler';
import {
    fireGestureHandler,
    getByGestureTestId,
} from 'react-native-gesture-handler/jest-utils';
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

    it('calls_onRoomDragEnd_with_room_id_and_rect_when_room_drag_commits', async () => {
        // Arrange: cellSize=40 で 56px（1.4 セル分）右へドラッグ → 1 セル移動
        const mockOnRoomDragEnd = jest.fn();
        render(
            <FloorPlanCanvas
                floorPlan={floorplanWithRoom}
                onRoomDragEnd={mockOnRoomDragEnd}
            />,
        );

        // Act
        fireGestureHandler(getByGestureTestId('room-pan-room-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: 56, translationY: 0 },
            { state: State.END, translationX: 56, translationY: 0 },
        ]);

        // Assert: runOnJS 経由のためコールバックは非同期に呼ばれる
        await waitFor(() => {
            expect(mockOnRoomDragEnd).toHaveBeenCalledWith('room-1', {
                x: 1,
                y: 0,
                w: 5,
                h: 4,
            });
        });
    });

    it('renders_with_custom_cell_size', () => {
        // Arrange & Act & Assert
        const { toJSON } = render(
            <FloorPlanCanvas floorPlan={emptyFloorPlan} cellSize={60} />,
        );

        expect(toJSON()).toBeTruthy();
    });
});
