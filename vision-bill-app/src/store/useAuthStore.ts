import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  accessToken: string | null;
  userId: string | null;
  tier: 'free' | 'pro';
  monthlyScanCount: number;
  isLoading: boolean;
  setSession: (userId: string, accessToken: string, tier?: 'free' | 'pro') => void;
  incrementScanCount: () => void;
  clearSession: () => void;
  initialize: () => Promise<void>;
}

const ACCESS_TOKEN_KEY = 'vision_bill_access_token';
const USER_ID_KEY = 'vision_bill_user_id';

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  userId: null,
  tier: 'free',
  monthlyScanCount: 0,
  isLoading: true,
  setSession: (userId, accessToken, tier = 'free') => set({ userId, accessToken, tier, isLoading: false }),
  incrementScanCount: () => set((state) => ({ monthlyScanCount: state.monthlyScanCount + 1 })),
  clearSession: async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_ID_KEY);
    set({ userId: null, accessToken: null, tier: 'free', monthlyScanCount: 0, isLoading: false });
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
