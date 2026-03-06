import { Stack } from 'expo-router';

export default function ReceivedLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#005BBB' },
        headerTintColor: '#FFFFFF',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Local do alerta',
          headerBackTitle: 'Voltar',
        }}
      />
    </Stack>
  );
}
