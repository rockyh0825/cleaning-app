import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { useFloorPlan } from "@/features/floor-plan/hooks/useFloorPlan";
import { FloorPlanCanvas } from "@/features/floor-plan/components/FloorPlanCanvas";
import { AddRoomModal } from "@/features/floor-plan/components/AddRoomModal";
import { RenameSheet } from "@/features/floor-plan/components/RenameSheet";
import { SelectionActions } from "@/features/floor-plan/components/SelectionActions";
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
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  // boolean だと対象消失後の別部屋選択でシートが誤って開くため、対象の部屋 id で追跡する
  const [renamingRoomId, setRenamingRoomId] = useState<string | null>(null);

  const { floorPlan, addRoom, updateRoom, deleteRoom } = useFloorPlan(
    userId ?? "",
    repository,
  );

  const rooms = floorPlan.data?.rooms ?? [];
  // 楽観的削除などでキャッシュから消えた部屋は選択扱いにしない
  const selectedRoom = rooms.find((room) => room.id === selectedRoomId) ?? null;

  function handleRoomPress(roomId: string) {
    // 初回タップは選択（操作バー表示）、選択中の部屋の再タップで詳細へ
    if (selectedRoomId === roomId) {
      router.push(`/floor-plan/${roomId}`);
      return;
    }
    setSelectedRoomId(roomId);
  }

  function handleDeletePress() {
    if (!selectedRoom) return;
    const roomId = selectedRoom.id;
    Alert.alert(
      `「${selectedRoom.name}」を削除しますか？`,
      "この部屋に置いた家具・パーツ・掃除記録もまとめて削除されます。この操作は取り消せません。",
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: () => {
            deleteRoom.mutate(roomId);
            setSelectedRoomId(null);
            // 選択解除の各経路（✕・家具タップ）と揃えてリネーム対象も破棄する
            setRenamingRoomId(null);
          },
        },
      ],
    );
  }

  function handleRenameSubmit(name: string) {
    if (!selectedRoom) return;
    updateRoom.mutate({ roomId: selectedRoom.id, input: { name } });
    setRenamingRoomId(null);
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
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {rooms.length === 0 ? (
        <View
          testID="empty-state"
          style={[styles.emptyState, { padding: theme.spacing.xl }]}
        >
          <Text
            testID="empty-state-illustration"
            style={[
              styles.emptyIllustration,
              { marginBottom: theme.spacing.lg },
            ]}
          >
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
            accessibilityRole="button"
            style={{
              backgroundColor: theme.colors.primary,
              borderRadius: theme.radius.md,
              paddingVertical: theme.spacing.md,
              paddingHorizontal: theme.spacing.xl,
            }}
            onPress={() => setIsModalVisible(true)}
          >
            <Text
              style={[theme.typography.label, { color: theme.colors.surface }]}
            >
              最初の部屋を追加
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FloorPlanCanvas
          floorPlan={floorPlan.data!}
          // 選択状態を単一の source にする（バーと選択枠・ハンドルを同時に制御）
          selectedRoomId={selectedRoomId}
          onRoomPress={handleRoomPress}
          // 間取り一覧では家具への操作は提供しないため、部屋の選択解除のみ行う（誤削除防止）
          onFurniturePress={() => {
            setSelectedRoomId(null);
            setRenamingRoomId(null);
          }}
          onRoomDragEnd={(roomId, rect) =>
            updateRoom.mutate({
              roomId,
              input: {
                gridX: rect.x,
                gridY: rect.y,
                gridW: rect.w,
                gridH: rect.h,
              },
            })
          }
        />
      )}

      {selectedRoom && (
        <View
          style={[
            styles.selectionActionsContainer,
            {
              top: theme.spacing.md,
              left: theme.spacing.md,
              right: theme.spacing.md,
            },
          ]}
        >
          <SelectionActions
            targetName={selectedRoom.name}
            onRename={() => setRenamingRoomId(selectedRoom.id)}
            onDelete={handleDeletePress}
            onDismiss={() => {
              setSelectedRoomId(null);
              setRenamingRoomId(null);
            }}
          />
        </View>
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

      <RenameSheet
        visible={renamingRoomId != null && renamingRoomId === selectedRoom?.id}
        initialName={selectedRoom?.name ?? ""}
        onSubmit={handleRenameSubmit}
        onClose={() => setRenamingRoomId(null)}
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
  },
  // FAB（右下）と重ならないよう画面上部に置く
  selectionActionsContainer: {
    position: "absolute",
  },
});
