/**
 * UI and logic constants for the Expo application
 */

export const UI_CONFIG = {
  UNDO_SNACKBAR_DURATION: 5000, // ms
  MAX_RECENT_RECEIPTS: 5,
  SETTLEMENT_HISTORY_LIMIT: 50,
};

export const SCAN_CONFIG = {
  GHOST_OVERLAY_OPACITY: 0.3,
  MAX_STITCH_PHOTOS: 5,
  PRICE_SPIKE_THRESHOLD: 15, // in percent
  MAX_SEGMENTS: 5,
};

export const IMAGE_CONFIG = {
  RESIZE_WIDTH: 1080,
  COMPRESS_QUALITY: 0.7,
};

export const SCREENS = {
  LOGIN: 'Login',
  MAIN: 'Main',
  DASHBOARD: 'Dashboard',
  PANTRY: 'Pantry',
  SCAN: 'Scan',
  GROUPS: 'Groups',
  PROFILE: 'Profile',
  VERIFICATION: 'Verification',
  SPLIT: 'Split',
  LOYALTY_WALLET: 'LoyaltyWallet',
  SUBSCRIPTIONS: 'Subscriptions',
  SETTLEMENT: 'Settlement',
  RECEIPT_HISTORY: 'ReceiptHistory',
  PRIVACY: 'Privacy',
};
