/**
 * Application-wide constants to avoid magic numbers
 */

export const SCAN_LIMITS = {
  FREE_TIER_MONTHLY_LIMIT: 5,
  PRICE_HISTORY_COUNT: 10,
  PRICE_SPIKE_THRESHOLD_PERCENT: 15,
  MAX_SEGMENTS: 5,
};

export const GEMINI_CONFIG = {
  MODEL_NAME: 'gemini-1.5-flash',
  STUB_KEY_FALLBACK: 'stub-key',
  MOCK_KEY_CHECK: 'mock-gemini-key',
};

export const IMAGE_CONFIG = {
  MAX_PIXELS: 100 * 1000 * 1000, // 100 Megapixels
  JPEG_QUALITY: 80,
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

export const THROTTLER_CONFIG = {
  TTL_MS: 60000,
  LIMIT: 10,
};

export const SHELF_LIFE_CONFIG = {
  DAYS_BY_CATEGORY: {
    Dairy: 3,
    Veggies: 5,
    Meat: 2,
    Beverages: 30,
    Snacks: 30,
    Household: 180,
    'Personal Care': 365,
  } as Record<string, number>,
  DEFAULT_SHELF_LIFE: 7,
  ALERT_DAYS_BEFORE: 2,
};

export const EXPIRY_CRON = {
  PATTERN: '0 9 * * *',
  JOB_ID: 'daily-expiry-check',
};

export const GAMIFICATION_THRESHOLDS = {
  STREAK_MIN: 3,
  SAVINGS_MIN: 200,
  ITEMS_COUNT_MIN: 50,
};

export const HISTORY_LIMITS = {
  SETTLEMENT_HISTORY: 50,
  STREAK_CALCULATION_LOOKBACK: 50,
};
