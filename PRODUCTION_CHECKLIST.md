# Production Checklist — VisionBill

> Run through this checklist before every production deployment. Items are ordered by severity.
> Last Updated: April 4, 2026

---

## CRITICAL — Blocking (Fix Before Any Deploy)

### Security

- [x] **JWT Passport strategy implemented** — `vision-bill-api/src/auth/strategies/jwt.strategy.ts`
  `JwtAuthGuard` was extending `AuthGuard('jwt')` but no JWT strategy was registered. All protected endpoints were non-functional. Created `jwt.strategy.ts`, registered in `auth.module.ts`.

- [x] **JWT claim field unified** — `vision-bill-api/src/common-types.ts`, all controllers
  JWT payload used `sub` but controllers read `req.user.userId`. Strategy `validate()` now returns `{ userId, email }`. All controllers updated to use `req.user.userId` consistently.

- [x] **IDOR on scan endpoints fixed** — `vision-bill-api/src/scans/scans.service.ts`, `scans.controller.ts`
  `GET/PATCH/DELETE :id` and `session/:id/segment|finalize` now verify the requesting user owns the resource. Returns 403 if scan belongs to a different user.

- [x] **CORS restricted** — `vision-bill-api/src/main.ts`
  `app.enableCors()` replaced with `ALLOWED_ORIGINS`-driven allowlist. Set `ALLOWED_ORIGINS` env var to your production domain(s).

- [x] **Startup env validation** — `vision-bill-api/src/app.module.ts`
  Joi schema validates `JWT_SECRET`, `MONGODB_URI`, `REDIS_URL`, `GEMINI_API_KEY`, `CLOUDINARY_URL` at startup. App will not boot if any are missing.

- [x] **Mobile token refresh URL** — `vision-bill-app/src/utils/auth.ts`
  `axios.post('http://localhost:3000/auth/refresh', ...)` replaced with dynamic `apiUrl` from `Constants.expoConfig.extra.apiUrl`.

- [x] **Real Google OAuth in mobile app** — `vision-bill-app/src/screens/LoginScreen.tsx`
  Mock credentials (`'demo-user-123', 'mock-access', 'mock-refresh'`) replaced with `expo-auth-session` `Google.useIdTokenAuthRequest`. New backend endpoint `/auth/google-mobile` verifies Google ID tokens via `google-auth-library`.

- [ ] **Rotate JWT secret** — `vision-bill-api/.env`
  `JWT_SECRET=super-secret-jwt-key` was committed in plaintext. **Rotate this secret now.** Store the new value in a secrets manager (AWS Secrets Manager, GCP Secret Manager, Vercel env vars). Do not commit the new secret.

- [ ] **Set `ALLOWED_ORIGINS` in production env**
  CORS is now enforced in code, but requires the env var to be populated. Without it, `origin: false` blocks all cross-origin requests. Set to your production domain: `ALLOWED_ORIGINS=https://visionbill.vercel.app`

- [ ] **Set Google OAuth Client ID** — `vision-bill-app/app.json:extra.googleClientId`
  `googleClientId` is blank. The mobile login button will silently fail until a valid Google OAuth Client ID (iOS/Android) is provided.

---

## HIGH — Fix Before First Load

### Queue Reliability

- [x] **Retry/backoff on scan jobs** — `vision-bill-api/src/scans/scans.service.ts`
  BullMQ jobs configured with `attempts: 3`, `backoff: exponential 5s`, `removeOnComplete: 100`, `removeOnFail: 500`.

- [ ] **Handle failed queue jobs with alerting** — `vision-bill-api/src/scans/scan.processor.ts`
  `@OnWorkerEvent('failed')` only logs. Add a Slack/PagerDuty webhook or dead-letter queue for visibility on stuck jobs.

- [ ] **Add retry config to expiry cron job** — `vision-bill-api/src/pantry/expiry.processor.ts`
  Repeatable job has no `attempts` or `backoff`. A single failure silently drops all expiry notifications for the day.

### Auth Hardening

- [x] **`/auth/refresh` rate-limited** — `vision-bill-api/src/auth/auth.controller.ts`
  `@Throttle({ default: { limit: 5, ttl: 60000 } })` applied — 5 requests/min.

- [x] **`/auth/google-mobile` rate-limited** — `vision-bill-api/src/auth/auth.controller.ts`
  `@Throttle({ default: { limit: 5, ttl: 60000 } })` applied.

- [x] **`RefreshDto` input validation** — `vision-bill-api/src/auth/dto/refresh.dto.ts`
  Empty/malformed `userId` or `refreshToken` now returns 400 instead of 500.

- [x] **`UnauthorizedException` on invalid refresh token** — `vision-bill-api/src/auth/auth.service.ts`
  Bare `Error` throws replaced with `UnauthorizedException` — returns 401, not 500.

### Database

- [x] **Mongoose connection options set** — `vision-bill-api/src/app.module.ts`
  `serverSelectionTimeoutMS: 5000`, `maxPoolSize: 10`, `socketTimeoutMS: 45000` configured.

- [x] **`autoIndex: false` in production** — `vision-bill-api/src/app.module.ts`
  `autoIndex: configService.get('NODE_ENV') !== 'production'`

- [ ] **Provision managed MongoDB** — Use MongoDB Atlas (or equivalent) with:
  - Automated backups enabled
  - IP allowlist restricted to API server IPs only
  - Monitoring/alerts on connection pool saturation

### Third-Party Integrations

- [ ] **Production Gemini API key** — Replace `mock-gemini-key` stub with a valid Google Cloud / AI Studio key. Set billing alerts.
- [ ] **Cloud storage** — Cloudinary production bucket configured with a dedicated credential. Remove the local file path fallback.
- [ ] **Managed Redis** — Provision Upstash, ElastiCache, or Redis Cloud. Do not run Redis on the same instance as the API.
- [ ] **Payment SDK** — Replace `PaywallModal.tsx` stub with a real provider (RevenueCat for mobile IAP or Stripe for web).

### Mobile

- [ ] **Add crash reporting** — No Sentry or Crashlytics configured. Production crashes are invisible.
  Install `@sentry/react-native` and initialize in `App.tsx` before the navigator renders.

- [x] **`console.*` calls gated behind `__DEV__`** — All bare `console.error/log/warn` in production code replaced with `if (__DEV__) console.*`:
  - `vision-bill-app/src/utils/auth.ts`
  - `vision-bill-app/src/screens/DashboardScreen.tsx`
  - `vision-bill-app/src/utils/notifications.ts`
  - `vision-bill-app/src/components/ErrorBoundary.tsx`

---

## MEDIUM

### Config / Environment

- [x] **Production API URL set** — `vision-bill-app/app.json`
  `apiUrl` updated to `https://visionbill.vercel.app`.

- [ ] **Per-environment API URL via EAS profiles** — `vision-bill-app/eas.json`
  Consider moving `apiUrl` out of `app.json` into per-profile env vars in `eas.json` so dev/staging/prod can coexist:
  ```json
  "production": { "env": { "EXPO_PUBLIC_API_URL": "https://visionbill.vercel.app" } }
  ```

- [ ] **Env-configurable log level** — `vision-bill-api/src/main.ts`
  Winston uses a fixed `Console` transport. Add `level: process.env.LOG_LEVEL ?? 'info'` to reduce log noise in production.

- [ ] **Remove hardcoded Redis fallback** — `vision-bill-api/src/common/constants.ts`
  `REDIS_CONFIG.DEFAULT_URL = 'redis://localhost:6379'` is unreachable now that Joi validation requires `REDIS_URL`. Remove it to prevent silent misconfiguration if validation is ever weakened.

### SSL / Networking

- [ ] **Serve API strictly over HTTPS** — Terminate TLS at the load balancer or reverse proxy. Redirect all HTTP to HTTPS.
- [ ] **Configure `trust proxy`** — If behind a load balancer/Vercel, add `app.set('trust proxy', 1)` so rate limiting and IP logging use the real client IP.

### File Upload / Temp File Cleanup

- [ ] **Delete Multer-uploaded file on failure** — `vision-bill-api/src/scans/scans.service.ts`
  The original uploaded file (`file.path`) is not deleted when processing fails. Wrap in `try/finally`:
  ```ts
  } finally {
    await fs.promises.unlink(file.path).catch(() => {});
  }
  ```

- [ ] **Wrap stitching segment cleanup in `try/finally`** — `vision-bill-api/src/scans/services/stitching.service.ts`
  `cleanupSegments` is only called on the success path. Segment images leak on disk if stitching throws.

### Monitoring / Health

- [ ] **Add liveness and readiness endpoints** — `vision-bill-api/src/health.controller.ts`
  Currently one combined `GET /health`. Kubernetes/Vercel needs two distinct probes:
  - `GET /live` — process is alive (always `200`)
  - `GET /ready` — MongoDB + Redis reachable (existing check logic)

### App Store / Legal

- [x] **Android `allowBackup: false`** — `vision-bill-app/app.json`
  Prevents ADB backup extraction of app data on Android.

- [x] **iOS ATS config** — `vision-bill-app/app.json`
  `NSAllowsArbitraryLoads: false` enforces HTTPS-only connections on iOS.

- [x] **Deep link scheme** — `vision-bill-app/app.json`
  `"scheme": "visionbill"` added (required for OAuth redirect callback).

- [ ] **Replace default Expo icons and splash screen** — `vision-bill-app/app.json` — use production VisionBill branding assets.
- [ ] **Link Terms of Service and Privacy Policy** — Required for App Store and Google Play. Wire real URLs into settings and login screens.
- [ ] **Prepare store metadata** — Screenshots, marketing descriptions, support email for submission.

### Swagger

- [x] **Swagger gated to non-production** — `vision-bill-api/src/main.ts`
  Swagger setup is now inside `if (process.env.NODE_ENV !== 'production')`. API schema not exposed in production.

---

## LOW

- [ ] **Enforce URI versioning on all controllers** — `vision-bill-api/src/main.ts`
  `VersioningType.URI` with `defaultVersion: '1'` is configured but no controllers use `@Version()`. Routes resolve at `/api/...` not `/api/v1/...`. Annotate all controllers with `@Version('1')` or remove the unused versioning config.

- [ ] **Add Swagger decorators to controllers** — Controllers lack `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`. Auto-generated docs are incomplete (only matters in non-production environments now).

- [ ] **Configure EAS build signing profiles** — `vision-bill-app/eas.json`
  No provisioning profiles or signing certificates configured. Required for App Store / Play Store submission.

- [ ] **Automate version / build number management** — `vision-bill-app/app.json`
  `version` and `versionCode` are manually maintained and can drift. Automate with an EAS pre-build hook or CI script.

---

## Pre-Deploy Verification

### Backend

```bash
cd vision-bill-api

# All unit tests must pass
npm run test

# Build must succeed with zero TypeScript errors
npm run build

# Verify env validation fires on missing vars
JWT_SECRET= node dist/main.js
# Expected: validation error at startup, process exits
```

### Frontend

```bash
cd vision-bill-app

# Verify no hardcoded localhost remains in source
grep -r "localhost" src/
# Should return no matches

# Verify no hardcoded IP addresses
grep -rE "\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b" src/

# EAS production build
eas build --platform all --profile production
```

### Smoke Tests (Post-Deploy)

- [ ] `GET /health` returns `{ status: 'ok' }` with MongoDB and Redis both up
- [ ] `GET /auth/google` redirects to Google consent screen
- [ ] `POST /auth/refresh` with an invalid token returns `401` (not `200` or `500`)
- [ ] `GET /scans/some-other-users-scan-id` with your token returns `403` (IDOR check)
- [ ] `GET /pantry` without `Authorization` header returns `401`
- [ ] `GET /split/settlement/balances` without auth returns `401`
- [ ] `GET /api/docs` in production returns `404` (Swagger not exposed)
- [ ] Upload a receipt image — scan completes and appears in history
- [ ] Token refresh flow works on a physical device (not emulator)
- [ ] Verify CORS rejects a request from an unlisted origin
- [ ] Google login on a physical device completes and lands on Dashboard

---

## Summary

| Severity | Status | Item |
|---|---|---|
| CRITICAL | ✅ | JWT strategy created — auth was completely broken |
| CRITICAL | ✅ | JWT claim field unified (`sub` → `userId`) across all controllers |
| CRITICAL | ✅ | IDOR fixed on all scan/session endpoints |
| CRITICAL | ✅ | CORS restricted to `ALLOWED_ORIGINS` |
| CRITICAL | ✅ | Startup env validation (Joi) |
| CRITICAL | ✅ | Mobile token refresh URL fixed |
| CRITICAL | ✅ | Real Google OAuth (replaced mock credentials) |
| CRITICAL | ⚠️ | **Rotate JWT secret** — still using committed plaintext secret |
| CRITICAL | ⚠️ | **Set `ALLOWED_ORIGINS` env var** — CORS blocks all origins without it |
| CRITICAL | ⚠️ | **Set Google OAuth Client ID** — mobile login non-functional without it |
| HIGH | ✅ | BullMQ retry/backoff configured |
| HIGH | ✅ | Auth endpoints rate-limited (5 req/min) |
| HIGH | ✅ | `RefreshDto` input validation |
| HIGH | ✅ | Mongoose connection options + `autoIndex: false` |
| HIGH | ✅ | `console.*` gated behind `__DEV__` |
| HIGH | ⬜ | Failed job alerting |
| HIGH | ⬜ | Managed MongoDB / Redis / Gemini / Cloudinary |
| HIGH | ⬜ | Crash reporting (Sentry) |
| MEDIUM | ✅ | Production API URL set in `app.json` |
| MEDIUM | ✅ | Swagger hidden in production |
| MEDIUM | ✅ | Android `allowBackup: false` |
| MEDIUM | ✅ | iOS ATS `NSAllowsArbitraryLoads: false` |
| MEDIUM | ✅ | Deep link scheme added |
| MEDIUM | ⬜ | SSL/HTTPS, trust proxy, file cleanup, liveness/readiness |

**3 items remain CRITICAL and must be resolved before going live: rotate the JWT secret, set `ALLOWED_ORIGINS`, and supply the Google OAuth Client ID.**
