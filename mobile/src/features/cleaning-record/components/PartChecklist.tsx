import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import type { Part } from "../types";
import { formatDateTime } from "../utils/formatDateTime";
import { RecordButton } from "./RecordButton";

type PartChecklistProps = {
  parts: Part[];
  onLogCleaning: (partIds: string[]) => void;
  isLoading?: boolean;
};

export function PartChecklist({
  parts,
  onLogCleaning,
  isLoading = false,
}: PartChecklistProps) {
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

  const handleRecord = () => {
    onLogCleaning(Array.from(selectedPartIds));
  };

  const renderItem = ({ item }: { item: Part }) => {
    const isSelected = selectedPartIds.has(item.id);
    return (
      <TouchableOpacity
        testID={`part-item-${item.id}`}
        style={[styles.item, isSelected && styles.itemSelected]}
        onPress={() => togglePart(item.id)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected }}
      >
        <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
          {isSelected && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <View style={styles.partInfo}>
          <Text style={styles.partName}>{item.name}</Text>
          <Text style={styles.lastCleanedAt}>
            最終掃除:{" "}
            {item.lastCleanedAt != null
              ? formatDateTime(item.lastCleanedAt)
              : "未記録"}
          </Text>
        </View>
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
      <View style={styles.footer}>
        <RecordButton
          selectedCount={selectedPartIds.size}
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
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#fff",
  },
  itemSelected: {
    backgroundColor: "#E8F5E9",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#BDBDBD",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    borderColor: "#4CAF50",
    backgroundColor: "#4CAF50",
  },
  checkmark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  partInfo: {
    flex: 1,
  },
  partName: {
    fontSize: 16,
    color: "#212121",
  },
  lastCleanedAt: {
    fontSize: 12,
    color: "#757575",
    marginTop: 2,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
});
