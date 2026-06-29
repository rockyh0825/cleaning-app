import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFloorplan } from '@/features/floorplan/hooks/useFloorplan';
import { FloorplanCanvas } from '@/features/floorplan/components/FloorplanCanvas';
import { AddFurnitureModal } from '@/features/floorplan/components/AddFurnitureModal';
import { FloorplanRepository } from '@/features/floorplan/repositories/FloorplanRepository';
import type { Floorplan } from '@/features/floorplan/types';

type Props = {
    roomId: string;
    userId: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const apiStub: any = {};
const repository = new FloorplanRepository(apiStub);

const EMPTY_FLOORPLAN: Floorplan = { rooms: [] };

export default function RoomDetailScreen({ roomId, userId }: Props) {
    const [isModalVisible, setIsModalVisible] = useState(false);

    const { floorplan, addRoom: _addRoom } = useFloorplan(userId, repository);

    const floorplanData = floorplan.data ?? EMPTY_FLOORPLAN;
    const room = floorplanData.rooms.find((r) => r.id === roomId);

    const singleRoomPlan: Floorplan = room
        ? { rooms: [room] }
        : EMPTY_FLOORPLAN;

    function handleAddFurniture(input: { name: string }) {
        // TODO: addFurniture usecase を実装後に接続
        console.log('Add furniture:', input.name, 'to room:', roomId);
        setIsModalVisible(false);
    }

    return (
        <View style={styles.container}>
            <FloorplanCanvas floorplan={singleRoomPlan} />

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
