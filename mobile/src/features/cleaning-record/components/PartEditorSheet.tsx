import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { BottomSheet } from "@/shared/components/BottomSheet";
import { useAppTheme } from "@/shared/theme/useAppTheme";
import type { Part } from "../types";

export type PartEditorInput = {
  name: string;
  recommendedCycleDays: number;
};

type Props = {
  visible: boolean;
  /** 編集対象のパーツ。null のときは新規追加モード */
  part: Part | null;
  onSubmit: (input: PartEditorInput) => void;
  onDelete?: (partId: string) => void;
  onCancel: () => void;
};

const DEFAULT_CYCLE_DAYS = "7";

/**
 * パーツ（家事する場所）の追加・編集を行うボトムシート。
 * 名前と推奨掃除周期（日）を入力し、編集モードでは削除もできる。
 */
export function PartEditorSheet({
  visible,
  part,
  onSubmit,
  onDelete,
  onCancel,
}: Props) {
  const theme = useAppTheme();
  const [name, setName] = useState("");
  const [cycleDays, setCycleDays] = useState(DEFAULT_CYCLE_DAYS);

  // 開くたびに編集対象へ同期する（追加モードは初期値に戻す）
  useEffect(() => {
    if (visible) {
      setName(part?.name ?? "");
      setCycleDays(
        part != null ? String(part.recommendedCycleDays) : DEFAULT_CYCLE_DAYS,
      );
    }
  }, [visible, part]);

  const isEditing = part != null;

  function handleSubmit() {
    const trimmedName = name.trim();
    const parsedCycleDays = Number(cycleDays);
    if (
      trimmedName === "" ||
      !Number.isInteger(parsedCycleDays) ||
      parsedCycleDays < 1
    ) {
      return;
    }
    onSubmit({ name: trimmedName, recommendedCycleDays: parsedCycleDays });
  }

  return (
    <BottomSheet visible={visible} onClose={onCancel}>
      <Text
        style={[
          theme.typography.title,
          { color: theme.colors.text, marginBottom: theme.spacing.lg },
        ]}
      >
        {isEditing ? "パーツを編集" : "パーツを追加"}
      </Text>

      <TextInput
        testID="part-name-input"
        style={[
          theme.typography.body,
          {
            color: theme.colors.text,
            borderWidth: 1,
            borderColor: theme.colors.outline,
            borderRadius: theme.radius.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.lg,
          },
        ]}
        placeholder="パーツ名（例: 換気扇）"
        placeholderTextColor={theme.colors.textMuted}
        value={name}
        onChangeText={setName}
        autoFocus
      />

      <Text
        style={[
          theme.typography.caption,
          { color: theme.colors.textMuted, marginBottom: theme.spacing.xs },
        ]}
      >
        推奨掃除周期（日）
      </Text>
      <TextInput
        testID="part-cycle-input"
        style={[
          theme.typography.body,
          {
            color: theme.colors.text,
            borderWidth: 1,
            borderColor: theme.colors.outline,
            borderRadius: theme.radius.md,
            padding: theme.spacing.md,
            marginBottom: theme.spacing.xl,
          },
        ]}
        placeholder={DEFAULT_CYCLE_DAYS}
        placeholderTextColor={theme.colors.textMuted}
        value={cycleDays}
        onChangeText={setCycleDays}
        keyboardType="number-pad"
      />

      <View style={[styles.buttonRow, { gap: theme.spacing.md }]}>
        {isEditing && onDelete != null && (
          <TouchableOpacity
            testID="part-editor-delete"
            accessibilityRole="button"
            accessibilityLabel="パーツを削除"
            style={[
              styles.deleteButton,
              {
                borderColor: theme.colors.danger,
                borderRadius: theme.radius.md,
                paddingVertical: theme.spacing.md,
                paddingHorizontal: theme.spacing.xl,
              },
            ]}
            onPress={() => onDelete(part.id)}
          >
            <Text style={[theme.typography.label, { color: theme.colors.danger }]}>
              削除
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          testID="part-editor-cancel"
          accessibilityRole="button"
          style={{
            borderWidth: 1,
            borderColor: theme.colors.outline,
            borderRadius: theme.radius.md,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.xl,
          }}
          onPress={onCancel}
        >
          <Text style={[theme.typography.label, { color: theme.colors.textMuted }]}>
            キャンセル
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="part-editor-submit"
          accessibilityRole="button"
          style={{
            backgroundColor: theme.colors.primary,
            borderRadius: theme.radius.md,
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.xl,
          }}
          onPress={handleSubmit}
        >
          <Text style={[theme.typography.label, { color: theme.colors.onPrimary }]}>
            {isEditing ? "保存" : "追加"}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  deleteButton: {
    borderWidth: 1,
    marginRight: "auto",
  },
});
