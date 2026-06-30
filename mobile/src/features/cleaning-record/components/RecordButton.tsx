import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

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
  const isDisabled = selectedCount === 0 || isLoading;

  return (
    <TouchableOpacity
      testID="record-button"
      style={[styles.button, isDisabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[styles.label, isDisabled && styles.labelDisabled]}>
          {selectedCount > 0 ? `記録（${selectedCount}件）` : "記録"}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    backgroundColor: "#BDBDBD",
  },
  label: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  labelDisabled: {
    color: "#fff",
  },
});
