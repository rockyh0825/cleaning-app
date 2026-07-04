import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
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
            furniture: [],
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

    beforeEach(() => {
        jest.clearAllMocks();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('user-1');
        mockUseLocalSearchParams.mockReturnValue({ roomId: 'room-1' });
        mockUseFloorPlan.mockReturnValue({
            floorPlan: { data: mockFloorPlan, isLoading: false, isError: false },
            addRoom: { mutate: jest.fn() },
            addFurniture: { mutate: mockAddFurnitureMutate },
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

    it('calls_addFurniture_with_roomId_when_furniture_modal_is_submitted', async () => {
        // Arrange
        render(<RoomDetailScreen />, { wrapper: createWrapper() });

        // Act
        fireEvent.press(screen.getByText('家具を追加'));
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
