import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: string;
  color: string;
}

interface SubscriptionState {
  subscriptions: Subscription[];
  addSubscription: (sub: Omit<Subscription, 'id'>) => void;
  removeSubscription: (id: string) => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set) => ({
      subscriptions: [
        { id: '1', name: 'Netflix', amount: 649, billingCycle: 'monthly', nextBillingDate: new Date(Date.now() + 86400000 * 5).toISOString(), color: '#E50914' },
        { id: '2', name: 'Spotify', amount: 119, billingCycle: 'monthly', nextBillingDate: new Date(Date.now() + 86400000 * 12).toISOString(), color: '#1DB954' },
      ],
      addSubscription: (sub) => set((state) => ({
        subscriptions: [...state.subscriptions, { ...sub, id: Date.now().toString() }]
      })),
      removeSubscription: (id) => set((state) => ({
        subscriptions: state.subscriptions.filter(s => s.id !== id)
      }))
    }),
    {
      name: 'vision-bill-subscriptions',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
