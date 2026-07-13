import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import type { Part } from "../types";
import {
  computeCycleElapsedRate,
  resolveElapsedRateBadge,
} from "../usecases/computeCycleElapsedRate";
import { formatDateTime } from "@/shared/utils/formatDateTime";
import { useAppTheme } from "@/shared/theme/useAppTheme";
import { StatusPill } from "@/shared/components/StatusPill";

/**
 * チェックマークのポップイン用スプリング設定。
 * 軽く弾む程度（やや低め damping）で「チェックした」実感を出す。
 * OS の「視差効果を減らす」設定では即時表示に切り替わる。
 */
export const CHECK_SPRING_CONFIG = {
  damping: 14,
  stiffness: 300,
  mass: 0.8,
  reduceMotion: ReduceMotion.System,
} as const;

type PartChecklistItemProps = {
  part: Part;
  isSelected: boolean;
  /** 経過率バッジの基準時刻（エポックms） */
  nowMs: number;
  onToggle: (partId: string) => void;
  /** 指定すると編集ボタンを表示する */
  onEdit?: (part: Part) => void;
};

/**
 * パーツ一覧の1行。チェックボックス・経過率バッジ・最終掃除日時を表示し、
 * チェック時はチェックマークがスプリングでポップインする。
 * FlatList の renderItem からフックを使うため独立コンポーネントにしている。
 */
export function PartChecklistItem({
  part,
  isSelected,
  nowMs,
  onToggle,
  onEdit,
}: PartChecklistItemProps) {
  const theme = useAppTheme();
  // 周期に対する経過率（例: 71%）。周期未設定は null でバッジ非表示
  const badge = resolveElapsedRateBadge(
    computeCycleElapsedRate(part.lastCleanedAt, part.recommendedCycleDays, nowMs),
  );

  // チェックマークのポップイン。マウント時点で選択済みならアニメーションしない
  const checkScale = useSharedValue(isSelected ? 1 : 0);
  useEffect(() => {
    // 選択解除時はチェックマーク自体が非表示になるため、即時リセットのみ行う
    checkScale.value = isSelected ? withSpring(1, CHECK_SPRING_CONFIG) : 0;
  }, [isSelected, checkScale]);
  // 依存配列は Babel プラグイン無しの環境（ts-jest でのテスト実行）でも動くよう明示する
  const checkAnimatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ scale: checkScale.value }],
    }),
    [checkScale],
  );

  return (
    <TouchableOpacity
      testID={`part-item-${part.id}`}
      style={[
        styles.item,
        {
          borderBottomColor: theme.colors.outline,
          backgroundColor: isSelected
            ? theme.colors.primarySoft
            : theme.colors.surface,
        },
      ]}
      onPress={() => onToggle(part.id)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected }}
    >
      <View
        style={[
          styles.checkbox,
          isSelected
            ? {
                borderColor: theme.colors.primary,
                backgroundColor: theme.colors.primary,
              }
            : { borderColor: theme.colors.outline },
        ]}
      >
        {isSelected && (
          <Animated.View
            testID={`part-check-${part.id}`}
            style={checkAnimatedStyle}
          >
            <Text style={[styles.checkmark, { color: theme.colors.onPrimary }]}>
              ✓
            </Text>
          </Animated.View>
        )}
      </View>
      <View style={styles.partInfo}>
        <View style={styles.nameRow}>
          <Text
            style={[styles.partName, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {part.name}
          </Text>
          {badge != null && (
            <StatusPill
              status={badge.status}
              label={badge.label}
              testID={`part-elapsed-badge-${part.id}`}
            />
          )}
        </View>
        <Text
          style={[styles.lastCleanedAt, { color: theme.colors.textMuted }]}
        >
          最終掃除:{" "}
          {part.lastCleanedAt != null
            ? formatDateTime(part.lastCleanedAt)
            : "未記録"}
        </Text>
      </View>
      {onEdit != null && (
        <TouchableOpacity
          testID={`part-edit-${part.id}`}
          accessibilityRole="button"
          accessibilityLabel={`${part.name}を編集`}
          style={[styles.editButton, { borderColor: theme.colors.outline }]}
          onPress={() => onEdit(part)}
        >
          <Text
            style={[
              styles.editButtonLabel,
              { color: theme.colors.textMuted },
            ]}
          >
            編集
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    fontSize: 14,
    fontWeight: "700",
  },
  partInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 4,
    marginLeft: 8,
  },
  editButtonLabel: {
    fontSize: 12,
  },
  partName: {
    fontSize: 16,
    // 長いパーツ名でも経過率バッジを押し出さないよう名前側を縮める
    flexShrink: 1,
  },
  lastCleanedAt: {
    fontSize: 12,
    marginTop: 2,
  },
});
