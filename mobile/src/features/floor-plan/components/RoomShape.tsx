import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import type { GestureType } from 'react-native-gesture-handler';
import Animated, { runOnJS } from 'react-native-reanimated';
import { useAppTheme } from '@/shared/theme/useAppTheme';
import type { Rect } from '@/shared/utils/grid';
import { GRID_COLS, GRID_ROWS } from '../constants';
import { useDragToGrid } from '../hooks/useDragToGrid';
import { CORNERS } from '../utils/cornerResize';
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
    /**
     * リサイズ確定時にグリッド単位の新矩形を受け取る（選択中のみ四つ角ハンドル表示）。
     * 左上・右上・左下の角では x/y も変わるため矩形全体を返す。
     */
    onResizeEnd?: (rect: Rect) => void;
    /** キャンバスのズーム倍率（px→グリッド変換に使用） */
    scale?: number;
    /** この部屋のドラッグ判定が終わるまで待機させるキャンバスパン */
    canvasPanGesture?: GestureType;
    /** 指定時は種別色の代わりにこの色で塗る（ヒートマップ用）。未指定なら従来の種別色 */
    fillColor?: string;
    /**
     * true で移動ドラッグの pan ジェスチャーを無効化する（タップは有効のまま）。
     * 読み取り専用表示で指への追従やキャンバスパンの阻害を防ぐ。未指定なら従来どおりドラッグ可能
     */
    dragDisabled?: boolean;
};

const CANVAS_BOUNDS: Rect = { x: 0, y: 0, w: GRID_COLS, h: GRID_ROWS };

// 中央グリップをこの時間ホールドすると移動ドラッグがアクティブ化する
const MOVE_ACTIVATION_MS = 300;

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
    fillColor,
    dragDisabled = false,
}: Props) {
    const theme = useAppTheme();
    const width = room.gridW * cellSize;
    const height = room.gridH * cellSize;
    const left = room.gridX * cellSize;
    const top = room.gridY * cellSize;
    const accent = theme.roomAccents[room.type] ?? theme.roomAccents.OTHER;

    // 移動は中央グリップの長押し起点のみ。四つ角のリサイズやタップ選択との誤操作を防ぐ
    const { gesture: panGesture, animatedStyle } = useDragToGrid({
        rect: { x: room.gridX, y: room.gridY, w: room.gridW, h: room.gridH },
        bounds: CANVAS_BOUNDS,
        cellSize,
        scale,
        onCommit: (rect) => onDragEnd?.(rect),
        testID: `room-pan-${room.id}`,
        blocksExternal: canvasPanGesture,
        enabled: !dragDisabled,
        activateAfterLongPressMs: MOVE_ACTIVATION_MS,
    });

    const tapGesture = Gesture.Tap()
        .onEnd((_event, success) => {
            if (success) runOnJS(onPress)();
        })
        .withTestId(`room-tap-${room.id}`);

    return (
        <GestureDetector gesture={tapGesture}>
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
                        backgroundColor: fillColor ?? accent.fill,
                        // 家具はキャンバス上で部屋の後に描画される絶対配置の兄弟のため、
                        // 選択中は部屋を前面に出して中央の移動グリップと四つ角ハンドルが
                        // 家具に覆われても操作できるようにする（非選択時は家具が上のまま）
                        zIndex: selected ? 1 : 0,
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
                <GestureDetector gesture={panGesture}>
                    <View
                        testID={`room-move-area-${room.id}`}
                        accessibilityLabel="長押しで部屋を移動"
                        style={styles.moveArea}
                    />
                </GestureDetector>
                {selected &&
                    onResizeEnd &&
                    CORNERS.map((corner) => (
                        <ResizeHandle
                            key={corner}
                            corner={corner}
                            position={{ x: room.gridX, y: room.gridY }}
                            size={{ w: room.gridW, h: room.gridH }}
                            maxRight={GRID_COLS}
                            maxBottom={GRID_ROWS}
                            cellSize={cellSize}
                            scale={scale}
                            blocksExternal={canvasPanGesture}
                            onCommit={onResizeEnd}
                            handleTestID={`resize-handle-${room.id}-${corner}`}
                            dragTestID={`room-resize-${room.id}-${corner}`}
                            ghostTestID={`resize-ghost-${room.id}-${corner}`}
                            accessibilityLabel="部屋のサイズを変更"
                        />
                    ))}
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
    // 移動用グリップ。四つ角のリサイズハンドルと干渉しないよう中央 50% のみを覆う
    moveArea: {
        position: 'absolute',
        left: '25%',
        top: '25%',
        width: '50%',
        height: '50%',
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
