import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, ActivityIndicator } from 'react-native';
import { setToken } from '@/lib/api';
import { getStoredToken } from '@/lib/storage';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    getStoredToken().then((token) => {
      if (token) {
        setToken(token);
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    });
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
      <ActivityIndicator size="large" color="#005BBB" />
      <Text style={{ color: '#666666', marginTop: 16 }}>Carregando...</Text>
    </View>
  );
}
