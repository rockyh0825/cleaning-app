import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { GestureType } from 'react-native-gesture-handler';
import Animated, { runOnJS } from 'react-native-reanimated';
import { useAppTheme } from '@/shared/theme/useAppTheme';
import type { Rect } from '@/shared/utils/grid';
import { useDragToGrid } from '../hooks/useDragToGrid';
import { ResizeHandle } from './ResizeHandle';
import type { Furniture } from '../types';

type Props = {
    furniture: Furniture;
    cellSize: number;
    selected: boolean;
    onPress: () => void;
    /** グリッド単位の可動域（所属部屋の矩形、キャンバス絶対座標） */
    bounds: Rect;
    /** ドラッグ確定時にスナップ・クランプ済みのグリッド矩形を受け取る */
    onDragEnd?: (rect: Rect) => void;
    /** リサイズ確定時にグリッド単位の新サイズを受け取る（選択中のみハンドル表示） */
    onResizeEnd?: (size: { w: number; h: number }) => void;
    /** キャンバスのズーム倍率（px→グリッド変換に使用） */
    scale?: number;
    /** この家具のドラッグ判定が終わるまで待機させるキャンバスパン */
    canvasPanGesture?: GestureType;
};

export function FurnitureItem({
    furniture,
    cellSize,
    selected,
    onPress,
    bounds,
    onDragEnd,
    onResizeEnd,
    scale = 1,
    canvasPanGesture,
}: Props) {
    const theme = useAppTheme();
    const width = furniture.gridW * cellSize;
    const height = furniture.gridH * cellSize;
    const left = furniture.gridX * cellSize;
    const top = furniture.gridY * cellSize;

    const { gesture: panGesture, animatedStyle } = useDragToGrid({
        rect: {
            x: furniture.gridX,
            y: furniture.gridY,
            w: furniture.gridW,
            h: furniture.gridH,
        },
        bounds,
        cellSize,
        scale,
        onCommit: (rect) => onDragEnd?.(rect),
        testID: `furniture-pan-${furniture.id}`,
        blocksExternal: canvasPanGesture,
    });

    const tapGesture = Gesture.Tap()
        .onEnd((_event, success) => {
            if (success) runOnJS(onPress)();
        })
        .withTestId(`furniture-tap-${furniture.id}`);

    // Pan（移動）と Tap（選択）は排他。先にアクティブになった方が勝つ
    const composedGesture = Gesture.Race(panGesture, tapGesture);

    return (
        <GestureDetector gesture={composedGesture}>
            <Animated.View
                testID={`furniture-item-${furniture.id}`}
                style={[
                    styles.furniture,
                    theme.elevation.card,
                    {
                        width,
                        height,
                        left,
                        top,
                        backgroundColor: theme.colors.surface,
                        borderRadius: theme.radius.sm,
                        borderWidth: selected ? 2 : 1,
                        borderColor: selected
                            ? theme.colors.primary
                            : theme.colors.outline,
                    },
                    animatedStyle,
                ]}
            >
                <Text
                    style={[styles.label, { color: theme.colors.textMuted }]}
                    numberOfLines={1}
                >
                    {furniture.name}
                </Text>
                {selected && onResizeEnd && (
                    <ResizeHandle
                        position={{ x: furniture.gridX, y: furniture.gridY }}
                        size={{ w: furniture.gridW, h: furniture.gridH }}
                        maxRight={bounds.x + bounds.w}
                        maxBottom={bounds.y + bounds.h}
                        cellSize={cellSize}
                        scale={scale}
                        blocksExternal={canvasPanGesture}
                        onCommit={onResizeEnd}
                        handleTestID={`resize-handle-${furniture.id}`}
                        dragTestID={`furniture-resize-${furniture.id}`}
                        accessibilityLabel="家具のサイズを変更"
                    />
                )}
            </Animated.View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    furniture: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        fontSize: 9,
    },
});
