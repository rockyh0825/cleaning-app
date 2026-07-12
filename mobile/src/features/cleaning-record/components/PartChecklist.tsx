import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import type { Part } from "../types";
import { formatDateTime } from "@/shared/utils/formatDateTime";
import { useAppTheme } from "@/shared/theme/useAppTheme";
import { RecordButton } from "./RecordButton";

type PartChecklistProps = {
  parts: Part[];
  onLogCleaning: (partIds: string[]) => void;
  /** 指定するとパーツごとに編集ボタンを表示する */
  onEditPart?: (part: Part) => void;
  isLoading?: boolean;
};

export function PartChecklist({
  parts,
  onLogCleaning,
  onEditPart,
  isLoading = false,
}: PartChecklistProps) {
  const theme = useAppTheme();
  const [selectedPartIds, setSelectedPartIds] = useState<Set<string>>(
    new Set(),
  );

  const togglePart = (partId: string) => {
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

  const renderItem = ({ item }: { item: Part }) => {
    const isSelected = selectedPartIds.has(item.id);
    return (
      <TouchableOpacity
        testID={`part-item-${item.id}`}
        style={[
          styles.item,
          {
            borderBottomColor: theme.colors.outline,
            backgroundColor: isSelected
              ? theme.colors.primarySoft
              : theme.colors.surface,
          },
        ]}
        onPress={() => togglePart(item.id)}
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
            <Text style={[styles.checkmark, { color: theme.colors.onPrimary }]}>
              ✓
            </Text>
          )}
        </View>
        <View style={styles.partInfo}>
          <Text style={[styles.partName, { color: theme.colors.text }]}>
            {item.name}
          </Text>
          <Text
            style={[styles.lastCleanedAt, { color: theme.colors.textMuted }]}
          >
            最終掃除:{" "}
            {item.lastCleanedAt != null
              ? formatDateTime(item.lastCleanedAt)
              : "未記録"}
          </Text>
        </View>
        {onEditPart != null && (
          <TouchableOpacity
            testID={`part-edit-${item.id}`}
            accessibilityRole="button"
            accessibilityLabel={`${item.name}を編集`}
            style={[styles.editButton, { borderColor: theme.colors.outline }]}
            onPress={() => onEditPart(item)}
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
  };

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
  },
  lastCleanedAt: {
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
});
