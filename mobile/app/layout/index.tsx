import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLayout } from '@/features/layout/hooks/useLayout';
import { LayoutCanvas } from '@/features/layout/components/LayoutCanvas';
import { AddRoomModal } from '@/features/layout/components/AddRoomModal';
import { LayoutRepository } from '@/features/layout/repositories/LayoutRepository';
import type { CreateRoomInput } from '@/features/layout/types';

const USER_UUID_KEY = 'user-uuid';

function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const apiStub: any = {};
const repository = new LayoutRepository(apiStub);

export default function LayoutIndexScreen() {
    const [userId, setUserId] = useState<string | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    useEffect(() => {
        async function initUserId() {
            const stored = await AsyncStorage.getItem(USER_UUID_KEY);
            if (stored) {
                setUserId(stored);
            } else {
                const newUuid = generateUUID();
                await AsyncStorage.setItem(USER_UUID_KEY, newUuid);
                setUserId(newUuid);
            }
        }
        initUserId();
    }, []);

    const { floorPlan, addRoom } = useLayout(userId ?? '', repository);

    const rooms = floorPlan.data?.rooms ?? [];

    function handleAddRoom(input: { name: string; type: CreateRoomInput['type'] }) {
        addRoom.mutate({
            name: input.name,
            type: input.type,
            gridX: 0,
            gridY: 0,
            gridW: 4,
            gridH: 4,
        });
        setIsModalVisible(false);
    }

    return (
        <View style={styles.container}>
            {rooms.length === 0 ? (
                <View testID="empty-state" style={styles.emptyState}>
                    <Text style={styles.emptyText}>まだ間取りがありません</Text>
                    <Text style={styles.emptySubText}>「部屋を追加」ボタンで始めましょう</Text>
                </View>
            ) : (
                <LayoutCanvas floorPlan={floorPlan.data!} />
            )}

            <TouchableOpacity
                style={styles.addButton}
                onPress={() => setIsModalVisible(true)}
            >
                <Text style={styles.addButtonText}>部屋を追加</Text>
            </TouchableOpacity>

            <AddRoomModal
                visible={isModalVisible}
                onSubmit={handleAddRoom}
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
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
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
