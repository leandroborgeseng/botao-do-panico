import AsyncStorage from '@react-native-async-storage/async-storage';

const DISGUISE_MODE_KEY = '@panico_disguise_mode';
type Listener = (enabled: boolean) => void;
const listeners = new Set<Listener>();

export async function getDisguiseMode(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(DISGUISE_MODE_KEY);
    return value === '1';
  } catch {
    return false;
  }
}

export async function setDisguiseMode(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(DISGUISE_MODE_KEY, enabled ? '1' : '0');
  } catch {}
  listeners.forEach((fn) => {
    try { fn(enabled); } catch {}
  });
}

export function subscribeDisguiseMode(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

