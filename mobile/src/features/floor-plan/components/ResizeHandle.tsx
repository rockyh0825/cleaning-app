import React from 'react';
import { StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import type { GestureType } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useAppTheme } from '@/shared/theme/useAppTheme';
import type { Rect } from '@/shared/utils/grid';
import { useDragToGrid } from '../hooks/useDragToGrid';
import { cornerBounds, cornerPoint, rectFromCorner } from '../utils/cornerResize';
import type { Corner } from '../utils/cornerResize';

type Props = {
    /** ハンドルを置く角（対角がアンカーとして固定される） */
    corner: Corner;
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
     */
    maxRight: number;
    /**
     * 広げられる下端のグリッド座標（position と同一空間）。
     * 部屋なら GRID_ROWS、家具なら所属部屋の高さ room.gridH を渡す。
     */
    maxBottom: number;
    cellSize: number;
    /**
     * リサイズ確定時にグリッド単位の新矩形（position と同一空間）を受け取る。
     * 左上以外の角では x/y も変わるため、サイズだけでなく矩形全体を返す。
     */
    onCommit: (rect: Rect) => void;
    /** キャンバスのズーム倍率（px→グリッド変換に使用） */
    scale?: number;
    /** このリサイズの判定が終わるまで待機させるキャンバスパン */
    blocksExternal?: GestureType;
    /** Animated.View に付与するテストID（部屋・家具で使い分ける） */
    handleTestID: string;
    /** ジェスチャーに付与するテストID（jest-utils の参照用） */
    dragTestID: string;
    /** ゴーストプレビュー枠に付与するテストID */
    ghostTestID?: string;
    /** アクセシビリティ用ラベル */
    accessibilityLabel?: string;
};

const HANDLE_SIZE = 20;

// 各角のハンドル配置。対象の角に半径ぶん重ねて外側へはみ出させる
const HANDLE_PLACEMENT: Record<Corner, ViewStyle> = {
    tl: { left: -HANDLE_SIZE / 2, top: -HANDLE_SIZE / 2 },
    tr: { right: -HANDLE_SIZE / 2, top: -HANDLE_SIZE / 2 },
    bl: { left: -HANDLE_SIZE / 2, bottom: -HANDLE_SIZE / 2 },
    br: { right: -HANDLE_SIZE / 2, bottom: -HANDLE_SIZE / 2 },
};

/**
 * 選択中の対象（部屋・家具）の角に表示するリサイズ用ハンドル。
 * useDragToGrid を「角の点」空間（w=h=0 の Rect）に読み替えて再利用し、
 * cornerBounds で対角アンカーから最小 1×1〜可動域にクランプする。
 * 確定時は rectFromCorner で矩形全体（x/y/w/h）を親へ返す。
 */
export function ResizeHandle({
    corner,
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
    ghostTestID,
    accessibilityLabel = 'サイズを変更',
}: Props) {
    const theme = useAppTheme();
    const targetRect: Rect = { x: position.x, y: position.y, w: size.w, h: size.h };
    const point = cornerPoint(targetRect, corner);
    const { gesture, animatedStyle, preview } = useDragToGrid({
        rect: { x: point.x, y: point.y, w: 0, h: 0 },
        bounds: cornerBounds(targetRect, corner, maxRight, maxBottom),
        cellSize,
        scale,
        onCommit: (dragged) =>
            onCommit(rectFromCorner(targetRect, corner, { x: dragged.x, y: dragged.y })),
        testID: dragTestID,
        blocksExternal,
    });

    // preview.x/y はスナップ後の「角の点」。rectFromCorner で確定後の矩形に戻し、
    // 対象の左上を基点とした px 矩形としてゴースト枠を描く。active(0/1) で表示切替。
    const ghostStyle = useAnimatedStyle(() => {
        const ghost = rectFromCorner(targetRect, corner, {
            x: preview.x.value,
            y: preview.y.value,
        });
        return {
            left: (ghost.x - targetRect.x) * cellSize,
            top: (ghost.y - targetRect.y) * cellSize,
            width: ghost.w * cellSize,
            height: ghost.h * cellSize,
            opacity: preview.active.value,
        };
        // 依存配列は Babel プラグイン無しの環境（ts-jest でのテスト実行）でも動くよう明示する
    }, [
        preview.x,
        preview.y,
        preview.active,
        cellSize,
        corner,
        position.x,
        position.y,
        size.w,
        size.h,
    ]);

    return (
        <>
            <Animated.View
                testID={ghostTestID}
                pointerEvents="none"
                style={[
                    styles.ghost,
                    {
                        borderColor: theme.colors.primary,
                        borderRadius: theme.radius.md,
                    },
                    ghostStyle,
                ]}
            />
            <GestureDetector gesture={gesture}>
                <Animated.View
                    testID={handleTestID}
                    accessibilityLabel={accessibilityLabel}
                    style={[
                        styles.handle,
                        HANDLE_PLACEMENT[corner],
                        {
                            backgroundColor: theme.colors.primary,
                            borderColor: theme.colors.surface,
                        },
                        animatedStyle,
                    ]}
                />
            </GestureDetector>
        </>
    );
}

const styles = StyleSheet.create({
    // 確定後の矩形を示す破線ゴースト枠。位置・サイズは ghostStyle が毎フレーム上書きする
    ghost: {
        position: 'absolute',
        borderWidth: 2,
        borderStyle: 'dashed',
    },
    handle: {
        position: 'absolute',
        width: HANDLE_SIZE,
        height: HANDLE_SIZE,
        borderRadius: HANDLE_SIZE / 2,
        borderWidth: 2,
    },
});
