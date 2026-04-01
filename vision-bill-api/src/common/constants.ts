/**
 * Application-wide constants to avoid magic numbers
 */

export const SCAN_LIMITS = {
  FREE_TIER_MONTHLY_LIMIT: 5,
  PRICE_HISTORY_COUNT: 10,
  PRICE_SPIKE_THRESHOLD_PERCENT: 15,
};

export const PDF_CONFIG = {
  PAGE_WIDTH: 1080,
  TEMP_DIR: 'uploads/temp_pdf',
  MAX_PAGES: 30,
};

export const CACHE_TTL = {
  STATS: 3600,   // 1 hour
  PANTRY: 3600,  // 1 hour
  RECIPES: 86400, // 24 hours — Gemini calls are expensive; invalidated on pantry change
};

export const FILE_UPLOAD_LIMITS = {
  MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
};

export const STORAGE_CONFIG = {
  RECEIPTS_FOLDER: 'vision-bill/receipts',
};

export const NOTIFICATION_STRINGS = {
  SCAN_COMPLETE_TITLE: 'Scan Complete! 🧾',
  SCAN_COMPLETE_BODY: 'Your receipt has been processed. Tap to view itemized breakdown.',
  PRICE_HIKE_ALERT: '🚨 Price Hike Alert',
  ITEMS_EXPIRING: '⚠️ Items Expiring Soon',
};

export const SETTLEMENT_CONFIG = {
  MIN_BALANCE: 0.01,
  PARTIAL_SETTLEMENT_DESC: 'Partial settlement',
};

export const PANTRY_CONFIG = {
  RECIPE_PROMPT_COUNT: 3,
};

export const REDIS_CONFIG = {
  DEFAULT_URL: 'redis://localhost:6379',
};

export const AUTH_CONFIG = {
  REFRESH_TOKEN_EXPIRES: '7d' as any,
  ACCESS_TOKEN_EXPIRES: '15m' as any,
};
