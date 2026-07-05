import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { PartChecklist } from '@/features/cleaning-record/components/PartChecklist';
import { useLogCleaning } from '@/features/cleaning-record/hooks/useLogCleaning';
import { usePartList } from '@/features/cleaning-record/hooks/usePartList';
import { CleaningRecordRepository } from '@/features/cleaning-record/repositories/CleaningRecordRepository';
import { useUserId } from '@/shared/hooks/useUserId';
import { api } from '@/shared/app-root/providers/di';
import { useAppTheme } from '@/shared/theme/useAppTheme';

const repository = new CleaningRecordRepository(api);

export default function AreaDetailScreen() {
    const theme = useAppTheme();
    const { areaId } = useLocalSearchParams<{ areaId: string }>();
    const userId = useUserId();

    const partList = usePartList(userId ?? '', areaId ?? '', repository);

    const { mutate, isPending } = useLogCleaning(userId ?? '', repository);

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

    if (parts.length === 0) {
        return (
            <View
                testID="empty-state"
                style={[styles.center, { backgroundColor: theme.colors.background }]}
            >
                <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
                    このエリアにはパーツがありません
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <PartChecklist
                parts={parts}
                onLogCleaning={(partIds) => mutate({ partIds })}
                isLoading={isPending}
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
});
