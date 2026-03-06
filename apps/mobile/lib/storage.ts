import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@panico_token';
const USER_KEY = '@panico_user';

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setStoredToken(token: string | null): Promise<void> {
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function getStoredUser(): Promise<string | null> {
  return AsyncStorage.getItem(USER_KEY);
}

export async function setStoredUser(userJson: string | null): Promise<void> {
  if (userJson) await AsyncStorage.setItem(USER_KEY, userJson);
  else await AsyncStorage.removeItem(USER_KEY);
}

export async function clearStorage(): Promise<void> {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}
