import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../utils/api';

interface AuthState {
  accessToken: string | null;
  userId: string | null;
  tier: 'free' | 'pro';
  monthlyScanCount: number;
  scanLimit: number;
  isLoading: boolean;
  setSession: (userId: string, accessToken: string, tier?: 'free' | 'pro', monthlyScanCount?: number) => void;
  incrementScanCount: () => void;
  refreshStatus: () => Promise<void>;
  clearSession: () => void;
  initialize: () => Promise<void>;
}

const ACCESS_TOKEN_KEY = 'vision_bill_access_token';
const USER_ID_KEY = 'vision_bill_user_id';

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  userId: null,
  tier: 'free',
  monthlyScanCount: 0,
  scanLimit: 5,
  isLoading: true,
  setSession: (userId, accessToken, tier = 'free', monthlyScanCount = 0) => 
    set({ userId, accessToken, tier, monthlyScanCount, isLoading: false }),
  incrementScanCount: () => set((state) => ({ monthlyScanCount: state.monthlyScanCount + 1 })),
  refreshStatus: async () => {
    try {
      const res = await api.get('/auth/status');
      set({ 
        tier: res.data.tier, 
        monthlyScanCount: res.data.monthlyScanCount,
        scanLimit: res.data.tier === 'pro' ? 999999 : 5 // fallback to 5 
      });
    } catch (e) {
      console.error('Failed to refresh auth status', e);
    }
  },
  clearSession: async () => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_ID_KEY);
    set({ userId: null, accessToken: null, tier: 'free', monthlyScanCount: 0, scanLimit: 5, isLoading: false });
  },
  initialize: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      const userId = await SecureStore.getItemAsync(USER_ID_KEY);
      set({ userId, accessToken, isLoading: false });
      if (accessToken) {
        // Run in background
        get().refreshStatus();
      }
    } catch (e) {
      set({ isLoading: false });
    }
  },
}));
