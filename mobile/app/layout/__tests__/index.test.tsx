import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LayoutIndexScreen from '../index';

// useLayout をモック
jest.mock('@/features/layout/hooks/useLayout', () => ({
    useLayout: jest.fn(),
}));

import { useLayout } from '@/features/layout/hooks/useLayout';
const mockUseLayout = useLayout as jest.Mock;

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

describe('LayoutIndexScreen', () => {
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
        render(<LayoutIndexScreen />, { wrapper: createWrapper() });

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
        render(<LayoutIndexScreen />, { wrapper: createWrapper() });

        // Assert
        await waitFor(() => {
            expect(AsyncStorage.setItem).toHaveBeenCalledWith(
                'user-uuid',
                expect.any(String),
            );
        });
    });
});
