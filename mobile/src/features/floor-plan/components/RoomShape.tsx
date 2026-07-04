import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS } from 'react-native-reanimated';
import { useAppTheme } from '@/shared/theme/useAppTheme';
import type { Rect } from '@/shared/utils/grid';
import { GRID_COLS, GRID_ROWS } from '../constants';
import { useDragToGrid } from '../hooks/useDragToGrid';
import { ResizeHandle } from './ResizeHandle';
import type { Room } from '../types';

type Props = {
    room: Room;
    cellSize: number;
    selected: boolean;
    onPress: () => void;
    /** ドラッグ確定時にスナップ・クランプ済みのグリッド矩形を受け取る */
    onDragEnd?: (rect: Rect) => void;
    /** 他の部屋と重なっているとき警告スタイルを表示する */
    overlapping?: boolean;
    /** リサイズ確定時にグリッド単位の新サイズを受け取る（選択中のみハンドル表示） */
    onResizeEnd?: (size: { w: number; h: number }) => void;
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

export function RoomShape({
    room,
    cellSize,
    selected,
    onPress,
    onDragEnd,
    overlapping = false,
    onResizeEnd,
}: Props) {
    const theme = useAppTheme();
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
                        // 選択は枠色、重なりは警告アイコンとチャネルを分ける
                        // （選択中でも重なりが分かり、選択フィードバックも消えない）
                        borderWidth: selected || overlapping ? 2 : 1,
                        borderColor: selected
                            ? '#1A60C8'
                            : overlapping
                              ? theme.colors.danger
                              : '#888',
                    },
                    animatedStyle,
                ]}
            >
                {overlapping && (
                    <Text
                        testID={`room-overlap-warning-${room.id}`}
                        style={styles.warningIcon}
                        accessibilityLabel="部屋が重なっています"
                    >
                        ⚠️
                    </Text>
                )}
                <Text style={styles.label} numberOfLines={1}>
                    {room.name}
                </Text>
                {selected && onResizeEnd && (
                    <ResizeHandle room={room} cellSize={cellSize} onCommit={onResizeEnd} />
                )}
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
    warningIcon: {
        position: 'absolute',
        top: 2,
        right: 4,
        fontSize: 12,
    },
});
