import { create } from 'zustand';
import { BillItem, Scan } from '../types';

interface ScanState {
  currentScan: Scan | null;
  items: BillItem[];
  currentImages: any[];
  loading: boolean;
  loadingMessage: string;
  error: string | null;
  setScan: (scan: Scan) => void;
  toggleItem: (index: number) => void;
  toggleParticipantAssignment: (itemIndex: number, participantId: string) => void;
  addImage: (image: any) => void;
  clearImages: () => void;
  setLoading: (loading: boolean, message?: string) => void;
}

export const useScanStore = create<ScanState>((set) => ({
  currentScan: null,
  items: [],
  currentImages: [],
  loading: false,
  loadingMessage: '',
  error: null,
  setScan: (scan: Scan) => set({ 
    currentScan: scan, 
    items: (scan.items || []).map((item) => ({ 
      ...item, 
      checked: false, 
      assignedParticipants: [],
      isSplit: false
    })) 
  }),

  toggleItem: (index) => set((state) => {
    const newItems = [...state.items];
    newItems[index] = { ...newItems[index], checked: !newItems[index].checked };
    return { items: newItems };
  }),

  toggleParticipantAssignment: (itemIndex: number, participantId: string) => set((state) => {
    const newItems = [...state.items];
    const item = { ...newItems[itemIndex] };
    const currentAssignments = item.assignedParticipants || [];
    
    // Check if participant already assigned
    const exists = currentAssignments.some(ap => ap.participantId === participantId);
    
    let nextAssignments;
    if (exists) {
      // Remove
      nextAssignments = currentAssignments.filter(ap => ap.participantId !== participantId);
    } else {
      // Add
      nextAssignments = [...currentAssignments, { participantId, share: 0 }];
    }

    // Equally redistribute shares
    const count = nextAssignments.length;
    item.assignedParticipants = nextAssignments.map(ap => ({
      ...ap,
      share: count > 0 ? 1 / count : 0
    }));
    item.isSplit = count > 1;

    newItems[itemIndex] = item;
    return { items: newItems };
  }),
  addImage: (image: any) => set((state) => ({ currentImages: [...state.currentImages, image] })),
  clearImages: () => set({ currentImages: [] }),
  setLoading: (loading, message = '') => set({ loading, loadingMessage: message }),
}));

