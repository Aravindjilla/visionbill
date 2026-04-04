import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import Constants from 'expo-constants';

const ACCESS_TOKEN_KEY = 'vision_bill_access_token';
const REFRESH_TOKEN_KEY = 'vision_bill_refresh_token';
const USER_ID_KEY = 'vision_bill_user_id';

export const saveTokens = async (userId: string, accessToken: string, refreshToken: string) => {
  await SecureStore.setItemAsync(USER_ID_KEY, userId);
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
};

export const getAccessToken = async () => {
  return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = async () => {
  return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
};

export const getUserId = async () => {
  return await SecureStore.getItemAsync(USER_ID_KEY);
};

export const refreshTokens = async () => {
  try {
    const userId = await getUserId();
    const refreshToken = await getRefreshToken();

    if (!userId || !refreshToken) throw new Error('Missing session info');

    const apiUrl = Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:3000';
    const resp = await axios.post(`${apiUrl}/auth/refresh`, {
      userId,
      refreshToken,
    });

    const { accessToken: newAccess, refreshToken: newRefresh } = resp.data;
    await saveTokens(userId, newAccess, newRefresh);
    return newAccess;
  } catch (error) {
    if (__DEV__) console.error('Refresh token failed', error);
    await clearSession();
    throw error;
  }
};

export const clearSession = async () => {
  await SecureStore.deleteItemAsync(USER_ID_KEY);
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
};
