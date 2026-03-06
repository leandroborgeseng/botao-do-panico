import { Linking, Alert, Platform } from 'react-native';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status === 'granted') return true;
  if (status === 'denied') {
    const canAskAgain = await Location.getForegroundPermissionsAsync().then((p) => p.canAskAgain);
    if (!canAskAgain) {
      Alert.alert(
        'Permissão negada',
        'Abra as configurações do app para permitir o uso da localização.',
        [
          { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
      return false;
    }
  }
  return false;
}

export async function requestMicrophonePermission(): Promise<boolean> {
  const result = await Audio.requestPermissionsAsync();
  const status = result.status ?? (result as { granted?: boolean }).granted ? 'granted' : 'denied';
  if (status === 'granted') return true;
  const canAskAgain = (result as { canAskAgain?: boolean }).canAskAgain !== false;
  if (status === 'denied') {
    Alert.alert(
      'Permissão negada',
      canAskAgain
        ? 'O app precisa do microfone para gravar áudio em caso de pânico. Você pode tentar novamente ou abrir as configurações.'
        : 'Abra as configurações do app para permitir o uso do microfone.',
      [
        { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
    return false;
  }
  return false;
}
