import { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { setToken } from '@/lib/api';
import { setUnauthorizedHandler } from '@/lib/unauthorized';
import { getStoredToken } from '@/lib/storage';

function useNotificationOpen() {
  const router = useRouter();
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { panicEventId?: string };
      const id = data?.panicEventId;
      if (mounted.current && id) {
        router.push(`/(tabs)/received/${id}` as const);
      }
    });

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!mounted.current || !response) return;
      const data = response.notification.request.content.data as { panicEventId?: string };
      const id = data?.panicEventId;
      if (id) router.push(`/(tabs)/received/${id}` as const);
    });

    return () => {
      mounted.current = false;
      sub.remove();
    };
  }, [router]);
}

export default function RootLayout() {
  const router = useRouter();
  useNotificationOpen();

  useEffect(() => {
    setUnauthorizedHandler(() => {
      router.replace('/login');
    });
    return () => setUnauthorizedHandler(() => {});
  }, [router]);

  useEffect(() => {
    getStoredToken().then((t) => {
      if (t) setToken(t);
    });
  }, []);

  return (
    <SafeAreaProvider>
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#005BBB' },
        headerTintColor: '#FFFFFF',
        contentStyle: { backgroundColor: '#FFFFFF' },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: 'Entrar' }} />
      <Stack.Screen name="register" options={{ title: 'Cadastro' }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
    </SafeAreaProvider>
  );
}
