import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import type { CleaningRecord } from "../types";

type CleaningTimelineProps = {
  records: CleaningRecord[];
  onDelete?: (recordId: string) => void;
};

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

// cleanedAt の降順（新しい順）でソート
function sortByCleanedAtDesc(records: CleaningRecord[]): CleaningRecord[] {
  return [...records].sort(
    (a, b) => b.cleanedAt.getTime() - a.cleanedAt.getTime(),
  );
}

export function CleaningTimeline({ records, onDelete }: CleaningTimelineProps) {
  if (records.length === 0) {
    return (
      <View testID="empty-state" style={styles.emptyContainer}>
        <Text style={styles.emptyText}>履歴がありません</Text>
      </View>
    );
  }

  const sorted = sortByCleanedAtDesc(records);

  const renderItem = ({ item }: { item: CleaningRecord }) => (
    <View testID="timeline-item" style={styles.item}>
      <View style={styles.itemContent}>
        <Text testID="timeline-item-date" style={styles.date}>
          {formatDate(item.cleanedAt)}
        </Text>
        <Text style={styles.partId} numberOfLines={1}>
          パーツ: {item.partId}
        </Text>
        {item.note != null && item.note.length > 0 && (
          <Text style={styles.note}>{item.note}</Text>
        )}
      </View>
      {onDelete != null && (
        <TouchableOpacity
          testID={`delete-button-${item.id}`}
          style={styles.deleteButton}
          onPress={() => onDelete(item.id)}
          accessibilityRole="button"
          accessibilityLabel="削除"
        >
          <Text style={styles.deleteButtonText}>削除</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <FlatList
      data={sorted}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
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
  itemContent: {
    flex: 1,
  },
  date: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 2,
  },
  partId: {
    fontSize: 12,
    color: "#757575",
  },
  note: {
    fontSize: 13,
    color: "#424242",
    marginTop: 4,
  },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#FFEBEE",
    borderRadius: 4,
    marginLeft: 8,
  },
  deleteButtonText: {
    color: "#D32F2F",
    fontSize: 13,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: "#9E9E9E",
  },
});
