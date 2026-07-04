import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { GRID_COLS, GRID_ROWS } from '../constants';
import { useDragToGrid } from '../hooks/useDragToGrid';
import type { Room } from '../types';

type Props = {
    room: Room;
    cellSize: number;
    /** リサイズ確定時にグリッド単位の新サイズを受け取る */
    onCommit: (size: { w: number; h: number }) => void;
};

const HANDLE_SIZE = 20;

/**
 * 選択中の部屋の右下に表示するリサイズ用ハンドル。
 * useDragToGrid をサイズ空間（x=gridW, y=gridH）に読み替えて再利用する。
 * bounds でサイズを 1×1〜キャンバス残り幅・高さにクランプする。
 */
export function ResizeHandle({ room, cellSize, onCommit }: Props) {
    const { gesture, animatedStyle } = useDragToGrid({
        rect: { x: room.gridW, y: room.gridH, w: 0, h: 0 },
        bounds: {
            x: 1,
            y: 1,
            w: GRID_COLS - room.gridX - 1,
            h: GRID_ROWS - room.gridY - 1,
        },
        cellSize,
        onCommit: (rect) => onCommit({ w: rect.x, h: rect.y }),
        testID: `room-resize-${room.id}`,
    });

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View
                testID={`resize-handle-${room.id}`}
                accessibilityLabel="部屋のサイズを変更"
                style={[styles.handle, animatedStyle]}
            />
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    handle: {
        position: 'absolute',
        right: -HANDLE_SIZE / 2,
        bottom: -HANDLE_SIZE / 2,
        width: HANDLE_SIZE,
        height: HANDLE_SIZE,
        borderRadius: HANDLE_SIZE / 2,
        backgroundColor: '#1A60C8',
        borderWidth: 2,
        borderColor: '#FFF',
    },
});
