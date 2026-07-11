import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';
import { useAppTheme } from '@/shared/theme/useAppTheme';
import type { AppTheme } from '@/shared/theme/tokens';
import { rectsOverlap } from '@/shared/utils/grid';
import type { Rect } from '@/shared/utils/grid';
import type { FloorPlan, Room } from '../types';
import { GRID_COLS, GRID_ROWS } from '../constants';
import { FurnitureItem } from './FurnitureItem';
import { RoomShape } from './RoomShape';

let SkiaCanvas: React.ComponentType<{ width: number; height: number; children?: React.ReactNode }> | null =
    null;
let SkiaGroup: React.ComponentType<{ children?: React.ReactNode }> | null = null;
let SkiaLine: React.ComponentType<{
    p1: { x: number; y: number };
    p2: { x: number; y: number };
    color?: string;
    strokeWidth?: number;
}> | null = null;

try {
    const Skia = require('@shopify/react-native-skia');
    SkiaCanvas = Skia.Canvas;
    SkiaGroup = Skia.Group;
    SkiaLine = Skia.Line;
} catch {
    // Skia not available; fall back to plain View grid
}

const DEFAULT_CELL_SIZE = 40;

const MIN_SCALE = 0.5;
const MAX_SCALE = 2;

/**
 * ピンチのズーム倍率を 0.5〜2 に収める。不正値（NaN・Infinity）は等倍に戻す。
 * Reanimated 非依存の純粋関数としてテストする（UIスレッドでも呼ぶため worklet 指定）。
 */
export function clampScale(scale: number): number {
    'worklet';
    if (!Number.isFinite(scale)) return 1;
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

type Props = {
    floorPlan: FloorPlan;
    cellSize?: number;
    onRoomPress?: (roomId: string) => void;
    onFurniturePress?: (furnitureId: string) => void;
    /**
     * 部屋の選択状態を親から制御する（選択枠・リサイズハンドルの表示を駆動）。
     * 渡された場合はこの値が真実の源となり内部 state を使わない。
     * 未指定（undefined）なら従来どおり内部 state で選択を管理する（後方互換）。
     */
    selectedRoomId?: string | null;
    /**
     * 家具の選択状態を親から制御する（選択ボーダーの表示を駆動）。
     * 渡された場合はこの値が真実の源となり内部 state を使わない。
     * 未指定（undefined）なら従来どおり内部 state で選択を管理する（後方互換）。
     */
    selectedFurnitureId?: string | null;
    /** 部屋のドラッグ・リサイズ確定時にスナップ・クランプ済みのグリッド矩形を受け取る */
    onRoomDragEnd?: (roomId: string, rect: Rect) => void;
    /** 家具のドラッグ確定時にスナップ・クランプ済みのグリッド矩形を受け取る */
    onFurnitureDragEnd?: (furnitureId: string, rect: Rect) => void;
    /**
     * areaId（room.id / furniture.id）→ hex のヒートマップ色。
     * 該当エリアの背景を fillColor として差し込む。miss したエリアは従来色のまま
     */
    areaColors?: Map<string, string>;
    /**
     * true でドラッグ確定・リサイズハンドル・選択表示を無効化しタップのみ許可する
     * （ヒートマップ等の読み取り専用表示向け）。未指定なら従来の編集挙動
     */
    readOnly?: boolean;
};

export function FloorPlanCanvas({
    floorPlan,
    cellSize = DEFAULT_CELL_SIZE,
    onRoomPress,
    onFurniturePress,
    onRoomDragEnd,
    onFurnitureDragEnd,
    selectedRoomId,
    selectedFurnitureId,
    areaColors,
    readOnly = false,
}: Props) {
    const theme = useAppTheme();
    // 制御プロップが渡された場合は親が真実の源。未指定なら内部 state で管理する（後方互換）
    const isRoomSelectionControlled = selectedRoomId !== undefined;
    const [internalSelectedRoomId, setInternalSelectedRoomId] = useState<string | null>(
        null,
    );
    const resolvedSelectedRoomId = isRoomSelectionControlled
        ? selectedRoomId
        : internalSelectedRoomId;
    // 家具選択も部屋と同じ後方互換パターン。制御プロップ指定時は親が真実の源
    const isFurnitureSelectionControlled = selectedFurnitureId !== undefined;
    const [internalSelectedFurnitureId, setInternalSelectedFurnitureId] = useState<
        string | null
    >(null);
    const resolvedSelectedFurnitureId = isFurnitureSelectionControlled
        ? selectedFurnitureId
        : internalSelectedFurnitureId;

    const scale = useSharedValue(1);
    const savedScale = useSharedValue(1);
    const panX = useSharedValue(0);
    const panY = useSharedValue(0);
    const savedPanX = useSharedValue(0);
    const savedPanY = useSharedValue(0);
    // ドラッグ確定計算（JSスレッド・commitDrag）に渡す確定済みズーム倍率
    const [gridScale, setGridScale] = useState(1);

    const pinchGesture = Gesture.Pinch()
        .onUpdate((event) => {
            scale.value = clampScale(savedScale.value * event.scale);
        })
        .onEnd((event) => {
            const next = clampScale(savedScale.value * event.scale);
            scale.value = next;
            savedScale.value = next;
            runOnJS(setGridScale)(next);
        })
        .withTestId('canvas-pinch');

    const canvasPanGesture = Gesture.Pan()
        .onUpdate((event) => {
            panX.value = savedPanX.value + event.translationX;
            panY.value = savedPanY.value + event.translationY;
        })
        .onEnd(() => {
            savedPanX.value = panX.value;
            savedPanY.value = panY.value;
        })
        .withTestId('canvas-pan');

    const canvasGesture = Gesture.Simultaneous(pinchGesture, canvasPanGesture);

    // 依存配列は Babel プラグイン無しの環境（ts-jest でのテスト実行）でも動くよう明示する
    const canvasAnimatedStyle = useAnimatedStyle(
        () => ({
            transform: [
                { translateX: panX.value },
                { translateY: panY.value },
                { scale: scale.value },
            ],
        }),
        [panX, panY, scale],
    );

    // readOnly ではドラッグ・リサイズを確定させない（タップのみ許可）
    const effectiveOnRoomDragEnd = readOnly ? undefined : onRoomDragEnd;
    const effectiveOnFurnitureDragEnd = readOnly ? undefined : onFurnitureDragEnd;

    const canvasWidth = GRID_COLS * cellSize;
    const canvasHeight = GRID_ROWS * cellSize;
    const overlappingRoomIds = useMemo(
        () => findOverlappingRoomIds(floorPlan.rooms),
        [floorPlan.rooms],
    );

    function handleRoomPress(roomId: string) {
        // readOnly では選択 UI を出さないため内部選択 state を更新しない（onRoomPress は通知する）
        if (!readOnly) {
            // 制御モードでは親が selectedRoomId を更新するため内部 state は触らない
            if (!isRoomSelectionControlled) {
                setInternalSelectedRoomId(roomId);
            }
            // 制御モードでは家具選択の解除も親（onRoomPress）に委ねる
            if (!isFurnitureSelectionControlled) {
                setInternalSelectedFurnitureId(null);
            }
        }
        onRoomPress?.(roomId);
    }

    function handleFurniturePress(furnitureId: string) {
        // readOnly では選択 UI を出さないため内部選択 state を更新しない（onFurniturePress は通知する）
        if (!readOnly) {
            // 制御モードでは親が selectedFurnitureId を更新するため内部 state は触らない
            if (!isFurnitureSelectionControlled) {
                setInternalSelectedFurnitureId(furnitureId);
            }
        }
        onFurniturePress?.(furnitureId);
    }

    return (
        <GestureDetector gesture={canvasGesture}>
            <View testID="floorPlan-viewport" style={styles.viewport}>
                <Animated.View
                    testID="floorPlan-canvas"
                    style={[
                        styles.container,
                        {
                            width: canvasWidth,
                            height: canvasHeight,
                            backgroundColor: theme.colors.surface,
                        },
                        canvasAnimatedStyle,
                    ]}
                >
                    {renderGrid(canvasWidth, canvasHeight, cellSize, theme)}

                    {floorPlan.rooms.map((room) => (
                        <React.Fragment key={room.id}>
                            <RoomShape
                                room={room}
                                cellSize={cellSize}
                                scale={gridScale}
                                canvasPanGesture={canvasPanGesture}
                                selected={
                                    !readOnly && resolvedSelectedRoomId === room.id
                                }
                                onPress={() => handleRoomPress(room.id)}
                                onDragEnd={(rect) =>
                                    effectiveOnRoomDragEnd?.(room.id, rect)
                                }
                                overlapping={overlappingRoomIds.has(room.id)}
                                fillColor={areaColors?.get(room.id)}
                                dragDisabled={readOnly}
                                onResizeEnd={
                                    // 四つ角リサイズは x/y も変わるため矩形をそのまま渡す
                                    effectiveOnRoomDragEnd
                                        ? (rect) =>
                                              effectiveOnRoomDragEnd(room.id, rect)
                                        : undefined
                                }
                            />
                            {room.furniture.map((furn) => (
                                <FurnitureItem
                                    key={furn.id}
                                    furniture={furn}
                                    cellSize={cellSize}
                                    scale={gridScale}
                                    canvasPanGesture={canvasPanGesture}
                                    selected={
                                        !readOnly &&
                                        resolvedSelectedFurnitureId === furn.id
                                    }
                                    onPress={() => handleFurniturePress(furn.id)}
                                    bounds={{
                                        x: room.gridX,
                                        y: room.gridY,
                                        w: room.gridW,
                                        h: room.gridH,
                                    }}
                                    fillColor={areaColors?.get(furn.id)}
                                    dragDisabled={readOnly}
                                    onDragEnd={(rect) =>
                                        effectiveOnFurnitureDragEnd?.(furn.id, rect)
                                    }
                                    onResizeEnd={
                                        // 四つ角リサイズは x/y も変わるため矩形をそのまま渡す
                                        effectiveOnFurnitureDragEnd
                                            ? (rect) =>
                                                  effectiveOnFurnitureDragEnd(
                                                      furn.id,
                                                      rect,
                                                  )
                                            : undefined
                                    }
                                />
                            ))}
                        </React.Fragment>
                    ))}
                </Animated.View>
            </View>
        </GestureDetector>
    );
}

/**
 * 全部屋ペアを rectsOverlap で判定し、重なっている部屋の id 集合を返す。
 * 部屋数は数十件規模なので O(n²) で十分（design.md 重なりポリシー）。
 */
function findOverlappingRoomIds(rooms: Room[]): Set<string> {
    const ids = new Set<string>();
    for (let i = 0; i < rooms.length; i++) {
        for (let j = i + 1; j < rooms.length; j++) {
            const a = rooms[i];
            const b = rooms[j];
            const rectA = { x: a.gridX, y: a.gridY, w: a.gridW, h: a.gridH };
            const rectB = { x: b.gridX, y: b.gridY, w: b.gridW, h: b.gridH };
            if (rectsOverlap(rectA, rectB)) {
                ids.add(a.id);
                ids.add(b.id);
            }
        }
    }
    return ids;
}

function renderGrid(
    canvasWidth: number,
    canvasHeight: number,
    cellSize: number,
    theme: AppTheme,
): React.ReactNode {
    if (SkiaCanvas && SkiaGroup && SkiaLine) {
        const SC = SkiaCanvas;
        const SG = SkiaGroup;
        const SL = SkiaLine;
        const cols = Math.floor(canvasWidth / cellSize);
        const rows = Math.floor(canvasHeight / cellSize);

        const lines: React.ReactNode[] = [];
        for (let c = 0; c <= cols; c++) {
            lines.push(
                <SL
                    key={`v-${c}`}
                    p1={{ x: c * cellSize, y: 0 }}
                    p2={{ x: c * cellSize, y: canvasHeight }}
                    color={theme.colors.gridLine}
                    strokeWidth={1}
                />,
            );
        }
        for (let r = 0; r <= rows; r++) {
            lines.push(
                <SL
                    key={`h-${r}`}
                    p1={{ x: 0, y: r * cellSize }}
                    p2={{ x: canvasWidth, y: r * cellSize }}
                    color={theme.colors.gridLine}
                    strokeWidth={1}
                />,
            );
        }

        return (
            <SC width={canvasWidth} height={canvasHeight}>
                <SG>{lines}</SG>
            </SC>
        );
    }

    // Fallback: plain View with a grid background color
    return (
        <View
            style={[
                StyleSheet.absoluteFillObject,
                {
                    backgroundColor: theme.colors.surfaceAlt,
                    borderWidth: 1,
                    borderColor: theme.colors.gridLine,
                },
            ]}
        />
    );
}

const styles = StyleSheet.create({
    viewport: {
        flex: 1,
        overflow: 'hidden',
    },
    container: {
        position: 'relative',
        overflow: 'hidden',
    },
});
