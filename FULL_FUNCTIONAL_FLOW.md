# VisionBill — Complete Functional Flow Document

> **Based on actual codebase audit of `vision-bill-api` (NestJS) + `vision-bill-app` (React Native / Expo 54)**

---

## System Architecture

```
[React Native App]  <-- REST/JWT -->  [NestJS API :3000]
 Expo 54                                      |
 Zustand + React Query                   [MongoDB]
 AsyncStorage (24h cache)                     |
 expo-secure-store (tokens)              [BullMQ] <-- [Redis]
                                         Queues/Cache
                                              |
                                        [Gemini 1.5 Flash]
                                        OCR + Normalization
                                              |
                                        [Cloudinary CDN]
                                              |
                                        [Expo Push Service]
```

---

## FLOW 1 — App Launch & Onboarding

### 1a. First-Time App Launch (Onboarding)

```
App.tsx initializes
    |
    v
Check AsyncStorage for 'HAS_ONBOARDED'
    |
    +-- Key MISSING --> Show OnboardingScreen
    |     |
    |     v
    |   3-slide horizontal carousel (Lottie animations):
    |     Slide 1: "Precision AI Scanning" (Gemini receipt extraction)
    |     Slide 2: "Smart Pantry Insights" (price tracking)
    |     Slide 3: "Effortless Bill Splitting" (WhatsApp + UPI)
    |     |
    |     v
    |   User taps "Next" --> scrolls slides
    |   User taps "Start Scanning" (last slide) OR "Skip Onboarding"
    |     |
    |     v
    |   AsyncStorage.setItem('HAS_ONBOARDED', 'true')
    |   --> Render main App navigation tree
    |
    +-- Key EXISTS --> Skip to Auth Check
```

### 1b. Auth Check (Every Launch)

```
useAuthStore.initialize()
    |
    v
Read accessToken from expo-secure-store
    |
    +-- Token EXISTS
    |     --> Set accessToken + userId + tier + monthlyScanCount in store
    |     --> Navigate to Main (Dashboard Tabs)
    |
    +-- Token MISSING
          --> Navigate to LoginScreen
```

### 1c. Font + Splash Screen Handling

```
App.tsx
    |
    v
SplashScreen.preventAutoHideAsync()
    |
    v
Load Google Fonts:
  Inter_400Regular, Inter_600SemiBold, Inter_700Bold
  Outfit_600SemiBold, Outfit_700Bold
    |
    v
fontsLoaded && !isAuthLoading?
    +-- No  --> Render null (splash stays visible)
    +-- Yes --> Splash auto-hides, render navigation
```

---

## FLOW 2 — Authentication

### 2a. Google OAuth Login

```
LoginScreen
    |
    v
User taps "Continue with Google"
    |
    v
GET /auth/google --> Google OAuth Consent Screen
    |
    v  (callback with auth code)
GET /auth/google/callback
    |
    v
AuthService.validateUser()
    +-- User EXISTS? --> Update displayName, avatar, lastLogin
    +-- NEW User?    --> Create User document in MongoDB
    |
    v
AuthService.generateTokens(user)
    +-- accessToken  --> JWT (15 min), payload: { email, sub: userId }
    +-- refreshToken --> JWT (7 days), bcrypt-hashed, stored in User.currentRefreshToken
    |
    v
Client stores in expo-secure-store:
    accessToken, userId, tier, monthlyScanCount
    |
    v
useAuthStore.setSession(...) --> state updated
    |
    v
Navigate --> Main (Bottom Tab Navigator)
    |
    v
registerForPushNotificationsAsync()
    +-- Device.isDevice? --> request Expo push permission
    +-- Get Expo push token --> POST /users/push-token/:userId
    +-- Android: Set notification channel with MAX importance
```

### 2b. Token Refresh (Automatic on 401)

```
Any API call --> 401 Unauthorized response
    |
    v
api.ts interceptor (response handler)
    |
    v
!originalRequest._retry?
    +-- YES --> Mark _retry = true
    |     |
    |     v
    |   refreshTokens() from auth.ts
    |     --> POST /auth/refresh { userId, refreshToken }
    |     |
    |     v
    |   AuthService.refresh()
    |     +-- findById(userId) --> fetch User
    |     +-- Check user !== null && user.currentRefreshToken !== null
    |     +-- bcrypt.compare(incoming, hashed)
    |         +-- MATCH    --> generateTokens() --> new accessToken + refreshToken
    |         +-- MISMATCH --> throw UnauthorizedException
    |     |
    |     v
    |   Store new tokens in expo-secure-store
    |   Retry original request with new Authorization header
    |
    +-- Already retried / refresh FAILED
          |
          v
        useAuthStore.getState().clearSession()
        --> All tokens cleared from secure store
        --> App.tsx detects store change --> Navigate to Login
```

### 2c. Logout & Account Deletion

```
ProfileScreen --> "Logout Session"
    |
    v
Alert confirmation
    +-- Confirmed --> clearSession() --> Navigate to Login

ProfileScreen --> "Delete My Account Permanently"
    |
    v
Alert (destructive confirmation)
    |
    v
DELETE /users/:id
    +-- API cascades deletion of all user data
    --> clearSession() --> Alert "Account Wiped"
```

---

## FLOW 3 — Receipt Scan Pipeline

### 3a. Scan Limit Check (Paywall Gate)

```
ScannerScreen mounts
    |
    v
useAuthStore: read tier + monthlyScanCount
    |
    v
tier === 'free' && monthlyScanCount >= 5?
    +-- YES --> setPaywallVisible(true)
    |     --> PaywallModal renders (animated, MotiView + LinearGradient)
    |         Features: Unlimited scans, Shared pantries,
    |         Analytics, Export to Excel/PDF
    |         Price: Rs.49/month Pro plan
    |         "Get Pro" button (payment flow not yet wired)
    |         "Maybe Later" --> close modal
    |
    +-- NO  --> Scanner is usable
```

### 3b. Capture Phase

```
ScannerScreen
    |
    v
Camera feed (CameraView, facing: back)
    |
    +-- MODE: Single Receipt (default)
    |     |
    |     +-- Capture button --> camera.takePictureAsync()
    |     |     +-- Immediately calls processScan([photo])
    |     |
    |     +-- Gallery button --> ImagePicker (LIMIT GATE first)
    |     |     +-- Single image --> processScan([asset])
    |     |
    |     +-- PDF button --> DocumentPicker
    |           +-- POST /scans/upload-pdf (multipart)
    |
    +-- MODE: Long Bill (toggle switch)
          |
          +-- Ghost overlay: last captured frame at 30% opacity (alignment aid)
          +-- "Segment N" header shows current count
          +-- Each capture --> addImage(photo) to local store (max 5)
          |
          +-- "Finish (N)" button --> processScan(currentImages[])
```

### 3c. Image Pre-processing (Frontend)

```
processScan(photos[])
    |
    v
For each photo:
  ImageManipulator.manipulateAsync()
    +-- Resize to width: 1080px
    +-- Compress to 0.7 quality, JPEG format
    |
    v
Build FormData: append each image as 'images' field
    |
    v
POST /scans/upload  (multipart/form-data, up to 10 images)
    |
    +-- SUCCESS --> setScan(response.data.scan) --> Navigate --> Verification
    |
    +-- FAILURE --> Haptics.Error notification
          --> Apply MOCK fallback scan data (3 demo items, dev safety net)
          --> setScan(mockScan) --> Navigate --> Verification anyway
          --> Error banner shown to user
```

### 3d. Backend Upload Handler (Synchronous)

```
POST /scans/upload --> ScansController.uploadScan()
    |
    +-- Multer: max 10 files, 10MB each, JPG/PNG only (filter enforced)
    |
    v
ScansService.createScan(userId, files[])
    |
    +-- findById(userId) --> verify user exists
    +-- checkAndResetUsage(user)
    |     +-- New calendar month (YYYY-MM)? Reset monthlyScanCount to 0
    +-- tier === 'free' && count >= 5? --> throw BadRequestException
    |
    v
_enqueueScan(userId, imagePaths[])
    |
    +-- StitchingService.stitchImages(imagePaths)
    |     +-- 1 image  --> return path as-is (no stitching needed)
    |     +-- N images --> sharp vertical composite:
    |           - Read metadata (width, height per image)
    |           - Safety guard: maxWidth x totalHeight < 100MP (OOM prevention)
    |           - Create white canvas (maxWidth x totalHeight)
    |           - Composite each image at incremental Y offset
    |           - Output: JPEG quality 80, mozjpeg encoder
    |           - Cleanup original segment temp files
    |           - Return stitchedPath on local disk
    |
    +-- Create Scan document in MongoDB:
    |     { userId, imageUrl: 'processing...', status: PROCESSING }
    |
    +-- scanQueue.add('process-scan', { scanId, userId, localStitchedPath })
    |     --> BullMQ job published to 'scan-queue'
    |
    +-- userModel.$inc monthlyScanCount by 1
    |
    +-- Return { scan, status: 'Processing started' }  <-- immediate response
```

### 3e. Multi-Segment Session API (Alternative Long Bill Flow)

```
POST /scans/session/init
    +-- Create ScanSession: { userId, segmentPaths: [], isFinalized: false }
    --> Returns { sessionId }

POST /scans/session/:id/segment
    +-- Accept single image per call
    +-- $push filePath into ScanSession.segmentPaths

POST /scans/session/:id/finalize
    +-- Load session, check !isFinalized
    +-- Call createScan(userId, segmentPaths[]) with all paths
    +-- Mark session.isFinalized = true, save
    +-- Return same ScanResponseDto as direct upload
```

### 3f. PDF Upload Flow

```
POST /scans/upload-pdf --> ScansController.uploadPdf()
    |
    v
ScansService.processPdfScan(userId, file)
    |
    +-- Same paywall + monthly limit check as createScan()
    |
    +-- pdf-img-convert: convert PDF pages --> JPEG images
    |     (2480px width per page, JPEG format)
    |
    +-- Write each page image to ./tmp/pdf/ temp directory
    |
    +-- Call _enqueueScan(userId, pagePaths[])
    |     +-- Same stitching + queuing pipeline as photo uploads
    |
    +-- finally block: cleanup all temp PDF page files (guaranteed)
```

### 3g. Async Processing (BullMQ Worker)

```
ScanProcessor consumes job from 'scan-queue'
    |
    v
Read: { scanId, userId, localStitchedPath }
    |
    v
scanModel.findById(scanId)
    |
    v
localStitchedPath EXISTS on disk?
    +-- YES --> fs.readFile(localStitchedPath) --> imageBuffer
    +-- NO  --> axios.get(scan.imageUrl) as fallback --> imageBuffer
    |
    v
NormalizerService.normalizeImage(imageBuffer)
    |
    +-- Gemini 1.5 Flash multimodal API call:
    |     Input: receipt image (base64 encoded) + structured prompt
    |
    |   Extraction instructions:
    |     1. merchantName + merchantAddress
    |     2. Item normalization: shorthand codes --> readable cleanName
    |     3. Category classification per item
    |        (Veggies/Dairy/Snacks/Beverages/Household/Meat/Personal Care)
    |     4. Pricing: qty, unit normalized (500g->0.5kg), final price paid
    |     5. Tax fields: cgst, sgst, taxTotal
    |     6. billType: 'grocery' | 'restaurant'
    |     7. Grand total in INR
    |     8. rawText: full OCR text for later search/lookup
    |
    |   Returns JSON:
    |     { merchantName, merchantAddress, billType, currency: 'INR',
    |       items: [{ shorthand, cleanName, qty, price, category, unit }],
    |       cgst, sgst, taxTotal, total, rawText }
    |
    +-- Mock stub returned if GEMINI_API_KEY is absent/test value
    |
    v
StrategyFactory.getStrategy(billType)
    +-- 'grocery'    --> GroceryStrategy.normalize(items)
    +-- 'restaurant' --> RestaurantStrategy.normalize(items)
    |
    v
Update Scan document with all extracted data:
    { rawText: NormalizerService.scrubPII(rawText),
      items, extractedTotal: normalizedData.total,
      billType, merchantName, merchantAddress,
      taxTotal, cgst, sgst, status: COMPLETED }

    PII scrubbing removes:
      - 16-digit card numbers      --> **** **** **** ****
      - Expiry dates               --> **/**
      - Phone numbers              --> ***-***-****
      - Email addresses            --> ****@****.***
    |
    v
StorageService.uploadImage(localStitchedPath)
    +-- Upload to Cloudinary --> returns secure CDN URL
    --> scan.imageUrl = cloudUrl
    --> scan.save()
    |
    v
PantryService.indexScannedItems(userId, items)
    +-- [See FLOW 5 - Pantry Indexing]
    |
    v
NotificationService.sendNotification()
    +-- userService.findById(userId) --> get user.pushToken
    +-- Expo.isExpoPushToken(token) validation
    +-- expo.sendPushNotificationsAsync([{
          to: pushToken, sound: 'default',
          title: 'Scan Complete!',
          body: 'Processed N items. Tap to verify and split.',
          data: { scanId }
        }])
    |
    v
User taps push notification --> App opens --> Navigate to VerificationScreen
```

---

## FLOW 4 — Verification & Item Correction

```
VerificationScreen
    |
    +-- useScanStore: items, currentScan, loading, loadingMessage
    |
    +-- loading === true?
    |     --> Show skeleton shimmers (3 shimmer cards)
    |     --> Header: "Analyzing Bill..." / "Gemini is working its magic"
    |
    v
Items available:
    +-- Stitched receipt image (scan.imageUrl)
    |     Overlay label: "Stitched Receipt View"
    |
    +-- SectionList: items grouped by category
    |     Section header: category name (colored)
    |     ItemCard per item:
    |       - cleanName, qty display, price
    |       - Checkbox toggle: include / exclude from split
    |       - Inline price edit: tap price to edit
    |
    +-- Tax Breakdown footer:
    |     Subtotal (live sum)
    |     CGST (if > 0)
    |     SGST (if > 0)
    |     Grand Total (scan.extractedTotal or computed)
    |
    +-- "Retake" button --> Navigate back to ScannerScreen
    |
    +-- "Split with Friends" sticky button
          |
          v
        currentScan._id !== 'mock-id'?
          +-- YES (real scan) --> PATCH /scans/:id/items { items }
          |                       ScansService.updateItems()
          |                       --> Persist edits, recalculate extractedTotal
          +-- NO (mock/demo)  --> Skip API call
          |
          v
        Navigate --> SplitScreen
```

---

## FLOW 5 — Pantry Indexing

```
[Triggered automatically by ScanProcessor after every completed scan]

PantryService.indexScannedItems(userId, items[])
    |
    +-- items.length === 0? --> return early
    |
    v
Single DB read:
    PantryItem.find({ userId, cleanName: { $in: allItemNames } })
    Build existingMap: cleanName --> PantryItemDocument
    |
    v
Build bulkOps[] -- for each scanned item:
    |
    +-- EXISTING in pantry?
    |     |
    |     +-- Same-day entry AND price unchanged? --> no-op (skip)
    |     |
    |     +-- New day OR price changed?
    |           +-- $push priceHistory: { date: now, price }  ($slice: -30)
    |           +-- Price spike check:
    |                 pct = (newPrice - oldPrice) / oldPrice * 100
    |                 pct > 20%?
    |                   --> sendSpikeNotification() [non-blocking]
    |                         Push: "Price Hike Alert"
    |                               "ItemName went up +X%  (Rs.prev -> Rs.new)"
    |           +-- $set: currentPrice, lastPrice, updatedAt
    |
    +-- NEW item?
          +-- insertOne: { userId, cleanName, shorthand, category,
                           currentPrice, unit,
                           priceHistory: [{ date: now, price }],
                           createdAt, updatedAt }
    |
    v
pantryModel.bulkWrite(bulkOps)  <-- single roundtrip for all items
    |
    v
Cache invalidation:
    +-- Redis del: stats:{userId}
    +-- Redis del: pantry:{userId}
```

### 5a. Daily Expiry Alerts (9 AM Cron)

```
ExpiryProcessor handles 'expiry-queue'
    |
    v
onModuleInit():
    +-- Remove stale repeatable job (prevents duplication on restart)
    +-- expiryQueue.add('check-expiry', {}, { repeat: '0 9 * * *' })
    --> Logs: "Expiry check job scheduled (daily at 9 AM)"

process(job):
    |
    v
Find ALL PantryItems (all users) from DB
    |
    v
Group into Map: userId --> items[]
    |
    v
For each [userId, items]:
    |
    +-- For each item, calculate shelf life by category:
    |     Dairy: 3d   Veggies: 5d   Meat: 2d
    |     Beverages/Snacks: 30d    Household: 180d
    |     Personal Care: 365d       Default: 7d
    |
    +-- expiresAt = item.updatedAt + shelfLife
    +-- daysLeft = ceil((expiresAt - now) / 86400000)
    +-- 0 <= daysLeft <= 2? --> add "ItemName (Xd left)" to expiring[]
    |
    +-- expiring.length > 0?
          +-- Fetch user.pushToken
          +-- Build preview: first 3 items + "+N more" suffix
          +-- Send push notification:
                "Items Expiring Soon"
                "Milk (expires today), Tomatoes (2d left), +2 more"
                data: { type: 'expiry', items: [...] }
```

---

## FLOW 6 — Bill Splitting

### 6a. SplitScreen Setup

```
SplitScreen
    |
    +-- GET /groups          --> user's groups + members (React Query)
    +-- GET /users/profile/:id --> user's own UPI ID for payment links
    +-- useScanStore: items[], currentScan (merchantName, extractedTotal)
    |
    +-- Groups load error banner:
          "Could not load groups. [Retry]"
          --> queryClient.invalidateQueries(['groups-participants'])
```

### 6b. Equal Split Mode

```
POST /split/calculate
    Body: { total, participantCount, participants: [{name, mobile}] }
    |
    v
SplitService.calculateEqualSplit(total, count)
    +-- share = floor(total * 100 / count) / 100  (no floating point drift)
    +-- remainder = total - (share * count)
    +-- Distribute remainder Rs.0.01 to first N participants
    +-- Returns: [{ name, mobile, share, whatsappLink }]
```

### 6c. Itemized Split Mode

```
POST /split/itemized
    Body: { items: [...], participants: [{name, mobile}] }
    |
    v
SplitService.calculateItemizedSplit(items, participants)
    +-- UI: user assigns items to specific participants
    +-- Returns: [{ name, mobile, share, items[], whatsappLink }]
```

### 6d. WhatsApp Deep Link

```
WhatsappService.generateDeepLink(mobile, amount, description, upiId)
    |
    v
Message:
    "Bill Split Request
     Amount: Rs.{amount}
     {description}
     UPI: {upiId}
     Please pay using any UPI app."
    |
    v
wa.me/{mobile}?text={encodeURIComponent(message)}
    |
    v
Linking.openURL() --> opens WhatsApp natively
```

### 6e. Recording the Expense

```
User taps "Record Expense"
    |
    v
POST /split/settlement/record
    { participants: [{name, mobile, amount}],
      description: "Bill split at {merchantName}",
      scanId: currentScan._id }
    |
    v
SettlementService.recordExpense()
    --> ledgerModel.insertMany([one LedgerEntry per participant]):
        { userId, counterpartyName, counterpartyMobile,
          amount, description, scanId, isSettled: false }
```

---

## FLOW 7 — Settlement & Ledger Resolution

```
SettlementScreen
    |
    +-- GET /split/settlement/balances
    |     --> SettlementService.getBalances(userId)
    |         Find: { userId, isSettled: false }
    |         Group by counterpartyMobile, sum amounts
    |         netAmount > 0 --> "Owed to You" (green)
    |         netAmount < 0 --> "You Owe" (red)
    |
    +-- Summary glass cards:
    |     "They Owe You: Rs.{totalOwed}"
    |     "You Owe: Rs.{totalIOwe}"
    |
    +-- Balance card per counterparty:
    |     Avatar (initials), name, "N transactions"
    |     Net amount, [History] + [Settle] buttons
    |
    +-- "History" tap --> Modal
    |     GET /split/settlement/history?mobile={mobile}
    |     Last 50 entries, newest first
    |     Shows: description, date, amount, "Settled" tag if paid
    |
    +-- "Settle" tap --> Modal
          Pre-fills: net amount (editable for partial)
          |
          v
        POST /split/settlement/settle { counterpartyMobile, amount }
            |
            v
        SettlementService.settle(userId, mobile, amount)
            +-- Find unsettled entries (oldest first)
            +-- Walk entries, consuming 'remaining' budget:
            |     entry.amount <= remaining?
            |       --> isSettled=true, settledAt=now, remaining-=entry.amount
            |     entry.amount > remaining? (partial)
            |       --> Create new settled entry for partial amount
            |       --> Update entry.amount = original - partial
            +-- Return { settled, remaining }
            +-- React Query invalidates settlement-balances cache
```

---

## FLOW 8 — Pantry & Insights

### 8a. Pantry Screen

```
PantryScreen
    |
    +-- GET /pantry --> getPantryItems(userId)
    |     Redis cached: pantry:{userId}
    |     Returns all items sorted by updatedAt desc
    |
    +-- GET /pantry/stats --> getStats(userId)
    |     Redis cached: stats:{userId}
    |     MongoDB $facet aggregation:
    |       totalSpent: sum of scan.extractedTotal where status=completed
    |       byCategory: sum item prices by category
    |       savings: sum of (max priceHistory - currentPrice) per item
    |       itemCount: total pantry items
    |       scanStreak: consecutive days with scans, up to 365 lookback
    |     Badges earned:
    |       "N Day Streak" (streak >= 3)
    |       "Top Saver"    (savings >= Rs.200)
    |       "Pantry Master" (itemCount >= 50)
    |
    +-- GET /pantry/weekly-trend --> getWeeklyTrend(userId)
    |     Past 7 calendar days, sum spend per day
    |     Returns: [{ day: 'Mon', total: 850 }, ...]
    |
    +-- POST /pantry/recipes --> suggestRecipes(userId)
          All pantry item names sent to Gemini 1.5 Flash
          Prompt: "Suggest 3 recipes from [items...], return JSON array"
          Returns: [{ title, time, difficulty, ingredients[], instructions[] }]
```

### 8b. Dashboard

```
DashboardScreen
    |
    +-- GET /scans (paginated, limit 5) --> recent receipt list
    +-- GET /pantry/stats              --> spending summary widgets
    |
    +-- CSV Export:
    |     ExportService.exportToCSV(receipts)
    |     Headers: Date, Store, Items, Total, Status
    |     FileSystem.writeAsStringAsync() + Sharing.shareAsync()
    |
    +-- PDF Export (per receipt):
    |     ExportService.generateReceiptHTML(scan)
    |     Branded HTML: VisionBill header, item table, grand total
    |     Print.printToFileAsync() + Sharing.shareAsync()
    |
    +-- Recent activity list:
    |     merchantName (or 'New Scan'), date, items, total
    |     Badge: grocery vs other
    |
    +-- Demo Seed (dev/test):
          POST /scans/demo-seed
          --> VisionBazaar Demo Store, 3 items, Rs.425
          --> Auto-indexes to Pantry
```

---

## FLOW 9 — Groups Management

```
GroupsScreen
    |
    +-- GET /groups --> user's groups list
    |
    +-- Create: POST /groups { name, members: [{name, mobile, upiId}] }
    +-- Update: PUT /groups/:id { name, members }
    +-- Add member: POST /groups/:id/members { name, mobile, upiId }
    +-- Remove member: DELETE /groups/:id/members/:index
    +-- Delete: DELETE /groups/:id
```

---

## FLOW 10 — User Profile & Settings

```
ProfileScreen
    |
    +-- GET /users/profile/:userId
    |     Displays: displayName, email, initials avatar
    |
    +-- Editable (POST /users/profile/:userId):
    |     mobile:      phone number for WhatsApp splits
    |     upiId:       VPA for UPI payment links
    |     savingsGoal: monthly Rs. target (default Rs.500)
    |
    +-- "Manage Subscriptions" --> SubscriptionsScreen
    |
    +-- Danger Zone:
          Logout: clearSession() --> Login
          Delete Account: DELETE /users/:id --> clearSession()
```

---

## FLOW 11 — Subscription Tracker

```
SubscriptionsScreen
    |
    +-- useSubscriptionStore (Zustand + AsyncStorage, device-local)
    +-- Shows: name, amount, days until next billing, color dot
    +-- Total Rs./month in header
    |
    +-- Add: modal with name + amount, nextBillingDate = now + 30 days
    +-- Remove: removeSubscription(id)
```

---

## FLOW 12 — Loyalty Wallet

```
LoyaltyWalletScreen
    |
    +-- useLoyaltyStore (Zustand + AsyncStorage, device-local)
    |
    +-- Scan barcode (CameraView):
    |     Formats: QR, EAN-13, EAN-8, Code128, Code39, PDF417, Aztec, Datamatrix
    |     --> setManualCode(data) --> open name modal
    |
    +-- Manual add: store name + barcode/card number
    |
    +-- Cards list: colored cards, tap to expand QR, long-press to remove
    +-- Expanded: react-native-qrcode-svg renders card value as QR code
```

---

## FLOW 13 — System Health

```
GET /health --> MongoDB ping + Redis ping (CONNECTED / DISCONNECTED)
GET /       --> "VisionBill API is running"
POST /scans/demo-seed --> seed demo receipt (requires JWT)
```

---

## State Management

| Store | Persistence | Contents |
|-------|------------|---------|
| `useAuthStore` | expo-secure-store | accessToken, userId, tier, monthlyScanCount, isLoading |
| `useScanStore` | In-memory | Active scan, items[], loading, error, currentImages[], loadingMessage |
| `useSubscriptionStore` | AsyncStorage | Subscription entries |
| `useLoyaltyStore` | AsyncStorage | Loyalty card barcodes + colors |
| React Query | AsyncStorage (24h gcTime, 5min stale) | Scans, pantry, groups, balances, profile |

---

## Navigation Tree

```
App (NavigationContainer)
    +-- Stack: Login
    +-- Stack: Main (Bottom Tabs)
    |     +-- Tab: Dashboard (Home)
    |     +-- Tab: Pantry
    |     +-- Tab: Scan (FAB center, raised)
    |     +-- Tab: Groups
    |     +-- Tab: Profile
    +-- Stack: Verification
    +-- Stack: Split
    +-- Stack: Settlement
    +-- Stack: ReceiptHistory
    +-- Stack: LoyaltyWallet
    +-- Stack: Subscriptions

Inline Modals:
    PaywallModal      - ScannerScreen (limit hit)
    GroupPickerModal  - SplitScreen
    SettleModal       - SettlementScreen
    HistoryModal      - SettlementScreen
    AddCardModal      - LoyaltyWalletScreen
    AddSubModal       - SubscriptionsScreen
```

---

## Background Jobs

| Queue | Trigger | Job | Handler | Schedule |
|-------|---------|-----|---------|----------|
| `scan-queue` | POST /scans/upload or /finalize | process-scan | ScanProcessor | On-demand |
| `expiry-queue` | Module init, self-scheduling | check-expiry | ExpiryProcessor | Daily 9AM (0 9 * * *) |

---

## API Reference

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /auth/google | None | Start OAuth |
| GET | /auth/google/callback | None | OAuth callback, issue tokens |
| POST | /auth/refresh | None | Refresh tokens |
| GET | /auth/status | None | Health check |

### Scans (JwtAuthGuard)
| Method | Path | Description |
|--------|------|-------------|
| POST | /scans/upload | 1-10 images |
| POST | /scans/upload-pdf | PDF bill |
| POST | /scans/session/init | Init session |
| POST | /scans/session/:id/segment | Add segment |
| POST | /scans/session/:id/finalize | Finalize + enqueue |
| POST | /scans/demo-seed | Seed demo data |
| GET | /scans | List (?limit&page) |
| GET | /scans/:id | Get one |
| PATCH | /scans/:id/items | Update items |
| DELETE | /scans/:id | Soft-delete |
| POST | /scans/:id/restore | Restore |

### Pantry
| Method | Path | Description |
|--------|------|-------------|
| GET | /pantry | All items |
| GET | /pantry/stats | Aggregated stats |
| GET | /pantry/weekly-trend | 7-day trend |
| POST | /pantry/recipes | AI recipes |

### Split & Settlement
| Method | Path | Description |
|--------|------|-------------|
| POST | /split/calculate | Equal split |
| POST | /split/itemized | Itemized split |
| POST | /split/settlement/record | Record expense |
| GET | /split/settlement/balances | Net balances |
| POST | /split/settlement/settle | Settle (partial OK) |
| GET | /split/settlement/history | History (?mobile=) |

### Groups (JwtAuthGuard)
| Method | Path | Description |
|--------|------|-------------|
| POST | /groups | Create |
| GET | /groups | List user's groups |
| PUT | /groups/:id | Update |
| DELETE | /groups/:id | Delete |
| POST | /groups/:id/members | Add member |
| DELETE | /groups/:id/members/:index | Remove member |

### Users
| Method | Path | Description |
|--------|------|-------------|
| GET | /users/profile/:id | Get profile |
| POST | /users/profile/:id | Update profile |
| POST | /users/push-token/:id | Register push token |
| DELETE | /users/:id | Delete account |

### System
| Method | Path | Description |
|--------|------|-------------|
| GET | /health | DB + Redis check |
| GET | / | Welcome message |

---

## Data Models

```
User
    _id, email, displayName, avatar, googleId
    tier: 'free' | 'pro'
    monthlyScanCount, lastResetMonth
    currentRefreshToken (bcrypt hash)
    pushToken, mobile, upiId, savingsGoal

Scan
    userId, imageUrl
    status: PROCESSING | COMPLETED | FAILED | DELETED
    rawText (PII-scrubbed)
    items[]: { shorthand, cleanName, qty, price, category, unit }
    billType: 'grocery' | 'restaurant'
    extractedTotal, merchantName, merchantAddress
    taxTotal, cgst, sgst
    createdAt  [compound index: userId + status + createdAt]

ScanSession
    userId
    segmentPaths: string[]
    isFinalized: boolean

PantryItem
    userId, cleanName, shorthand, category
    currentPrice, lastPrice, unit
    priceHistory: [{ date, price }]  (max 30 via $slice)
    createdAt, updatedAt

LedgerEntry
    userId, counterpartyName, counterpartyMobile
    amount, description, scanId
    isSettled: boolean
    settledAt?: Date

Group
    userId, name
    members: [{ name, mobile, upiId }]
```

---

*Full codebase audit — April 2026*
