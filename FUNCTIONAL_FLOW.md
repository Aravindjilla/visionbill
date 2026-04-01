# VisionBill — Application Functional Flow

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    VisionBill Architecture                   │
│                                                              │
│  [Mobile App]  ←─ REST ─→  [NestJS API]  ←→  [MongoDB]      │
│  React Native               Port 3000         Database       │
│  Expo 54                        │                            │
│                            [BullMQ]  ←→  [Redis]             │
│                            Workers         Queue/Cache        │
│                                │                             │
│                          [Gemini AI]  [Cloudinary]           │
│                          OCR/Normalize  Image CDN            │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Authentication Flow

```
User taps "Continue with Google"
        │
        ▼
GET /auth/google  ──→  Google OAuth Consent Screen
        │
        ▼ (callback with code)
GET /auth/google/callback
        │
        ▼
AuthService.validateUser()
  ├─ User exists?  →  Update displayName, avatar, lastLogin
  └─ New user?     →  Create User document in MongoDB
        │
        ▼
AuthService.generateTokens(user)
  ├─ accessToken   (JWT, 15 min, payload: { email, sub: userId })
  └─ refreshToken  (JWT, 7 days, bcrypt-hashed → stored in User.currentRefreshToken)
        │
        ▼
Client stores tokens in expo-secure-store
        │
        ▼
useAuthStore.setSession(accessToken, userId, tier, monthlyScanCount)
        │
        ▼
Navigate → Main (Dashboard)

─────────────────────────────────
TOKEN REFRESH (on 401 response):
─────────────────────────────────
api.ts interceptor detects 401
        │
        ▼
POST /auth/refresh  { userId, refreshToken }
  ├─ AuthService.refresh()
  │   ├─ Fetch user by userId
  │   ├─ bcrypt.compare(incoming, user.currentRefreshToken)
  │   └─ If match → generateTokens() → return new pair
  └─ If mismatch → throw UnauthorizedException
        │
   ┌────┴────┐
success    failure
   │           │
retry      clearSession()
original   → Navigate → Login
request
```

---

## 2. Receipt Scan Pipeline

### 2a. Upload Phase (Synchronous — Frontend → API)

```
ScannerScreen
  │
  ├─ Paywall check: tier + monthlyScanCount < 5?
  │   └─ No → PaywallModal (upgrade prompt)
  │
  ├─ User captures 1–5 image segments (camera or gallery)
  │   └─ ImageManipulator: resize + compress locally before upload
  │
  ├─ Single image:
  │   POST /scans/upload   (multipart, up to 10 images)
  │
  └─ Multi-segment (long bill):
      POST /scans/session/init
      POST /scans/session/:id/segment  (repeat per segment)
      POST /scans/session/:id/finalize
            │
            ▼
ScansService.createScan()
  ├─ Check monthly limit (throw BadRequestException if exceeded)
  ├─ StitchingService.stitchImages()  [sharp — vertical concat]
  ├─ Create Scan doc { status: PROCESSING, imageUrl: 'processing...' }
  ├─ Enqueue BullMQ job { scanId, userId, localStitchedPath }
  ├─ $inc user.monthlyScanCount
  └─ Return { scan, status: 'Processing started' }  ← immediate response
```

### 2b. Processing Phase (Async — BullMQ Worker)

```
ScanProcessor consumes job from 'scan-queue'
        │
        ▼
Read stitched image from disk (localStitchedPath)
  └─ If path missing → axios.get(scan.imageUrl) as fallback
        │
        ▼
NormalizerService.normalizeImage(imageBuffer)
  └─ Gemini 1.5 Flash multimodal API (single call)
      Input:  receipt image (base64) + structured prompt
      Output: {
        merchantName, merchantAddress,
        items: [{ name, price, category, qty, unit }],
        billType,  extractedTotal,
        cgst, sgst, taxTotal,
        rawText
      }
        │
        ▼
StrategyFactory.getStrategy(billType)
  ├─ 'grocery'    → GroceryStrategy.normalize(items)
  └─ 'restaurant' → RestaurantStrategy.normalize(items)
        │
        ▼
Update Scan document:
  { rawText: scrubPII(rawText), items, extractedTotal,
    billType, merchantName, merchantAddress,
    taxTotal, cgst, sgst, status: COMPLETED }
        │
        ▼
StorageService.uploadImage(localStitchedPath)
  └─ Cloudinary upload → returns secure CDN URL
  scan.imageUrl = cloudUrl
  scan.save()
        │
        ▼
PantryService.indexScannedItems(userId, items)
  └─ [see Pantry Indexing flow below]
        │
        ▼
NotificationService.sendNotification(user.pushToken,
  "Scan Complete! 🧾",
  "Processed N items. Tap to verify and split.",
  { scanId })
        │
        ▼
User taps notification → app opens VerificationScreen
```

---

## 3. Verification & Item Correction Flow

```
VerificationScreen (receives scanId)
  │
  ├─ Display stitched receipt image (scan.imageUrl)
  ├─ Items grouped by category from useScanStore
  │
  ├─ Per item actions:
  │   ├─ Toggle include/exclude
  │   └─ Edit price inline
  │
  └─ User taps "Confirm"
          │
          ▼
      PATCH /scans/:id/items  { items: [...corrected...] }
          │
          ▼
      ScansService.updateItems()
      → Persist corrected items to MongoDB
          │
          ▼
      Navigate → SplitScreen
```

---

## 4. Split & Settlement Flow

### 4a. Split Calculation

```
SplitScreen
  │
  ├─ GET /groups              → fetch user's groups + members
  ├─ GET /users/profile/:id   → fetch own UPI ID
  │
  ├─ Mode A: EQUAL SPLIT
  │   SplitService.calculateEqualSplit(total, participants)
  │   ├─ Share = floor(total * 100 / count) / 100  [cents math]
  │   ├─ Remainder distributed to first N participants
  │   └─ Each participant: { name, mobile, share, whatsappLink }
  │
  └─ Mode B: ITEMIZED SPLIT
      SplitService.calculateItemizedSplit(items, participants)
      ├─ User assigns items to specific participants
      └─ Each participant: { name, mobile, share, items[], whatsappLink }
          │
          ▼
WhatsappService.generateDeepLink()
  └─ wa.me/:mobile?text=<encoded bill summary + UPI ID + amount>
          │
          ▼
User taps "Record Expense"
          │
          ▼
POST /split/settlement/record
  { userId, participants[], description, scanId }
          │
          ▼
SettlementService.recordExpense()
  └─ Create LedgerEntry per participant:
     { userId, counterpartyName, counterpartyMobile,
       amount, description, scanId, isSettled: false }
```

### 4b. Settlement Resolution

```
SettlementScreen
  │
  ├─ GET /split/settlement/balances
  │   SettlementService.getBalances(userId)
  │   ├─ Aggregate all unsettled LedgerEntries by counterpartyMobile
  │   ├─ netAmount > 0  →  "Owed to Me"  list
  │   └─ netAmount < 0  →  "I Owe"       list
  │
  ├─ User taps "Settle" for a counterparty
  │   └─ Input settlement amount in modal
  │
  └─ POST /split/settlement/settle { counterpartyMobile, amount }
      SettlementService.settle()
      ├─ Find unsettled entries for that counterparty
      ├─ Mark entries isSettled: true (most recent first)
      │   until consumed amount is exhausted
      └─ Return settled entries → React Query cache invalidated
```

---

## 5. Pantry Indexing Flow

```
[Triggered by ScanProcessor after every completed scan]

PantryService.indexScannedItems(userId, items[])
        │
        ▼
Single DB read:
  PantryItem.find({ userId, cleanName: { $in: item names } })
        │
        ▼
For each item:
  ├─ Exists in pantry?
  │   ├─ Same-day entry already recorded? → skip
  │   ├─ Price changed?
  │   │   ├─ Append to priceHistory (keep last 30 entries)
  │   │   ├─ Calculate % change from lastPrice
  │   │   └─ > PRICE_SPIKE_THRESHOLD (20%)?
  │   │       └─ NotificationService.sendNotification() "Price spike alert"
  │   └─ Update currentPrice, lastUpdated
  │
  └─ New item?
      └─ Insert: { userId, cleanName, category, currentPrice,
                   unit, priceHistory: [{ date, price }] }
        │
        ▼
Single bulkWrite() to MongoDB (all upserts in one operation)
        │
        ▼
CacheService.invalidate(userId)  [clears Redis pantry cache]

─────────────────────────────────
DAILY EXPIRY ALERTS (9 AM cron):
─────────────────────────────────
ExpiryProcessor ('expiry-queue')
  ├─ Query: PantryItem.find({ expiresAt: { $lte: now + 2 days } })
  ├─ Group by userId
  └─ Per user → NotificationService.sendNotification()
      "N items expiring soon: Milk (2d), Tomatoes (1d), ..."
```

---

## 6. API Endpoint Reference

### Auth  (`/auth`)

| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| GET | `/auth/google` | Google OAuth | Initiate OAuth flow |
| GET | `/auth/google/callback` | Google OAuth | OAuth callback → issue JWT tokens |
| POST | `/auth/refresh` | None | Refresh access token |
| GET | `/auth/status` | None | Health check |

### Scans  (`/scans`) — all require `JwtAuthGuard`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/scans/upload` | Upload 1–10 images directly |
| POST | `/scans/upload-pdf` | Upload PDF bill (auto-converted) |
| POST | `/scans/session/init` | Init multi-segment session |
| POST | `/scans/session/:id/segment` | Add image segment |
| POST | `/scans/session/:id/finalize` | Finalize → enqueue processing |
| POST | `/scans/demo-seed` | Seed a sample demo receipt |
| GET | `/scans` | List scans (paginated, `?limit&page`) |
| GET | `/scans/:id` | Get single scan |
| PATCH | `/scans/:id/items` | Update extracted items |
| DELETE | `/scans/:id` | Soft-delete scan |
| POST | `/scans/:id/restore` | Restore deleted scan |

### Pantry  (`/pantry`)

| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| GET | `/pantry` | None* | All pantry items |
| GET | `/pantry/stats` | None* | Category/price stats (`$facet` aggregation) |
| GET | `/pantry/weekly-trend` | None* | 7-day price trend |
| POST | `/pantry/recipes` | None* | AI recipe suggestions (Gemini) |

*Falls back to `demo-user-id` when unauthenticated

### Split & Settlement  (`/split`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/split/calculate` | Equal split |
| POST | `/split/itemized` | Itemized split |
| POST | `/split/settlement/record` | Record expense in ledger |
| GET | `/split/settlement/balances` | Net balance per counterparty |
| POST | `/split/settlement/settle` | Mark entries settled |
| GET | `/split/settlement/history` | Transaction history (`?mobile=`) |

### Groups  (`/groups`) — all require `JwtAuthGuard`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/groups` | Create group |
| GET | `/groups` | List user's groups |
| PUT | `/groups/:id` | Update group |
| DELETE | `/groups/:id` | Delete group |
| POST | `/groups/:id/members` | Add member |
| DELETE | `/groups/:id/members/:index` | Remove member |

### Users  (`/users`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users/profile/:id` | Get profile (public) |
| POST | `/users/profile/:id` | Update mobile, upiId, savingsGoal |
| POST | `/users/push-token/:id` | Register push token |
| DELETE | `/users/:id` | Delete account (cascade) |

### System

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | MongoDB + Redis liveness probe |
| GET | `/` | Welcome message |

---

## 7. Screen Navigation Map

```
                          ┌──────────────┐
             first run ──►│ Onboarding   │
                          └──────┬───────┘
                                 │ finish
                          ┌──────▼───────┐
              no token ──►│    Login     │◄── clearSession()
                          └──────┬───────┘
                          Google OAuth
                          └──────▼───────┐
                          ┌──────────────┤
                          │  Main Tabs   │
                          │  (Bottom Nav)│
                          └──┬──┬──┬──┬─┘
                 ┌───────────┘  │  │  └──────────────┐
                 ▼              ▼  ▼                  ▼
           Dashboard        Pantry Groups          Profile
               │               │
     ┌─────────┼───────┐       │ stats / trends / recipes
     │         │       │       │
     ▼         ▼       ▼       │
  Scanner  Receipt  Settlement │
  (Tab)    History             │
     │                         │
     │ capture                 │
     ▼                         │
Verification ──────────────────┘ (items indexed → pantry)
     │
     ▼
  Split ────────────────────────────────► Settlement
     │
     └─► WhatsApp deep-link (share)


  ─── Modals / overlays ───
  PaywallModal     (from Scanner or Dashboard when limit hit)
  GroupPickerModal (from SplitScreen)
  SettleModal      (from SettlementScreen)
```

---

## 8. State Management Summary

| Store | Contents | Persistence |
|-------|----------|-------------|
| `useAuthStore` (Zustand) | `accessToken`, `userId`, `tier`, `monthlyScanCount` | `expo-secure-store` |
| `useScanStore` (Zustand) | Active scan images, loading state, last deleted | In-memory |
| `useSubscriptionStore` (Zustand) | Subscription tracker entries | AsyncStorage |
| `useLoyaltyStore` (Zustand) | Loyalty card barcodes | AsyncStorage |
| React Query | All server data — scans, pantry, groups, balances | AsyncStorage (PersistQueryClientProvider, 24h gcTime) |

---

## 9. Background Jobs

| Queue | Trigger | Job | Handler |
|-------|---------|-----|---------|
| `scan-queue` | POST /scans/upload (finalize) | `{ scanId, userId, localStitchedPath }` | `ScanProcessor` |
| `expiry-queue` | Cron `0 9 * * *` (daily 9 AM) | `{ userId }` | `ExpiryProcessor` |

---

## 10. Key Data Models (Schema Summary)

```
User
  _id, email, displayName, avatar, googleId
  tier: 'free' | 'pro'
  monthlyScanCount, lastResetMonth
  currentRefreshToken (bcrypt hash)
  pushToken, mobile, upiId, savingsGoal

Scan
  userId, imageUrl, status: PROCESSING | COMPLETED | FAILED | DELETED
  rawText (PII-scrubbed), items[], billType
  extractedTotal, merchantName, merchantAddress
  taxTotal, cgst, sgst
  createdAt  [index: userId + status + createdAt]

PantryItem
  userId, cleanName, shorthand, category
  currentPrice, lastPrice, unit
  priceHistory: [{ date, price }]  (max 30 entries)
  expiresAt  [index for expiry queries]

LedgerEntry
  userId, counterpartyName, counterpartyMobile
  amount, description, scanId
  isSettled: boolean

Group
  userId, name, members: [{ name, mobile, upiId }]
```
