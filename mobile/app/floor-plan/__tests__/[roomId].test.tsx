import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RoomDetailScreen from '../[roomId]';

jest.mock('@/features/floor-plan/hooks/useFloorPlan', () => ({
    useFloorPlan: jest.fn(),
}));

jest.mock('expo-router', () => ({
    useLocalSearchParams: () => ({ roomId: 'room-1' }),
}));

jest.mock('@/shared/hooks/useUserId', () => ({
    useUserId: () => 'user-1',
}));

import { useFloorPlan } from '@/features/floor-plan/hooks/useFloorPlan';
const mockUseFloorPlan = useFloorPlan as jest.Mock;

const targetRoom = {
    id: 'room-1',
    name: 'リビング',
    type: 'LIVING',
    gridX: 0,
    gridY: 0,
    gridW: 4,
    gridH: 4,
    furniture: [],
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
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders_the_target_room_from_route_params_on_the_canvas', async () => {
        // Arrange
        mockUseFloorPlan.mockReturnValue({
            floorPlan: { data: { rooms: [targetRoom] }, isLoading: false, isError: false },
            addFurniture: { mutate: jest.fn() },
        });

        // Act
        render(<RoomDetailScreen />, { wrapper: createWrapper() });

        // Assert
        await waitFor(() => {
            expect(screen.getByTestId('room-shape-room-1')).toBeTruthy();
        });
    });

    it('calls_add_furniture_mutation_with_room_id_from_route_params_on_submit', async () => {
        // Arrange
        const mutate = jest.fn();
        mockUseFloorPlan.mockReturnValue({
            floorPlan: { data: { rooms: [targetRoom] }, isLoading: false, isError: false },
            addFurniture: { mutate },
        });

        // Act
        render(<RoomDetailScreen />, { wrapper: createWrapper() });
        fireEvent.press(screen.getByTestId('fab'));
        fireEvent.changeText(screen.getByPlaceholderText('家具名'), '本棚');
        fireEvent.press(screen.getByText('追加'));

        // Assert
        expect(mutate).toHaveBeenCalledWith({
            roomId: 'room-1',
            input: expect.objectContaining({ name: '本棚' }),
        });
    });
});
