import React from 'react';
import { ScrollView } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { State } from 'react-native-gesture-handler';
import {
    fireGestureHandler,
    getByGestureTestId,
} from 'react-native-gesture-handler/jest-utils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RoomDetailScreen from '../[roomId]';
import type { FloorPlan } from '@/features/floor-plan/types';

// expo-router をモック（roomId はルートパラメータで渡る）
jest.mock('expo-router', () => ({
    useLocalSearchParams: jest.fn(),
}));

// useFloorPlan をモック
jest.mock('@/features/floor-plan/hooks/useFloorPlan', () => ({
    useFloorPlan: jest.fn(),
}));

import { useLocalSearchParams } from 'expo-router';
import { useFloorPlan } from '@/features/floor-plan/hooks/useFloorPlan';

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockUseFloorPlan = useFloorPlan as jest.Mock;

const mockFloorPlan: FloorPlan = {
    rooms: [
        {
            id: 'room-1',
            name: 'リビング',
            type: 'LIVING',
            gridX: 2,
            gridY: 3,
            gridW: 6,
            gridH: 4,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
            furniture: [
                {
                    id: 'furn-1',
                    roomId: 'room-1',
                    name: 'ソファ',
                    gridX: 2,
                    gridY: 3,
                    gridW: 1,
                    gridH: 1,
                    rotation: 0,
                    createdAt: new Date('2024-01-01'),
                    updatedAt: new Date('2024-01-01'),
                },
            ],
        },
    ],
};

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );
    };
}

describe('RoomDetailScreen', () => {
    const mockAddFurnitureMutate = jest.fn();
    const mockUpdateFurnitureMutate = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user-1');
        mockUseLocalSearchParams.mockReturnValue({ roomId: 'room-1' });
        mockUseFloorPlan.mockReturnValue({
            floorPlan: { data: mockFloorPlan, isLoading: false, isError: false },
            addRoom: { mutate: jest.fn() },
            addFurniture: { mutate: mockAddFurnitureMutate },
            updateFurniture: { mutate: mockUpdateFurnitureMutate },
            deleteRoom: { mutate: jest.fn() },
        });
    });

    it('renders_floor_plan_canvas_for_the_room_from_route_params', async () => {
        // Arrange & Act
        render(<RoomDetailScreen />, { wrapper: createWrapper() });

        // Assert
        await waitFor(() => {
            expect(screen.getByTestId('floorPlan-canvas')).toBeTruthy();
        });
        expect(screen.getByText('リビング')).toBeTruthy();
    });

    it('opens_add_furniture_modal_when_fab_is_pressed', async () => {
        // Arrange
        render(<RoomDetailScreen />, { wrapper: createWrapper() });
        await screen.findByTestId('floorPlan-canvas');

        // Act
        fireEvent.press(screen.getByTestId('fab'));

        // Assert: AddFurnitureModal（ボトムシート）が開く
        await waitFor(() => {
            expect(screen.getByPlaceholderText('家具名')).toBeTruthy();
        });
    });

    it('calls_addFurniture_with_roomId_when_furniture_modal_is_submitted', async () => {
        // Arrange
        render(<RoomDetailScreen />, { wrapper: createWrapper() });

        // Act
        fireEvent.press(screen.getByTestId('fab'));
        fireEvent.changeText(screen.getByPlaceholderText('家具名'), 'ソファ');
        fireEvent.press(screen.getByText('追加'));

        // Assert
        await waitFor(() => {
            expect(mockAddFurnitureMutate).toHaveBeenCalledWith({
                roomId: 'room-1',
                input: expect.objectContaining({ name: 'ソファ' }),
            });
        });
    });

    it('calls_addFurniture_with_presetKey_when_preset_chip_is_submitted', async () => {
        // Arrange
        render(<RoomDetailScreen />, { wrapper: createWrapper() });

        // Act: プリセットチップを選択して送信
        fireEvent.press(screen.getByTestId('fab'));
        fireEvent.press(screen.getByTestId('furniture-preset-chip-sofa'));
        fireEvent.press(screen.getByText('追加'));

        // Assert: presetKey がそのまま addFurniture に渡る
        await waitFor(() => {
            expect(mockAddFurnitureMutate).toHaveBeenCalledWith({
                roomId: 'room-1',
                input: expect.objectContaining({
                    name: 'ソファ',
                    presetKey: 'sofa',
                }),
            });
        });
    });

    it('calls_updateFurniture_with_clamped_grid_rect_when_furniture_drag_commits', async () => {
        // Arrange: cellSize=40 で 56px（1.4 セル分）右へドラッグ → 1 セル移動
        render(<RoomDetailScreen />, { wrapper: createWrapper() });
        await waitFor(() => {
            expect(screen.getByTestId('furniture-item-furn-1')).toBeTruthy();
        });

        // Act
        fireGestureHandler(getByGestureTestId('furniture-pan-furn-1'), [
            { state: State.BEGAN },
            { state: State.ACTIVE, translationX: 56, translationY: 0 },
            { state: State.END, translationX: 56, translationY: 0 },
        ]);

        // Assert: スナップ済みグリッド座標で updateFurniture が呼ばれる
        await waitFor(() => {
            expect(mockUpdateFurnitureMutate).toHaveBeenCalledWith({
                furnitureId: 'furn-1',
                input: { gridX: 3, gridY: 3, gridW: 1, gridH: 1 },
            });
        });
    });

    /**
     * 回転の入替が観測できるよう、非正方形の家具を1つ持つ間取りに差し替える。
     * 占有サイズは「その角度で実際に占めている矩形」を渡すこと（90/270 度では
     * 未回転時の縦横が入れ替わっている）。部屋は 6x4 なのでどの向きでも収まる。
     */
    function useNonSquareFurniture(furniture: {
        gridW: number;
        gridH: number;
        rotation: 0 | 90 | 180 | 270;
        gridX?: number;
        gridY?: number;
    }) {
        mockUseFloorPlan.mockReturnValue({
            floorPlan: {
                data: {
                    rooms: [
                        {
                            ...mockFloorPlan.rooms[0],
                            furniture: [
                                {
                                    ...mockFloorPlan.rooms[0].furniture[0],
                                    name: 'ベッド',
                                    presetKey: 'bed',
                                    gridX: 0,
                                    gridY: 0,
                                    ...furniture,
                                },
                            ],
                        },
                    ],
                },
                isLoading: false,
                isError: false,
            },
            addRoom: { mutate: jest.fn() },
            addFurniture: { mutate: mockAddFurnitureMutate },
            updateFurniture: { mutate: mockUpdateFurnitureMutate },
            deleteRoom: { mutate: jest.fn() },
        });
    }

    it('calls_updateFurniture_with_swapped_size_when_rotate_pressed', async () => {
        // Arrange: 未回転（占有 2x3）の家具を、四方に余裕のある位置で選択する。
        // 回転は中心ピボットなので、壁際だと回した先が部屋の外に出て保留になる
        useNonSquareFurniture({ gridW: 2, gridH: 3, rotation: 0, gridX: 2, gridY: 1 });
        render(<RoomDetailScreen />, { wrapper: createWrapper() });
        await waitFor(() => {
            expect(screen.getByTestId('furniture-item-furn-1')).toBeTruthy();
        });
        fireEvent.press(screen.getByTestId('furniture-item-furn-1'));

        // Act
        fireEvent.press(screen.getByTestId('selection-rotate'));

        // Assert: 90度回転と同時に占有サイズが 3x2 へ入れ替わり、中心 (3, 2.5) を保つ
        await waitFor(() => {
            expect(mockUpdateFurnitureMutate).toHaveBeenCalledWith({
                furnitureId: 'furn-1',
                input: { rotation: 90, gridW: 3, gridH: 2, gridX: 1, gridY: 1 },
            });
        });
    });

    it('wraps_rotation_back_to_zero_when_rotate_pressed_at_270', async () => {
        // Arrange: 270 度（占有 3x2）の家具 → 次のタップで 0 度・占有 2x3 に戻る（境界値）
        useNonSquareFurniture({ gridW: 3, gridH: 2, rotation: 270, gridX: 1, gridY: 1 });
        render(<RoomDetailScreen />, { wrapper: createWrapper() });
        await waitFor(() => {
            expect(screen.getByTestId('furniture-item-furn-1')).toBeTruthy();
        });
        fireEvent.press(screen.getByTestId('furniture-item-furn-1'));

        // Act
        fireEvent.press(screen.getByTestId('selection-rotate'));

        // Assert: 角度は 0 に折り返し、占有は未回転時の 2x3 に戻る
        await waitFor(() => {
            expect(mockUpdateFurnitureMutate).toHaveBeenCalledWith({
                furnitureId: 'furn-1',
                input: { rotation: 0, gridW: 2, gridH: 3, gridX: 2, gridY: 1 },
            });
        });
    });

    it('renders_canvas_without_scroll_view', async () => {
        // Arrange & Act: ScrollView 入れ子を廃止してもキャンバスと部屋が描画される
        render(<RoomDetailScreen />, { wrapper: createWrapper() });

        // Assert
        await waitFor(() => {
            expect(screen.getByTestId('floorPlan-canvas')).toBeTruthy();
        });
        expect(screen.getByTestId('room-shape-room-1')).toBeTruthy();
        expect(screen.UNSAFE_queryAllByType(ScrollView)).toHaveLength(0);
    });

    it('shows_not_found_message_when_room_does_not_exist', async () => {
        // Arrange
        mockUseLocalSearchParams.mockReturnValue({ roomId: 'missing-room' });

        // Act
        render(<RoomDetailScreen />, { wrapper: createWrapper() });

        // Assert
        await waitFor(() => {
            expect(screen.getByTestId('room-not-found')).toBeTruthy();
        });
    });
});
