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
import { resetUserIdCacheForTest } from '@/shared/hooks/useUserId';
const mockUseCleaningHistory = useCleaningHistory as jest.Mock;

function createWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false, gcTime: 0 },
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
        // モジュールレベルにメモ化された初期化 Promise をテスト間でリセットする
        resetUserIdCacheForTest();
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

    it('shows_error_banner_and_keeps_timeline_when_delete_record_fails', async () => {
        // Arrange: 削除 mutation が失敗した状態
        mockUseCleaningHistory.mockReturnValue({
            records: RECORDS,
            isLoading: false,
            error: null,
            deleteRecord: { mutate: jest.fn(), isError: true },
            updateRecord: { mutate: jest.fn() },
        });

        // Act
        render(<HistoryScreen />, { wrapper: createWrapper() });

        // Assert: エラーバナーが表示され、タイムラインは表示・操作可能なまま残る
        await waitFor(() => {
            expect(screen.getByTestId('delete-record-error')).toBeTruthy();
        });
        expect(screen.getByText('削除に失敗しました')).toBeTruthy();
        expect(screen.getAllByTestId('timeline-item')).toHaveLength(2);
        expect(screen.getByTestId('delete-button-record-1')).toBeTruthy();
    });

    it('calls_update_record_mutation_when_note_is_saved', async () => {
        // Arrange
        const mockUpdateMutate = jest.fn();
        mockUseCleaningHistory.mockReturnValue({
            records: RECORDS,
            isLoading: false,
            error: null,
            deleteRecord: { mutate: jest.fn() },
            updateRecord: { mutate: mockUpdateMutate },
        });
        render(<HistoryScreen />, { wrapper: createWrapper() });
        await screen.findAllByTestId('timeline-item');

        // Act
        fireEvent.press(screen.getByTestId('edit-button-record-2'));
        fireEvent.changeText(
            screen.getByTestId('note-input-record-2'),
            'フィルター交換と換気扇掃除',
        );
        fireEvent.press(screen.getByTestId('save-note-button-record-2'));

        // Assert
        await waitFor(() => {
            expect(mockUpdateMutate).toHaveBeenCalledWith({
                recordId: 'record-2',
                input: { note: 'フィルター交換と換気扇掃除' },
            });
        });
    });

    it('shows_error_banner_when_update_record_fails', async () => {
        // Arrange: 修正 mutation が失敗した状態
        mockUseCleaningHistory.mockReturnValue({
            records: RECORDS,
            isLoading: false,
            error: null,
            deleteRecord: { mutate: jest.fn() },
            updateRecord: { mutate: jest.fn(), isError: true },
        });

        // Act
        render(<HistoryScreen />, { wrapper: createWrapper() });

        // Assert: エラーバナーが表示され、タイムラインは残る
        await waitFor(() => {
            expect(screen.getByTestId('update-record-error')).toBeTruthy();
        });
        expect(screen.getByText('修正に失敗しました')).toBeTruthy();
        expect(screen.getAllByTestId('timeline-item')).toHaveLength(2);
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
