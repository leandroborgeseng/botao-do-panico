import { Tabs } from 'expo-router';
import { View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';
import { useEffect, useState } from 'react';
import { getDisguiseMode, subscribeDisguiseMode } from '@/lib/settings';

export default function TabsLayout() {
  const [disguiseMode, setDisguiseMode] = useState(false);

  useEffect(() => {
    getDisguiseMode().then(setDisguiseMode).catch(() => {});
    return subscribeDisguiseMode(setDisguiseMode);
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.onPrimary,
        headerTitle: disguiseMode
          ? undefined
          : () => (
              <View style={{ backgroundColor: colors.primary, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 }}>
                <Image
                  source={require('../../assets/logo-prefeitura-franca.png')}
                  style={{ width: 140, height: 40 }}
                  resizeMode="contain"
                  accessibilityLabel="Prefeitura de Franca"
                />
              </View>
            ),
        tabBarStyle: { backgroundColor: colors.primary, borderTopColor: 'rgba(255,255,255,0.25)' },
        tabBarActiveTintColor: colors.onPrimary,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.75)',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: disguiseMode ? 'Pedidos' : 'Pânico',
          tabBarLabel: disguiseMode ? 'Pedidos' : 'Pânico',
          tabBarIcon: ({ color, size }) =>
            disguiseMode ? <Ionicons name="pizza" size={size} color={color} /> : <Ionicons name="warning" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="received"
        options={{
          title: 'Alertas recebidos',
          tabBarLabel: 'Alertas',
          tabBarIcon: ({ color, size }) => <Ionicons name="notifications" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Contatos',
          tabBarLabel: 'Contatos',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Histórico de envios',
          tabBarLabel: 'Histórico',
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Meus dados',
          tabBarLabel: 'Meus dados',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
