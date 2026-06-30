import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import type { Part } from "../types";
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
        <Text style={styles.partName}>{item.name}</Text>
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
  partName: {
    fontSize: 16,
    color: "#212121",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
});
