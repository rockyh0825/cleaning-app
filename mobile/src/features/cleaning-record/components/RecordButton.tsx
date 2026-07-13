import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import Animated from "react-native-reanimated";
import { useAppTheme } from "@/shared/theme/useAppTheme";
import { usePressScale } from "@/shared/hooks/usePressScale";

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
  // 押下時のスプリングフィードバック。スケールは外側のラッパーに掛け、
  // ボタン本体のスタイル（テストの検証対象）は従来のまま保つ
  const { animatedStyle, pressIn, pressOut } = usePressScale();

  return (
    <Animated.View testID="record-button-scale" style={animatedStyle}>
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
        onPressIn={pressIn}
        onPressOut={pressOut}
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
    </Animated.View>
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
