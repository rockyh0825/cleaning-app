import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import type { Room } from '../types';

type Props = {
    room: Room;
    cellSize: number;
    selected: boolean;
    onPress: () => void;
};

const ROOM_COLORS: Record<string, string> = {
    LIVING: '#B3D9FF',
    KITCHEN: '#FFD9B3',
    BEDROOM: '#D9FFB3',
    BATHROOM: '#B3FFEE',
    TOILET: '#E6B3FF',
    OTHER: '#E0E0E0',
};

export function RoomShape({ room, cellSize, selected, onPress }: Props) {
    const width = room.gridW * cellSize;
    const height = room.gridH * cellSize;
    const left = room.gridX * cellSize;
    const top = room.gridY * cellSize;
    const backgroundColor = ROOM_COLORS[room.type] ?? '#E0E0E0';

    return (
        <TouchableOpacity
            testID={`room-shape-${room.id}`}
            style={[
                styles.room,
                {
                    width,
                    height,
                    left,
                    top,
                    backgroundColor,
                    borderWidth: selected ? 2 : 1,
                    borderColor: selected ? '#1A60C8' : '#888',
                },
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Text style={styles.label} numberOfLines={1}>
                {room.name}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    room: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
    },
    label: {
        fontSize: 11,
        color: '#333',
        fontWeight: '500',
    },
});
