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
};

export const CACHE_TTL = {
  STATS: 3600, // 1 hour
  PANTRY: 3600,
};

export const FILE_UPLOAD_LIMITS = {
  MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
};
