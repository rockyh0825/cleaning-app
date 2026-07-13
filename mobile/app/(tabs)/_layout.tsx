import React from 'react';
import { Tabs } from 'expo-router';
import { TabIcon } from '@/shared/components/TabIcon';
import { useAppTheme } from '@/shared/theme/useAppTheme';

export default function TabsLayout() {
    const theme = useAppTheme();

    return (
        <Tabs
            screenOptions={{
                headerStyle: { backgroundColor: theme.colors.surface },
                headerTintColor: theme.colors.text,
                headerTitleStyle: { color: theme.colors.text },
                tabBarStyle: { backgroundColor: theme.colors.surface },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.textMuted,
                sceneStyle: { backgroundColor: theme.colors.background },
            }}
        >
            <Tabs.Screen
                name="floor-plan"
                options={{
                    title: '間取り',
                    // 内側の Stack がヘッダーを持つため Tabs 側は非表示
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => (
                        <TabIcon name="floor-plan" color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="heatmap"
                options={{
                    title: 'ヒートマップ',
                    tabBarIcon: ({ color, size }) => (
                        <TabIcon name="heatmap" color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: '履歴',
                    tabBarIcon: ({ color, size }) => (
                        <TabIcon name="history" color={color} size={size} />
                    ),
                }}
            />
        </Tabs>
    );
}
