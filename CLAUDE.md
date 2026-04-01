# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

Monorepo with two independent projects:
- `vision-bill-api/` — NestJS 11 backend
- `vision-bill-app/` — React Native / Expo 54 mobile app

---

## Commands

### API (`vision-bill-api/`)

```bash
npm run start:dev       # development with hot-reload (watch mode)
npm run build           # compile TypeScript to dist/
npm run start:prod      # run compiled dist/main.js
npm run lint            # ESLint with auto-fix
npm run test            # run all unit tests (Jest)
npm run test:cov        # run tests with coverage report
npm run test:e2e        # run e2e tests (test/jest-e2e.json)

# Run a single spec file
npx jest <filename> --no-coverage
# e.g. npx jest normalizer.service.spec --no-coverage
```

Jest config: `rootDir=src`, pattern `*.spec.ts`. Tests live alongside source files.

### App (`vision-bill-app/`)

```bash
npx expo start          # start Expo dev server (Metro bundler)
npx expo start --android
npx expo start --ios
```

No test runner is configured in the app project.

---

## Environment Setup

### API `.env` (vision-bill-api/.env)

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/visionbill
JWT_SECRET=<secret>
GOOGLE_CLIENT_ID=<id>
GOOGLE_CLIENT_SECRET=<secret>
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
GEMINI_API_KEY=mock-gemini-key        # use 'mock-gemini-key' for stub responses
CLOUDINARY_URL=cloudinary://mock:mock@mock  # include 'mock' for local file fallback
REDIS_URL=redis://localhost:6379      # required for BullMQ queues + cache
```

**Mock modes**: When `GEMINI_API_KEY=mock-gemini-key`, both `OcrService` and `NormalizerService` return hardcoded stub data. When `CLOUDINARY_URL` contains `'mock'`, `StorageService.uploadImage()` returns the local file path unchanged instead of uploading.

### App API URL (`vision-bill-app/app.json`)

The base URL is in `app.json` under `expo.extra.apiUrl`. The app reads it via `Constants.expoConfig?.extra?.apiUrl`. Update this for physical device testing or production — `http://localhost:3000` only works on iOS Simulator / Android Emulator when the API runs on the same machine.

---

## API Architecture

### Module Map

```
src/
  auth/         → Google OAuth, JWT issue/refresh (bcrypt-hashed tokens), user CRUD, push token registration, account delete (cascade)
  scans/        → Receipt upload (image + PDF), multi-segment session, BullMQ enqueue, scan status/history
  scan.processor.ts → BullMQ worker: multimodal Gemini → Strategy → Reconcile → Pantry index → Push notify
  pantry/       → PantryItem upsert (bulkWrite), price history, stats aggregation, recipe AI, daily expiry cron
  split/        → Equal/itemized split calculation, WhatsApp deep-link generation
  settlement/   → Double-entry ledger (LedgerEntry), net balance aggregation, partial settlement
  groups/       → Group + member management (source for split participants)
  health/       → GET /health — MongoDB + Redis liveness probe
  common/       → AllExceptionsFilter, LoggingInterceptor, constants.ts, common-types.ts
```

### Shared Types and Constants

- `src/common-types.ts` — `AuthenticatedRequest`, `BillItemDto`, `UpdateItemsDto`, `ScanResponseDto`. Used across controllers and services.
- `src/common/constants.ts` — `SCAN_LIMITS`, `PDF_CONFIG`, `CACHE_TTL`, `FILE_UPLOAD_LIMITS`. All magic numbers live here.

### Scan Processing Pipeline

```
POST /api/v1/scans/upload
  → Tier check + monthly reset (checkAndResetUsage)
  → ImageManipulator resize (done on mobile before upload)
  → StitchingService (sharp) — vertically concatenates multi-segment images
  → BullMQ: enqueue job with { scanId, userId, localStitchedPath }
  → $inc monthlyScanCount

Worker (scan.processor.ts):
  → Read local stitched file from disk (localStitchedPath)
  → NormalizerService.normalizeImage(buffer) — single multimodal Gemini call
      returns { merchantName, items, cgst, sgst, taxTotal, total, billType, rawText }
  → StrategyFactory.getStrategy(billType).normalize(items)
  → Reconciler.reconcile(items, total)
  → StorageService.uploadImage(localStitchedPath) → Cloudinary
  → Scan.save(COMPLETED)
  → PantryService.indexScannedItems (bulkWrite upsert, price spike detection)
  → Push notification via expo-server-sdk
```

**Critical**: The local file path (`localStitchedPath`) must be passed in the job data. The Cloudinary upload happens **after** OCR in the worker, not before. If the local path is missing, the worker falls back to downloading from Cloudinary via `axios`.

### BullMQ Queues

- `scan-queue` — scan processing jobs, registered in `ScansModule` and `AppModule`
- `expiry-queue` — daily 9 AM cron (`0 9 * * *`) for pantry expiry notifications, registered in `PantryModule`

Both require Redis (`REDIS_URL`).

### Auth Flow

- Google OAuth → `AuthService.validateUser()` → issues `accessToken` (15m JWT) + `refreshToken` (7d JWT)
- Refresh token is stored as `bcrypt.hash(token, 10)` on `User.currentRefreshToken` — one token per user (single active session)
- Frontend intercepts 401 in `api.ts`, calls `refreshTokens()`, retries once; on failure calls `clearSession()` which triggers navigation to Login via `useAuthStore` state

### Global Middleware (main.ts)

- `helmet()` — security headers
- `ValidationPipe({ whitelist: true, transform: true })` — DTO validation on all endpoints
- `AllExceptionsFilter` — normalizes all errors; 500s return generic message, no stack leak
- `LoggingInterceptor` — logs `[METHOD] /path - Status: XXX - XXXms` for every request
- `ThrottlerGuard` (APP_GUARD) — 10 req/60s globally
- Winston logger wired to `NestFactory.create()` — replaces default NestJS console logger

---

## App Architecture

### Navigation Structure

```
App.tsx
  PersistQueryClientProvider (TanStack Query, AsyncStorage persister, 24h gcTime)
    ErrorBoundary
      AppTourProvider
        Stack.Navigator
          Login         ← shown when no accessToken in store
          Main          ← MainTabs (bottom tab navigator)
            Dashboard, Pantry, Scan(tab), Groups, Profile
          Verification  ← after scan completes
          Split         ← bill splitting
          Settlement    ← net balance / payment tracking
          ReceiptHistory
          LoyaltyWallet
          Subscriptions
```

### State Management Layers

| Store | What it holds | Persistence |
|---|---|---|
| `useAuthStore` (Zustand) | `accessToken`, `userId`, `tier`, `monthlyScanCount` | `expo-secure-store` |
| `useScanStore` (Zustand) | Current scan in progress, image list, loading state, last deleted | In-memory |
| `useSubscriptionStore` (Zustand) | Subscription tracker entries | AsyncStorage |
| `useLoyaltyStore` (Zustand) | Loyalty card barcodes | AsyncStorage |
| React Query | All server data (scans, pantry, groups, stats, balances) | AsyncStorage via `PersistQueryClientProvider` |

### API Client (`src/utils/api.ts`)

Axios instance with:
- Base URL from `Constants.expoConfig?.extra?.apiUrl` (set in `app.json`)
- Request interceptor: attaches `Bearer <token>` from `expo-secure-store`
- Response interceptor: on 401, refreshes token and retries once; on retry failure clears session

### Paywall Pattern

Free tier = 5 scans/month. Enforced in two places:
1. **Client** (`ScannerScreen`, `DashboardScreen`): checks `tier` + `monthlyScanCount` from `useAuthStore`, shows `PaywallModal`
2. **Server** (`ScansService.createScan`): re-checks and throws `BadRequestException` if limit exceeded

---

## Key Patterns

### Adding a New BillType Strategy

1. Create `src/scans/strategies/<type>.strategy.ts` implementing `BillStrategy`
2. Register in `StrategyFactory.getStrategy()` switch

### Adding a New API Endpoint

- Add `@UseGuards(JwtAuthGuard)` at the controller class level (not per-method) — all routes on a controller are protected by default
- Use `AuthenticatedRequest` from `common-types.ts` for `@Req()` typed requests
- Use `@Query('param')` for query params; service pagination signature: `findAll(userId, limit?, page?)`

### PantryItem Indexing

`indexScannedItems` uses a single `bulkWrite` — one `find` to load existing items by `cleanName $in`, then one `bulkWrite` for all upserts. Do not reintroduce per-item `findOne` loops.

### PII Scrubbing

`NormalizerService.scrubPII(text)` — static method, call before persisting any OCR raw text. Masks card numbers, expiry dates, Indian phone numbers (`+91`/`+XXX` format, 10-digit suffix), and email addresses.

---

## Infrastructure Dependencies

Local development requires:
- **MongoDB** on `localhost:27017`
- **Redis** on `localhost:6379` (BullMQ queues + Redis cache)

Both `GEMINI_API_KEY` and `CLOUDINARY_URL` can be left as mock values in `.env` for development — the services detect mock mode and return stub responses.
