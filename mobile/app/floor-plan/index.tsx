import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { useFloorPlan } from "@/features/floor-plan/hooks/useFloorPlan";
import { FloorPlanCanvas } from "@/features/floor-plan/components/FloorPlanCanvas";
import { AddRoomModal } from "@/features/floor-plan/components/AddRoomModal";
import { FloorPlanRepository } from "@/features/floor-plan/repositories/FloorPlanRepository";
import type { CreateRoomInput } from "@/features/floor-plan/types";
import { GRID_COLS, GRID_ROWS } from "@/features/floor-plan/constants";
import { useUserId } from "@/shared/hooks/useUserId";
import { api } from "@/shared/app-root/providers/di";
import { FloatingActionButton } from "@/shared/components/FloatingActionButton";
import { useAppTheme } from "@/shared/theme/useAppTheme";
import { findFreePosition } from "@/shared/utils/grid";

const repository = new FloorPlanRepository(api);

const DEFAULT_ROOM_SIZE = { w: 4, h: 4 };

export default function FloorPlanIndexScreen() {
  const theme = useAppTheme();
  const userId = useUserId();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { floorPlan, addRoom, updateRoom } = useFloorPlan(userId ?? "", repository);

  const rooms = floorPlan.data?.rooms ?? [];

  function handleRoomPress(roomId: string) {
    router.push(`/floor-plan/${roomId}`);
  }

  function handleAddRoom(input: {
    name: string;
    type: CreateRoomInput["type"];
  }) {
    // 既存部屋と重ならない位置を探索する。満杯なら (0,0) に置き、重なり警告に委ねる
    const obstacles = rooms.map((room) => ({
      x: room.gridX,
      y: room.gridY,
      w: room.gridW,
      h: room.gridH,
    }));
    const freePosition = findFreePosition(DEFAULT_ROOM_SIZE, obstacles, {
      x: 0,
      y: 0,
      w: GRID_COLS,
      h: GRID_ROWS,
    });

    addRoom.mutate({
      name: input.name,
      type: input.type,
      gridX: freePosition?.x ?? 0,
      gridY: freePosition?.y ?? 0,
      gridW: DEFAULT_ROOM_SIZE.w,
      gridH: DEFAULT_ROOM_SIZE.h,
    });
    setIsModalVisible(false);
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {rooms.length === 0 ? (
        <View
          testID="empty-state"
          style={[styles.emptyState, { padding: theme.spacing.xl }]}
        >
          <Text testID="empty-state-illustration" style={styles.emptyIllustration}>
            🏠
          </Text>
          <Text
            style={[
              theme.typography.title,
              { color: theme.colors.text, marginBottom: theme.spacing.sm },
            ]}
          >
            まだ間取りがありません
          </Text>
          <Text
            style={[
              theme.typography.body,
              {
                color: theme.colors.textMuted,
                textAlign: "center",
                marginBottom: theme.spacing.xl,
              },
            ]}
          >
            部屋を配置して、わが家の掃除マップを作りましょう
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: theme.colors.primary,
              borderRadius: theme.radius.md,
              paddingVertical: theme.spacing.md,
              paddingHorizontal: theme.spacing.xl,
            }}
            onPress={() => setIsModalVisible(true)}
          >
            <Text style={[theme.typography.label, { color: theme.colors.surface }]}>
              最初の部屋を追加
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FloorPlanCanvas
          floorPlan={floorPlan.data!}
          onRoomPress={handleRoomPress}
          onRoomDragEnd={(roomId, rect) =>
            updateRoom.mutate({
              roomId,
              input: { gridX: rect.x, gridY: rect.y, gridW: rect.w, gridH: rect.h },
            })
          }
        />
      )}

      <FloatingActionButton
        accessibilityLabel="部屋を追加"
        onPress={() => setIsModalVisible(true)}
      />

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
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyIllustration: {
    fontSize: 64,
    lineHeight: 76,
    marginBottom: 16,
  },
});
