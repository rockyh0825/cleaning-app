import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SectionList,
} from "react-native";
import type { CleaningRecord } from "../types";
import { groupRecordsByDate } from "../usecases/groupRecordsByDate";
import { formatTime } from "@/shared/utils/formatDateTime";
import { useAppTheme } from "@/shared/theme/useAppTheme";

type CleaningTimelineProps = {
  records: CleaningRecord[];
  // partId → パーツ名。渡し忘れ（全行フォールバック表示）を型エラーで
  // 防ぐため必須。エントリが未解決（削除済みパーツ等）の行は UUID ではなく
  // フォールバック表示にする（issue #152）
  partNamesById: Record<string, string>;
  onDelete?: (recordId: string) => void;
  // 更新の成否を待てるよう Promise を返せるようにする。
  // 成功時のみ編集UIを閉じ、失敗時はドラフトを保持して再試行できるようにする。
  onUpdateNote?: (recordId: string, note: string) => void | Promise<unknown>;
  /** 日付グルーピング（今日/昨日）の基準時刻。テスト用に注入可能（省略時は現在時刻） */
  now?: Date;
};

export function CleaningTimeline({
  records,
  partNamesById,
  onDelete,
  onUpdateNote,
  now,
}: CleaningTimelineProps) {
  const theme = useAppTheme();
  // 編集中の記録IDと入力中メモ。一度に編集できるのは1件のみ
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState("");

  if (records.length === 0) {
    return (
      <View testID="empty-state" style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
          履歴がありません
        </Text>
      </View>
    );
  }

  // 日付（今日/昨日/それ以前）ごとのセクションに分け、新しい順に表示する
  const sections = groupRecordsByDate(records, now ?? new Date());

  // 編集中の記録が refetch 等で records から消えた場合、stale な
  // editingRecordId は無効として扱う（修正ボタンが復帰しなくなるのを防ぐ）
  const isEditingActive =
    editingRecordId !== null && records.some((r) => r.id === editingRecordId);

  const startEditing = (record: CleaningRecord) => {
    setEditingRecordId(record.id);
    setDraftNote(record.note ?? "");
  };

  const saveNote = async (recordId: string) => {
    try {
      // 更新の成功を待ってから編集UIを閉じる。
      await onUpdateNote?.(recordId, draftNote);
      setEditingRecordId(null);
    } catch {
      // 失敗時は編集UIとドラフトを保持し、ユーザーが再試行できるようにする。
      // 失敗のフィードバック（バナー表示）は呼び出し側（history 画面）が担う。
    }
  };

  const renderItem = ({ item }: { item: CleaningRecord }) => {
    const isEditing = editingRecordId === item.id;
    return (
      <View
        testID="timeline-item"
        style={[
          styles.item,
          {
            borderBottomColor: theme.colors.outline,
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        <View style={styles.itemContent}>
          {/* 日付はセクション見出しが持つため、行内は時刻のみ表示する */}
          <Text
            testID="timeline-item-date"
            style={[styles.date, { color: theme.colors.text }]}
          >
            {formatTime(item.cleanedAt)}
          </Text>
          <Text
            style={[styles.partName, { color: theme.colors.textMuted }]}
            numberOfLines={1}
          >
            パーツ: {partNamesById[item.partId] ?? "不明なパーツ"}
          </Text>
          {isEditing ? (
            <View style={styles.editRow}>
              <TextInput
                testID={`note-input-${item.id}`}
                style={[
                  styles.noteInput,
                  {
                    borderColor: theme.colors.outline,
                    color: theme.colors.text,
                  },
                ]}
                value={draftNote}
                onChangeText={setDraftNote}
                placeholder="メモ"
                placeholderTextColor={theme.colors.textMuted}
                autoFocus
              />
              <TouchableOpacity
                testID={`save-note-button-${item.id}`}
                style={[
                  styles.saveButton,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => {
                  void saveNote(item.id);
                }}
                accessibilityRole="button"
                accessibilityLabel="保存"
              >
                <Text
                  style={[
                    styles.saveButtonText,
                    { color: theme.colors.onPrimary },
                  ]}
                >
                  保存
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                testID={`cancel-note-button-${item.id}`}
                style={styles.cancelButton}
                onPress={() => setEditingRecordId(null)}
                accessibilityRole="button"
                accessibilityLabel="キャンセル"
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    { color: theme.colors.textMuted },
                  ]}
                >
                  キャンセル
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            item.note != null &&
            item.note.length > 0 && (
              <Text style={[styles.note, { color: theme.colors.text }]}>
                {item.note}
              </Text>
            )
          )}
        </View>
        {/* 編集中は他の行の「修正」を出さない（ドラフトの無警告破棄を防ぐ） */}
        {onUpdateNote != null && !isEditingActive && (
          <TouchableOpacity
            testID={`edit-button-${item.id}`}
            style={[
              styles.editButton,
              { backgroundColor: theme.colors.primarySoft },
            ]}
            onPress={() => startEditing(item)}
            accessibilityRole="button"
            accessibilityLabel="修正"
          >
            {/* primarySoft 上の通常テキストは primary だと 4.19:1 のため text を使う */}
            <Text style={[styles.editButtonText, { color: theme.colors.text }]}>
              修正
            </Text>
          </TouchableOpacity>
        )}
        {onDelete != null && !isEditing && (
          <TouchableOpacity
            testID={`delete-button-${item.id}`}
            style={[
              styles.deleteButton,
              { backgroundColor: theme.colors.dangerSoft },
            ]}
            onPress={() => onDelete(item.id)}
            accessibilityRole="button"
            accessibilityLabel="削除"
          >
            <Text
              style={[styles.deleteButtonText, { color: theme.colors.danger }]}
            >
              削除
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      renderSectionHeader={({ section }) => (
        <Text
          testID={`timeline-section-${section.key}`}
          style={[
            theme.typography.label,
            styles.sectionHeader,
            {
              color: theme.colors.textMuted,
              backgroundColor: theme.colors.background,
            },
          ]}
        >
          {section.title}
        </Text>
      )}
      // 見出しが行に重なって操作を妨げないよう固定表示はしない
      stickySectionHeadersEnabled={false}
      // キーボード表示中でも「保存」等のタップが1回目で届くようにする
      keyboardShouldPersistTaps="handled"
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  itemContent: {
    flex: 1,
  },
  date: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  partName: {
    fontSize: 12,
  },
  note: {
    fontSize: 13,
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
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 13,
  },
  saveButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  saveButtonText: {
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
    fontSize: 13,
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  deleteButtonText: {
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
  },
});
