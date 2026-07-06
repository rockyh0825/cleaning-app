import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import type { GestureType } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useAppTheme } from '@/shared/theme/useAppTheme';
import { useDragToGrid } from '../hooks/useDragToGrid';

type Props = {
    /**
     * 対象の左上グリッド座標。position と maxRight/maxBottom は同一空間で渡せばよい。
     * 部屋なら絶対座標、家具なら部屋相対座標（0 基点）を渡す。
     */
    position: { x: number; y: number };
    /** 対象の現在グリッドサイズ */
    size: { w: number; h: number };
    /**
     * 広げられる右端のグリッド座標（position と同一空間）。
     * 部屋なら GRID_COLS、家具なら所属部屋の幅 room.gridW を渡す。
     * リサイズ可動域は maxRight - position.x のみで決まる空間非依存な差分計算。
     */
    maxRight: number;
    /**
     * 広げられる下端のグリッド座標（position と同一空間）。
     * 部屋なら GRID_ROWS、家具なら所属部屋の高さ room.gridH を渡す。
     */
    maxBottom: number;
    cellSize: number;
    /** リサイズ確定時にグリッド単位の新サイズを受け取る */
    onCommit: (size: { w: number; h: number }) => void;
    /** キャンバスのズーム倍率（px→グリッド変換に使用） */
    scale?: number;
    /** このリサイズの判定が終わるまで待機させるキャンバスパン */
    blocksExternal?: GestureType;
    /** Animated.View に付与するテストID（部屋・家具で使い分ける） */
    handleTestID: string;
    /** ジェスチャーに付与するテストID（jest-utils の参照用） */
    dragTestID: string;
    /** アクセシビリティ用ラベル */
    accessibilityLabel?: string;
};

const HANDLE_SIZE = 20;

/**
 * 選択中の対象（部屋・家具）の右下に表示するリサイズ用ハンドル。
 * useDragToGrid をサイズ空間（x=gridW, y=gridH）に読み替えて再利用する。
 * bounds でサイズを 1×1〜可動域（maxRight/maxBottom）にクランプする。
 */
export function ResizeHandle({
    position,
    size,
    maxRight,
    maxBottom,
    cellSize,
    onCommit,
    scale = 1,
    blocksExternal,
    handleTestID,
    dragTestID,
    accessibilityLabel = 'サイズを変更',
}: Props) {
    const theme = useAppTheme();
    const { gesture, animatedStyle } = useDragToGrid({
        rect: { x: size.w, y: size.h, w: 0, h: 0 },
        bounds: {
            x: 1,
            y: 1,
            w: maxRight - position.x - 1,
            h: maxBottom - position.y - 1,
        },
        cellSize,
        scale,
        onCommit: (rect) => onCommit({ w: rect.x, h: rect.y }),
        testID: dragTestID,
        blocksExternal,
    });

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View
                testID={handleTestID}
                accessibilityLabel={accessibilityLabel}
                style={[
                    styles.handle,
                    {
                        backgroundColor: theme.colors.primary,
                        borderColor: theme.colors.surface,
                    },
                    animatedStyle,
                ]}
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
        borderWidth: 2,
    },
});
