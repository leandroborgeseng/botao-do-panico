import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { deviceTokens } from '@/lib/api';

/**
 * Solicita permissão de notificação, obtém o Expo Push Token e registra no backend.
 * Não bloqueia o fluxo: em caso de falha (ex.: sem projectId no dev), apenas não registra.
 * Chamar após login/cadastro quando o usuário já está autenticado.
 */
export async function registerPushTokenIfPossible(): Promise<void> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const expoPushToken = await Notifications.getExpoPushTokenAsync({
      projectId: projectId ?? undefined,
    }).catch(() => null);
    if (!expoPushToken?.data) return;

    const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
    await deviceTokens.register({
      token: expoPushToken.data,
      platform,
    });
  } catch {
    // Não bloqueia login/cadastro; o usuário poderá receber notificações depois
    // se configurar EAS (extra.eas.projectId) e tentar de novo
  }
}
