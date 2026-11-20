import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const ACCESS = 'accessToken';
const REFRESH = 'refreshToken';

// One-time migration from the old AsyncStorage location.
async function read(key: string): Promise<string | null> {
  const secure = await SecureStore.getItemAsync(key);
  if (secure !== null) return secure;
  const legacy = await AsyncStorage.getItem(key);
  if (legacy !== null) {
    await SecureStore.setItemAsync(key, legacy);
    await AsyncStorage.removeItem(key);
  }
  return legacy;
}

export async function getAccessToken(): Promise<string | null> {
  return read(ACCESS);
}

export async function getRefreshToken(): Promise<string | null> {
  return read(REFRESH);
}

export async function saveTokens(access: string, refresh: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS, access);
  await SecureStore.setItemAsync(REFRESH, refresh);
  await AsyncStorage.removeItem(ACCESS);
  await AsyncStorage.removeItem(REFRESH);
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS);
  await SecureStore.deleteItemAsync(REFRESH);
  await AsyncStorage.removeItem(ACCESS);
  await AsyncStorage.removeItem(REFRESH);
}
