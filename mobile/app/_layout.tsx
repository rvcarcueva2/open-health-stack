import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { migrate } from '../src/db/migrations';

const queryClient = new QueryClient();

export default function RootLayout() {
    return (
        <QueryClientProvider client={queryClient}>
            <SQLiteProvider databaseName="ohs.db" onInit={migrate}>
                <Stack screenOptions={{ headerTitleStyle: { fontWeight: '700' } }}>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="add-patient" options={{ presentation: 'modal', title: 'New patient' }} />
                </Stack>
                <StatusBar style="auto" />
            </SQLiteProvider>
        </QueryClientProvider>
    );
}