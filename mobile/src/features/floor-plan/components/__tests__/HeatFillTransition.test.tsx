import React from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { lightTheme } from '@/shared/theme/tokens';
import { COLOR_TRANSITION_DURATION_MS } from '@/shared/utils/colorTransition';
import { RoomShape } from '../RoomShape';
import { FurnitureItem } from '../FurnitureItem';
import type { Room, Furniture } from '../../types';
import type { Rect } from '@/shared/utils/grid';

const testRoom: Room = {
    id: 'room-1',
    name: 'リビング',
    type: 'LIVING',
    gridX: 0,
    gridY: 0,
    gridW: 5,
    gridH: 4,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
};

const roomBounds: Rect = { x: 2, y: 3, w: 6, h: 4 };

const testFurniture: Furniture = {
    id: 'furn-1',
    roomId: 'room-1',
    name: 'ソファ',
    gridX: 0,
    gridY: 0,
    gridW: 1,
    gridH: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
};

/**
 * ヒートマップ表示（fillColor 指定）で掃除記録後に状態色が変わったとき、
 * 部屋・家具の塗りが瞬時切替でなく滑らかにトランジションすることを検証する。
 */
describe('ヒートマップ塗りの状態色トランジション', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('room_fill_settles_on_new_heat_color_after_fill_color_changes', () => {
        // Arrange: 要掃除（赤）で塗られた部屋
        const { rerender } = render(
            <RoomShape
                room={testRoom}
                cellSize={40}
                selected={false}
                onPress={jest.fn()}
                fillColor={lightTheme.colors.heatOverdue}
                dragDisabled
            />,
        );

        // Act: 記録完了できれい（緑）へ変化
        rerender(
            <RoomShape
                room={testRoom}
                cellSize={40}
                selected={false}
                onPress={jest.fn()}
                fillColor={lightTheme.colors.heatFresh}
                dragDisabled
            />,
        );
        act(() => {
            jest.advanceTimersByTime(COLOR_TRANSITION_DURATION_MS + 100);
        });

        // Assert
        expect(screen.getByTestId('room-shape-room-1')).toHaveAnimatedStyle({
            backgroundColor: lightTheme.colors.heatFresh,
        });
    });

    it('room_fill_shows_intermediate_color_midway_through_the_transition', () => {
        // Arrange
        const { rerender } = render(
            <RoomShape
                room={testRoom}
                cellSize={40}
                selected={false}
                onPress={jest.fn()}
                fillColor={lightTheme.colors.heatOverdue}
                dragDisabled
            />,
        );

        // Act: 半分だけ時間を進める
        rerender(
            <RoomShape
                room={testRoom}
                cellSize={40}
                selected={false}
                onPress={jest.fn()}
                fillColor={lightTheme.colors.heatFresh}
                dragDisabled
            />,
        );
        act(() => {
            jest.advanceTimersByTime(
                Math.floor(COLOR_TRANSITION_DURATION_MS / 2),
            );
        });

        // Assert: 起点・目標のどちらでもない中間色＝瞬時切替でない
        const style = screen.getByTestId('room-shape-room-1').props
            .jestAnimatedStyle.value as { backgroundColor?: string };
        expect(style.backgroundColor).toBeDefined();
        expect(style.backgroundColor).not.toBe(lightTheme.colors.heatOverdue);
        expect(style.backgroundColor).not.toBe(lightTheme.colors.heatFresh);
    });

    it('furniture_fill_settles_on_new_heat_color_after_fill_color_changes', () => {
        // Arrange: 要掃除（赤）で塗られた家具
        const { rerender } = render(
            <FurnitureItem
                furniture={testFurniture}
                cellSize={40}
                selected={false}
                onPress={jest.fn()}
                bounds={roomBounds}
                fillColor={lightTheme.colors.heatOverdue}
                dragDisabled
            />,
        );

        // Act: 記録完了できれい（緑）へ変化
        rerender(
            <FurnitureItem
                furniture={testFurniture}
                cellSize={40}
                selected={false}
                onPress={jest.fn()}
                bounds={roomBounds}
                fillColor={lightTheme.colors.heatFresh}
                dragDisabled
            />,
        );
        act(() => {
            jest.advanceTimersByTime(COLOR_TRANSITION_DURATION_MS + 100);
        });

        // Assert
        expect(
            screen.getByTestId('furniture-item-furn-1'),
        ).toHaveAnimatedStyle({
            backgroundColor: lightTheme.colors.heatFresh,
        });
    });

    it('room_fill_stays_stable_when_fill_color_does_not_change', () => {
        // Arrange & Act: 同じ塗り色で再レンダリング
        const { rerender } = render(
            <RoomShape
                room={testRoom}
                cellSize={40}
                selected={false}
                onPress={jest.fn()}
                fillColor={lightTheme.colors.heatDue}
                dragDisabled
            />,
        );
        rerender(
            <RoomShape
                room={testRoom}
                cellSize={40}
                selected={false}
                onPress={jest.fn()}
                fillColor={lightTheme.colors.heatDue}
                dragDisabled
            />,
        );
        act(() => {
            jest.advanceTimersByTime(COLOR_TRANSITION_DURATION_MS + 100);
        });

        // Assert
        expect(screen.getByTestId('room-shape-room-1')).toHaveAnimatedStyle({
            backgroundColor: lightTheme.colors.heatDue,
        });
    });
});
