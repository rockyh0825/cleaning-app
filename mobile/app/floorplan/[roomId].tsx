import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFloorPlan } from '@/features/floorplan/hooks/useFloorPlan';
import { FloorPlanCanvas } from '@/features/floorplan/components/FloorPlanCanvas';
import { AddFurnitureModal } from '@/features/floorplan/components/AddFurnitureModal';
import { FloorPlanRepository } from '@/features/floorplan/repositories/FloorPlanRepository';
import type { FloorPlan } from '@/features/floorplan/types';

type Props = {
    roomId: string;
    userId: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const apiStub: any = {};
const repository = new FloorPlanRepository(apiStub);

const EMPTY_FLOOR_PLAN: FloorPlan = { rooms: [] };

export default function RoomDetailScreen({ roomId, userId }: Props) {
    const [isModalVisible, setIsModalVisible] = useState(false);

    const { floorPlan, addRoom: _addRoom } = useFloorPlan(userId, repository);

    const floorPlanData = floorPlan.data ?? EMPTY_FLOOR_PLAN;
    const room = floorPlanData.rooms.find((r) => r.id === roomId);

    const singleRoomPlan: FloorPlan = room
        ? { rooms: [room] }
        : EMPTY_FLOOR_PLAN;

    function handleAddFurniture(input: { name: string }) {
        // TODO: addFurniture usecase を実装後に接続
        console.log('Add furniture:', input.name, 'to room:', roomId);
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
