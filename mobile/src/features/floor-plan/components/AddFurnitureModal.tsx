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
import { FURNITURE_CATEGORIES, FURNITURE_PRESETS } from '../constants';
import type { FurnitureCategory } from '../constants';
import { FurnitureGlyph } from './glyphs/FurnitureGlyph';

type Props = {
    visible: boolean;
    roomId: string;
    onSubmit: (input: {
        name: string;
        presetKey?: string;
        gridW: number;
        gridH: number;
    }) => void;
    onCancel: () => void;
};

// 自由名称（プリセット未選択）のときの既定サイズ
const FREE_NAME_SIZE = { w: 1, h: 1 };

// チップ内グリフプレビューの収まり枠（px）。縦横比を保ったままこの枠に収める
const PREVIEW_BOX = 32;

export function AddFurnitureModal({ visible, onSubmit, onCancel }: Props) {
    const theme = useAppTheme();
    const [name, setName] = useState('');
    const [selectedPresetKey, setSelectedPresetKey] = useState<string | null>(null);
    const [size, setSize] = useState(FREE_NAME_SIZE);
    const [category, setCategory] = useState<FurnitureCategory>('living');

    function reset() {
        setName('');
        setSelectedPresetKey(null);
        setSize(FREE_NAME_SIZE);
        setCategory('living');
    }

    function handleSelectPreset(key: string, label: string) {
        const preset = FURNITURE_PRESETS.find((p) => p.key === key);
        setSelectedPresetKey(key);
        setName(label);
        setSize(preset ? preset.defaultSize : FREE_NAME_SIZE);
    }

    function handleChangeName(value: string) {
        // 手入力に切り替えたら自由名称扱い（presetKey を外し、サイズも 1×1 に戻す）
        setSelectedPresetKey(null);
        setName(value);
        setSize(FREE_NAME_SIZE);
    }

    function handleSubmit() {
        if (!name.trim()) {
            return;
        }
        onSubmit({
            name: name.trim(),
            ...(selectedPresetKey ? { presetKey: selectedPresetKey } : {}),
            gridW: size.w,
            gridH: size.h,
        });
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
                testID="furniture-category-tablist"
                // タブのグルーピングを支援技術に伝える（各タブは role="tab"）
                accessibilityRole="tablist"
                style={[
                    styles.categoryTabs,
                    { gap: theme.spacing.xs, marginBottom: theme.spacing.md },
                ]}
            >
                {FURNITURE_CATEGORIES.map((tab) => {
                    const isActive = category === tab.key;
                    return (
                        <Pressable
                            key={tab.key}
                            testID={`furniture-category-tab-${tab.key}`}
                            accessibilityRole="tab"
                            accessibilityLabel={tab.label}
                            accessibilityState={{ selected: isActive }}
                            style={{
                                backgroundColor: isActive
                                    ? theme.colors.primarySoft
                                    : theme.colors.surface,
                                borderWidth: 1,
                                borderColor: isActive
                                    ? theme.colors.primary
                                    : theme.colors.outline,
                                borderRadius: theme.radius.lg,
                                paddingVertical: theme.spacing.sm,
                                paddingHorizontal: theme.spacing.md,
                            }}
                            onPress={() => setCategory(tab.key)}
                        >
                            <Text
                                style={[
                                    theme.typography.caption,
                                    {
                                        // primarySoft 上の通常テキストは primary だと
                                        // 4.19:1 で WCAG AA 未達のため text を使う
                                        // （CleaningTimeline と同じ規約）。選択の手がかりは
                                        // borderColor: primary + fontWeight で担保する
                                        color: isActive
                                            ? theme.colors.text
                                            : theme.colors.textMuted,
                                        fontWeight: isActive ? '600' : '400',
                                    },
                                ]}
                            >
                                {tab.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            <View
                style={[
                    styles.presetGrid,
                    { gap: theme.spacing.sm, marginBottom: theme.spacing.xl },
                ]}
            >
                {FURNITURE_PRESETS.filter((preset) => preset.category === category).map(
                    (preset) => {
                        const isSelected = selectedPresetKey === preset.key;
                        // 縦横比を保ったまま PREVIEW_BOX に収まるセルサイズを求める
                        const { w, h } = preset.defaultSize;
                        const previewCell = PREVIEW_BOX / Math.max(w, h);
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
                                onPress={() =>
                                    handleSelectPreset(preset.key, preset.label)
                                }
                            >
                                <View style={styles.presetPreview}>
                                    <FurnitureGlyph
                                        presetKey={preset.key}
                                        gridW={w}
                                        gridH={h}
                                        cellSize={previewCell}
                                    />
                                </View>
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
                    },
                )}
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
                        style={[theme.typography.label, { color: theme.colors.onPrimary }]}
                    >
                        追加
                    </Text>
                </TouchableOpacity>
            </View>
        </BottomSheet>
    );
}

const styles = StyleSheet.create({
    categoryTabs: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    presetGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    presetChip: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
    },
    presetPreview: {
        width: PREVIEW_BOX,
        height: PREVIEW_BOX,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
});
