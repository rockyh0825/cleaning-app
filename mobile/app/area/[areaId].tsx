import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { PartChecklist } from '@/features/cleaning-record/components/PartChecklist';
import { PartEditorSheet } from '@/features/cleaning-record/components/PartEditorSheet';
import type { PartEditorInput } from '@/features/cleaning-record/components/PartEditorSheet';
import { useLogCleaning } from '@/features/cleaning-record/hooks/useLogCleaning';
import { useManageParts } from '@/features/cleaning-record/hooks/useManageParts';
import { usePartList } from '@/features/cleaning-record/hooks/usePartList';
import { CleaningRecordRepository } from '@/features/cleaning-record/repositories/CleaningRecordRepository';
import type { OwnerType, Part } from '@/features/cleaning-record/types';
import { useUserId } from '@/shared/hooks/useUserId';
import { api } from '@/shared/app-root/providers/di';
import { useAppTheme } from '@/shared/theme/useAppTheme';

const repository = new CleaningRecordRepository(api);

export default function AreaDetailScreen() {
    const theme = useAppTheme();
    const { areaId, ownerType: ownerTypeParam } = useLocalSearchParams<{
        areaId: string;
        ownerType?: string;
    }>();
    const userId = useUserId();

    const partList = usePartList(userId ?? '', areaId ?? '', repository);

    const { mutate, isPending, error: logCleaningError } = useLogCleaning(userId ?? '', repository);
    const {
        addPart,
        updatePart,
        deletePart,
        error: managePartError,
    } = useManageParts(userId ?? '', repository);

    const [editingPart, setEditingPart] = useState<Part | null>(null);
    const [isEditorVisible, setEditorVisible] = useState(false);

    if (userId == null || partList.isPending) {
        return (
            <View
                testID="area-loading"
                style={[styles.center, { backgroundColor: theme.colors.background }]}
            >
                <ActivityIndicator color={theme.colors.primary} />
            </View>
        );
    }

    if (partList.isError) {
        return (
            <View
                testID="error-state"
                style={[styles.center, { backgroundColor: theme.colors.background }]}
            >
                <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
                    パーツの取得に失敗しました
                </Text>
            </View>
        );
    }

    const parts = partList.parts;

    // 遷移元が知っている所有者種別を最優先し、なければ表示中パーツから推定する
    const ownerType: OwnerType =
        ownerTypeParam === 'ROOM' || ownerTypeParam === 'FURNITURE'
            ? ownerTypeParam
            : (parts[0]?.ownerType ?? 'ROOM');

    const openAddEditor = () => {
        setEditingPart(null);
        setEditorVisible(true);
    };

    const openEditEditor = (part: Part) => {
        setEditingPart(part);
        setEditorVisible(true);
    };

    const closeEditor = () => {
        setEditorVisible(false);
        setEditingPart(null);
    };

    const handleEditorSubmit = (input: PartEditorInput) => {
        if (editingPart == null) {
            addPart({
                ownerType,
                ownerId: areaId ?? '',
                name: input.name,
                recommendedCycleDays: input.recommendedCycleDays,
            });
        } else {
            updatePart({ partId: editingPart.id, input });
        }
        closeEditor();
    };

    const handleEditorDelete = (partId: string) => {
        const partName = editingPart?.name ?? 'このパーツ';
        Alert.alert(
            `「${partName}」を削除しますか？`,
            'このパーツに紐づく掃除記録もまとめて削除されます。この操作は取り消せません。',
            [
                { text: 'キャンセル', style: 'cancel' },
                {
                    text: '削除する',
                    style: 'destructive',
                    onPress: () => {
                        deletePart(partId);
                        closeEditor();
                    },
                },
            ],
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {logCleaningError != null && (
                <View testID="log-cleaning-error" style={styles.errorBanner}>
                    <Text style={[theme.typography.body, { color: theme.colors.danger }]}>
                        記録に失敗しました。再試行してください
                    </Text>
                </View>
            )}
            {managePartError != null && (
                <View testID="manage-part-error" style={styles.errorBanner}>
                    <Text style={[theme.typography.body, { color: theme.colors.danger }]}>
                        パーツの保存に失敗しました。再試行してください
                    </Text>
                </View>
            )}
            <View style={styles.headerRow}>
                <TouchableOpacity
                    testID="add-part-button"
                    accessibilityRole="button"
                    accessibilityLabel="パーツを追加"
                    style={[
                        styles.addButton,
                        {
                            borderColor: theme.colors.primary,
                            borderRadius: theme.radius.md,
                            paddingVertical: theme.spacing.sm,
                            paddingHorizontal: theme.spacing.md,
                        },
                    ]}
                    onPress={openAddEditor}
                >
                    <Text style={[theme.typography.label, { color: theme.colors.primary }]}>
                        ＋ パーツを追加
                    </Text>
                </TouchableOpacity>
            </View>
            {parts.length === 0 ? (
                <View
                    testID="empty-state"
                    style={[styles.center, { backgroundColor: theme.colors.background }]}
                >
                    <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
                        このエリアにはパーツがありません
                    </Text>
                </View>
            ) : (
                <PartChecklist
                    parts={parts}
                    onLogCleaning={(partIds) => mutate({ partIds })}
                    onEditPart={openEditEditor}
                    isLoading={isPending}
                />
            )}
            <PartEditorSheet
                visible={isEditorVisible}
                part={editingPart}
                onSubmit={handleEditorSubmit}
                onDelete={handleEditorDelete}
                onCancel={closeEditor}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    errorBanner: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    addButton: {
        borderWidth: 1,
    },
});
