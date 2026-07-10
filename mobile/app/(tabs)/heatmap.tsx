import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { HeatmapView } from '@/features/heatmap/components/HeatmapView';
import { useUserId } from '@/shared/hooks/useUserId';
import {
    cleaningStatusCapability,
    floorPlanCapability,
} from '@/shared/app-root/providers/di';
import { useAppTheme } from '@/shared/theme/useAppTheme';

export default function HeatmapScreen() {
    const theme = useAppTheme();
    const userId = useUserId();

    if (userId == null) {
        return (
            <View
                testID="heatmap-user-loading"
                style={[styles.center, { backgroundColor: theme.colors.background }]}
            >
                <ActivityIndicator color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <HeatmapView
                userId={userId}
                floorPlanCapability={floorPlanCapability}
                cleaningStatusCapability={cleaningStatusCapability}
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
});
