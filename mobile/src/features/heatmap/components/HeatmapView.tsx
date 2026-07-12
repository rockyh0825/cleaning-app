import React from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { router } from "expo-router";
// FloorPlanCanvas は間取り描画基盤の共有（design.md）。データ参照は Capability 経由に限定する
import { FloorPlanCanvas } from "@/features/floor-plan/components/FloorPlanCanvas";
import { useAppTheme } from "@/shared/theme/useAppTheme";
import { useHeatmap, type UseHeatmapDeps } from "../hooks/useHeatmap";
import { HeatmapLegend } from "./HeatmapLegend";

type HeatmapViewProps = {
    userId: string;
} & UseHeatmapDeps;

/**
 * ヒートマップ画面の中身。
 * useHeatmap の結果を read-only の FloorPlanCanvas に流して塗り分け、凡例を併置する。
 * エリア（部屋・家具）タップで該当エリアの詳細（パーツ一覧・掃除記録）へ遷移する。
 */
export function HeatmapView({
    userId,
    floorPlanCapability,
    cleaningStatusCapability,
}: HeatmapViewProps) {
    const theme = useAppTheme();
    const { rooms, areaColors, isPending, isError, isStatusError } = useHeatmap(
        userId,
        { floorPlanCapability, cleaningStatusCapability },
    );

    // パーツ0件のエリアでも正しい所有者種別でパーツを追加できるよう ownerType を引き継ぐ
    function openAreaDetail(areaId: string, ownerType: "ROOM" | "FURNITURE") {
        router.push(`/area/${areaId}?ownerType=${ownerType}`);
    }

    if (isPending) {
        return (
            <View
                testID="heatmap-loading"
                style={[
                    styles.center,
                    { backgroundColor: theme.colors.background },
                ]}
            >
                <ActivityIndicator color={theme.colors.primary} />
            </View>
        );
    }

    if (isError) {
        return (
            <View
                testID="error-state"
                style={[
                    styles.center,
                    { backgroundColor: theme.colors.background },
                ]}
            >
                <Text
                    style={[
                        theme.typography.body,
                        { color: theme.colors.textMuted },
                    ]}
                >
                    ヒートマップの取得に失敗しました
                </Text>
            </View>
        );
    }

    if (rooms.length === 0) {
        return (
            <View
                testID="empty-state"
                style={[
                    styles.center,
                    { backgroundColor: theme.colors.background },
                ]}
            >
                <Text style={styles.emptyIllustration}>🔥</Text>
                <Text
                    style={[
                        theme.typography.title,
                        {
                            color: theme.colors.text,
                            marginBottom: theme.spacing.sm,
                        },
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
                    間取りを作ると、掃除の状態が色で見えるようになります
                </Text>
                <TouchableOpacity
                    testID="empty-state-cta"
                    accessibilityRole="button"
                    style={{
                        backgroundColor: theme.colors.primary,
                        borderRadius: theme.radius.md,
                        paddingVertical: theme.spacing.md,
                        paddingHorizontal: theme.spacing.xl,
                    }}
                    onPress={() => router.push("/floor-plan")}
                >
                    <Text
                        style={[
                            theme.typography.label,
                            { color: theme.colors.onPrimary },
                        ]}
                    >
                        間取りを作る
                    </Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: theme.colors.background },
            ]}
        >
            {isStatusError && (
                <View
                    testID="heatmap-status-error"
                    style={styles.errorBanner}
                >
                    <Text
                        style={[
                            theme.typography.body,
                            { color: theme.colors.danger },
                        ]}
                    >
                        掃除状態を取得できなかったため、色分けなしで表示しています
                    </Text>
                </View>
            )}
            <FloorPlanCanvas
                floorPlan={{ rooms }}
                readOnly
                areaColors={areaColors}
                onRoomPress={(roomId) => openAreaDetail(roomId, "ROOM")}
                onFurniturePress={(furnitureId) =>
                    openAreaDetail(furnitureId, "FURNITURE")
                }
            />
            <HeatmapLegend />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
    },
    emptyIllustration: {
        fontSize: 64,
        lineHeight: 76,
        marginBottom: 16,
    },
    errorBanner: {
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
});
