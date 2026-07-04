import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS } from 'react-native-reanimated';
import type { Rect } from '@/shared/utils/grid';
import { GRID_COLS, GRID_ROWS } from '../constants';
import { useDragToGrid } from '../hooks/useDragToGrid';
import type { Room } from '../types';

type Props = {
    room: Room;
    cellSize: number;
    selected: boolean;
    onPress: () => void;
    /** ドラッグ確定時にスナップ・クランプ済みのグリッド矩形を受け取る */
    onDragEnd?: (rect: Rect) => void;
};

const ROOM_COLORS: Record<string, string> = {
    LIVING: '#B3D9FF',
    KITCHEN: '#FFD9B3',
    BEDROOM: '#D9FFB3',
    BATHROOM: '#B3FFEE',
    TOILET: '#E6B3FF',
    OTHER: '#E0E0E0',
};

const CANVAS_BOUNDS: Rect = { x: 0, y: 0, w: GRID_COLS, h: GRID_ROWS };

export function RoomShape({ room, cellSize, selected, onPress, onDragEnd }: Props) {
    const width = room.gridW * cellSize;
    const height = room.gridH * cellSize;
    const left = room.gridX * cellSize;
    const top = room.gridY * cellSize;
    const backgroundColor = ROOM_COLORS[room.type] ?? '#E0E0E0';

    const { gesture: panGesture, animatedStyle } = useDragToGrid({
        rect: { x: room.gridX, y: room.gridY, w: room.gridW, h: room.gridH },
        bounds: CANVAS_BOUNDS,
        cellSize,
        onCommit: (rect) => onDragEnd?.(rect),
        testID: `room-pan-${room.id}`,
    });

    const tapGesture = Gesture.Tap()
        .onEnd((_event, success) => {
            if (success) runOnJS(onPress)();
        })
        .withTestId(`room-tap-${room.id}`);

    // Pan（移動）と Tap（選択）は排他。先にアクティブになった方が勝つ
    const composedGesture = Gesture.Race(panGesture, tapGesture);

    return (
        <GestureDetector gesture={composedGesture}>
            <Animated.View
                testID={`room-shape-${room.id}`}
                style={[
                    styles.room,
                    {
                        width,
                        height,
                        left,
                        top,
                        backgroundColor,
                        borderWidth: selected ? 2 : 1,
                        borderColor: selected ? '#1A60C8' : '#888',
                    },
                    animatedStyle,
                ]}
            >
                <Text style={styles.label} numberOfLines={1}>
                    {room.name}
                </Text>
            </Animated.View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    room: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
    },
    label: {
        fontSize: 11,
        color: '#333',
        fontWeight: '500',
    },
});
