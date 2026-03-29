import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  accessToken: string | null;
  userId: string | null;
  isLoading: boolean;
  setSession: (userId: string, accessToken: string) => void;
  clearSession: () => void;
  initialize: () => Promise<void>;
}

const ACCESS_TOKEN_KEY = 'vision_bill_access_token';
const USER_ID_KEY = 'vision_bill_user_id';

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  userId: null,
  isLoading: true,
  setSession: (userId, accessToken) => set({ userId, accessToken, isLoading: false }),
  clearSession: async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_ID_KEY);
    set({ userId: null, accessToken: null, isLoading: false });
  },
  initialize: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      const userId = await SecureStore.getItemAsync(USER_ID_KEY);
      set({ userId, accessToken, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
    }
  },
}));
