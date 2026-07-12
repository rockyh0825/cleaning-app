import React from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/shared/theme/ThemeProvider';
import { darkTheme } from '@/shared/theme/tokens';
import FloorPlanIndexScreen from '../index';
import RoomDetailScreen from '../[roomId]';

// useAppTheme.test.tsx と同じ方法で OS のカラースキームをモックする
jest.mock('react-native/Libraries/Utilities/useColorScheme');

jest.mock('expo-router', () => ({
    useLocalSearchParams: () => ({ roomId: 'room-1' }),
    router: { push: jest.fn() },
}));

jest.mock('@/features/floor-plan/hooks/useFloorPlan', () => ({
    useFloorPlan: jest.fn(),
}));

jest.mock('@/shared/hooks/useUserId', () => ({
    useUserId: () => 'user-1',
}));

import { useFloorPlan } from '@/features/floor-plan/hooks/useFloorPlan';

const mockUseColorScheme = useColorScheme as jest.Mock;
const mockUseFloorPlan = useFloorPlan as jest.Mock;

const targetRoom = {
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
};

function renderWithProviders(ui: React.ReactElement) {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>{ui}</ThemeProvider>
        </QueryClientProvider>,
    );
}

// primary 背景のボタンラベルには、意味的に正しい onPrimary トークンを使う。
// primary のトーン変更（明るい色に振れた場合など）にも頑健になるため、
// surface の流用ではなく onPrimary であることを検証する。
// light では onPrimary と surface が同値のため、差が出るダークテーマで検証する。
describe('primary ボタンのラベル色（ダークモード・画面）', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseColorScheme.mockReturnValue('dark');
    });

    it('labels_log_cleaning_button_with_on_primary_token_when_color_scheme_is_dark', async () => {
        // Arrange
        mockUseFloorPlan.mockReturnValue({
            floorPlan: {
                data: { rooms: [targetRoom] },
                isLoading: false,
                isError: false,
            },
            addFurniture: { mutate: jest.fn() },
            updateFurniture: { mutate: jest.fn() },
            deleteFurniture: { mutate: jest.fn() },
        });

        // Act
        renderWithProviders(<RoomDetailScreen />);

        // Assert
        const label = await screen.findByText('掃除を記録');
        const labelStyle = StyleSheet.flatten(label.props.style);
        expect(labelStyle.color).toBe(darkTheme.colors.onPrimary);
    });

    it('labels_empty_state_cta_with_on_primary_token_when_color_scheme_is_dark', async () => {
        // Arrange
        mockUseFloorPlan.mockReturnValue({
            floorPlan: { data: { rooms: [] }, isLoading: false, isError: false },
            addRoom: { mutate: jest.fn() },
            updateRoom: { mutate: jest.fn() },
            deleteRoom: { mutate: jest.fn() },
        });

        // Act
        renderWithProviders(<FloorPlanIndexScreen />);

        // Assert
        const label = await screen.findByText('最初の部屋を追加');
        const labelStyle = StyleSheet.flatten(label.props.style);
        expect(labelStyle.color).toBe(darkTheme.colors.onPrimary);
    });
});
