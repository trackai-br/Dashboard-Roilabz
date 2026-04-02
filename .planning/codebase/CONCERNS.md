# Technical Concerns & Risks

## Critical Issues (blocking / production risk)

### [CRITICAL] Migration 004 & 010 not applied — database tables missing
- **Description:** Tables `meta_ad_sets`, `meta_ads`, `meta_insights`, `meta_sync_status` referenced in code but not yet created in Supabase. Migrations 004 and 010 exist in `/migrations` but require manual execution via Supabase SQL Editor.
- **Impact:** Drill-down to ad sets, ad-level details, and metrics sync will fail silently. Frontend shows empty data without user awareness.
- **Location:** `/apps/meta-ads-manager/migrations/004_add_ad_sets_and_ads.sql`, `/migrations/010_create_insights_pipeline.sql`
- **Tags:** [[Supabase]] [[migration]] [[blocking]]
- **Status:** Requires immediate manual action

### [CRITICAL] Supabase Nano overload from Inngest retry death spiral
- **Description:** Free tier database reached 91% CPU, 100% disk IO, 50% memory. Root cause: 4 Inngest cron jobs (15-30min frequency) with 3 retries each, processing 109 Meta accounts with 63k+ ads. Each failure triggered cascading retries on rate-limited queries.
- **Impact:** All API queries timeout, circuit breaker activated, database credentials unreachable.
- **Mitigation applied:** Reduced cron frequencies (15min→6-12h) and retries (3→1). Should be verified in production.
- **Location:** `/src/inngest/functions/*` (cron schedules)
- **Tags:** [[Inngest]] [[Supabase]] [[infrastructure]] [[rate-limit]]

### [CRITICAL] isPublishing state trap in PreviewPublishStep
- **Description:** If `handlePublish()` throws exception before `setIsPublishing(false)`, the publish button becomes permanently disabled. No UI recovery path for user.
- **Impact:** User cannot retry publishing without page refresh.
- **Location:** `/src/pages/api/meta/bulk-publish.ts` line ~350-362
- **Fix:** Wrap entire publish flow in try/finally to ensure `setIsPublishing(false)` always executes.
- **Tags:** [[bulk-publish]] [[error-handling]] [[UX]]

## Technical Debt

### [HIGH] BatchCard missing campaignCount UI
- **Description:** `BatchAccountEntry.campaignCount` field added to store and Zod schema, but no input control exposed in `BatchCard.tsx`. Users cannot set different campaign counts per account (e.g., Account A: 4 campaigns, Account B: 2). Field exists as backend-only, defaults to `undefined` (treated as 1).
- **Impact:** New distribution algorithm (BR-029 block-based) cannot be leveraged by users through UI. Workaround requires direct store manipulation.
- **Location:** `/src/components/campaign-wizard/tabs/` (BatchCard.tsx)
- **Prioridad:** Alta (blocks feature adoption)
- **Tags:** [[wizard]] [[UI]] [[campaignCount]]

### [HIGH] PreviewPublishStep doesn't consult pageCurrentAdsets
- **Description:** `buildDistributionMap()` accepts `pageCurrentAdsets` parameter (introduced in BR-032 to BR-035) to prevent exceeding 250 adsets per page limit. However, `PreviewPublishStep` doesn't call `/api/meta/pages/[pageId]/adset-count` before distribution. Algorithm assumes max capacity (250) for all pages, ignoring existing adsets.
- **Impact:** Pages near or at the 250-adset limit may fail during Meta API calls with quota exceeded errors.
- **Location:** `/src/components/campaign-wizard/` (Tab6Preview.tsx), `/src/pages/api/meta/bulk-publish.ts`
- **Fix:** Execute Promise.all() with endpoint calls for each selected page before calling buildDistributionMap().
- **Tags:** [[bulk-publish]] [[distribution]] [[pageCurrentAdsets]]

### [MEDIUM] Supabase TypeScript types outdated
- **Description:** Tables `meta_insights` and `meta_sync_status` (migration 010) not reflected in Supabase type definitions. Code uses `as any` as workaround for rows from these tables.
- **Location:** `/src/inngest/functions/syncMetaInsights.ts`, other sync functions
- **Fix:** Run `supabase gen types typescript --project-id={id}` after applying migrations, remove `as any` casts.
- **Tags:** [[Supabase]] [[TypeScript]]

### [MEDIUM] Pagination not implemented in /api/meta/campaigns
- **Description:** Endpoint returns all campaigns at once via single Supabase query. For 10k+ campaigns, response size becomes large. Frontend already supports pagination params.
- **Location:** `/src/pages/api/meta/campaigns.ts`
- **Fix:** Add `.range(offset, offset + limit)` to Supabase query, pass pagination metadata in response.
- **Tags:** [[pagination]] [[Supabase]] [[performance]]

### [MEDIUM] Inngest function cron frequencies may still be excessive
- **Description:** Even after reduction from 15min→6h (sync-meta-ad-accounts) and 30min→6h (sync-meta-insights), these are still global crons that process 109+ accounts sequentially. Each account may timeout on Hobby tier.
- **Impact:** Some accounts may be skipped or return partial sync on each cycle.
- **Location:** `/src/inngest/functions/syncMetaAdAccounts.ts`, `/src/inngest/functions/syncMetaInsights.ts`
- **Tags:** [[Inngest]] [[infrastructure]] [[rate-limit]]

### [MEDIUM] Debug logs and console.error statements scattered across bulk-publish flow
- **Description:** Extensive logging added during bug fixes for error 2490487. Should be cleaned up or moved to structured logging once flow stabilizes.
- **Location:** `/src/pages/api/meta/bulk-publish.ts`, `/src/lib/meta-ad-rules.ts`, Inngest functions
- **Tags:** [[logging]] [[cleanup]]

### [LOW] uploadImage method in meta-api.ts unused
- **Description:** Implemented for `/adimages` endpoint upload but app lacks capability for that endpoint. Workaround uses `picture` field with direct URLs instead.
- **Status:** Safe to keep for future capability grants; mark as deprecation candidate.
- **Location:** `/src/lib/meta-api.ts`
- **Tags:** [[dead-code]] [[Meta-API]]

## Security Concerns

### [HIGH] Environment variables not validated on startup
- **Description:** Missing `SUPABASE_SERVICE_ROLE_KEY`, `META_APP_ID`, `META_APP_SECRET`, `INNGEST_EVENT_KEY`, and other secrets are used with fallback to `''` (empty string). No validation prevents app from starting in misconfigured state.
- **Impact:** Silent failures in production if env var is missing. Inngest webhooks may fail if `INNGEST_SIGNING_KEY` is empty.
- **Location:** `/src/inngest/client.ts`, `/src/lib/supabase.ts`, `/src/pages/api/meta/bulk-publish.ts`
- **Fix:** Use startup validation (e.g., `invariant()` or `process.exit(1)` in server init) to fail fast.
- **Tags:** [[env-vars]] [[validation]]

### [MEDIUM] Meta OAuth tokens stored in DB with no rotation strategy
- **Description:** Long-lived Meta OAuth tokens (60-day expiry) stored in `meta_connections.access_token`. Refresh flow exists via `refreshMetaToken()` cron but:
  1. No pre-expiry alert to users
  2. No manual refresh endpoint if token expires before cron runs
  3. No token versioning/history (can't audit which token was used for which operation)
- **Impact:** Expired tokens cause silent API failures until next cron cycle or manual intervention.
- **Location:** `/src/inngest/functions/refreshMetaToken.ts`, `/src/pages/api/auth/meta/callback.ts`
- **Tags:** [[auth]] [[tokens]] [[oauth]]

### [MEDIUM] Supabase RLS policies potentially incomplete
- **Description:** RLS is enabled per CLAUDE.md ("RLS ativo") but audit of actual policies in migrations 002 & 009 is needed to verify:
  1. Users can only see their own accounts, campaigns, adsets, ads
  2. Inngest sync functions use `supabaseAdmin` (service role) to bypass RLS for system operations
  3. No data leakage between users on shared accounts
- **Location:** `/migrations/002_create_users_and_rls.sql`, `/migrations/009_create_missing_tables.sql`
- **Tags:** [[RLS]] [[security]] [[Supabase]]

### [MEDIUM] Google Drive folder URLs not validated for public access
- **Description:** `/api/drive/list-files` uses API key (not OAuth) to list files from "public" Google Drive folders. No verification that folder is actually public or that user has permission to reference it.
- **Impact:** User could paste private folder URL → API call may fail silently or expose folder content if shared with the API key.
- **Location:** `/src/pages/api/drive/list-files.ts`
- **Tags:** [[Google-Drive]] [[authorization]]

### [LOW] CSRF state stored in `oauth_states` table with TTL but not cleaned up
- **Description:** State tokens created with `exp_at` timestamp, but no cleanup job removes expired states. Table grows unbounded.
- **Potential impact:** Low (state is single-use, but table bloat is inefficient).
- **Location:** `/migrations/008_add_user_id_to_oauth_states.sql`
- **Fix:** Add Inngest cron to delete states where `exp_at < NOW()`.
- **Tags:** [[oauth]] [[cleanup]]

## Performance Concerns

### [HIGH] Timeout guard at 50s in bulk-publish may silently drop campaigns
- **Description:** Vercel serverless timeout is 60s (Pro) or 10s (Hobby). Code enforces 50s safety margin, marking remaining campaigns as "timeout" after 50s elapsed. No backpressure or queue system to retry silently.
- **Impact:** On Hobby tier (10s limit), likely all requests timeout. On Pro tier, batch size is limited to ~8-10 campaigns.
- **Location:** `/src/pages/api/meta/bulk-publish.ts` lines 90-102
- **Mitigation:** Use Inngest as async background task instead of synchronous API route. Currently documented as "future work".
- **Tags:** [[Vercel]] [[timeout]] [[bulk-publish]]

### [MEDIUM] Rate limit headers from Meta API not actively monitored
- **Description:** Code reads `x-business-use-case-usage` header and implements adaptive delay (0s to 12s based on >=50% to >=95% thresholds). However:
  1. No metrics/alerts if rate limit is consistently high
  2. No autoscaling of batch size if usage > 80%
  3. Jitter (0-2s random) can still trigger rate limit if multiple accounts sync in parallel
- **Location:** `/src/lib/meta-api.ts` (adaptive delay logic), `/src/inngest/functions/syncMetaInsights.ts`
- **Tags:** [[Meta-API]] [[rate-limit]] [[monitoring]]

### [MEDIUM] Account-level insights batch assumes max 500 campaigns per account
- **Description:** `syncMetaInsights` fetches `{account_id}/insights?limit=500` per page. If an account has >500 campaigns, requires pagination. Pagination logic exists but no test coverage for 500+ campaign scenarios.
- **Location:** `/src/inngest/functions/syncMetaInsights.ts` line 104-110
- **Tags:** [[Meta-API]] [[batch]] [[scale]]

### [MEDIUM] Supabase singleton lazy initialization in SSR context
- **Description:** CLAUDE.md states "RLS ativo; singleton lazy para SSR". Supabase client initialized on-demand in API routes and Inngest. If two concurrent requests hit before initialization, could create duplicate clients.
- **Impact:** Low-likelihood race condition, but potential resource leak.
- **Location:** `/src/inngest/functions/` (all use `getSupabase()` singleton pattern)
- **Tags:** [[Supabase]] [[singleton]]

## Known Limitations

### Rate limit of Meta API can block rapid publications
- **Description:** Each campaign creation = 3+ API calls (campaign + adset + ad). 50 campaigns = 150+ calls. Meta API rate limit (~80 calls/min for most apps) triggers after ~5-10 campaigns.
- **Implemented mitigation:** Jitter 800-2000ms between calls, backoff exponential, monitor `x-business-use-case-usage` header.
- **Status:** Tested and working, but known hard ceiling.
- **Tags:** [[Meta-API]] [[rate-limit]]

### Google Drive file limit (100 max per folder)
- **Description:** `/api/drive/list-files` uses Google Drive API v3 with `pageSize=100`. If folder has >100 files, only first 100 are returned.
- **Impact:** Creative libraries larger than 100 items cannot be fully synced.
- **Location:** `/src/pages/api/drive/list-files.ts` line ~82
- **Tags:** [[Google-Drive]] [[API-limit]]

### Video upload not implemented
- **Description:** Creative files of type "video" are skipped during bulk-publish with a warning. No upload endpoint for Meta `/act_{id}/advideos` (requires special app capability).
- **Workaround:** Use video URL directly in `video_data.video_url` field (alternative, untested).
- **Location:** `/src/pages/api/meta/bulk-publish.ts` line ~225
- **Tags:** [[Meta-API]] [[video]] [[feature-gap]]

### Google Ads integration is sync-only
- **Description:** CLAUDE.md states "Integracao parcial (sync apenas)". Can sync Google Ads accounts and campaigns, but no CRUD operations (create/update/delete).
- **Location:** `/src/inngest/functions/syncGoogleAdsAccounts.ts`
- **Tags:** [[Google-Ads]] [[feature-gap]]

### 250 adsets per page limit
- **Description:** Facebook enforces max 250 adsets per page. Distribution algorithm respects this via `pageCurrentAdsets` tracking (BR-032+), but if user exceeds limit, Meta API will reject with "Page adset limit exceeded".
- **Status:** Controlled by algorithm; risk is low unless PreviewPublishStep skips pageCurrentAdsets fetch.
- **Tags:** [[Meta-API]] [[limit]]

## Missing / Incomplete Features

### [HIGH] Retry mechanism doesn't reconstruct full campaign hierarchy
- **Description:** When bulk-publish fails, `/api/meta/retry-publish` attempts to retry. However, if rate limit was hit mid-adset creation, retry only recreates campaign (not adsets/ads). Campaigns end up empty.
- **Impact:** Failed retries result in orphaned empty campaigns in Meta.
- **Location:** `/src/pages/api/meta/retry-publish.ts`
- **Status:** Partially fixed in BUG-016 (retry now calls `createFullCampaign` to recreate everything). Needs verification.
- **Tags:** [[bulk-publish]] [[retry]] [[feature-gap]]

### [MEDIUM] Campaign draft auto-save missing validation feedback
- **Description:** `/api/drafts/save` persists partial draft state without returning validation errors. If user sees green checkmark but data is invalid, publication will fail later with confusing Meta API error.
- **Location:** `/src/pages/api/drafts/save.ts`
- **Fix:** Return validation errors from Zod schema; frontend shows them inline.
- **Tags:** [[drafts]] [[validation]] [[UX]]

### [MEDIUM] No email/webhook notification for failed syncs
- **Description:** When `syncMetaInsights` or other Inngest functions fail, status is marked "failed" in `meta_sync_status` table, but no alert is sent to user. User must manually check /logs page.
- **Location:** `/src/inngest/functions/syncMetaInsights.ts` (catch blocks don't trigger alerts)
- **Tags:** [[Inngest]] [[alerts]] [[observability]]

### [MEDIUM] Alert rules don't support time-of-day scheduling
- **Description:** `/api/alerts` supports condition-based rules (e.g., "if ROAS < 2.0") but not time windows (e.g., "only check 9am-5pm"). All alerts are evaluated 24/7.
- **Location:** `/src/inngest/functions/checkAlertRules.ts`
- **Tags:** [[alerts]] [[feature-gap]]

### [LOW] No campaign template import/export
- **Description:** UI allows saving templates in wizard, but no bulk export (e.g., CSV/JSON) or import from external system.
- **Location:** `/src/pages/api/templates/*`
- **Tags:** [[templates]] [[feature-gap]]

## Dependency Risks

### [MEDIUM] Inngest v3.52.7 vs v4.0.0 — unclear version compatibility
- **Description:** `package.json` depends on `inngest@^3.52.7`, but code imports from `inngest/next` (Next.js integration). v4.0.0 has breaking changes. No clear migration path documented.
- **Impact:** Future npm updates could pull v4, breaking app.
- **Location:** `/apps/meta-ads-manager/package.json` line 22
- **Fix:** Pin to `^3.52.7` explicitly or evaluate v4 migration.
- **Tags:** [[dependencies]] [[inngest]]

### [MEDIUM] google-ads-api v23.0.0 — outdated package name
- **Description:** Package is `google-ads-api` (third-party community fork), not official Google Ads API client. Official package is `google-ads` from Google. Third-party package may not receive timely security updates.
- **Impact:** Potential security lag if vulnerabilities found in official SDK but not backported.
- **Location:** `/apps/meta-ads-manager/package.json` line 21
- **Tags:** [[dependencies]] [[google-ads]]

### [LOW] Framer Motion v12.38.0 — possibly outdated
- **Description:** Current stable version may be newer. No explicit constraint on upper bound (uses `^12.38.0`).
- **Impact:** Minor; animation library is non-critical.
- **Tags:** [[dependencies]]

### [LOW] Tailwind CSS 4.2.1 — major version with breaking changes
- **Description:** v4 introduced @tailwindcss/postcss and other changes. Ensure config in `tailwind.config.js` is v4-compatible.
- **Location:** `/apps/meta-ads-manager/tailwind.config.js`, `package.json` line 33
- **Tags:** [[dependencies]] [[tailwind]]

## Monitoring & Observability Gaps

### [HIGH] No structured logging for Meta API errors
- **Description:** Errors logged via `console.error()` with variable detail. No centralized error catalog or pattern matching for common errors (e.g., "error 2490487" always means bid constraints, "error 100" means invalid param).
- **Impact:** Debugging production issues is slow; no trend detection.
- **Location:** `/src/lib/meta-api.ts`, `/src/pages/api/meta/bulk-publish.ts`, Inngest functions
- **Tags:** [[logging]] [[observability]]

### [HIGH] Publish job status not tracked in real-time
- **Description:** `/api/meta/publish-status/[jobId]` exists but frontend polling may miss updates if status changes between polls. No WebSocket/server-sent events for real-time feedback.
- **Impact:** User sees stale status; may retry thinking job failed when it succeeded.
- **Location:** `/src/pages/api/meta/publish-status/*`, frontend polling
- **Tags:** [[status-tracking]] [[websocket]]

### [MEDIUM] No metrics dashboard for sync health
- **Description:** `meta_sync_status` table records last_sync_status, last_error, records_synced per account, but no UI dashboard to visualize:
  1. Accounts with stale data (>6h since last successful sync)
  2. Error rate trends
  3. Sync duration per account
- **Impact:** Admins can't quickly diagnose if sync is degrading.
- **Location:** `/src/pages/*` (dashboard incomplete)
- **Tags:** [[observability]] [[dashboard]]

### [MEDIUM] Inngest logs not accessible without Inngest account
- **Description:** If Inngest service itself has an issue, app operator has no local logs. All function execution details are in Inngest dashboard.
- **Impact:** Debugging async issues requires access to external SaaS.
- **Tags:** [[Inngest]] [[logging]]

### [LOW] No APM/tracing instrumentation
- **Description:** No OpenTelemetry or APM integration (Datadog, New Relic, etc.). Cannot trace full request lifecycle across API → Supabase → Meta API.
- **Tags:** [[observability]] [[APM]]

## Data Consistency & Integrity Gaps

### [MEDIUM] Campaign creation + DB insertion are not transactional
- **Description:** Code creates campaign in Meta API, then inserts record in `meta_ads_campaigns` table. If DB insert fails, campaign exists in Meta but not in Supabase. Sync job may recreate duplicate.
- **Location:** `/src/pages/api/meta/bulk-publish.ts` lines 128-149
- **Mitigation:** Sync Inngest job upserts on `campaign_id` constraint, preventing duplicate records. Still has stale data window.
- **Tags:** [[transactions]] [[consistency]]

### [MEDIUM] Adset and Ad records may become orphaned
- **Description:** If adset creation succeeds but ad creation fails mid-batch, adset record exists in DB without any ads. Meta API has ads, Supabase does not.
- **Impact:** Frontend drill-down shows incomplete data; user may think ads weren't created.
- **Location:** `/src/pages/api/meta/bulk-publish.ts` lines 185-228
- **Tags:** [[consistency]]

### [MEDIUM] Sync may create duplicates if run concurrently
- **Description:** Two Inngest workers could run `syncMetaAdAccounts` simultaneously. Both fetch same accounts from Meta, both upsert to Supabase. While upsert prevents duplicates, CPU/API calls are wasted.
- **Mitigation:** Inngest has built-in concurrency limits. Verify they are set in config.
- **Location:** `/src/inngest/client.ts`, Inngest dashboard settings
- **Tags:** [[Inngest]] [[concurrency]]

## Error Handling Gaps

### [MEDIUM] Silent failures in rate limit retries
- **Description:** When rate limit is hit (≥95% usage), code throws `RateLimitError`. Inngest catches it and retries. But if user is waiting on frontend, they see no feedback that request is queued for retry.
- **Impact:** User thinks app is broken; may retry manually, doubling queue.
- **Location:** `/src/lib/meta-api.ts` (RateLimitError), `/src/inngest/functions/*` (retry logic)
- **Tags:** [[error-handling]] [[UX]]

### [MEDIUM] Catch-all error responses hide root cause
- **Description:** API routes return `{ error: 'Failed to ...' }` without including error details. Useful for security (don't leak internals), but makes debugging hard.
- **Example:** `{ error: 'Failed to fetch accounts' }` could mean 10 different things.
- **Location:** `/src/pages/api/meta/*`, `/src/pages/api/drafts/*`
- **Tags:** [[error-handling]] [[debugging]]

### [LOW] Unhandled promise rejections in useEffect hooks
- **Description:** Some useEffect hooks in wizard make async calls without proper error handling. If promise rejects, error is swallowed.
- **Location:** `/src/components/campaign-wizard/` (various tabs)
- **Tags:** [[React]] [[error-handling]]

## Specific File Risks

### `/src/pages/api/meta/bulk-publish.ts`
- **Issue:** Large (~300+ lines), handles campaign/adset/ad creation in single function. Hard to test, hard to maintain.
- **Recommendation:** Refactor into smaller modules (campaign builder, adset builder, ad builder) with isolated tests.

### `/src/inngest/functions/syncMetaInsights.ts`
- **Issue:** Complex pagination + adaptive delay + rate limit handling. If async error occurs mid-pagination, partial state is saved.
- **Recommendation:** Add explicit transaction boundary or saga pattern to ensure all-or-nothing sync per account.

### `/src/components/campaign-wizard/tabs/`
- **Issue:** 7 tabs with significant local state. BatchCard, ConfigPopupV2, Tab5Creative all manage their own Zustand slices. Interactions between tabs can cause infinite loops (previously: BUG-015).
- **Recommendation:** Consider a single unified wizard state machine with explicit state transitions.

## Summary

**Critical Path to Stability:**
1. Apply missing migrations (004, 010) immediately
2. Validate env vars on startup
3. Fix isPublishing trap in PreviewPublishStep
4. Verify Inngest cron frequency reductions are deployed
5. Add BatchCard UI for campaignCount
6. Implement PreviewPublishStep → pageCurrentAdsets fetch

**Medium-term (next sprint):**
1. Refactor bulk-publish.ts into smaller, testable modules
2. Add structured logging with error catalog
3. Implement audit trail for token refresh events
4. Add Inngest function concurrency limits config
5. Build sync health dashboard

**Long-term:**
1. Migrate bulk-publish from Vercel to Inngest (async)
2. Add OpenTelemetry tracing
3. Implement email/webhook alerts for failed syncs
4. Upgrade to official Google Ads API client
5. Consider database transaction boundaries (Supabase Postgres triggers or explicit locks)
