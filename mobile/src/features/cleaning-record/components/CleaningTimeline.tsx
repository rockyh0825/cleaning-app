import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import type { CleaningRecord } from "../types";
import { formatDateTime } from "../utils/formatDateTime";

type CleaningTimelineProps = {
  records: CleaningRecord[];
  onDelete?: (recordId: string) => void;
  onUpdateNote?: (recordId: string, note: string) => void;
};

// cleanedAt の降順（新しい順）でソート
function sortByCleanedAtDesc(records: CleaningRecord[]): CleaningRecord[] {
  return [...records].sort(
    (a, b) => b.cleanedAt.getTime() - a.cleanedAt.getTime(),
  );
}

export function CleaningTimeline({
  records,
  onDelete,
  onUpdateNote,
}: CleaningTimelineProps) {
  // 編集中の記録IDと入力中メモ。一度に編集できるのは1件のみ
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState("");

  if (records.length === 0) {
    return (
      <View testID="empty-state" style={styles.emptyContainer}>
        <Text style={styles.emptyText}>履歴がありません</Text>
      </View>
    );
  }

  const sorted = sortByCleanedAtDesc(records);

  const startEditing = (record: CleaningRecord) => {
    setEditingRecordId(record.id);
    setDraftNote(record.note ?? "");
  };

  const saveNote = (recordId: string) => {
    onUpdateNote?.(recordId, draftNote);
    setEditingRecordId(null);
  };

  const renderItem = ({ item }: { item: CleaningRecord }) => {
    const isEditing = editingRecordId === item.id;
    return (
      <View testID="timeline-item" style={styles.item}>
        <View style={styles.itemContent}>
          <Text testID="timeline-item-date" style={styles.date}>
            {formatDateTime(item.cleanedAt)}
          </Text>
          <Text style={styles.partId} numberOfLines={1}>
            パーツ: {item.partId}
          </Text>
          {isEditing ? (
            <View style={styles.editRow}>
              <TextInput
                testID={`note-input-${item.id}`}
                style={styles.noteInput}
                value={draftNote}
                onChangeText={setDraftNote}
                placeholder="メモ"
                autoFocus
              />
              <TouchableOpacity
                testID={`save-note-button-${item.id}`}
                style={styles.saveButton}
                onPress={() => saveNote(item.id)}
                accessibilityRole="button"
                accessibilityLabel="保存"
              >
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID={`cancel-note-button-${item.id}`}
                style={styles.cancelButton}
                onPress={() => setEditingRecordId(null)}
                accessibilityRole="button"
                accessibilityLabel="キャンセル"
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
            </View>
          ) : (
            item.note != null &&
            item.note.length > 0 && <Text style={styles.note}>{item.note}</Text>
          )}
        </View>
        {onUpdateNote != null && !isEditing && (
          <TouchableOpacity
            testID={`edit-button-${item.id}`}
            style={styles.editButton}
            onPress={() => startEditing(item)}
            accessibilityRole="button"
            accessibilityLabel="修正"
          >
            <Text style={styles.editButtonText}>修正</Text>
          </TouchableOpacity>
        )}
        {onDelete != null && !isEditing && (
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
  };

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
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  noteInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#BDBDBD",
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 13,
    color: "#212121",
  },
  saveButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#E8F5E9",
    borderRadius: 4,
    marginLeft: 8,
  },
  saveButtonText: {
    color: "#2E7D32",
    fontSize: 13,
    fontWeight: "500",
  },
  cancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 4,
  },
  cancelButtonText: {
    color: "#757575",
    fontSize: 13,
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#E3F2FD",
    borderRadius: 4,
    marginLeft: 8,
  },
  editButtonText: {
    color: "#1565C0",
    fontSize: 13,
    fontWeight: "500",
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
