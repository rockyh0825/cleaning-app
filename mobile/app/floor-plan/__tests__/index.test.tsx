import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FloorPlanIndexScreen from '../index';

// expo-router をモック（部屋タップで詳細画面へ push する）
jest.mock('expo-router', () => ({
    router: { push: jest.fn() },
}));

// useFloorPlan をモック
jest.mock('@/features/floor-plan/hooks/useFloorPlan', () => ({
    useFloorPlan: jest.fn(),
}));

import { router } from 'expo-router';
import { useFloorPlan } from '@/features/floor-plan/hooks/useFloorPlan';
const mockUseLayout = useFloorPlan as jest.Mock;

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

describe('FloorPlanIndexScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
        (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    });

    it('shows_empty_state_when_floor_plan_has_no_rooms', async () => {
        // Arrange
        mockUseLayout.mockReturnValue({
            floorPlan: { data: { rooms: [] }, isLoading: false, isError: false },
            addRoom: { mutate: jest.fn() },
            deleteRoom: { mutate: jest.fn() },
        });
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');

        // Act
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });

        // Assert
        await waitFor(() => {
            expect(screen.getByTestId('empty-state')).toBeTruthy();
        });
    });

    it('navigates_to_room_detail_when_room_is_pressed', async () => {
        // Arrange
        mockUseLayout.mockReturnValue({
            floorPlan: {
                data: {
                    rooms: [
                        {
                            id: 'room-1',
                            name: 'リビング',
                            type: 'LIVING',
                            gridX: 0,
                            gridY: 0,
                            gridW: 6,
                            gridH: 4,
                            createdAt: new Date('2024-01-01'),
                            updatedAt: new Date('2024-01-01'),
                            furniture: [],
                        },
                    ],
                },
                isLoading: false,
                isError: false,
            },
            addRoom: { mutate: jest.fn() },
            addFurniture: { mutate: jest.fn() },
            deleteRoom: { mutate: jest.fn() },
        });
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });

        // Act
        fireEvent.press(await screen.findByText('リビング'));

        // Assert
        await waitFor(() => {
            expect(router.push).toHaveBeenCalledWith('/floor-plan/room-1');
        });
    });

    it('saves_new_uuid_to_async_storage_when_no_uuid_exists', async () => {
        // Arrange
        mockUseLayout.mockReturnValue({
            floorPlan: { data: { rooms: [] }, isLoading: false, isError: false },
            addRoom: { mutate: jest.fn() },
            deleteRoom: { mutate: jest.fn() },
        });
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

        // Act
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });

        // Assert
        await waitFor(() => {
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                'user-uuid',
                expect.any(String),
            );
        });
    });

    it('adds_room_at_non_overlapping_position_when_origin_is_occupied', async () => {
        // Arrange: (0,0) に 4x4 の既存部屋 → 新規部屋(4x4)は重ならない (4,0) に配置される
        const mockMutate = jest.fn();
        mockUseLayout.mockReturnValue({
            floorPlan: {
                data: {
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
                            furniture: [],
                        },
                    ],
                },
                isLoading: false,
                isError: false,
            },
            addRoom: { mutate: mockMutate },
            deleteRoom: { mutate: jest.fn() },
        });
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });

        // Act
        fireEvent.press(screen.getByText('部屋を追加'));
        fireEvent.changeText(screen.getByPlaceholderText('部屋名'), 'キッチン');
        fireEvent.press(screen.getByText('追加'));

        // Assert
        await waitFor(() => {
            expect(mockMutate).toHaveBeenCalledWith(
                expect.objectContaining({ gridX: 4, gridY: 0, gridW: 4, gridH: 4 }),
            );
        });
    });

    it('adds_room_at_origin_without_crashing_when_canvas_is_full', async () => {
        // Arrange: キャンバス(20x20)全面を占有する部屋 → 空きなし → (0,0) に配置
        const mockMutate = jest.fn();
        mockUseLayout.mockReturnValue({
            floorPlan: {
                data: {
                    rooms: [
                        {
                            id: 'room-1',
                            name: '巨大部屋',
                            type: 'OTHER',
                            gridX: 0,
                            gridY: 0,
                            gridW: 20,
                            gridH: 20,
                            createdAt: new Date('2024-01-01'),
                            updatedAt: new Date('2024-01-01'),
                            furniture: [],
                        },
                    ],
                },
                isLoading: false,
                isError: false,
            },
            addRoom: { mutate: mockMutate },
            deleteRoom: { mutate: jest.fn() },
        });
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        render(<FloorPlanIndexScreen />, { wrapper: createWrapper() });

        // Act
        fireEvent.press(screen.getByText('部屋を追加'));
        fireEvent.changeText(screen.getByPlaceholderText('部屋名'), '物置');
        fireEvent.press(screen.getByText('追加'));

        // Assert
        await waitFor(() => {
            expect(mockMutate).toHaveBeenCalledWith(
                expect.objectContaining({ gridX: 0, gridY: 0 }),
            );
        });
    });
});
