import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS } from 'react-native-reanimated';
import type { Rect } from '@/shared/utils/grid';
import { useDragToGrid } from '../hooks/useDragToGrid';
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
};

export function FurnitureItem({
    furniture,
    cellSize,
    selected,
    onPress,
    bounds,
    onDragEnd,
}: Props) {
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
        onCommit: (rect) => onDragEnd?.(rect),
        testID: `furniture-pan-${furniture.id}`,
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
                    {
                        width,
                        height,
                        left,
                        top,
                        borderWidth: selected ? 2 : 1,
                        borderColor: selected ? '#E2720A' : '#666',
                    },
                    animatedStyle,
                ]}
            >
                <Text style={styles.label} numberOfLines={1}>
                    {furniture.name}
                </Text>
            </Animated.View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    furniture: {
        position: 'absolute',
        backgroundColor: '#FFF9C4',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 3,
    },
    label: {
        fontSize: 9,
        color: '#333',
    },
});
