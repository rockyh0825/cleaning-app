import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HeatmapScreen from '../heatmap';

// HeatmapView をモック（画面は userId 解決と配線のみを担う）
jest.mock('@/features/heatmap/components/HeatmapView', () => {
    const ReactActual = require('react');
    const { View } = require('react-native');
    return {
        HeatmapView: jest.fn(() =>
            ReactActual.createElement(View, { testID: 'heatmap-view' }),
        ),
    };
});

import { HeatmapView } from '@/features/heatmap/components/HeatmapView';
import { resetUserIdCacheForTest } from '@/shared/hooks/useUserId';
const mockHeatmapView = HeatmapView as jest.Mock;

describe('HeatmapScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // モジュールレベルにメモ化された初期化 Promise をテスト間でリセットする
        resetUserIdCacheForTest();
        (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    });

    it('mounts_heatmap_view_with_resolved_user_id', async () => {
        // Arrange
        (AsyncStorage.getItem as jest.Mock).mockResolvedValue('existing-uuid');

        // Act
        render(<HeatmapScreen />);

        // Assert: userId 解決後に HeatmapView がマウントされ、userId と Capability が渡る
        await waitFor(() => {
            expect(screen.getByTestId('heatmap-view')).toBeTruthy();
        });
        const props = mockHeatmapView.mock.calls[0][0];
        expect(props.userId).toBe('existing-uuid');
        expect(props.floorPlanCapability).toBeDefined();
        expect(props.cleaningStatusCapability).toBeDefined();
    });

    it('shows_loading_while_user_id_is_unresolved', () => {
        // Arrange: 解決しない Promise で userId 未解決状態を維持する
        (AsyncStorage.getItem as jest.Mock).mockReturnValue(
            new Promise(() => {}),
        );

        // Act
        render(<HeatmapScreen />);

        // Assert
        expect(screen.getByTestId('heatmap-user-loading')).toBeTruthy();
        expect(screen.queryByTestId('heatmap-view')).toBeNull();
    });
});
