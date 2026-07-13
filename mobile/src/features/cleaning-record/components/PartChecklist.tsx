import React, { useState } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import type { Part } from "../types";
import { useAppTheme } from "@/shared/theme/useAppTheme";
import { hapticSelection } from "@/shared/haptics/haptics";
import { PartChecklistItem } from "./PartChecklistItem";
import { RecordButton } from "./RecordButton";

type PartChecklistProps = {
  parts: Part[];
  onLogCleaning: (partIds: string[]) => void;
  /** 指定するとパーツごとに編集ボタンを表示する */
  onEditPart?: (part: Part) => void;
  isLoading?: boolean;
  /** 経過率バッジの基準時刻。テスト用に注入可能（省略時は現在時刻） */
  now?: Date;
};

export function PartChecklist({
  parts,
  onLogCleaning,
  onEditPart,
  isLoading = false,
  now,
}: PartChecklistProps) {
  const theme = useAppTheme();
  // 経過率はレンダリング時点の時刻で算出する（画面再訪・refetch で自然に更新される）
  const nowMs = (now ?? new Date()).getTime();
  const [selectedPartIds, setSelectedPartIds] = useState<Set<string>>(
    new Set(),
  );

  const togglePart = (partId: string) => {
    // チェック ON/OFF どちらも選択変更としてフィードバックする
    hapticSelection();
    setSelectedPartIds((prev) => {
      const next = new Set(prev);
      if (next.has(partId)) {
        next.delete(partId);
      } else {
        next.add(partId);
      }
      return next;
    });
  };

  // 選択後に削除されたパーツの ID を除外する（stale な選択で記録しない）
  const validSelectedPartIds = parts
    .filter((part) => selectedPartIds.has(part.id))
    .map((part) => part.id);

  const handleRecord = () => {
    onLogCleaning(validSelectedPartIds);
  };

  const renderItem = ({ item }: { item: Part }) => (
    <PartChecklistItem
      part={item}
      isSelected={selectedPartIds.has(item.id)}
      nowMs={nowMs}
      onToggle={togglePart}
      onEdit={onEditPart}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={parts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={styles.list}
      />
      <View style={[styles.footer, { borderTopColor: theme.colors.outline }]}>
        <RecordButton
          selectedCount={validSelectedPartIds.length}
          onPress={handleRecord}
          isLoading={isLoading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
});
