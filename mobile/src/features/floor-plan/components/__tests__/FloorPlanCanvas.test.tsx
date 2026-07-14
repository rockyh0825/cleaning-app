import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import {
    act,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react-native';
import { State } from 'react-native-gesture-handler';
import {
    fireGestureHandler,
    getByGestureTestId,
} from 'react-native-gesture-handler/jest-utils';
import { lightTheme } from '@/shared/theme/tokens';
import { clampScale, FloorPlanCanvas } from '../FloorPlanCanvas';
import type { FloorPlan } from '../../types';
import { flushRunOnJS } from '@/shared/testing/flushRunOnJS';

jest.mock('@shopify/react-native-skia');

/**
 * blocksExternalGesture で「このジェスチャーが失敗するまで待たせる相手」として
 * 宣言された testId を返す。config.blocksHandlers は GestureRef[]（数値・ref・
 * ジェスチャー）だが、本コンポーネントはジェスチャーオブジェクトのみを渡している。
 */
function blockedGestureTestIds(gestureTestId: string): (string | undefined)[] {
    const blocked = getByGestureTestId(gestureTestId).config.blocksHandlers ?? [];
    return blocked.map(
        (ref) => (ref as { config?: { testId?: string } }).config?.testId,
    );
}

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

    it('drives_furniture_selection_from_prop_when_selectedFurnitureId_is_controlled', () => {
        // Arrange & Act: 制御プロップで furn-1 を選択状態にする
        render(
            <FloorPlanCanvas
                floorPlan={floorplanWithRoom}
                selectedFurnitureId="furn-1"
            />,
        );

        // Assert: 内部タップ無しでも選択ボーダー（primary）が適用される
        const item = screen.getByTestId('furniture-item-furn-1');
        const style = StyleSheet.flatten(item.props.style);
        expect(style.borderColor).toBe(lightTheme.colors.primary);
    });

    it('hides_furniture_selection_when_controlled_prop_is_null', async () => {
        // Arrange & Act: 制御モードで未選択（null）
        render(
            <FloorPlanCanvas
                floorPlan={floorplanWithRoom}
                selectedFurnitureId={null}
                onFurniturePress={jest.fn()}
            />,
        );
        // タップしても親が state を持つため内部では選択されない
        fireGestureHandler(getByGestureTestId('furniture-tap-furn-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE },
            { state: State.END },
        ]);
        // runOnJS 経由の onPress を流し切ってから検証する（内部 state を触らないことの確認）
        await act(async () => {
            await new Promise((resolve) => setImmediate(resolve));
        });

        // Assert: 制御プロップが null のままなら選択ボーダーは付かない
        const item = screen.getByTestId('furniture-item-furn-1');
        const style = StyleSheet.flatten(item.props.style);
        expect(style.borderColor).toBe(lightTheme.colors.outline);
    });

    it('selects_furniture_via_internal_state_when_prop_is_omitted', async () => {
        // Arrange: 非制御（後方互換）
        render(
            <FloorPlanCanvas
                floorPlan={floorplanWithRoom}
                onFurniturePress={jest.fn()}
            />,
        );

        // Act: タップで内部 state が選択を管理する
        fireGestureHandler(getByGestureTestId('furniture-tap-furn-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE },
            { state: State.END },
        ]);

        // Assert: 内部 state 駆動で選択ボーダーが付く
        await waitFor(() => {
            const item = screen.getByTestId('furniture-item-furn-1');
            const style = StyleSheet.flatten(item.props.style);
            expect(style.borderColor).toBe(lightTheme.colors.primary);
        });
    });

    it('clears_internal_furniture_selection_when_room_is_pressed', async () => {
        // Arrange: 非制御でまず家具を選択する
        render(
            <FloorPlanCanvas
                floorPlan={floorplanWithRoom}
                onRoomPress={jest.fn()}
                onFurniturePress={jest.fn()}
            />,
        );
        fireGestureHandler(getByGestureTestId('furniture-tap-furn-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE },
            { state: State.END },
        ]);
        await waitFor(() => {
            const item = screen.getByTestId('furniture-item-furn-1');
            expect(StyleSheet.flatten(item.props.style).borderColor).toBe(
                lightTheme.colors.primary,
            );
        });

        // Act: 部屋をタップする
        fireGestureHandler(getByGestureTestId('room-tap-room-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE },
            { state: State.END },
        ]);

        // Assert: 家具の選択は解除される
        await waitFor(() => {
            const item = screen.getByTestId('furniture-item-furn-1');
            expect(StyleSheet.flatten(item.props.style).borderColor).toBe(
                lightTheme.colors.outline,
            );
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
            expect(screen.getByTestId('resize-handle-room-1-br')).toBeTruthy();
        });

        // Act: cellSize=40 で右へ 56px（1.4 セル分）→ 幅 5 → 6
        fireGestureHandler(getByGestureTestId('room-resize-room-1-br'), [
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

    it('fills_rooms_and_furniture_with_matching_areaColors_entries', () => {
        // Arrange: areaId（room.id / furniture.id）→ hex の Map を渡す
        const areaColors = new Map<string, string>([
            ['room-1', '#112233'],
            ['furn-1', '#445566'],
        ]);

        // Act
        render(
            <FloorPlanCanvas
                floorPlan={floorplanWithRoom}
                areaColors={areaColors}
            />,
        );

        // Assert: 各エリアの背景が対応する色で塗られる
        const room = screen.getByTestId('room-shape-room-1');
        expect(StyleSheet.flatten(room.props.style).backgroundColor).toBe(
            '#112233',
        );
        const furniture = screen.getByTestId('furniture-item-furn-1');
        expect(StyleSheet.flatten(furniture.props.style).backgroundColor).toBe(
            '#445566',
        );
    });

    it('keeps_default_fill_when_area_id_is_missing_from_areaColors', () => {
        // Arrange: Map にどのエリアも載っていない
        const areaColors = new Map<string, string>([['other-area', '#112233']]);

        // Act
        render(
            <FloorPlanCanvas
                floorPlan={floorplanWithRoom}
                areaColors={areaColors}
            />,
        );

        // Assert: miss したエリアは従来色（種別色 / surface）のまま
        const room = screen.getByTestId('room-shape-room-1');
        expect(StyleSheet.flatten(room.props.style).backgroundColor).toBe(
            lightTheme.roomAccents.LIVING.fill,
        );
        const furniture = screen.getByTestId('furniture-item-furn-1');
        expect(StyleSheet.flatten(furniture.props.style).backgroundColor).toBe(
            lightTheme.colors.surface,
        );
    });

    it('does_not_call_drag_end_callbacks_when_readOnly', async () => {
        // Arrange: readOnly でもドラッグコールバックを渡した状態にする
        const mockOnRoomDragEnd = jest.fn();
        const mockOnFurnitureDragEnd = jest.fn();
        render(
            <FloorPlanCanvas
                floorPlan={floorplanWithRoom}
                readOnly
                onRoomDragEnd={mockOnRoomDragEnd}
                onFurnitureDragEnd={mockOnFurnitureDragEnd}
            />,
        );

        // Act: 部屋・家具それぞれを 1 セル分ドラッグする
        fireGestureHandler(getByGestureTestId('room-pan-room-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: 56, translationY: 0 },
            { state: State.END, translationX: 56, translationY: 0 },
        ]);
        fireGestureHandler(getByGestureTestId('furniture-pan-furn-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: 56, translationY: 0 },
            { state: State.END, translationX: 56, translationY: 0 },
        ]);
        // runOnJS 経由の commit を流し切ってから「呼ばれない」ことを検証する
        await act(async () => {
            await new Promise((resolve) => setImmediate(resolve));
        });

        // Assert
        expect(mockOnRoomDragEnd).not.toHaveBeenCalled();
        expect(mockOnFurnitureDragEnd).not.toHaveBeenCalled();
    });

    it('calls_press_callbacks_on_tap_when_readOnly', async () => {
        // Arrange: readOnly でもタップ（詳細画面への導線）は有効
        const mockOnRoomPress = jest.fn();
        const mockOnFurniturePress = jest.fn();
        render(
            <FloorPlanCanvas
                floorPlan={floorplanWithRoom}
                readOnly
                onRoomPress={mockOnRoomPress}
                onFurniturePress={mockOnFurniturePress}
            />,
        );

        // Act
        fireGestureHandler(getByGestureTestId('room-tap-room-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE },
            { state: State.END },
        ]);
        fireGestureHandler(getByGestureTestId('furniture-tap-furn-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE },
            { state: State.END },
        ]);

        // Assert
        await waitFor(() => {
            expect(mockOnRoomPress).toHaveBeenCalledWith('room-1');
            expect(mockOnFurniturePress).toHaveBeenCalledWith('furn-1');
        });
    });

    it('does_not_update_internal_selection_when_tapped_while_readOnly', async () => {
        // Arrange: 非制御（内部 state）モードで readOnly 表示
        const { rerender } = render(
            <FloorPlanCanvas
                floorPlan={floorplanWithRoom}
                readOnly
                onRoomPress={jest.fn()}
                onFurniturePress={jest.fn()}
            />,
        );

        // Act: readOnly 中に部屋・家具をタップする
        fireGestureHandler(getByGestureTestId('room-tap-room-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE },
            { state: State.END },
        ]);
        fireGestureHandler(getByGestureTestId('furniture-tap-furn-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE },
            { state: State.END },
        ]);
        // runOnJS 経由の onPress を流し切る（内部 state を触らないことの確認）
        await act(async () => {
            await new Promise((resolve) => setImmediate(resolve));
        });

        // Assert: readOnly 中は選択表示なし
        expect(screen.queryByTestId('room-selected-room-1')).toBeNull();

        // Act: readOnly を解除しても、readOnly 中のタップが選択として現れない
        rerender(
            <FloorPlanCanvas
                floorPlan={floorplanWithRoom}
                onRoomPress={jest.fn()}
                onFurniturePress={jest.fn()}
            />,
        );

        // Assert: 内部選択 state が更新されていなければ選択枠・選択ボーダーは出ない
        expect(screen.queryByTestId('room-selected-room-1')).toBeNull();
        const furniture = screen.getByTestId('furniture-item-furn-1');
        expect(StyleSheet.flatten(furniture.props.style).borderColor).toBe(
            lightTheme.colors.outline,
        );
    });

    it('disables_room_and_furniture_pan_gestures_when_readOnly', () => {
        // Arrange & Act: readOnly ではドラッグの pan 自体を無効化する
        // （指への追従や blocksExternalGesture によるキャンバスパン阻害を防ぐ）
        render(<FloorPlanCanvas floorPlan={floorplanWithRoom} readOnly />);

        // Assert
        expect(getByGestureTestId('room-pan-room-1').config.enabled).toBe(false);
        expect(getByGestureTestId('furniture-pan-furn-1').config.enabled).toBe(
            false,
        );
    });

    it('keeps_pan_gestures_enabled_when_readOnly_is_omitted', () => {
        // Arrange & Act: readOnly 未指定なら従来どおりドラッグ可能（後方互換）
        render(<FloorPlanCanvas floorPlan={floorplanWithRoom} />);

        // Assert
        expect(getByGestureTestId('room-pan-room-1').config.enabled).toBe(true);
        expect(getByGestureTestId('furniture-pan-furn-1').config.enabled).toBe(
            true,
        );
    });

    it('hides_selection_outline_and_resize_handle_when_readOnly', () => {
        // Arrange & Act: 制御プロップで選択済みでも readOnly なら選択表示しない
        render(
            <FloorPlanCanvas
                floorPlan={floorplanWithRoom}
                readOnly
                selectedRoomId="room-1"
                selectedFurnitureId="furn-1"
                onRoomDragEnd={jest.fn()}
            />,
        );

        // Assert: 選択枠・リサイズハンドル・家具の選択ボーダーが出ない
        expect(screen.queryByTestId('room-selected-room-1')).toBeNull();
        expect(screen.queryByTestId('resize-handle-room-1-br')).toBeNull();
        const furniture = screen.getByTestId('furniture-item-furn-1');
        expect(StyleSheet.flatten(furniture.props.style).borderColor).toBe(
            lightTheme.colors.outline,
        );
    });

    it('calls_onRoomDragEnd_with_moved_origin_when_top_left_resize_commits', async () => {
        // Arrange: 左上角のリサイズは x/y も変わる。矩形全体がそのまま親へ届くこと
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
            expect(screen.getByTestId('resize-handle-room-1-tl')).toBeTruthy();
        });

        // Act: 左上角を 1 セル分（+40px）内側へ
        fireGestureHandler(getByGestureTestId('room-resize-room-1-tl'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: 40, translationY: 40 },
            { state: State.END, translationX: 40, translationY: 40 },
        ]);

        // Assert: 右下固定のまま原点が (1,1) へ移った矩形で確定する
        await waitFor(() => {
            expect(mockOnRoomDragEnd).toHaveBeenCalledWith('room-1', {
                x: 1,
                y: 1,
                w: 4,
                h: 3,
            });
        });
    });

    it('stacks_selected_room_above_furniture_covering_the_center_move_grip', () => {
        // Arrange: 4×4 の部屋の中央 2×2 セル（= 中央 50% の移動グリップ全域）を家具が覆う
        const floorPlanWithCoveredGrip: FloorPlan = {
            rooms: [
                {
                    id: 'room-1',
                    name: 'リビング',
                    type: 'LIVING',
                    gridX: 0,
                    gridY: 0,
                    gridW: 4,
                    gridH: 4,
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date('2024-01-01'),
                    furniture: [
                        {
                            id: 'furn-1',
                            roomId: 'room-1',
                            name: 'テーブル',
                            gridX: 1,
                            gridY: 1,
                            gridW: 2,
                            gridH: 2,
                            createdAt: new Date('2024-01-01'),
                            updatedAt: new Date('2024-01-01'),
                        },
                    ],
                },
            ],
        };

        // Act: 部屋を選択状態で表示する
        render(
            <FloorPlanCanvas
                floorPlan={floorPlanWithCoveredGrip}
                selectedRoomId="room-1"
                onRoomDragEnd={jest.fn()}
            />,
        );

        // Assert: 家具は部屋の後に描画される兄弟のため、選択中の部屋を前面に出さないと
        // 中央の移動グリップが家具に覆われて部屋を移動できない（回帰防止）
        const roomStyle = StyleSheet.flatten(
            screen.getByTestId('room-shape-room-1').props.style,
        );
        const furnitureStyle = StyleSheet.flatten(
            screen.getByTestId('furniture-item-furn-1').props.style,
        );
        expect(roomStyle.zIndex ?? 0).toBeGreaterThan(furnitureStyle.zIndex ?? 0);
    });

    it('keeps_furniture_above_unselected_rooms', () => {
        // Arrange & Act: 非選択の部屋は従来どおり家具の下に置く（家具のタップ・操作を阻害しない）
        render(
            <FloorPlanCanvas
                floorPlan={floorplanWithRoom}
                selectedRoomId={null}
                onFurniturePress={jest.fn()}
            />,
        );

        // Assert
        const roomStyle = StyleSheet.flatten(
            screen.getByTestId('room-shape-room-1').props.style,
        );
        const furnitureStyle = StyleSheet.flatten(
            screen.getByTestId('furniture-item-furn-1').props.style,
        );
        expect(roomStyle.zIndex ?? 0).toBe(furnitureStyle.zIndex ?? 0);
    });

    it('calls_onBackgroundPress_when_background_is_pressed', async () => {
        // Arrange
        const mockOnBackgroundPress = jest.fn();
        render(
            <FloorPlanCanvas
                floorPlan={floorplanWithRoom}
                selectedRoomId="room-1"
                onBackgroundPress={mockOnBackgroundPress}
            />,
        );

        // Act: 部屋・家具のない空白領域をタップする
        fireGestureHandler(getByGestureTestId('canvas-background-tap'), [
            { state: State.BEGAN },
            { state: State.ACTIVE },
            { state: State.END },
        ]);
        await flushRunOnJS();

        // Assert
        expect(mockOnBackgroundPress).toHaveBeenCalledTimes(1);
    });

    it('does_not_call_onBackgroundPress_when_background_tap_is_cancelled', async () => {
        // Arrange: アクティブ化後に他ジェスチャーへ奪われた Tap は success=false で終わる
        const mockOnBackgroundPress = jest.fn();
        render(
            <FloorPlanCanvas
                floorPlan={floorplanWithRoom}
                selectedRoomId="room-1"
                onBackgroundPress={mockOnBackgroundPress}
            />,
        );

        // Act: ACTIVE から CANCELLED へ抜ける（onEnd が success=false で呼ばれる唯一の経路。
        // BEGAN からの FAILED では onEnd 自体が呼ばれず if (success) を踏めない）
        fireGestureHandler(getByGestureTestId('canvas-background-tap'), [
            { state: State.BEGAN },
            { state: State.ACTIVE },
            { state: State.CANCELLED },
        ]);
        await flushRunOnJS();

        // Assert: 選択解除は起きない
        expect(mockOnBackgroundPress).not.toHaveBeenCalled();
    });

    it('does_not_call_onBackgroundPress_when_room_or_furniture_is_pressed', async () => {
        // Arrange
        const mockOnBackgroundPress = jest.fn();
        render(
            <FloorPlanCanvas
                floorPlan={floorplanWithRoom}
                selectedRoomId="room-1"
                onRoomPress={jest.fn()}
                onFurniturePress={jest.fn()}
                onBackgroundPress={mockOnBackgroundPress}
            />,
        );

        // Act: 部屋・家具をタップする
        fireGestureHandler(getByGestureTestId('room-tap-room-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE },
            { state: State.END },
        ]);
        fireGestureHandler(getByGestureTestId('furniture-tap-furn-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE },
            { state: State.END },
        ]);
        await flushRunOnJS();

        // Assert: 要素のタップは背景タップとして扱わない
        expect(mockOnBackgroundPress).not.toHaveBeenCalled();
    });

    it('spreads_background_hit_area_over_the_viewport_around_the_zoomable_canvas', () => {
        // Arrange & Act
        render(
            <FloorPlanCanvas
                floorPlan={floorplanWithRoom}
                onBackgroundPress={jest.fn()}
            />,
        );

        // Assert: ヒット領域はズーム・パンで動く固定サイズのキャンバスの「中」ではなく、
        // キャンバスを包む可視領域（viewport）いっぱいの祖先でなければならない。
        // 内側に置くとズームアウトでキャンバスの外へ出た空白がタップできなくなる（issue #172）
        const viewport = screen.getByTestId('floorPlan-viewport');
        const background = within(viewport).getByTestId('floorPlan-background');
        expect(within(background).getByTestId('floorPlan-canvas')).toBeTruthy();
        expect(StyleSheet.flatten(background.props.style)).toMatchObject(
            StyleSheet.absoluteFillObject,
        );
    });

    it('makes_room_tap_block_background_tap', () => {
        // Arrange & Act
        render(
            <FloorPlanCanvas
                floorPlan={floorplanWithRoom}
                onBackgroundPress={jest.fn()}
            />,
        );

        // Assert: 背景タップは viewport 全体を覆う祖先に付くため部屋のタップも届く。
        // 部屋のタップが失敗するまで待たせることで初めて誤発火しない（排他の中核）
        expect(blockedGestureTestIds('room-tap-room-1')).toContain(
            'canvas-background-tap',
        );
    });

    it('makes_furniture_tap_block_background_tap', () => {
        // Arrange & Act
        render(
            <FloorPlanCanvas
                floorPlan={floorplanWithRoom}
                onBackgroundPress={jest.fn()}
            />,
        );

        // Assert: 家具のタップも同様に背景タップを待たせる
        expect(blockedGestureTestIds('furniture-tap-furn-1')).toContain(
            'canvas-background-tap',
        );
    });

    it('limits_background_tap_distance_and_duration_explicitly', () => {
        // Arrange & Act
        render(
            <FloorPlanCanvas
                floorPlan={floorplanWithRoom}
                onBackgroundPress={jest.fn()}
            />,
        );

        // Assert: iOS の既定は maxDistSq=NAN で距離判定がスキップされ、指を動かしても
        // Tap は自己失敗しない。パン・ピンチでの誤発火はこの明示指定だけが防いでいる。
        // 既定値（undefined）に落ちたことを検出するため実値をリテラルで固定する
        const config = getByGestureTestId('canvas-background-tap').config;
        expect(config.maxDist).toBe(8);
        expect(config.maxDurationMs).toBe(250);
    });

    it('clears_internal_room_selection_when_background_is_pressed', async () => {
        // Arrange: 非制御（後方互換）でまず部屋を選択する
        render(<FloorPlanCanvas floorPlan={floorplanWithRoom} />);
        fireGestureHandler(getByGestureTestId('room-tap-room-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE },
            { state: State.END },
        ]);
        await flushRunOnJS();
        expect(screen.getByTestId('room-selected-room-1')).toBeTruthy();

        // Act: 背景をタップする
        fireGestureHandler(getByGestureTestId('canvas-background-tap'), [
            { state: State.BEGAN },
            { state: State.ACTIVE },
            { state: State.END },
        ]);
        await flushRunOnJS();

        // Assert: 内部 state 駆動でも選択枠が消える
        expect(screen.queryByTestId('room-selected-room-1')).toBeNull();
    });

    it('clears_internal_furniture_selection_when_background_is_pressed', async () => {
        // Arrange: 非制御（後方互換）でまず家具を選択する
        render(<FloorPlanCanvas floorPlan={floorplanWithRoom} />);
        fireGestureHandler(getByGestureTestId('furniture-tap-furn-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE },
            { state: State.END },
        ]);
        await flushRunOnJS();
        expect(
            StyleSheet.flatten(
                screen.getByTestId('furniture-item-furn-1').props.style,
            ).borderColor,
        ).toBe(lightTheme.colors.primary);

        // Act: 背景をタップする
        fireGestureHandler(getByGestureTestId('canvas-background-tap'), [
            { state: State.BEGAN },
            { state: State.ACTIVE },
            { state: State.END },
        ]);
        await flushRunOnJS();

        // Assert: 内部 state 駆動でも選択ボーダーが外れる
        expect(
            StyleSheet.flatten(
                screen.getByTestId('furniture-item-furn-1').props.style,
            ).borderColor,
        ).toBe(lightTheme.colors.outline);
    });

    it('disables_background_tap_when_readOnly', () => {
        // Arrange & Act: readOnly では選択 UI が無いため背景タップも無効化する
        render(<FloorPlanCanvas floorPlan={floorplanWithRoom} readOnly />);

        // Assert
        expect(getByGestureTestId('canvas-background-tap').config.enabled).toBe(
            false,
        );
    });

    it('keeps_background_tap_enabled_when_readOnly_is_omitted', () => {
        // Arrange & Act
        render(<FloorPlanCanvas floorPlan={floorplanWithRoom} />);

        // Assert
        expect(getByGestureTestId('canvas-background-tap').config.enabled).toBe(
            true,
        );
    });
});
