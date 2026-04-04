# Production Checklist — VisionBill

> Run through this checklist before every production deployment. Items are ordered by severity.
> Last Updated: April 2, 2026

---

## CRITICAL — Blocking (Fix Before Any Deploy)

### Security

- [ ] **Restrict CORS allowed origins** — `vision-bill-api/src/main.ts:11,27`
  Both `cors: true` (NestFactory) and `app.enableCors()` (no args) allow ALL origins.
  ```ts
  // Remove cors: true from NestFactory.create()
  app.enableCors({ origin: ['https://your-domain.com'], credentials: true });
  ```

- [ ] **Remove JWT secret from repository** — `vision-bill-api/.env`
  `JWT_SECRET=super-secret-jwt-key` is committed in plaintext. Rotate the secret and store it in a secrets manager (AWS Secrets Manager, GCP Secret Manager, etc.).

- [ ] **Guard all unprotected endpoints** — add `@UseGuards(JwtAuthGuard)` to:
  - `vision-bill-api/src/auth/auth.controller.ts` — `@Post('refresh')` accepts any `userId`/`refreshToken` without authentication
  - `vision-bill-api/src/auth/user.controller.ts` — `GET/POST profile/:id` and `POST push-token/:id` are fully public
  - `vision-bill-api/src/pantry/pantry.controller.ts` — `GET /`, `GET stats`, `GET weekly-trend`, `POST recipes` all fall back to `'demo-user-id'`
  - `vision-bill-api/src/split/split.controller.ts` — ALL 6 endpoints (calculate, itemized, record, balances, settle, history) have zero guards

- [ ] **Fix mobile token refresh URL** — `vision-bill-app/src/utils/auth.ts:33`
  `axios.post('http://localhost:3000/auth/refresh', ...)` is hardcoded and will fail on any physical device or production build.
  ```ts
  import Constants from 'expo-constants';
  const base = Constants.expoConfig?.extra?.apiUrl ?? '';
  axios.post(`${base}/auth/refresh`, { userId, refreshToken });
  ```

- [ ] **Add startup environment variable validation** — `vision-bill-api/src/app.module.ts:20`
  `ConfigModule.forRoot({ isGlobal: true })` has no validation schema. The app boots silently with missing critical config.
  ```ts
  import * as Joi from 'joi';

  ConfigModule.forRoot({
    isGlobal: true,
    validationSchema: Joi.object({
      JWT_SECRET:       Joi.string().required(),
      MONGODB_URI:      Joi.string().required(),
      REDIS_URL:        Joi.string().required(),
      GEMINI_API_KEY:   Joi.string().required(),
      CLOUDINARY_URL:   Joi.string().required(),
      PORT:             Joi.number().default(3000),
      NODE_ENV:         Joi.string().valid('development', 'production', 'test').default('development'),
    }),
  })
  ```

---

## HIGH — Fix Before First Load

### Queue Reliability

- [ ] **Add retry/backoff to scan jobs** — `vision-bill-api/src/scans/scans.service.ts:96-100`
  `scanQueue.add(...)` has no `attempts`, `backoff`, `removeOnComplete`, or `removeOnFail`. Failed scans are silently dropped.
  ```ts
  scanQueue.add('process-scan', payload, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  });
  ```

- [ ] **Handle failed queue jobs** — `vision-bill-api/src/scans/scan.processor.ts:125-133`
  `@OnWorkerEvent('failed')` only logs. Add alerting (PagerDuty, Slack webhook) or move to a dead-letter queue.

- [ ] **Add retry config to expiry cron job** — `vision-bill-api/src/pantry/expiry.processor.ts:26-38`
  Repeatable job has no `attempts` or `backoff`. A single failure silently drops the day's expiry notifications.

### Database

- [ ] **Add Mongoose connection options** — `vision-bill-api/src/app.module.ts:42-48`
  No `serverSelectionTimeoutMS`, `maxPoolSize`, `retryWrites`, or reconnect config. Transient DB failure crashes the app.
  ```ts
  MongooseModule.forRootAsync({
    useFactory: (config: ConfigService) => ({
      uri: config.get('MONGODB_URI'),
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      retryWrites: true,
    }),
    inject: [ConfigService],
  })
  ```

- [ ] **Disable `autoIndex` in production** — `vision-bill-api/src/app.module.ts`
  Mongoose recreates/checks all indexes on every restart, adding startup latency.
  ```ts
  autoIndex: process.env.NODE_ENV !== 'production',
  ```

- [ ] **Provision managed MongoDB** — Use MongoDB Atlas (or equivalent) with:
  - Automated backups enabled
  - IP allowlist restricted to API server IPs
  - Monitoring/alerts on connection pool saturation

### Rate Limiting

- [ ] **Tighten rate limits on auth endpoints** — `vision-bill-api/src/common/constants.ts:68-71`
  Global throttler is `10 req / 60s`. Auth endpoints (`/auth/refresh`, Google OAuth) are brute-forceable at this limit. Add per-route `@Throttle()` overrides (e.g., 5 req/min).

### Third-Party Integrations

- [ ] **Production Gemini API key** — Replace `mock-gemini-key` stub with a valid Google Cloud / AI Studio key. Set billing alerts.
- [ ] **Cloud storage** — Configure Cloudinary (or migrate to AWS S3 / GCP Cloud Storage) with a dedicated production bucket. Remove the local file path fallback.
- [ ] **Managed Redis** — Provision Upstash, ElastiCache, or Redis Cloud. Do not run Redis on the same instance as the API.
- [ ] **Payment SDK** — Replace `PaywallModal.tsx` stub with a real provider (RevenueCat for mobile IAP or Stripe for web).

### Mobile

- [ ] **Add crash reporting** — No Sentry or Crashlytics configured. Production crashes are invisible. Install `@sentry/react-native` and initialize in `App.tsx`.

- [ ] **Remove `console.*` calls from production code** — Present in:
  - `vision-bill-app/src/utils/auth.ts:42`
  - `vision-bill-app/src/screens/DashboardScreen.tsx:121`
  - `vision-bill-app/src/screens/LoginScreen.tsx:35`
  - `vision-bill-app/src/utils/notifications.ts:18,29,31,35`
  - `vision-bill-app/src/components/ErrorBoundary.tsx:26`

  Replace with a logger utility gated on `__DEV__`, or route errors to the crash reporter.

---

## MEDIUM

### Config / Environment

- [ ] **Parameterize API URL per EAS build** — `vision-bill-app/app.json:45`
  `"apiUrl": "http://localhost:3000"` is hardcoded for all builds. Add per-profile env vars in `eas.json`:
  ```json
  "production": {
    "env": { "EXPO_PUBLIC_API_URL": "https://api.yourdomain.com" }
  }
  ```

- [ ] **Env-configurable log level** — `vision-bill-api/src/main.ts:12-23`
  Winston has a fixed `Console` transport with no `LOG_LEVEL` env support. Add `level: process.env.LOG_LEVEL ?? 'info'`.

- [ ] **Remove hardcoded Redis fallback** — `vision-bill-api/src/common/constants.ts:60`
  `REDIS_CONFIG.DEFAULT_URL = 'redis://localhost:6379'` is used as a silent fallback. With env validation in place, this becomes unreachable dead code.

### SSL / Networking

- [ ] **Serve API strictly over HTTPS** — Terminate TLS at the load balancer or reverse proxy (nginx/Caddy). Redirect all HTTP to HTTPS.
- [ ] **Configure `trust proxy`** — If behind a load balancer, add `app.set('trust proxy', 1)` so rate limiting and IP logging use the real client IP, not the proxy IP.

### File Upload / Temp File Cleanup

- [ ] **Delete Multer-uploaded file on failure** — `vision-bill-api/src/scans/scans.service.ts:159-172`
  The original uploaded file (`file.path`) is not deleted when processing fails. Add `try/finally`:
  ```ts
  } finally {
    await fs.promises.unlink(file.path).catch(() => {});
  }
  ```

- [ ] **Wrap stitching segment cleanup in `try/finally`** — `vision-bill-api/src/scans/services/stitching.service.ts:51-57`
  `cleanupSegments` is called on the success path only. Segment images leak on disk if stitching throws.

### Monitoring / Health

- [ ] **Add separate liveness and readiness endpoints** — `vision-bill-api/src/health.controller.ts:7-36`
  Currently one combined `GET /health`. Kubernetes needs two distinct probes:
  - `GET /live` — process is alive (always `200` if app is running)
  - `GET /ready` — MongoDB + Redis are reachable (current logic)

### App Store / Legal

- [ ] **Replace default Expo icons and splash screen** — `vision-bill-app/app.json` — use production VisionBill branding assets.
- [ ] **Link Terms of Service and Privacy Policy** — Required for both App Store and Google Play. Wire real URLs in settings and login screens.
- [ ] **Prepare store metadata** — Screenshots, marketing descriptions, support email for App Store and Play Store submission.

---

## LOW

- [ ] **Enforce URI versioning on all controllers** — `vision-bill-api/src/main.ts:28-32`
  `VersioningType.URI` with `defaultVersion: '1'` is configured but no controllers use `@Version()`. Routes resolve at `/api/...` not `/api/v1/...`. Annotate all controllers with `@Version('1')` or remove the unused versioning config.

- [ ] **Add Swagger decorators to controllers**
  Swagger is enabled at `/api/docs` but controllers lack `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`. Auto-generated docs are incomplete.

- [ ] **Configure EAS build signing profiles** — `vision-bill-app/eas.json`
  No provisioning profiles or signing certificates configured. Required for App Store / Play Store submission.

- [ ] **Automate version / build number management** — `vision-bill-app/app.json:5,27`
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
NODE_ENV=production node dist/main.js
```

### Frontend

```bash
cd vision-bill-app

# Verify no localhost references remain
grep -r "localhost" src/

# Verify no hardcoded IP addresses
grep -rE "\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b" src/

# EAS production build
eas build --platform all --profile production
```

### Smoke Tests (Post-Deploy)

- [ ] `GET /health` returns `{ status: 'ok' }` with MongoDB and Redis both up
- [ ] `GET /auth/google` redirects to Google consent screen
- [ ] `POST /auth/refresh` with an invalid token returns `401` (not `200` or `500`)
- [ ] `GET /pantry` without `Authorization` header returns `401`
- [ ] `GET /split/settlement/balances` without auth returns `401`
- [ ] Upload a receipt image — scan completes and appears in history
- [ ] Token refresh flow works on a physical device (not emulator)
- [ ] Verify CORS rejects a request from an unlisted origin

---

## Summary

| Severity | Count | Highest-Impact Item |
|---|---|---|
| CRITICAL | 5 | CORS all-origins + unguarded endpoints |
| HIGH | 10 | No job retry, no DB reconnect, no crash reporter, missing third-party integrations |
| MEDIUM | 9 | SSL, env log level, file cleanup gaps, no liveness/readiness split, app store prep |
| LOW | 4 | Versioning, Swagger, EAS signing, build automation |

**Minimum viable bar for any public production deploy: all 5 CRITICAL items must be resolved.**
