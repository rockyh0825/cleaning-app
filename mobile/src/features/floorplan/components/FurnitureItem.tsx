import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import type { Furniture } from '../types';

type Props = {
    furniture: Furniture;
    cellSize: number;
    selected: boolean;
    onPress: () => void;
};

export function FurnitureItem({ furniture, cellSize, selected, onPress }: Props) {
    const width = furniture.gridW * cellSize;
    const height = furniture.gridH * cellSize;
    const left = furniture.gridX * cellSize;
    const top = furniture.gridY * cellSize;

    return (
        <TouchableOpacity
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
            ]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Text style={styles.label} numberOfLines={1}>
                {furniture.name}
            </Text>
        </TouchableOpacity>
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
