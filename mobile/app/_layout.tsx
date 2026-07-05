import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '@/shared/theme/ThemeProvider';
import { useAppTheme } from '@/shared/theme/useAppTheme';

const queryClient = new QueryClient();

// Stack のヘッダー・背景にテーマを当てるため ThemeProvider の内側で描画する
function ThemedStack() {
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
            <Stack.Screen name="floor-plan/index" options={{ title: '間取り' }} />
            <Stack.Screen name="floor-plan/[roomId]" options={{ title: '部屋詳細' }} />
        </Stack>
    );
}

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider>
                    <ThemedStack />
                </ThemeProvider>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}
