import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { CleaningTimeline } from '@/features/cleaning-record/components/CleaningTimeline';
import { useCleaningHistory } from '@/features/cleaning-record/hooks/useCleaningHistory';
import { usePartNames } from '@/features/cleaning-record/hooks/usePartList';
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
    // 履歴の partId をパーツ名で表示するための対応表（issue #152）。
    // 名前未解決のままタイムラインを出すと「不明なパーツ」が一瞬表示されて
    // ちらつくため、ローディング判定に含める。
    const { partNamesById, isPending: isPartNamesPending } = usePartNames(
        userId ?? '',
        repository,
    );

    if (userId == null || isLoading || isPartNamesPending) {
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
                partNamesById={partNamesById}
                onDelete={(recordId) => deleteRecord.mutate(recordId)}
                onUpdateNote={(recordId, note) =>
                    // mutateAsync で成否を CleaningTimeline に伝える。
                    // 失敗時は編集UIとドラフトを保持し、バナー（updateRecord.isError）で通知する。
                    updateRecord.mutateAsync({ recordId, input: { note } })
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
