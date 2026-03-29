export interface BillItem {
  shorthand: string;
  cleanName: string;
  category: string;
  qty: number;
  price: number;
  unit?: string;
  checked?: boolean;
  assignedParticipants?: { participantId: string; share: number }[];
  isSplit?: boolean;
}

export interface Scan {
  _id: string;
  userId: string;
  imageUrl: string;
  items: BillItem[];
  extractedTotal: number;
  billType: 'grocery' | 'restaurant';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

export interface ScanResponse {
  scan: Scan;
  isReconciled: boolean;
}

export interface ScanSession {
  _id: string;
  userId: string;
  segmentPaths: string[];
  isFinalized: boolean;
}
