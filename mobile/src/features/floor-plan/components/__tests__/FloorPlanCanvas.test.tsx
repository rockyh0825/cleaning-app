import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
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

    it('shows_overlap_warning_on_both_rooms_when_two_rooms_overlap', () => {
        // Arrange: (0,0,5,4) と (3,2,4,4) は重なる
        const overlappingPlan: FloorPlan = {
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
                    furniture: [],
                },
                {
                    id: 'room-2',
                    name: 'キッチン',
                    type: 'KITCHEN',
                    gridX: 3,
                    gridY: 2,
                    gridW: 4,
                    gridH: 4,
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date('2024-01-01'),
                    furniture: [],
                },
            ],
        };

        // Act
        render(<FloorPlanCanvas floorPlan={overlappingPlan} />);

        // Assert
        expect(screen.getByTestId('room-overlap-warning-room-1')).toBeTruthy();
        expect(screen.getByTestId('room-overlap-warning-room-2')).toBeTruthy();
    });

    it('shows_no_overlap_warning_when_rooms_only_share_an_edge', () => {
        // Arrange: (0,0,5,4) と (5,0,4,4) は辺が接するだけで重ならない
        const touchingPlan: FloorPlan = {
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
                    furniture: [],
                },
                {
                    id: 'room-2',
                    name: 'キッチン',
                    type: 'KITCHEN',
                    gridX: 5,
                    gridY: 0,
                    gridW: 4,
                    gridH: 4,
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date('2024-01-01'),
                    furniture: [],
                },
            ],
        };

        // Act
        render(<FloorPlanCanvas floorPlan={touchingPlan} />);

        // Assert
        expect(screen.queryByTestId('room-overlap-warning-room-1')).toBeNull();
        expect(screen.queryByTestId('room-overlap-warning-room-2')).toBeNull();
    });
});
