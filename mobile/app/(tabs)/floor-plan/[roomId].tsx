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
import type { Rect } from '@/shared/utils/grid';
import { fitsWithin, rotateClockwise } from '@/features/floor-plan/utils/rotation';
import type { FloorPlan, Furniture, RoomWithFurniture } from '@/features/floor-plan/types';

/** 回転で生じる家具のパッチ（向き＋占有矩形）。保留中はこれをローカルに持つ */
type FurniturePatch = Pick<Furniture, 'rotation' | 'gridX' | 'gridY' | 'gridW' | 'gridH'>;

const repository = new FloorPlanRepository(api);

const EMPTY_FLOORPLAN: FloorPlan = { rooms: [] };

/**
 * 保留中の回転を部屋のスナップショットへ重ねる。保存前の向きを画面に映すための描画専用の合成で、
 * サーバーへ送る値には使わない。対象の家具が消えている場合（削除・別部屋）は何もしない。
 */
function applyPendingRotation(
    room: RoomWithFurniture | undefined,
    pending: { furnitureId: string; patch: FurniturePatch } | null,
): RoomWithFurniture | undefined {
    if (!room || !pending) return room;
    if (!room.furniture.some((f) => f.id === pending.furnitureId)) return room;
    return {
        ...room,
        furniture: room.furniture.map((f) =>
            f.id === pending.furnitureId ? { ...f, ...pending.patch } : f,
        ),
    };
}

export default function RoomDetailScreen() {
    const theme = useAppTheme();
    const { roomId } = useLocalSearchParams<{ roomId: string }>();
    const userId = useUserId();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null);
    // boolean だと対象消失後の別家具選択でシートが誤って開くため、対象の家具 id で追跡する
    const [renamingFurnitureId, setRenamingFurnitureId] = useState<string | null>(null);
    /**
     * 部屋からはみ出したまま確定できない回転。サーバーへは送らずローカルに保留する。
     * 回転を拒否すると「収まらない向きの家具は二度と回せない」という詰みが生まれるため、
     * 回転そのものは必ず成立させ、保存だけを収まるまで待つ
     */
    const [pendingRotation, setPendingRotation] = useState<{
        furnitureId: string;
        patch: FurniturePatch;
    } | null>(null);

    const { floorPlan, addFurniture, updateFurniture, deleteFurniture } = useFloorPlan(
        userId ?? '',
        repository,
    );

    const floorPlanData = floorPlan.data ?? EMPTY_FLOORPLAN;
    const savedRoom = floorPlanData.rooms.find((r) => r.id === roomId);
    // 保留中の向きはサーバー値より優先して描く（ユーザーの操作が画面に映らないと壊れて見える）
    const room = applyPendingRotation(savedRoom, pendingRotation);
    // 楽観的削除などでキャッシュから消えた家具は選択扱いにしない
    const selectedFurniture =
        room?.furniture.find((f) => f.id === selectedFurnitureId) ?? null;
    const hasPendingRotation =
        pendingRotation != null &&
        room?.furniture.some((f) => f.id === pendingRotation.furnitureId) === true;

    /**
     * 選択解除の唯一の経路。選択とリネーム対象は必ずセットで破棄する
     * （✕・部屋タップ・空白タップ・削除確定のどこから来ても挙動を揃えるため）。
     * 保留も一緒に捨てる（下の handleFurnitureSelect と同じ不変条件）
     */
    function clearFurnitureSelection() {
        setSelectedFurnitureId(null);
        setRenamingFurnitureId(null);
        setPendingRotation(null);
    }

    /**
     * 保留スロットは1つしか無いので「保留中の家具＝選択中の家具」を不変条件にする。
     * 別の家具へ移る時点で未保存の回転を捨てておかないと、次にその家具を回した瞬間に
     * 無関係な家具の保留が黙って消える（ユーザーには理由の分からない巻き戻しに見える）
     */
    function handleFurnitureSelect(furnitureId: string) {
        if (pendingRotation && pendingRotation.furnitureId !== furnitureId) {
            setPendingRotation(null);
        }
        setSelectedFurnitureId(furnitureId);
    }

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
                        // 保留も clearFurnitureSelection で落ちる（消えた家具の保留を残すと
                        // 以後の判定が幽霊の id を参照し続ける）
                        clearFurnitureSelection();
                    },
                },
            ],
        );
    }

    function handleRotatePress() {
        if (!selectedFurniture || !room) return;
        // selectedFurniture には保留中のパッチが既に適用済みなので、保留からの続きも自然に繋がる
        const rotated = rotateClockwise(selectedFurniture);

        if (!fitsWithin(rotated, room)) {
            // 拒否せず保留する。回転自体は成立させないと、収まらない向きの家具が
            // 二度と回せなくなり直しようがなくなる
            setPendingRotation({ furnitureId: selectedFurniture.id, patch: rotated });
            return;
        }

        setPendingRotation(null);
        updateFurniture.mutate({
            furnitureId: selectedFurniture.id,
            input: rotated,
        });
    }

    /**
     * 移動・リサイズの確定。保留中の家具なら、この移動で部屋に収まったかを見直し、
     * 収まったなら待たせていた向きごとまとめて保存する（保留を解く導線は回転だけではない）
     */
    function handleFurnitureDragEnd(furnitureId: string, rect: Rect) {
        const moved = { gridX: rect.x, gridY: rect.y, gridW: rect.w, gridH: rect.h };

        if (!room || !hasPendingRotation || pendingRotation.furnitureId !== furnitureId) {
            updateFurniture.mutate({ furnitureId, input: moved });
            return;
        }

        const patch = { ...pendingRotation.patch, ...moved };

        if (!fitsWithin(patch, room)) {
            setPendingRotation({ furnitureId, patch });
            return;
        }

        setPendingRotation(null);
        updateFurniture.mutate({ furnitureId, input: patch });
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
        if (!savedRoom) return;
        // モーダルで選んだサイズを部屋サイズにクランプ（最低 1 セル）
        const w = Math.max(1, Math.min(input.gridW, savedRoom.gridW));
        const h = Math.max(1, Math.min(input.gridH, savedRoom.gridH));
        // 既存家具は部屋相対 rect。0 起点の相対境界から重ならない空き位置を探す。
        // 保留を適用した room ではなく savedRoom を見る: 保留は描画専用の見かけで、
        // まだ確定していない位置を障害物にすると、実際に置かれている家具の上へ新品を重ねてしまう
        const obstacles = savedRoom.furniture.map((f) => ({
            x: f.gridX,
            y: f.gridY,
            w: f.gridW,
            h: f.gridH,
        }));
        const pos =
            findFreePosition({ w, h }, obstacles, {
                x: 0,
                y: 0,
                w: savedRoom.gridW,
                h: savedRoom.gridH,
            }) ?? { x: 0, y: 0 };
        addFurniture.mutate({
            roomId: savedRoom.id,
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
                pendingFurnitureId={hasPendingRotation ? pendingRotation.furnitureId : null}
                onFurniturePress={handleFurnitureSelect}
                // 部屋タップは家具の選択解除に使う（index.tsx の家具タップと対称）
                onRoomPress={clearFurnitureSelection}
                // 空白領域のタップでも解除できるようにする（✕ を押さずに済む）
                onBackgroundPress={clearFurnitureSelection}
                onFurnitureDragEnd={handleFurnitureDragEnd}
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
                        onRotate={handleRotatePress}
                        onDismiss={clearFurnitureSelection}
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
                <Text style={[styles.logCleaningLabel, { color: theme.colors.onPrimary }]}>
                    掃除を記録
                </Text>
            </TouchableOpacity>

            <FloatingActionButton
                accessibilityLabel="家具を追加"
                onPress={() => setIsModalVisible(true)}
            />

            {/* 「掃除を記録」・FAB より後に描いて、重なっても保留の説明が隠れないようにする
                （保留は見落とされると未保存のまま画面を離れてしまう） */}
            {hasPendingRotation && (
                <View
                    testID="pending-rotation-notice"
                    style={[
                        styles.pendingNotice,
                        {
                            backgroundColor: theme.colors.dangerSoft,
                            borderColor: theme.colors.danger,
                            borderRadius: theme.radius.sm,
                            padding: theme.spacing.sm,
                            left: theme.spacing.md,
                            right: theme.spacing.md,
                        },
                    ]}
                    accessibilityRole="alert"
                >
                    <View style={styles.pendingNoticeText}>
                        <Text style={[theme.typography.label, { color: theme.colors.danger }]}>
                            部屋からはみ出しているため保存していません
                        </Text>
                        <Text
                            style={[theme.typography.caption, { color: theme.colors.danger }]}
                        >
                            部屋に収まる向き・位置にすると保存されます
                        </Text>
                    </View>
                    {/* 収まる置き方が無い家具（部屋より長い等）は回しても動かしても収まらない。
                        諦めて元へ戻す導線が無いと、保留の帯が消せないまま残る */}
                    <TouchableOpacity
                        testID="pending-rotation-revert"
                        onPress={() => setPendingRotation(null)}
                        accessibilityRole="button"
                        accessibilityLabel="回転を元に戻す"
                        style={[
                            styles.pendingRevert,
                            {
                                borderColor: theme.colors.danger,
                                borderRadius: theme.radius.sm,
                            },
                        ]}
                    >
                        <Text style={[theme.typography.label, { color: theme.colors.danger }]}>
                            元に戻す
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

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
    // 「掃除を記録」(bottom 24 + 高さ約44) と FAB (bottom 24 + 56) の両方を避けた高さに置く。
    // 保留は見落とされると未保存のまま画面を離れてしまうため、何にも隠されてはいけない
    pendingNotice: {
        position: 'absolute',
        bottom: 88,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    pendingNoticeText: {
        flex: 1,
        gap: 2,
    },
    pendingRevert: {
        borderWidth: 1,
        paddingVertical: 6,
        paddingHorizontal: 10,
    },
});
