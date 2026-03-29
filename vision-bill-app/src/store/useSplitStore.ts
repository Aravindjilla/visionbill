import { create } from 'zustand';

interface Participant {
  name: string;
  mobile: string;
  amount: number;
  whatsappLink?: string;
}

interface SplitState {
  participants: Participant[];
  total: number;
  addParticipant: (p: Participant) => void;
  setTotal: (total: number) => void;
  clearParticipants: () => void;
}

export const useSplitStore = create<SplitState>((set) => ({
  participants: [],
  total: 0,
  addParticipant: (p) => set((state) => ({ participants: [...state.participants, p] })),
  setTotal: (total) => set({ total }),
  clearParticipants: () => set({ participants: [] }),
}));
