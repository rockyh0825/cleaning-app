import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { FloorPlan } from '../types';
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
const GRID_COLS = 20;
const GRID_ROWS = 20;

type Props = {
    floorplan: FloorPlan;
    cellSize?: number;
    onRoomPress?: (roomId: string) => void;
    onFurniturePress?: (furnitureId: string) => void;
};

export function FloorPlanCanvas({
    floorplan,
    cellSize = DEFAULT_CELL_SIZE,
    onRoomPress,
    onFurniturePress,
}: Props) {
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);

    const canvasWidth = GRID_COLS * cellSize;
    const canvasHeight = GRID_ROWS * cellSize;

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
            testID="floorplan-canvas"
            style={[styles.container, { width: canvasWidth, height: canvasHeight }]}
        >
            {renderGrid(canvasWidth, canvasHeight, cellSize)}

            {floorplan.rooms.map((room) => (
                <React.Fragment key={room.id}>
                    <RoomShape
                        room={room}
                        cellSize={cellSize}
                        selected={selectedRoomId === room.id}
                        onPress={() => handleRoomPress(room.id)}
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
