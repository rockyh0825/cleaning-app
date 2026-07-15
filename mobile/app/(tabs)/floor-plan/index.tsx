import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { useFloorPlan } from "@/features/floor-plan/hooks/useFloorPlan";
import { FloorPlanCanvas } from "@/features/floor-plan/components/FloorPlanCanvas";
import { AddRoomModal } from "@/features/floor-plan/components/AddRoomModal";
import { RenameScreen } from "@/features/floor-plan/components/RenameScreen";
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
    // タップは選択のみ。詳細（家具配置の修正）へは操作バーの「部屋の中を修正」から遷移する
    setSelectedRoomId(roomId);
  }

  /**
   * 家具は部屋より後に描かれる絶対配置の兄弟のため、常に部屋よりも前でタップを奪う。
   * 一覧では家具そのものへの操作を提供しないので、家具へのタップはその家具が乗っている
   * 部屋へのタップとして扱う。こうしないと家具で隙間なく埋まった部屋は、部屋の地を
   * 一点も触れず永久に選択できなくなる
   */
  function handleFurniturePress(furnitureId: string) {
    const owner = rooms.find((room) =>
      room.furniture.some((furniture) => furniture.id === furnitureId),
    );
    if (owner) setSelectedRoomId(owner.id);
  }

  /**
   * 選択解除の唯一の経路。選択とリネーム対象は必ずセットで破棄する
   * （✕・家具タップ・空白タップ・削除確定のどこから来ても挙動を揃えるため）
   */
  function clearRoomSelection() {
    setSelectedRoomId(null);
    setRenamingRoomId(null);
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
          text: "削除する",
          style: "destructive",
          onPress: () => {
            deleteRoom.mutate(roomId, {
              onError: () => {
                Alert.alert(
                  "削除に失敗しました",
                  "通信状態を確認してもう一度お試しください。",
                );
              },
            });
            clearRoomSelection();
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
    gridW: number;
    gridH: number;
  }) {
    // 既存部屋と重ならない位置を探索する。満杯なら (0,0) に置き、重なり警告に委ねる
    const obstacles = rooms.map((room) => ({
      x: room.gridX,
      y: room.gridY,
      w: room.gridW,
      h: room.gridH,
    }));
    const freePosition = findFreePosition(
      { w: input.gridW, h: input.gridH },
      obstacles,
      {
        x: 0,
        y: 0,
        w: GRID_COLS,
        h: GRID_ROWS,
      },
    );

    addRoom.mutate({
      name: input.name,
      type: input.type,
      gridX: freePosition?.x ?? 0,
      gridY: freePosition?.y ?? 0,
      gridW: input.gridW,
      gridH: input.gridH,
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
              style={[theme.typography.label, { color: theme.colors.onPrimary }]}
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
          // 一覧では家具そのものを選択させない（操作対象は部屋だけ）
          selectedFurnitureId={null}
          // 家具に覆われた部屋も選べるよう、家具タップはその部屋のタップとして扱う
          onFurniturePress={handleFurniturePress}
          // 空白領域のタップでも解除できるようにする（✕ を押さずに済む）
          onBackgroundPress={clearRoomSelection}
          onRoomDragEnd={(roomId, rect) => {
            updateRoom.mutate({
              roomId,
              input: {
                gridX: rect.x,
                gridY: rect.y,
                gridW: rect.w,
                gridH: rect.h,
              },
            });
          }}
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
            onEditInterior={() => router.push(`/floor-plan/${selectedRoom.id}`)}
            renameLabel="名称修正"
            onRename={() => setRenamingRoomId(selectedRoom.id)}
            onDelete={handleDeletePress}
            onDismiss={clearRoomSelection}
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

      <RenameScreen
        visible={renamingRoomId != null && renamingRoomId === selectedRoom?.id}
        title="部屋の名称を修正"
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
