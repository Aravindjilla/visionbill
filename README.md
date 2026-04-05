# VisionBill — AI-Powered Receipt Scanner & Expense Tracker

VisionBill transforms paper receipts into structured financial data using Google Gemini AI. It provides item-level expense tracking, shared pantry management, bill splitting with UPI deep links, and settlement tracking — all in a React Native mobile app backed by a NestJS API.

---

## Repository Structure

```
shining-pathfinder/
├── vision-bill-api/      # NestJS 11 backend
└── vision-bill-app/      # React Native / Expo 54 mobile app
```

---

## Features

- **AI Receipt OCR** — Single Gemini 1.5 Flash multimodal call extracts merchant, items, taxes, and totals
- **Multi-segment scanning** — Ghost-overlay alignment for long bills; segments stitched server-side with Sharp
- **PDF upload** — Up to 30 pages converted to JPEG and processed as a scan
- **Pantry tracking** — Auto-indexes scanned items, tracks price history, detects price spikes (>15%)
- **Bill splitting** — Equal and itemized splits; generates WhatsApp deep links with UPI payment URLs
- **Settlement ledger** — Double-entry ledger, net balance aggregation, partial settlement support
- **Groups** — Manage recurring split participants
- **Recipe suggestions** — Gemini-powered suggestions from current pantry contents (cached 24 hrs)
- **Expiry alerts** — Daily 9 AM cron checks shelf-life per category and sends push notifications
- **Free / Pro tiers** — Free tier: 5 scans/month; enforced both client-side and server-side

---

## Tech Stack

### Backend (`vision-bill-api/`)

| Layer | Technology |
|---|---|
| Framework | NestJS 11 |
| Database | MongoDB via Mongoose 9 |
| Job queue | BullMQ 5 + Redis (ioredis) |
| AI / OCR | Google Gemini 1.5 Flash (`@google/generative-ai`) |
| Image storage | Cloudinary 2 |
| Image processing | Sharp 0.34 (server-side stitching) |
| Auth | Google OAuth 2.0 + JWT (access: 15 min, refresh: 7 days) |
| Security | Helmet, bcrypt, `@nestjs/throttler` (10 req / 60 s global) |
| Logging | Winston + nest-winston |
| Validation | class-validator, class-transformer, Joi |
| Push notifications | Expo Server SDK |
| API docs | Swagger / OpenAPI (development only, `/api/docs`) |

### Frontend (`vision-bill-app/`)

| Layer | Technology |
|---|---|
| Framework | React Native + Expo SDK 54 (New Architecture) |
| Language | TypeScript |
| Navigation | React Navigation 7 (Stack + Bottom Tabs) |
| Server state | TanStack Query v5 + AsyncStorage persister |
| Client state | Zustand 5 (auth, scan, subscriptions, loyalty) |
| HTTP client | Axios (with 401 interceptor + token refresh) |
| Auth | expo-auth-session + Google OAuth (`useIdTokenAuthRequest`) |
| Secure storage | expo-secure-store (tokens) |
| Animations | Lottie React Native, Moti, React Native Reanimated 4 |
| Charts | React Native Chart Kit |
| Build | EAS Build (development / preview / production profiles) |

---

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB running on `localhost:27017` (or a MongoDB Atlas URI)
- Redis running on `localhost:6379` (or Upstash / Redis Cloud URI)

### Backend Setup

```bash
cd vision-bill-api
npm install
cp .env .env.local   # fill in all values (see table below)
npm run start:dev
```

#### Required environment variables

| Variable | Description |
|---|---|
| `PORT` | API port (default `3000`) |
| `MONGODB_URI` | MongoDB connection string |
| `REDIS_URL` | Redis connection string (e.g. `redis://localhost:6379`) |
| `JWT_SECRET` | Secret for signing JWT access + refresh tokens — **use a strong random value** |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 Client Secret |
| `GOOGLE_CALLBACK_URL` | OAuth redirect URI (e.g. `https://yourapi.com/api/auth/google/callback`) |
| `GEMINI_API_KEY` | Google AI Studio / Cloud API key. Set to `mock-gemini-key` for stub responses |
| `CLOUDINARY_URL` | Cloudinary connection URL. Include `mock` in the string for local-file fallback |
| `NODE_ENV` | `development` \| `production` \| `test` |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins (e.g. `https://yourdomain.com`) |
| `LOG_LEVEL` | Winston log level (default `info`) |

> **Mock modes**: `GEMINI_API_KEY=mock-gemini-key` returns hardcoded OCR stub data. `CLOUDINARY_URL` containing `mock` skips upload and returns the local file path.

#### API commands

```bash
npm run start:dev     # development with hot-reload
npm run build         # compile TypeScript → dist/
npm run start:prod    # run compiled dist/main.js
npm run test          # run all unit tests (Jest)
npm run test:cov      # tests with coverage
npm run lint          # ESLint with auto-fix
```

### Mobile App Setup

```bash
cd vision-bill-app
npm install
```

Set the API base URL in `app.json`:
```json
"extra": {
  "apiUrl": "http://localhost:3000",
  "googleClientId": "YOUR_GOOGLE_OAUTH_CLIENT_ID"
}
```

> For physical device testing replace `localhost` with your machine's LAN IP or your deployed API URL.

```bash
npx expo start            # Metro bundler
npx expo start --android
npx expo start --ios
```

#### EAS builds

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile production
eas build --platform ios --profile production
eas submit --platform android --profile production
```

---

## API Architecture

### Module map

```
src/
  auth/             → Google OAuth, JWT issue/refresh, user CRUD, push token registration
  scans/            → Receipt upload (image + PDF), multi-segment sessions, BullMQ enqueue
  scan.processor.ts → BullMQ worker: Gemini OCR → Strategy → Reconcile → Pantry index → Push notify
  pantry/           → PantryItem upsert (bulkWrite), price history, stats, recipe AI, expiry cron
  split/            → Equal/itemized split calculation, WhatsApp deep-link generation
  settlement/       → Double-entry ledger, net balance aggregation, partial settlement
  groups/           → Group + member management
  health/           → GET /health/live, GET /health/ready — liveness + readiness probes
  common/           → AllExceptionsFilter, LoggingInterceptor, constants.ts, common-types.ts
```

### Scan processing pipeline

```
POST /api/scans/upload
  → Tier check + monthly reset
  → StitchingService (Sharp) — vertically concatenates multi-segment images
  → BullMQ: enqueue job { scanId, userId, localStitchedPath }
  → $inc monthlyScanCount

Worker (scan.processor.ts):
  → Read stitched file from disk
  → NormalizerService — single Gemini multimodal call
      returns { merchantName, items, cgst, sgst, taxTotal, total, billType, rawText }
  → StrategyFactory.getStrategy(billType).normalize(items)
  → Reconciler.reconcile(items, total)
  → StorageService.uploadImage → Cloudinary
  → Scan.save(COMPLETED)
  → PantryService.indexScannedItems (bulkWrite upsert, price spike detection)
  → Push notification via expo-server-sdk
```

### Health endpoints

```
GET /health/live    → 200 if process is running
GET /health/ready   → 200 if MongoDB + Redis are reachable; 503 otherwise
GET /health         → alias for /ready
```

### Auth flow

1. Mobile calls `POST /auth/google-mobile` with a Google ID token (verified server-side via `google-auth-library`)
2. Server issues `accessToken` (15 min JWT) + `refreshToken` (7 day JWT, bcrypt-hashed and stored on user)
3. Mobile stores both tokens in `expo-secure-store`
4. Axios interceptor automatically calls `POST /auth/refresh` on 401 and retries once

---

## App Architecture

### Navigation

```
App.tsx
  PersistQueryClientProvider (TanStack Query + AsyncStorage, 24 hr gcTime)
    ErrorBoundary
      AppTourProvider
        Stack.Navigator
          Login / Onboarding
          Main (Bottom Tabs: Dashboard, Pantry, Scan, Groups, Profile)
          Verification, Split, Settlement, ReceiptHistory
          LoyaltyWallet, Subscriptions
          Privacy, Terms
```

### State management

| Store | Contents | Persistence |
|---|---|---|
| `useAuthStore` (Zustand) | `accessToken`, `userId`, `tier`, `monthlyScanCount` | expo-secure-store |
| `useScanStore` (Zustand) | Current scan in progress, image list, loading state | In-memory |
| `useSubscriptionStore` (Zustand) | Subscription tracker entries | AsyncStorage |
| `useLoyaltyStore` (Zustand) | Loyalty card barcodes | AsyncStorage |
| React Query | All server data (scans, pantry, groups, stats, balances) | AsyncStorage (persisted) |

---

## Key Configuration

### Scan limits (constants.ts)

| Setting | Value |
|---|---|
| Free tier monthly scans | 5 |
| Price spike alert threshold | 15% |
| Max upload size | 10 MB |
| Max PDF pages | 30 |
| Max stitch segments | 5 |

### Caching (Redis TTLs)

| Key pattern | TTL |
|---|---|
| `stats:{userId}` | 1 hour |
| `pantry:{userId}:*` | 1 hour |
| `recipes:{userId}` | 24 hours |

---

## Project Documents

| Document | Description |
|---|---|
| [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) | Security & production readiness checklist with status |
| [FUNCTIONAL_FLOW.md](./FUNCTIONAL_FLOW.md) | Full API endpoint map and screen flow diagrams |
| [FULL_FUNCTIONAL_FLOW.md](./FULL_FUNCTIONAL_FLOW.md) | Extended functional audit |
| [DeploymentGuide.md](./DeploymentGuide.md) | Deployment steps for Vercel + mobile stores |
| [StoreListing.md](./StoreListing.md) | App Store and Play Store metadata |
| [CLAUDE.md](./CLAUDE.md) | AI assistant context for this codebase |
