import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useFloorPlan } from '@/features/floor-plan/hooks/useFloorPlan';
import { FloorPlanCanvas } from '@/features/floor-plan/components/FloorPlanCanvas';
import { AddFurnitureModal } from '@/features/floor-plan/components/AddFurnitureModal';
import { FloorPlanRepository } from '@/features/floor-plan/repositories/FloorPlanRepository';
import type { FloorPlan } from '@/features/floor-plan/types';
import { api } from '@/shared/app-root/providers/di';
import { useUserId } from '@/shared/hooks/useUserId';

const repository = new FloorPlanRepository(api);

const EMPTY_FLOORPLAN: FloorPlan = { rooms: [] };

export default function RoomDetailScreen() {
    const { roomId } = useLocalSearchParams<{ roomId: string }>();
    const userId = useUserId();
    const [isModalVisible, setIsModalVisible] = useState(false);

    const { floorPlan, addFurniture } = useFloorPlan(userId ?? '', repository);

    const floorPlanData = floorPlan.data ?? EMPTY_FLOORPLAN;
    const room = floorPlanData.rooms.find((r) => r.id === roomId);

    const singleRoomPlan: FloorPlan = room
        ? { rooms: [room] }
        : EMPTY_FLOORPLAN;

    function handleAddFurniture(input: { name: string }) {
        addFurniture.mutate({
            roomId,
            input: { name: input.name, gridX: 0, gridY: 0, gridW: 1, gridH: 1 },
        });
        setIsModalVisible(false);
    }

    return (
        <View style={styles.container}>
            <FloorPlanCanvas floorPlan={singleRoomPlan} />

            <TouchableOpacity
                style={styles.addButton}
                onPress={() => setIsModalVisible(true)}
            >
                <Text style={styles.addButtonText}>家具を追加</Text>
            </TouchableOpacity>

            <AddFurnitureModal
                visible={isModalVisible}
                roomId={roomId}
                onSubmit={handleAddFurniture}
                onCancel={() => setIsModalVisible(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    addButton: {
        margin: 16,
        padding: 14,
        backgroundColor: '#4A90E2',
        borderRadius: 8,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
