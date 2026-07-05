import React from 'react';
import { Stack } from 'expo-router';
import { useAppTheme } from '@/shared/theme/useAppTheme';

export default function FloorPlanLayout() {
    const theme = useAppTheme();

    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: theme.colors.surface },
                headerTintColor: theme.colors.text,
                headerTitleStyle: { color: theme.colors.text },
                contentStyle: { backgroundColor: theme.colors.background },
            }}
        >
            <Stack.Screen name="index" options={{ title: '間取り' }} />
            <Stack.Screen name="[roomId]" options={{ title: '部屋詳細' }} />
        </Stack>
    );
}
