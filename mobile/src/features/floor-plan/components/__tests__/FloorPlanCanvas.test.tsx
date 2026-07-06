import React from 'react';
import { ScrollView } from 'react-native';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { State } from 'react-native-gesture-handler';
import {
    fireGestureHandler,
    getByGestureTestId,
} from 'react-native-gesture-handler/jest-utils';
import { clampScale, FloorPlanCanvas } from '../FloorPlanCanvas';
import type { FloorPlan } from '../../types';

jest.mock('@shopify/react-native-skia');

describe('clampScale', () => {
    it('returns_value_unchanged_when_within_range', () => {
        // Arrange & Act & Assert
        expect(clampScale(1.5)).toBe(1.5);
    });

    it('clamps_to_min_scale_when_below_range', () => {
        // Arrange & Act & Assert
        expect(clampScale(0.3)).toBe(0.5);
    });

    it('clamps_to_max_scale_when_above_range', () => {
        // Arrange & Act & Assert
        expect(clampScale(3)).toBe(2);
    });

    it('returns_1_when_scale_is_not_finite', () => {
        // Arrange & Act & Assert
        expect(clampScale(Number.NaN)).toBe(1);
    });
});

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

    it('calls_onFurnitureDragEnd_with_furniture_id_and_rect_when_furniture_drag_commits', async () => {
        // Arrange: cellSize=40 で 56px（1.4 セル分）右へドラッグ → 1 セル移動
        const mockOnFurnitureDragEnd = jest.fn();
        render(
            <FloorPlanCanvas
                floorPlan={floorplanWithRoom}
                onFurnitureDragEnd={mockOnFurnitureDragEnd}
            />,
        );

        // Act
        fireGestureHandler(getByGestureTestId('furniture-pan-furn-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: 56, translationY: 0 },
            { state: State.END, translationX: 56, translationY: 0 },
        ]);

        // Assert: runOnJS 経由のためコールバックは非同期に呼ばれる
        await waitFor(() => {
            expect(mockOnFurnitureDragEnd).toHaveBeenCalledWith('furn-1', {
                x: 1,
                y: 0,
                w: 2,
                h: 1,
            });
        });
    });

    it('renders_canvas_and_rooms_without_scroll_view', () => {
        // Arrange & Act: ScrollView 入れ子を廃止してもキャンバスと部屋・家具が描画される
        render(<FloorPlanCanvas floorPlan={floorplanWithRoom} />);

        // Assert
        expect(screen.getByTestId('floorPlan-canvas')).toBeTruthy();
        expect(screen.getByTestId('room-shape-room-1')).toBeTruthy();
        expect(screen.getByTestId('furniture-item-furn-1')).toBeTruthy();
        expect(screen.UNSAFE_queryAllByType(ScrollView)).toHaveLength(0);
    });

    it('applies_pinch_zoom_scale_to_drag_grid_conversion', async () => {
        // Arrange: ピンチで 2x にズーム後、100px ドラッグ
        // scale=2 では 100 / (40 * 2) = 1.25 → 1 セル移動（scale=1 なら 3 セルになる）
        const mockOnRoomDragEnd = jest.fn();
        render(
            <FloorPlanCanvas
                floorPlan={floorplanWithRoom}
                onRoomDragEnd={mockOnRoomDragEnd}
            />,
        );

        // Act: ピンチズーム → 部屋ドラッグ
        fireGestureHandler(getByGestureTestId('canvas-pinch'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, scale: 2 },
            { state: State.END, scale: 2 },
        ]);
        // ズーム倍率は runOnJS 経由で state に反映されるため、反映を待ってからドラッグする
        await act(async () => {
            await new Promise((resolve) => setImmediate(resolve));
        });
        fireGestureHandler(getByGestureTestId('room-pan-room-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: 100, translationY: 0 },
            { state: State.END, translationX: 100, translationY: 0 },
        ]);

        // Assert: ズーム倍率を考慮したグリッド変換で確定する
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

    it('drives_room_selection_from_prop_when_selectedRoomId_is_controlled', () => {
        // Arrange & Act: 制御プロップで room-1 を選択状態にする
        render(
            <FloorPlanCanvas
                floorPlan={floorplanWithRoom}
                selectedRoomId="room-1"
            />,
        );

        // Assert: 内部タップ無しでも選択枠が表示される
        expect(screen.getByTestId('room-selected-room-1')).toBeTruthy();
    });

    it('hides_room_selection_when_controlled_prop_is_null', () => {
        // Arrange & Act: 制御モードで未選択（null）
        render(
            <FloorPlanCanvas
                floorPlan={floorplanWithRoom}
                selectedRoomId={null}
                onRoomPress={jest.fn()}
            />,
        );
        // タップしても親が state を持つため内部では選択枠を出さない
        fireGestureHandler(getByGestureTestId('room-tap-room-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE },
            { state: State.END },
        ]);

        // Assert: 制御プロップが null のままなら選択枠は表示されない
        expect(screen.queryByTestId('room-selected-room-1')).toBeNull();
    });

    it('selects_room_via_internal_state_when_prop_is_omitted', async () => {
        // Arrange: 非制御（後方互換）
        render(
            <FloorPlanCanvas
                floorPlan={floorplanWithRoom}
                onRoomPress={jest.fn()}
            />,
        );

        // Act: タップで内部 state が選択を管理する
        fireGestureHandler(getByGestureTestId('room-tap-room-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE },
            { state: State.END },
        ]);

        // Assert: 内部 state 駆動で選択枠が表示される
        await waitFor(() => {
            expect(screen.getByTestId('room-selected-room-1')).toBeTruthy();
        });
    });

    it('calls_onRoomDragEnd_with_resized_rect_when_selected_room_resize_commits', async () => {
        // Arrange: 部屋を選択してリサイズハンドルを表示させる
        const mockOnRoomDragEnd = jest.fn();
        render(
            <FloorPlanCanvas
                floorPlan={floorplanWithRoom}
                onRoomDragEnd={mockOnRoomDragEnd}
            />,
        );
        fireGestureHandler(getByGestureTestId('room-tap-room-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE },
            { state: State.END },
        ]);
        await waitFor(() => {
            expect(screen.getByTestId('resize-handle-room-1')).toBeTruthy();
        });

        // Act: cellSize=40 で右へ 56px（1.4 セル分）→ 幅 5 → 6
        fireGestureHandler(getByGestureTestId('room-resize-room-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: 56, translationY: 0 },
            { state: State.END, translationX: 56, translationY: 0 },
        ]);

        // Assert: 位置は不変・サイズのみ更新された矩形で確定する
        await waitFor(() => {
            expect(mockOnRoomDragEnd).toHaveBeenCalledWith('room-1', {
                x: 0,
                y: 0,
                w: 6,
                h: 4,
            });
        });
    });
});
