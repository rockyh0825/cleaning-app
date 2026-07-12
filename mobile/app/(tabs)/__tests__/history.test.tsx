import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HistoryScreen from '../history';

// useCleaningHistory をモック
jest.mock('@/features/cleaning-record/hooks/useCleaningHistory', () => ({
    useCleaningHistory: jest.fn(),
}));

// usePartNames をモック（usePartList モジュール内）
jest.mock('@/features/cleaning-record/hooks/usePartList', () => ({
    usePartNames: jest.fn(),
}));

import { useCleaningHistory } from '@/features/cleaning-record/hooks/useCleaningHistory';
import { usePartNames } from '@/features/cleaning-record/hooks/usePartList';
import { resetUserIdCacheForTest } from '@/shared/hooks/useUserId';
const mockUseCleaningHistory = useCleaningHistory as jest.Mock;
const mockUsePartNames = usePartNames as jest.Mock;

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
        mockUsePartNames.mockReturnValue({
            partNamesById: {
                'part-1': 'キッチンシンク',
                'part-2': 'エアコンフィルター',
            },
            isPending: false,
            isError: false,
        });
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

    it('displays_part_names_instead_of_part_ids_in_timeline', async () => {
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

        // Assert: partId（UUID）ではなくパーツ名が表示される
        await waitFor(() => {
            expect(screen.getByText('パーツ: キッチンシンク')).toBeTruthy();
        });
        expect(screen.getByText('パーツ: エアコンフィルター')).toBeTruthy();
        expect(screen.queryByText(/part-1/)).toBeNull();
        expect(screen.queryByText(/part-2/)).toBeNull();
    });

    it('shows_loading_indicator_while_part_names_are_pending', async () => {
        // Arrange: 履歴は取得済みだがパーツ名が未解決
        mockUseCleaningHistory.mockReturnValue({
            records: RECORDS,
            isLoading: false,
            error: null,
            deleteRecord: { mutate: jest.fn() },
            updateRecord: { mutate: jest.fn() },
        });
        mockUsePartNames.mockReturnValue({
            partNamesById: {},
            isPending: true,
            isError: false,
        });

        // Act
        render(<HistoryScreen />, { wrapper: createWrapper() });

        // Assert: 名前未解決の状態でタイムラインを出さず、ローディングを表示する
        await waitFor(() => {
            expect(screen.getByTestId('history-loading')).toBeTruthy();
        });
        expect(screen.queryAllByTestId('timeline-item')).toHaveLength(0);
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
        const mockUpdateMutateAsync = jest.fn().mockResolvedValue(undefined);
        mockUseCleaningHistory.mockReturnValue({
            records: RECORDS,
            isLoading: false,
            error: null,
            deleteRecord: { mutate: jest.fn() },
            updateRecord: { mutateAsync: mockUpdateMutateAsync },
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

        // Assert: 保存で mutateAsync が呼ばれ、成功後に編集UIが閉じる
        await waitFor(() => {
            expect(mockUpdateMutateAsync).toHaveBeenCalledWith({
                recordId: 'record-2',
                input: { note: 'フィルター交換と換気扇掃除' },
            });
        });
        // クローズは mutateAsync の解決後（非同期）に起きるため、CI の遅い環境でも
        // タイムアウトしないよう待ち時間を長めに取る。
        await waitFor(
            () => {
                expect(screen.queryByTestId('note-input-record-2')).toBeNull();
            },
            { timeout: 5000 },
        );
    });

    it('keeps_edit_ui_with_draft_when_update_record_mutation_fails', async () => {
        // Arrange: 更新 mutation が失敗（reject）するケース
        const mockUpdateMutateAsync = jest
            .fn()
            .mockRejectedValue(new Error('update failed'));
        mockUseCleaningHistory.mockReturnValue({
            records: RECORDS,
            isLoading: false,
            error: null,
            deleteRecord: { mutate: jest.fn() },
            updateRecord: { mutateAsync: mockUpdateMutateAsync, isError: true },
        });
        render(<HistoryScreen />, { wrapper: createWrapper() });
        await screen.findAllByTestId('timeline-item');

        // Act
        fireEvent.press(screen.getByTestId('edit-button-record-2'));
        fireEvent.changeText(
            screen.getByTestId('note-input-record-2'),
            '打ち直したくないメモ',
        );
        fireEvent.press(screen.getByTestId('save-note-button-record-2'));

        // Assert: 失敗時は編集UIとドラフトが残り、バナーで通知される
        await waitFor(() => {
            expect(mockUpdateMutateAsync).toHaveBeenCalledTimes(1);
        });
        const input = screen.getByTestId('note-input-record-2');
        expect(input).toBeTruthy();
        expect(input.props.value).toBe('打ち直したくないメモ');
        expect(screen.getByTestId('update-record-error')).toBeTruthy();
        expect(screen.getByText('修正に失敗しました')).toBeTruthy();
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
