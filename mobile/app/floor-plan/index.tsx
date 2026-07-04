import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { useFloorPlan } from "@/features/floor-plan/hooks/useFloorPlan";
import { FloorPlanCanvas } from "@/features/floor-plan/components/FloorPlanCanvas";
import { AddRoomModal } from "@/features/floor-plan/components/AddRoomModal";
import { FloorPlanRepository } from "@/features/floor-plan/repositories/FloorPlanRepository";
import type { CreateRoomInput } from "@/features/floor-plan/types";
import { useUserId } from "@/shared/hooks/useUserId";
import { api } from "@/shared/app-root/providers/di";

const repository = new FloorPlanRepository(api);

export default function FloorPlanIndexScreen() {
  const userId = useUserId();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { floorPlan, addRoom } = useFloorPlan(userId ?? "", repository);

  const rooms = floorPlan.data?.rooms ?? [];

  function handleAddRoom(input: {
    name: string;
    type: CreateRoomInput["type"];
  }) {
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
          <Text style={styles.emptySubText}>
            「部屋を追加」ボタンで始めましょう
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.canvasScroll}>
          <ScrollView horizontal>
            <FloorPlanCanvas
              floorPlan={floorPlan.data!}
              onRoomPress={(roomId) => router.push(`/floor-plan/${roomId}`)}
            />
          </ScrollView>
        </ScrollView>
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
    backgroundColor: "#fff",
  },
  canvasScroll: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
  addButton: {
    margin: 16,
    padding: 14,
    backgroundColor: "#4A90E2",
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
