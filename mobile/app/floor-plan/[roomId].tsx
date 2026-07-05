import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useFloorPlan } from '@/features/floor-plan/hooks/useFloorPlan';
import { FloorPlanCanvas } from '@/features/floor-plan/components/FloorPlanCanvas';
import { AddFurnitureModal } from '@/features/floor-plan/components/AddFurnitureModal';
import { FloorPlanRepository } from '@/features/floor-plan/repositories/FloorPlanRepository';
import { useUserId } from '@/shared/hooks/useUserId';
import { api } from '@/shared/app-root/providers/di';
import { FloatingActionButton } from '@/shared/components/FloatingActionButton';
import { useAppTheme } from '@/shared/theme/useAppTheme';
import type { FloorPlan } from '@/features/floor-plan/types';

const repository = new FloorPlanRepository(api);

const EMPTY_FLOORPLAN: FloorPlan = { rooms: [] };

export default function RoomDetailScreen() {
    const theme = useAppTheme();
    const { roomId } = useLocalSearchParams<{ roomId: string }>();
    const userId = useUserId();
    const [isModalVisible, setIsModalVisible] = useState(false);

    const { floorPlan, addFurniture, updateFurniture } = useFloorPlan(userId ?? '', repository);

    const floorPlanData = floorPlan.data ?? EMPTY_FLOORPLAN;
    const room = floorPlanData.rooms.find((r) => r.id === roomId);

    if (!room) {
        return (
            <View
                testID="room-not-found"
                style={[styles.notFound, { backgroundColor: theme.colors.background }]}
            >
                <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
                    部屋が見つかりません
                </Text>
            </View>
        );
    }

    function handleAddFurniture(input: { name: string; presetKey?: string }) {
        if (!room) return;
        addFurniture.mutate({
            roomId: room.id,
            input: {
                name: input.name,
                presetKey: input.presetKey,
                gridX: room.gridX,
                gridY: room.gridY,
                gridW: 1,
                gridH: 1,
            },
        });
        setIsModalVisible(false);
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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

            <FloatingActionButton
                accessibilityLabel="家具を追加"
                onPress={() => setIsModalVisible(true)}
            />

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
    },
    notFound: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
