import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
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
                    tabBarIcon: ({ color }) => (
                        <Text style={{ color, fontSize: 18 }}>🏠</Text>
                    ),
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: '履歴',
                    tabBarIcon: ({ color }) => (
                        <Text style={{ color, fontSize: 18 }}>🕒</Text>
                    ),
                }}
            />
        </Tabs>
    );
}
