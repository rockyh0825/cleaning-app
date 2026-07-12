import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useAppTheme } from "@/shared/theme/useAppTheme";

type RecordButtonProps = {
  selectedCount: number;
  onPress: () => void;
  isLoading?: boolean;
};

export function RecordButton({
  selectedCount,
  onPress,
  isLoading = false,
}: RecordButtonProps) {
  const theme = useAppTheme();
  const isDisabled = selectedCount === 0 || isLoading;

  return (
    <TouchableOpacity
      testID="record-button"
      style={[
        styles.button,
        {
          // 無効時の配色は shared/components/Button の primary disabled と揃える
          backgroundColor: isDisabled
            ? theme.colors.surfaceAlt
            : theme.colors.primary,
        },
      ]}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      {isLoading ? (
        // ローディング中は無効状態（surfaceAlt 背景）なので muted で描く
        <ActivityIndicator color={theme.colors.textMuted} />
      ) : (
        <Text
          style={[
            styles.label,
            {
              color: isDisabled
                ? theme.colors.textMuted
                : theme.colors.onPrimary,
            },
          ]}
        >
          {selectedCount > 0 ? `記録（${selectedCount}件）` : "記録"}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
});
