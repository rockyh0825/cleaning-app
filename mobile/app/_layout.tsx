import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const queryClient = new QueryClient();

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <QueryClientProvider client={queryClient}>
                <Stack>
                    <Stack.Screen name="floor-plan/index" options={{ title: '間取り' }} />
                    <Stack.Screen name="floor-plan/[roomId]" options={{ title: '部屋詳細' }} />
                </Stack>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}
