import React, { useState } from 'react';
import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { BottomSheet } from '@/shared/components/BottomSheet';
import { useAppTheme } from '@/shared/theme/useAppTheme';
import { FURNITURE_PRESETS } from '../constants';

type Props = {
    visible: boolean;
    roomId: string;
    onSubmit: (input: { name: string; presetKey?: string }) => void;
    onCancel: () => void;
};

export function AddFurnitureModal({ visible, onSubmit, onCancel }: Props) {
    const theme = useAppTheme();
    const [name, setName] = useState('');
    const [selectedPresetKey, setSelectedPresetKey] = useState<string | null>(null);

    function reset() {
        setName('');
        setSelectedPresetKey(null);
    }

    function handleSelectPreset(key: string, label: string) {
        setSelectedPresetKey(key);
        setName(label);
    }

    function handleChangeName(value: string) {
        // 手入力に切り替えたら自由名称扱い（presetKey を外す）
        setSelectedPresetKey(null);
        setName(value);
    }

    function handleSubmit() {
        if (!name.trim()) {
            return;
        }
        onSubmit(
            selectedPresetKey
                ? { name: name.trim(), presetKey: selectedPresetKey }
                : { name: name.trim() },
        );
        reset();
    }

    function handleCancel() {
        reset();
        onCancel();
    }

    return (
        <BottomSheet visible={visible} onClose={handleCancel}>
            <Text
                style={[
                    theme.typography.title,
                    { color: theme.colors.text, marginBottom: theme.spacing.lg },
                ]}
            >
                家具を追加
            </Text>

            <TextInput
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
                placeholder="家具名"
                placeholderTextColor={theme.colors.textMuted}
                value={name}
                onChangeText={handleChangeName}
                autoFocus
            />

            <View
                style={[
                    styles.presetGrid,
                    { gap: theme.spacing.sm, marginBottom: theme.spacing.xl },
                ]}
            >
                {FURNITURE_PRESETS.map((preset) => {
                    const isSelected = selectedPresetKey === preset.key;
                    return (
                        <Pressable
                            key={preset.key}
                            testID={`furniture-preset-chip-${preset.key}`}
                            accessibilityRole="button"
                            accessibilityLabel={preset.label}
                            accessibilityState={{ selected: isSelected }}
                            style={[
                                styles.presetChip,
                                {
                                    backgroundColor: isSelected
                                        ? theme.colors.surfaceAlt
                                        : theme.colors.surface,
                                    borderColor: isSelected
                                        ? theme.colors.primary
                                        : theme.colors.outline,
                                    borderRadius: theme.radius.lg,
                                    paddingVertical: theme.spacing.sm,
                                    paddingHorizontal: theme.spacing.md,
                                    gap: theme.spacing.xs,
                                },
                            ]}
                            onPress={() => handleSelectPreset(preset.key, preset.label)}
                        >
                            <Text style={styles.presetIcon}>{preset.icon}</Text>
                            <Text
                                style={[
                                    theme.typography.caption,
                                    {
                                        color: isSelected
                                            ? theme.colors.primary
                                            : theme.colors.textMuted,
                                        fontWeight: isSelected ? '600' : '400',
                                    },
                                ]}
                            >
                                {preset.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            <View style={[styles.buttonRow, { gap: theme.spacing.md }]}>
                <TouchableOpacity
                    style={{
                        borderWidth: 1,
                        borderColor: theme.colors.outline,
                        borderRadius: theme.radius.md,
                        paddingVertical: theme.spacing.md,
                        paddingHorizontal: theme.spacing.xl,
                    }}
                    onPress={handleCancel}
                >
                    <Text
                        style={[theme.typography.label, { color: theme.colors.textMuted }]}
                    >
                        キャンセル
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={{
                        backgroundColor: theme.colors.primary,
                        borderRadius: theme.radius.md,
                        paddingVertical: theme.spacing.md,
                        paddingHorizontal: theme.spacing.xl,
                    }}
                    onPress={handleSubmit}
                >
                    <Text
                        style={[theme.typography.label, { color: theme.colors.surface }]}
                    >
                        追加
                    </Text>
                </TouchableOpacity>
            </View>
        </BottomSheet>
    );
}

const styles = StyleSheet.create({
    presetGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    presetChip: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
    },
    presetIcon: {
        fontSize: 18,
        lineHeight: 24,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
});
