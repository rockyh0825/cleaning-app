import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
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

type Props = {
    floorPlan: FloorPlan;
    cellSize?: number;
    onRoomPress?: (roomId: string) => void;
    onFurniturePress?: (furnitureId: string) => void;
    /** 部屋のドラッグ確定時にスナップ・クランプ済みのグリッド矩形を受け取る */
    onRoomDragEnd?: (roomId: string, rect: Rect) => void;
};

export function FloorPlanCanvas({
    floorPlan,
    cellSize = DEFAULT_CELL_SIZE,
    onRoomPress,
    onFurniturePress,
    onRoomDragEnd,
}: Props) {
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);

    const canvasWidth = GRID_COLS * cellSize;
    const canvasHeight = GRID_ROWS * cellSize;
    const overlappingRoomIds = findOverlappingRoomIds(floorPlan.rooms);

    function handleRoomPress(roomId: string) {
        setSelectedRoomId(roomId);
        setSelectedFurnitureId(null);
        onRoomPress?.(roomId);
    }

    function handleFurniturePress(furnitureId: string) {
        setSelectedFurnitureId(furnitureId);
        onFurniturePress?.(furnitureId);
    }

    return (
        <View
            testID="floorPlan-canvas"
            style={[styles.container, { width: canvasWidth, height: canvasHeight }]}
        >
            {renderGrid(canvasWidth, canvasHeight, cellSize)}

            {floorPlan.rooms.map((room) => (
                <React.Fragment key={room.id}>
                    <RoomShape
                        room={room}
                        cellSize={cellSize}
                        selected={selectedRoomId === room.id}
                        onPress={() => handleRoomPress(room.id)}
                        onDragEnd={(rect) => onRoomDragEnd?.(room.id, rect)}
                        overlapping={overlappingRoomIds.has(room.id)}
                    />
                    {room.furniture.map((furn) => (
                        <FurnitureItem
                            key={furn.id}
                            furniture={furn}
                            cellSize={cellSize}
                            selected={selectedFurnitureId === furn.id}
                            onPress={() => handleFurniturePress(furn.id)}
                        />
                    ))}
                </React.Fragment>
            ))}
        </View>
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
                    color="#DDD"
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
                    color="#DDD"
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
                { backgroundColor: '#F8F8F8', borderWidth: 1, borderColor: '#DDD' },
            ]}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        overflow: 'hidden',
    },
});
