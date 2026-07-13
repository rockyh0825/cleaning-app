import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { GestureType } from 'react-native-gesture-handler';
import Animated, { runOnJS } from 'react-native-reanimated';
import { useAppTheme } from '@/shared/theme/useAppTheme';
import { withAlpha } from '@/shared/utils/color';
import type { Rect } from '@/shared/utils/grid';
import { useDragToGrid } from '../hooks/useDragToGrid';
import { CORNERS } from '../utils/cornerResize';
import { FurnitureGlyph } from './glyphs/FurnitureGlyph';
import { ResizeHandle } from './ResizeHandle';
import type { Furniture } from '../types';

type Props = {
    furniture: Furniture;
    cellSize: number;
    selected: boolean;
    onPress: () => void;
    /**
     * 所属部屋の矩形（キャンバス絶対座標）。家具座標は部屋相対（0基点）のため、
     * 描画は bounds の絶対位置ぶんオフセットし、ドラッグ・リサイズの可動域は
     * bounds のサイズを 0 起点の相対矩形として使う。
     */
    bounds: Rect;
    /** ドラッグ確定時にスナップ・クランプ済みのグリッド矩形を受け取る */
    onDragEnd?: (rect: Rect) => void;
    /**
     * リサイズ確定時にグリッド単位の新矩形（部屋相対）を受け取る（選択中のみ四つ角ハンドル表示）。
     * 左上・右上・左下の角では x/y も変わるため矩形全体を返す。
     */
    onResizeEnd?: (rect: Rect) => void;
    /** キャンバスのズーム倍率（px→グリッド変換に使用） */
    scale?: number;
    /** この家具のドラッグ判定が終わるまで待機させるキャンバスパン */
    canvasPanGesture?: GestureType;
    /** 指定時は surface 色の代わりにこの色で塗る（ヒートマップ用）。未指定なら従来の surface 色 */
    fillColor?: string;
    /**
     * true で移動ドラッグの pan ジェスチャーを無効化する（タップは有効のまま）。
     * 読み取り専用表示で指への追従やキャンバスパンの阻害を防ぐ。未指定なら従来どおりドラッグ可能
     */
    dragDisabled?: boolean;
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
    fillColor,
    dragDisabled = false,
}: Props) {
    const theme = useAppTheme();
    const width = furniture.gridW * cellSize;
    const height = furniture.gridH * cellSize;
    // 家具座標は部屋相対のため、部屋の絶対位置（bounds.x/y）ぶんオフセットして描画する
    const left = (bounds.x + furniture.gridX) * cellSize;
    const top = (bounds.y + furniture.gridY) * cellSize;
    // ドラッグ・リサイズの可動域は 0 起点の相対矩形（部屋のサイズのみ）
    const relativeBounds: Rect = { x: 0, y: 0, w: bounds.w, h: bounds.h };

    const { gesture: panGesture, animatedStyle } = useDragToGrid({
        rect: {
            x: furniture.gridX,
            y: furniture.gridY,
            w: furniture.gridW,
            h: furniture.gridH,
        },
        bounds: relativeBounds,
        cellSize,
        scale,
        onCommit: (rect) => onDragEnd?.(rect),
        testID: `furniture-pan-${furniture.id}`,
        blocksExternal: canvasPanGesture,
        enabled: !dragDisabled,
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
                        backgroundColor: fillColor ?? theme.colors.surface,
                        borderRadius: theme.radius.sm,
                        borderWidth: selected ? 2 : 1,
                        borderColor: selected
                            ? theme.colors.primary
                            : theme.colors.outline,
                    },
                    animatedStyle,
                ]}
            >
                {/* トップダウン・グリフ。ジェスチャーを妨げないよう pointerEvents="none" の
                    レイヤーに絶対配置する（overflow: hidden は角ハンドルが切れるため使わない）。
                    ヒートマップ表示（fillColor 指定）では状態色シルエットに切り替える */}
                <View
                    testID={`furniture-glyph-layer-${furniture.id}`}
                    pointerEvents="none"
                    style={StyleSheet.absoluteFill}
                >
                    <FurnitureGlyph
                        presetKey={furniture.presetKey}
                        gridW={furniture.gridW}
                        gridH={furniture.gridH}
                        cellSize={cellSize}
                        silhouette={fillColor != null}
                    />
                </View>
                <Text
                    style={[
                        styles.label,
                        {
                            color: theme.colors.textMuted,
                            // 下端の名前チップ。グリフの上でも読めるよう半透明の面を敷く
                            // （hex 連結はトークンが 6桁 hex である前提に依存するため
                            // withAlpha で rgba 化する）
                            backgroundColor: withAlpha(theme.colors.surface, 0.9),
                            borderRadius: theme.radius.sm,
                        },
                    ]}
                    numberOfLines={1}
                >
                    {furniture.name}
                </Text>
                {selected &&
                    onResizeEnd &&
                    CORNERS.map((corner) => (
                        <ResizeHandle
                            key={corner}
                            corner={corner}
                            position={{ x: furniture.gridX, y: furniture.gridY }}
                            size={{ w: furniture.gridW, h: furniture.gridH }}
                            maxRight={bounds.w}
                            maxBottom={bounds.h}
                            cellSize={cellSize}
                            scale={scale}
                            blocksExternal={canvasPanGesture}
                            onCommit={onResizeEnd}
                            handleTestID={`resize-handle-${furniture.id}-${corner}`}
                            dragTestID={`furniture-resize-${furniture.id}-${corner}`}
                            ghostTestID={`resize-ghost-${furniture.id}-${corner}`}
                            accessibilityLabel="家具のサイズを変更"
                        />
                    ))}
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
        position: 'absolute',
        bottom: 2,
        maxWidth: '92%',
        paddingHorizontal: 4,
        paddingVertical: 1,
        overflow: 'hidden',
    },
});
