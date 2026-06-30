import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FloorPlanIndexScreen from '../index';

// useFloorPlan をモック
jest.mock('@/features/floor-plan/hooks/useFloorPlan', () => ({
    useFloorPlan: jest.fn(),
}));

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
});
