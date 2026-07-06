import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { CleaningTimeline } from '@/features/cleaning-record/components/CleaningTimeline';
import { useCleaningHistory } from '@/features/cleaning-record/hooks/useCleaningHistory';
import { CleaningRecordRepository } from '@/features/cleaning-record/repositories/CleaningRecordRepository';
import { useUserId } from '@/shared/hooks/useUserId';
import { api } from '@/shared/app-root/providers/di';
import { useAppTheme } from '@/shared/theme/useAppTheme';

const repository = new CleaningRecordRepository(api);

export default function HistoryScreen() {
    const theme = useAppTheme();
    const userId = useUserId();

    const { records, isLoading, error, deleteRecord, updateRecord } = useCleaningHistory(
        userId ?? '',
        {},
        repository,
    );

    if (userId == null || isLoading) {
        return (
            <View
                testID="history-loading"
                style={[styles.center, { backgroundColor: theme.colors.background }]}
            >
                <ActivityIndicator color={theme.colors.primary} />
            </View>
        );
    }

    if (error != null) {
        return (
            <View
                testID="error-state"
                style={[styles.center, { backgroundColor: theme.colors.background }]}
            >
                <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
                    履歴の取得に失敗しました
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {deleteRecord.isError && (
                <View testID="delete-record-error" style={styles.errorBanner}>
                    <Text style={[theme.typography.body, { color: theme.colors.danger }]}>
                        削除に失敗しました
                    </Text>
                </View>
            )}
            {updateRecord.isError && (
                <View testID="update-record-error" style={styles.errorBanner}>
                    <Text style={[theme.typography.body, { color: theme.colors.danger }]}>
                        修正に失敗しました
                    </Text>
                </View>
            )}
            <CleaningTimeline
                records={records}
                onDelete={(recordId) => deleteRecord.mutate(recordId)}
                onUpdateNote={(recordId, note) =>
                    updateRecord.mutate({ recordId, input: { note } })
                }
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
    },
    errorBanner: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
});
