import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BillItem, Scan } from '../types';

interface ScanState {
  currentScan: Scan | null;
  items: BillItem[];
  currentImages: any[];
  loading: boolean;
  loadingMessage: string;
  error: string | null;
  lastDeleted: Scan | null;
  setScan: (scan: Scan) => void;
  setLastDeleted: (scan: Scan | null) => void;
  toggleItem: (index: number) => void;
  toggleParticipantAssignment: (itemIndex: number, participantId: string) => void;
  updateItemPrice: (index: number, newPrice: number) => void;
  addImage: (image: any) => void;
  clearImages: () => void;
  setLoading: (loading: boolean, message?: string) => void;
  setError: (error: string | null) => void;
  removeItem: (index: number) => void;
  setAllItemsChecked: (checked: boolean) => void;
}

export const useScanStore = create<ScanState>()(
  persist(
    (set) => ({
      currentScan: null,
      items: [],
      currentImages: [],
      loading: false,
      loadingMessage: '',
      error: null,
      lastDeleted: null,
      setScan: (scan: Scan) => set({ 
        currentScan: scan, 
        items: (scan.items || []).map((item) => ({ 
          ...item, 
          checked: false, 
          assignedParticipants: [],
          isSplit: false
        })) 
      }),
      setLastDeleted: (scan) => set({ lastDeleted: scan }),

      toggleItem: (index) => set((state) => {
        const newItems = [...state.items];
        newItems[index] = { ...newItems[index], checked: !newItems[index].checked };
        return { items: newItems };
      }),

      toggleParticipantAssignment: (itemIndex: number, participantId: string) => set((state) => {
        const newItems = [...state.items];
        const item = { ...newItems[itemIndex] };
        const currentAssignments = item.assignedParticipants || [];
        
        const exists = currentAssignments.some(ap => ap.participantId === participantId);
        
        let nextAssignments;
        if (exists) {
          nextAssignments = currentAssignments.filter(ap => ap.participantId !== participantId);
        } else {
          nextAssignments = [...currentAssignments, { participantId, share: 0 }];
        }

        const count = nextAssignments.length;
        item.assignedParticipants = nextAssignments.map(ap => ({
          ...ap,
          share: count > 0 ? 1 / count : 0
        }));
        item.isSplit = count > 1;

        newItems[itemIndex] = item;
        return { items: newItems };
      }),
      updateItemPrice: (index, newPrice) => set((state) => {
        const newItems = [...state.items];
        newItems[index] = { ...newItems[index], price: newPrice };
        const newTotal = newItems.reduce((acc, item) => acc + item.price, 0);
        return { 
          items: newItems,
          currentScan: state.currentScan ? { ...state.currentScan, extractedTotal: newTotal } : null
        };
      }),
      addImage: (image: any) => set((state) => ({ currentImages: [...state.currentImages, image] })),
      clearImages: () => set({ currentImages: [] }),
      setLoading: (loading, message = '') => set({ loading, loadingMessage: message }),
      setError: (error) => set({ error }),
      removeItem: (index) => set((state) => {
        const newItems = state.items.filter((_, i) => i !== index);
        const newTotal = newItems.reduce((acc, item) => acc + item.price, 0);
        return { 
          items: newItems,
          currentScan: state.currentScan ? { ...state.currentScan, extractedTotal: newTotal } : null
        };
      }),
      setAllItemsChecked: (checked) => set((state) => ({
        items: state.items.map(i => ({ ...i, checked }))
      })),
    }),
    {
      name: 'vision-bill-scan-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentScan: state.currentScan,
        items: state.items,
        // currentImages excluded to prevent AsyncStorage 6MB limit issues
      }),
    }
  )
);

