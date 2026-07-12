import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useFloorPlan } from '@/features/floor-plan/hooks/useFloorPlan';
import { FloorPlanCanvas } from '@/features/floor-plan/components/FloorPlanCanvas';
import { AddFurnitureModal } from '@/features/floor-plan/components/AddFurnitureModal';
import { RenameSheet } from '@/features/floor-plan/components/RenameSheet';
import { SelectionActions } from '@/features/floor-plan/components/SelectionActions';
import { FloorPlanRepository } from '@/features/floor-plan/repositories/FloorPlanRepository';
import { useUserId } from '@/shared/hooks/useUserId';
import { api } from '@/shared/app-root/providers/di';
import { FloatingActionButton } from '@/shared/components/FloatingActionButton';
import { useAppTheme } from '@/shared/theme/useAppTheme';
import { findFreePosition } from '@/shared/utils/grid';
import type { FloorPlan } from '@/features/floor-plan/types';

const repository = new FloorPlanRepository(api);

const EMPTY_FLOORPLAN: FloorPlan = { rooms: [] };

export default function RoomDetailScreen() {
    const theme = useAppTheme();
    const { roomId } = useLocalSearchParams<{ roomId: string }>();
    const userId = useUserId();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);
    // boolean だと対象消失後の別家具選択でシートが誤って開くため、対象の家具 id で追跡する
    const [renamingFurnitureId, setRenamingFurnitureId] = useState<string | null>(null);

    const { floorPlan, addFurniture, updateFurniture, deleteFurniture } = useFloorPlan(
        userId ?? '',
        repository,
    );

    const floorPlanData = floorPlan.data ?? EMPTY_FLOORPLAN;
    const room = floorPlanData.rooms.find((r) => r.id === roomId);
    // 楽観的削除などでキャッシュから消えた家具は選択扱いにしない
    const selectedFurniture =
        room?.furniture.find((f) => f.id === selectedFurnitureId) ?? null;

    function handleDeletePress() {
        if (!selectedFurniture) return;
        const furnitureId = selectedFurniture.id;
        Alert.alert(
            `「${selectedFurniture.name}」を削除しますか？`,
            'この家具に紐づく掃除記録もまとめて削除されます。この操作は取り消せません。',
            [
                { text: 'キャンセル', style: 'cancel' },
                {
                    text: '削除する',
                    style: 'destructive',
                    onPress: () => {
                        deleteFurniture.mutate(furnitureId);
                        setSelectedFurnitureId(null);
                        // 選択解除の各経路（✕・部屋タップ）と揃えてリネーム対象も破棄する
                        setRenamingFurnitureId(null);
                    },
                },
            ],
        );
    }

    function handleRenameSubmit(name: string) {
        if (!selectedFurniture) return;
        updateFurniture.mutate({ furnitureId: selectedFurniture.id, input: { name } });
        setRenamingFurnitureId(null);
    }

    // 表示できる room があれば通常描画を優先し、背景 refetch 失敗（isError）でも
    // 閲覧中の部屋を消さない。room が無いときだけ状態を出し分ける。
    // 取得完了前に room を判定すると実在の部屋でも not-found に落ちるため、
    // ローディング → エラー → not-found の順に出し分ける。
    if (!room) {
        if (floorPlan.isLoading) {
            return (
                <View
                    testID="room-loading"
                    style={[styles.centered, { backgroundColor: theme.colors.background }]}
                >
                    <ActivityIndicator color={theme.colors.primary} />
                </View>
            );
        }

        if (floorPlan.isError) {
            return (
                <View
                    testID="room-error"
                    style={[styles.centered, { backgroundColor: theme.colors.background }]}
                >
                    <Text style={[theme.typography.body, { color: theme.colors.danger }]}>
                        読み込みに失敗しました
                    </Text>
                </View>
            );
        }

        return (
            <View
                testID="room-not-found"
                style={[styles.centered, { backgroundColor: theme.colors.background }]}
            >
                <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
                    部屋が見つかりません
                </Text>
            </View>
        );
    }

    function handleAddFurniture(input: {
        name: string;
        presetKey?: string;
        gridW: number;
        gridH: number;
    }) {
        if (!room) return;
        // モーダルで選んだサイズを部屋サイズにクランプ（最低 1 セル）
        const w = Math.max(1, Math.min(input.gridW, room.gridW));
        const h = Math.max(1, Math.min(input.gridH, room.gridH));
        // 既存家具は部屋相対 rect。0 起点の相対境界から重ならない空き位置を探す
        const obstacles = room.furniture.map((f) => ({
            x: f.gridX,
            y: f.gridY,
            w: f.gridW,
            h: f.gridH,
        }));
        const pos =
            findFreePosition({ w, h }, obstacles, {
                x: 0,
                y: 0,
                w: room.gridW,
                h: room.gridH,
            }) ?? { x: 0, y: 0 };
        addFurniture.mutate({
            roomId: room.id,
            input: {
                name: input.name,
                presetKey: input.presetKey,
                // 家具座標は部屋相対（0基点）
                gridX: pos.x,
                gridY: pos.y,
                gridW: w,
                gridH: h,
            },
        });
        setIsModalVisible(false);
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <FloorPlanCanvas
                floorPlan={{ rooms: [room] }}
                // 詳細画面には部屋選択の解除導線が無いため常に非選択で制御する
                selectedRoomId={null}
                // 選択状態を単一の source にする（バーと選択ボーダーを同時に制御）
                selectedFurnitureId={selectedFurnitureId}
                onFurniturePress={setSelectedFurnitureId}
                // 部屋タップは家具の選択解除に使う（index.tsx の家具タップと対称）
                onRoomPress={() => {
                    setSelectedFurnitureId(null);
                    setRenamingFurnitureId(null);
                }}
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

            {selectedFurniture && (
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
                        targetName={selectedFurniture.name}
                        onRename={() => setRenamingFurnitureId(selectedFurniture.id)}
                        onDelete={handleDeletePress}
                        onOpenCleaningParts={() =>
                            router.push(`/area/${selectedFurniture.id}?ownerType=FURNITURE`)
                        }
                        onDismiss={() => {
                            setSelectedFurnitureId(null);
                            setRenamingFurnitureId(null);
                        }}
                    />
                </View>
            )}

            <TouchableOpacity
                testID="log-cleaning-button"
                style={[styles.logCleaningButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => router.push(`/area/${room.id}?ownerType=ROOM`)}
                accessibilityRole="button"
                accessibilityLabel="掃除を記録"
            >
                <Text style={[styles.logCleaningLabel, { color: theme.colors.surface }]}>
                    掃除を記録
                </Text>
            </TouchableOpacity>

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

            <RenameSheet
                visible={
                    renamingFurnitureId != null &&
                    renamingFurnitureId === selectedFurniture?.id
                }
                initialName={selectedFurniture?.name ?? ''}
                onSubmit={handleRenameSubmit}
                onClose={() => setRenamingFurnitureId(null)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    logCleaningButton: {
        position: 'absolute',
        left: 16,
        bottom: 24,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logCleaningLabel: {
        fontSize: 15,
        fontWeight: '600',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // FAB（右下）や「掃除を記録」ボタンと重ならないよう画面上部に置く
    selectionActionsContainer: {
        position: 'absolute',
    },
});
