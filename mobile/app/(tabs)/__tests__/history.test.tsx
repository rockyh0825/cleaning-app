import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HistoryScreen from '../history';

// useCleaningHistory をモック
jest.mock('@/features/cleaning-record/hooks/useCleaningHistory', () => ({
    useCleaningHistory: jest.fn(),
}));

import { useCleaningHistory } from '@/features/cleaning-record/hooks/useCleaningHistory';
const mockUseCleaningHistory = useCleaningHistory as jest.Mock;

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

const RECORDS = [
    {
        id: 'record-1',
        partId: 'part-1',
        cleanedAt: new Date('2026-07-01T10:00:00'),
        note: null,
        createdAt: new Date('2026-07-01T10:00:00'),
        updatedAt: new Date('2026-07-01T10:00:00'),
    },
    {
        id: 'record-2',
        partId: 'part-2',
        cleanedAt: new Date('2026-07-03T09:00:00'),
        note: 'フィルター交換も実施',
        createdAt: new Date('2026-07-03T09:00:00'),
        updatedAt: new Date('2026-07-03T09:00:00'),
    },
];

describe('HistoryScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    });

    it('renders_cleaning_timeline_with_records_on_history_tab', async () => {
        // Arrange
        mockUseCleaningHistory.mockReturnValue({
            records: RECORDS,
            isLoading: false,
            error: null,
            deleteRecord: { mutate: jest.fn() },
            updateRecord: { mutate: jest.fn() },
        });

        // Act
        render(<HistoryScreen />, { wrapper: createWrapper() });

        // Assert: CleaningTimeline が記録を表示する
        await waitFor(() => {
            expect(screen.getAllByTestId('timeline-item')).toHaveLength(2);
        });
    });

    it('shows_empty_state_when_no_records_exist', async () => {
        // Arrange
        mockUseCleaningHistory.mockReturnValue({
            records: [],
            isLoading: false,
            error: null,
            deleteRecord: { mutate: jest.fn() },
            updateRecord: { mutate: jest.fn() },
        });

        // Act
        render(<HistoryScreen />, { wrapper: createWrapper() });

        // Assert
        await waitFor(() => {
            expect(screen.getByTestId('empty-state')).toBeTruthy();
        });
    });

    it('shows_error_state_when_history_fetch_fails', async () => {
        // Arrange
        mockUseCleaningHistory.mockReturnValue({
            records: [],
            isLoading: false,
            error: new Error('network error'),
            deleteRecord: { mutate: jest.fn() },
            updateRecord: { mutate: jest.fn() },
        });

        // Act
        render(<HistoryScreen />, { wrapper: createWrapper() });

        // Assert
        await waitFor(() => {
            expect(screen.getByTestId('error-state')).toBeTruthy();
        });
        expect(screen.queryByTestId('empty-state')).toBeNull();
    });

    it('calls_delete_record_mutation_when_delete_button_is_pressed', async () => {
        // Arrange
        const mockDeleteMutate = jest.fn();
        mockUseCleaningHistory.mockReturnValue({
            records: RECORDS,
            isLoading: false,
            error: null,
            deleteRecord: { mutate: mockDeleteMutate },
            updateRecord: { mutate: jest.fn() },
        });
        render(<HistoryScreen />, { wrapper: createWrapper() });
        await screen.findAllByTestId('timeline-item');

        // Act
        fireEvent.press(screen.getByTestId('delete-button-record-1'));

        // Assert
        await waitFor(() => {
            expect(mockDeleteMutate).toHaveBeenCalledWith('record-1');
        });
    });
});
