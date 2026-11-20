import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCESS = 'accessToken';
const REFRESH = 'refreshToken';

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(ACCESS);
}

export async function getRefreshToken(): Promise<string | null> {
  return AsyncStorage.getItem(REFRESH);
}

export async function saveTokens(access: string, refresh: string): Promise<void> {
  await AsyncStorage.setItem(ACCESS, access);
  await AsyncStorage.setItem(REFRESH, refresh);
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.removeItem(ACCESS);
  await AsyncStorage.removeItem(REFRESH);
}
