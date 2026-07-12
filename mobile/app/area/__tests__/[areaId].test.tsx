import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AreaDetailScreen from '../[areaId]';

// expo-router をモック（areaId を渡す）
jest.mock('expo-router', () => ({
    useLocalSearchParams: jest.fn(),
}));

// useLogCleaning をモック
jest.mock('@/features/cleaning-record/hooks/useLogCleaning', () => ({
    useLogCleaning: jest.fn(),
}));

// useManageParts をモック
jest.mock('@/features/cleaning-record/hooks/useManageParts', () => ({
    useManageParts: jest.fn(),
}));

// リポジトリをモック（listParts のフィクスチャを返す）
const mockListParts = jest.fn();
jest.mock('@/features/cleaning-record/repositories/CleaningRecordRepository', () => ({
    CleaningRecordRepository: jest.fn().mockImplementation(() => ({
        listParts: (...args: unknown[]) => mockListParts(...args),
    })),
}));

import { useLocalSearchParams } from 'expo-router';
import { useLogCleaning } from '@/features/cleaning-record/hooks/useLogCleaning';
import { useManageParts } from '@/features/cleaning-record/hooks/useManageParts';
import { resetUserIdCacheForTest } from '@/shared/hooks/useUserId';

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;
const mockUseLogCleaning = useLogCleaning as jest.Mock;
const mockUseManageParts = useManageParts as jest.Mock;

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

const PARTS = [
    {
        id: 'part-1',
        ownerType: 'ROOM' as const,
        ownerId: 'room-1',
        name: 'エアコンフィルター',
        recommendedCycleDays: 14,
        lastCleanedAt: null,
        createdAt: new Date('2026-07-01'),
        updatedAt: new Date('2026-07-01'),
    },
    {
        id: 'part-2',
        ownerType: 'ROOM' as const,
        ownerId: 'room-1',
        name: '床',
        recommendedCycleDays: 7,
        lastCleanedAt: null,
        createdAt: new Date('2026-07-01'),
        updatedAt: new Date('2026-07-01'),
    },
    {
        id: 'part-other',
        ownerType: 'ROOM' as const,
        ownerId: 'room-2',
        name: '別の部屋のパーツ',
        recommendedCycleDays: 7,
        lastCleanedAt: null,
        createdAt: new Date('2026-07-01'),
        updatedAt: new Date('2026-07-01'),
    },
];

describe('AreaDetailScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // モジュールレベルにメモ化された初期化 Promise をテスト間でリセットする
        resetUserIdCacheForTest();
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');
        (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
        mockUseLocalSearchParams.mockReturnValue({ areaId: 'room-1' });
        mockListParts.mockResolvedValue(PARTS);
        mockUseLogCleaning.mockReturnValue({
            mutate: jest.fn(),
            isPending: false,
            error: null,
        });
        mockUseManageParts.mockReturnValue({
            addPart: jest.fn(),
            updatePart: jest.fn(),
            deletePart: jest.fn(),
            isPending: false,
            error: null,
        });
    });

    it('renders_part_checklist_with_parts_of_the_area', async () => {
        // Arrange & Act
        render(<AreaDetailScreen />, { wrapper: createWrapper() });

        // Assert: 対象エリアのパーツのみ表示される
        await waitFor(() => {
            expect(screen.getByText('エアコンフィルター')).toBeTruthy();
        });
        expect(screen.getByText('床')).toBeTruthy();
        expect(screen.queryByText('別の部屋のパーツ')).toBeNull();
    });

    it('logs_cleaning_with_selected_part_ids_when_record_button_is_pressed', async () => {
        // Arrange
        const mockMutate = jest.fn();
        mockUseLogCleaning.mockReturnValue({
            mutate: mockMutate,
            isPending: false,
            error: null,
        });
        render(<AreaDetailScreen />, { wrapper: createWrapper() });
        await screen.findByText('エアコンフィルター');

        // Act: パーツを選択して記録ボタンを押す
        fireEvent.press(screen.getByTestId('part-item-part-1'));
        fireEvent.press(screen.getByTestId('record-button'));

        // Assert
        await waitFor(() => {
            expect(mockMutate).toHaveBeenCalledWith({ partIds: ['part-1'] });
        });
    });

    it('shows_empty_state_when_area_has_no_parts', async () => {
        // Arrange
        mockListParts.mockResolvedValue([]);

        // Act
        render(<AreaDetailScreen />, { wrapper: createWrapper() });

        // Assert
        await waitFor(() => {
            expect(screen.getByTestId('empty-state')).toBeTruthy();
        });
    });

    it('shows_error_banner_and_keeps_checklist_when_log_cleaning_fails', async () => {
        // Arrange: 掃除記録の mutation が失敗した状態
        mockUseLogCleaning.mockReturnValue({
            mutate: jest.fn(),
            isPending: false,
            error: new Error('network error'),
        });

        // Act
        render(<AreaDetailScreen />, { wrapper: createWrapper() });

        // Assert: エラーバナーが表示され、チェックリストと記録ボタンは操作可能なまま残る
        await waitFor(() => {
            expect(screen.getByTestId('log-cleaning-error')).toBeTruthy();
        });
        expect(
            screen.getByText('記録に失敗しました。再試行してください'),
        ).toBeTruthy();
        expect(screen.getByText('エアコンフィルター')).toBeTruthy();
        expect(screen.getByTestId('record-button')).toBeTruthy();
    });

    it('adds_part_for_the_area_when_submitted_from_part_editor', async () => {
        // Arrange
        const mockAddPart = jest.fn();
        mockUseManageParts.mockReturnValue({
            addPart: mockAddPart,
            updatePart: jest.fn(),
            deletePart: jest.fn(),
            isPending: false,
            error: null,
        });
        render(<AreaDetailScreen />, { wrapper: createWrapper() });
        await screen.findByText('エアコンフィルター');

        // Act: 追加ボタン → 名前入力 → 追加
        fireEvent.press(screen.getByTestId('add-part-button'));
        fireEvent.changeText(screen.getByTestId('part-name-input'), '換気扇');
        fireEvent.press(screen.getByTestId('part-editor-submit'));

        // Assert: エリアの ownerType/ownerId でパーツが追加される
        expect(mockAddPart).toHaveBeenCalledWith({
            ownerType: 'ROOM',
            ownerId: 'room-1',
            name: '換気扇',
            recommendedCycleDays: 7,
        });
    });

    it('shows_add_part_button_even_when_area_has_no_parts', async () => {
        // Arrange
        mockListParts.mockResolvedValue([]);

        // Act
        render(<AreaDetailScreen />, { wrapper: createWrapper() });

        // Assert: 空状態でもパーツを追加できる導線がある
        await waitFor(() => {
            expect(screen.getByTestId('empty-state')).toBeTruthy();
        });
        expect(screen.getByTestId('add-part-button')).toBeTruthy();
    });

    it('updates_part_when_submitted_from_part_editor_in_edit_mode', async () => {
        // Arrange
        const mockUpdatePart = jest.fn();
        mockUseManageParts.mockReturnValue({
            addPart: jest.fn(),
            updatePart: mockUpdatePart,
            deletePart: jest.fn(),
            isPending: false,
            error: null,
        });
        render(<AreaDetailScreen />, { wrapper: createWrapper() });
        await screen.findByText('エアコンフィルター');

        // Act: パーツの編集ボタン → 値を変更 → 保存
        fireEvent.press(screen.getByTestId('part-edit-part-1'));
        fireEvent.changeText(screen.getByTestId('part-name-input'), '天井');
        fireEvent.changeText(screen.getByTestId('part-cycle-input'), '30');
        fireEvent.press(screen.getByTestId('part-editor-submit'));

        // Assert
        expect(mockUpdatePart).toHaveBeenCalledWith({
            partId: 'part-1',
            input: { name: '天井', recommendedCycleDays: 30 },
        });
    });

    it('deletes_part_when_delete_button_is_pressed_in_part_editor', async () => {
        // Arrange
        const mockDeletePart = jest.fn();
        mockUseManageParts.mockReturnValue({
            addPart: jest.fn(),
            updatePart: jest.fn(),
            deletePart: mockDeletePart,
            isPending: false,
            error: null,
        });
        render(<AreaDetailScreen />, { wrapper: createWrapper() });
        await screen.findByText('エアコンフィルター');

        // Act
        fireEvent.press(screen.getByTestId('part-edit-part-1'));
        fireEvent.press(screen.getByTestId('part-editor-delete'));

        // Assert
        expect(mockDeletePart).toHaveBeenCalledWith('part-1');
    });

    it('shows_error_banner_when_part_mutation_fails', async () => {
        // Arrange
        mockUseManageParts.mockReturnValue({
            addPart: jest.fn(),
            updatePart: jest.fn(),
            deletePart: jest.fn(),
            isPending: false,
            error: new Error('network error'),
        });

        // Act
        render(<AreaDetailScreen />, { wrapper: createWrapper() });

        // Assert: パーツ操作の失敗バナーが表示され、チェックリストは残る
        await waitFor(() => {
            expect(screen.getByTestId('manage-part-error')).toBeTruthy();
        });
        expect(screen.getByText('エアコンフィルター')).toBeTruthy();
    });

    it('shows_error_state_when_parts_fetch_fails', async () => {
        // Arrange
        mockListParts.mockRejectedValue(new Error('network error'));

        // Act
        render(<AreaDetailScreen />, { wrapper: createWrapper() });

        // Assert
        await waitFor(() => {
            expect(screen.getByTestId('error-state')).toBeTruthy();
        });
        expect(screen.queryByTestId('empty-state')).toBeNull();
    });
});
