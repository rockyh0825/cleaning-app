import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { GestureType } from 'react-native-gesture-handler';
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
    /** キャンバスのズーム倍率（px→グリッド変換に使用） */
    scale?: number;
    /** この部屋のドラッグ判定が終わるまで待機させるキャンバスパン */
    canvasPanGesture?: GestureType;
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
    scale = 1,
    canvasPanGesture,
}: Props) {
    const theme = useAppTheme();
    const width = room.gridW * cellSize;
    const height = room.gridH * cellSize;
    const left = room.gridX * cellSize;
    const top = room.gridY * cellSize;
    const accent = theme.roomAccents[room.type] ?? theme.roomAccents.OTHER;

    const { gesture: panGesture, animatedStyle } = useDragToGrid({
        rect: { x: room.gridX, y: room.gridY, w: room.gridW, h: room.gridH },
        bounds: CANVAS_BOUNDS,
        cellSize,
        scale,
        onCommit: (rect) => onDragEnd?.(rect),
        testID: `room-pan-${room.id}`,
        blocksExternal: canvasPanGesture,
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
                    theme.elevation.card,
                    {
                        width,
                        height,
                        left,
                        top,
                        backgroundColor: accent.fill,
                        borderRadius: theme.radius.md,
                        // 重なりは警告チャネル（danger 枠）、選択は別オーバーレイで強調する
                        borderWidth: overlapping ? 2 : 1,
                        borderColor: overlapping
                            ? theme.colors.danger
                            : theme.colors.outline,
                    },
                    animatedStyle,
                ]}
            >
                {selected && (
                    <View
                        testID={`room-selected-${room.id}`}
                        pointerEvents="none"
                        style={[
                            StyleSheet.absoluteFillObject,
                            styles.selectedOutline,
                            {
                                borderColor: accent.accent,
                                borderRadius: theme.radius.md,
                            },
                        ]}
                    />
                )}
                {overlapping && (
                    <Text
                        testID={`room-overlap-warning-${room.id}`}
                        style={styles.warningIcon}
                        accessibilityLabel="部屋が重なっています"
                    >
                        ⚠️
                    </Text>
                )}
                <Text testID={`room-type-icon-${room.id}`} style={styles.icon}>
                    {accent.icon}
                </Text>
                <Text
                    style={[
                        styles.label,
                        theme.typography.caption,
                        { color: accent.accent },
                    ]}
                    numberOfLines={1}
                >
                    {room.name}
                </Text>
                {selected && onResizeEnd && (
                    <ResizeHandle
                        position={{ x: room.gridX, y: room.gridY }}
                        size={{ w: room.gridW, h: room.gridH }}
                        maxRight={GRID_COLS}
                        maxBottom={GRID_ROWS}
                        cellSize={cellSize}
                        scale={scale}
                        blocksExternal={canvasPanGesture}
                        onCommit={onResizeEnd}
                        handleTestID={`resize-handle-${room.id}`}
                        dragTestID={`room-resize-${room.id}`}
                        accessibilityLabel="部屋のサイズを変更"
                    />
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
    },
    selectedOutline: {
        borderWidth: 2,
    },
    icon: {
        fontSize: 16,
    },
    label: {
        fontWeight: '600',
    },
    warningIcon: {
        position: 'absolute',
        top: 2,
        right: 4,
        fontSize: 12,
    },
});
