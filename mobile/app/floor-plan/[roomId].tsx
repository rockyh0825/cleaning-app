import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useFloorPlan } from '@/features/floor-plan/hooks/useFloorPlan';
import { FloorPlanCanvas } from '@/features/floor-plan/components/FloorPlanCanvas';
import { AddFurnitureModal } from '@/features/floor-plan/components/AddFurnitureModal';
import { FloorPlanRepository } from '@/features/floor-plan/repositories/FloorPlanRepository';
import { useUserId } from '@/shared/hooks/useUserId';
import { api } from '@/shared/app-root/providers/di';
import type { FloorPlan } from '@/features/floor-plan/types';

const repository = new FloorPlanRepository(api);

const EMPTY_FLOORPLAN: FloorPlan = { rooms: [] };

export default function RoomDetailScreen() {
    const { roomId } = useLocalSearchParams<{ roomId: string }>();
    const userId = useUserId();
    const [isModalVisible, setIsModalVisible] = useState(false);

    const { floorPlan, addFurniture, updateFurniture } = useFloorPlan(userId ?? '', repository);

    const floorPlanData = floorPlan.data ?? EMPTY_FLOORPLAN;
    const room = floorPlanData.rooms.find((r) => r.id === roomId);

    if (!room) {
        return (
            <View testID="room-not-found" style={styles.notFound}>
                <Text style={styles.notFoundText}>部屋が見つかりません</Text>
            </View>
        );
    }

    function handleAddFurniture(input: { name: string }) {
        if (!room) return;
        addFurniture.mutate({
            roomId: room.id,
            input: {
                name: input.name,
                gridX: room.gridX,
                gridY: room.gridY,
                gridW: 1,
                gridH: 1,
            },
        });
        setIsModalVisible(false);
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.canvasScroll}>
                <ScrollView horizontal>
                    <FloorPlanCanvas
                        floorPlan={{ rooms: [room] }}
                        onFurnitureDragEnd={(furnitureId, rect) =>
                            updateFurniture.mutate({
                                furnitureId,
                                input: {
                                    gridX: rect.x,
                                    gridY: rect.y,
                                    gridW: rect.w,
                                    gridH: rect.h,
                                },
                            })
                        }
                    />
                </ScrollView>
            </ScrollView>

            <TouchableOpacity
                style={styles.addButton}
                onPress={() => setIsModalVisible(true)}
            >
                <Text style={styles.addButtonText}>家具を追加</Text>
            </TouchableOpacity>

            <AddFurnitureModal
                visible={isModalVisible}
                roomId={room.id}
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
    canvasScroll: {
        flex: 1,
    },
    notFound: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    notFoundText: {
        fontSize: 16,
        color: '#888',
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
