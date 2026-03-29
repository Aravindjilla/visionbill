import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LoyaltyCard {
  id: string;
  store: string;
  code: string;
  color: string;
}

const DEFAULT_COLORS = ['#F97316', '#0EA5E9', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B'];

interface LoyaltyState {
  cards: LoyaltyCard[];
  addCard: (store: string, code: string) => void;
  removeCard: (id: string) => void;
}

export const useLoyaltyStore = create<LoyaltyState>()(
  persist(
    (set, get) => ({
      cards: [
        { id: '1', store: 'BigBazaar', code: '9845123476', color: '#F97316' },
        { id: '2', store: 'Reliance Smart', code: 'REL-8832-111', color: '#0EA5E9' },
        { id: '3', store: 'Apollo Pharmacy', code: 'APL-9988', color: '#10B981' },
      ],
      addCard: (store, code) =>
        set((state) => ({
          cards: [
            ...state.cards,
            {
              id: Date.now().toString(),
              store,
              code,
              color: DEFAULT_COLORS[state.cards.length % DEFAULT_COLORS.length],
            },
          ],
        })),
      removeCard: (id) =>
        set((state) => ({ cards: state.cards.filter((c) => c.id !== id) })),
    }),
    {
      name: 'vision-bill-loyalty',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
