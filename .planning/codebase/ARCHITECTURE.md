# Architecture

## Overview

This project is a comprehensive AI-Orchestrated System (AIOS) for full-stack development featuring a modular monorepo structure. The primary production application is **Meta Ads Manager**, a full-stack web platform built with Next.js for managing Meta/Facebook advertising campaigns at scale. It enables users to create, configure, and bulk-publish ad campaigns with complex distribution logic across multiple ad accounts and pages, backed by Supabase for data persistence and Inngest for asynchronous job orchestration.

The broader AIOS framework provides CLI tools, core runtime modules, and agent scaffolding systems to support AI-driven development workflows. The system is designed for high-scalability and multi-environment deployment (local development, staging, production via Vercel).

## Layers

### Frontend

**Technology**: Next.js 14.1 (Pages Router), React 18.2, TypeScript 5.9, Tailwind CSS 4.2, Framer Motion

**Key Components**:
- **Page Routes** (`src/pages/`):
  - `/login` — Supabase Auth UI with Google OAuth
  - `/dashboard` — Main analytics page with KPIs, campaign table, sync controls
  - `/campaigns` — Campaign list with pagination (50 items/page)
  - `/campaigns/setup` — 7-step wizard for bulk campaign creation
  - `/connections` — OAuth connection management (Meta + Google)
  - `/alerts` — Alert rules management (CRUD)
  - `/logs` — Sync history and audit logs
  - `/settings` — User preferences

- **Context & State Management**:
  - **WizardContext** (`src/contexts/WizardContext.tsx`): Manages campaign wizard state (steps, configuration, distribution). Uses useReducer for stateful UI across 7 tabs.
  - **ThemeContext**: Manages light/dark theme
  - **React Query** (v5.90): Server state management with 15-minute stale time, 10-minute garbage collection. Hooks include `useMetaCampaigns`, `useMetaAccounts`, `useMetaAccountsKPIs`.

- **Custom Hooks** (`src/hooks/`):
  - `useAuth()` — Supabase auth state
  - `useMetaConnection()` — Meta OAuth token management
  - `useMetaAccounts()` — Fetch user's connected ad accounts
  - `useMetaCampaigns()` — Fetch campaigns with pagination
  - `useMetaAudiences()`, `useMetaPixels()`, `useMetaPages()` — Meta resources
  - `useMetaSync()` — Trigger sync workflows
  - `useSyncLogs()` — Fetch sync history
  - `useDriveFiles()` — List Google Drive creative assets

- **Components** (`src/components/`):
  - `DashboardLayout` — Main shell with header, sidebar
  - `KPISection` — Performance metrics (spend, reach, conversions)
  - `CampaignsTableNew` — Paginated campaign list with inline editing
  - `CampaignWizard` & `CampaignWizardTabs` — Multi-step form for campaign setup
  - `CampaignEditor` — Full campaign detail editor

**Styling**: Tailwind CSS with postcss, responsive design via flexbox/grid. Motion via Framer Motion for transitions.

### Backend (API Routes)

**Technology**: Next.js API Routes (serverless on Vercel), TypeScript, async/await

**Entry Point**: `src/pages/api/`

**Authentication Layer**:
- `requireAuth(req)` — Validates Supabase JWT from request headers
- `getUserAccounts(userId)` — RLS-aware query to fetch user's ad accounts
- All routes except `/api/health` and `/api/inngest` require auth

**API Route Groups**:

1. **Auth Routes** (`api/auth/meta/`):
   - `meta.ts` — Initiates Meta OAuth flow (generates CSRF state, redirects to Meta Login)
   - `callback.ts` — Receives OAuth code, exchanges for long-lived token (60-day), stores in `meta_connections` table
   - `connection.ts` — Check/manage active Meta connection status
   - `disconnect.ts` — Revoke Meta token

2. **Meta Sync Routes** (`api/meta/`):
   - `sync-all` — Orchestrates full sync: accounts → pages → pixels
   - `sync-accounts` — Fetches ad accounts from Meta Graph API v23.0, upserts into Supabase
   - `accounts/`, `accounts/pages`, `accounts/pixels`, `accounts/audiences` — Fetch user's connected resources

3. **Campaign Management** (`api/meta/campaigns*`):
   - `campaigns` — GET list campaigns (50/page pagination)
   - `campaigns/[id]` — GET/PUT/DELETE individual campaign
   - `campaigns-create` — POST create single campaign + adset + ad
   - `bulk-campaigns-create` — POST queue campaigns for async creation (via Inngest)
   - `bulk-publish` — POST sync batch creation of campaigns/adsets/ads (50s timeout limit)
   - `publish-status/[jobId]` — GET status of async publish job

4. **Ad Set & Ad Routes** (`api/meta/adsets*`, `api/meta/ads*`):
   - CRUD operations (GET, PUT, DELETE) for individual adsets and ads
   - Targeting, budget, bidding strategy management

5. **Analytics** (`api/meta/insights`):
   - Fetch performance metrics (spend, impressions, CTR) from Meta API

6. **Draft & Template Routes** (`api/drafts/`, `api/templates/`):
   - `drafts/current` — Load current wizard state draft (JSON)
   - `drafts/save` — Auto-save wizard progress
   - `templates/save` — CRUD campaign templates

7. **Utility Routes**:
   - `drive/list-files` — List media (images/videos) from Google Drive public folders
   - `health` — Env var + DB connectivity check (no auth)
   - `notifications`, `alerts` — User notifications and alert rules

**Core Libraries**:
- `lib/meta-api.ts` — Wrapper for Meta Graph API calls, structured error handling (MetaAPIError)
- `lib/supabase.ts` — Lazy-loading Supabase client singletons (anon + admin)
- `lib/auth.ts` — JWT validation, user context extraction
- `lib/supabase-rls.ts` — Row-level security queries (filters by user_id)
- `lib/api-client.ts` — Authenticated fetch wrapper (injects JWT from localStorage)
- `lib/validation.ts` — Zod schemas for campaign, adset, ad creation
- `lib/distribution.ts` — Algorithm to distribute adsets across campaigns/pages (handles 250 adset/page limit)

### Database

**Technology**: Supabase PostgreSQL with Row-Level Security (RLS)

**Schema** (`src/types/database.ts` auto-generated):

**Core Tables**:

1. **users** — Supabase Auth integration
   - Fields: id (UUID), email, full_name, avatar_url
   - Meta connection fields: meta_access_token, meta_token_expires_at, meta_user_id, meta_user_name
   - RLS: Users can only read/update their own row

2. **meta_connections** — OAuth token storage
   - Fields: id, user_id, access_token, expires_at, refresh_token (optional)
   - Stores long-lived Meta OAuth tokens (60-day validity)
   - RLS: Users can only access their own connections

3. **oauth_states** — CSRF state for OAuth flow
   - Fields: id, state, provider ('meta'|'google'), user_id, expires_at (10 min TTL)
   - Prevents OAuth state fixation attacks

4. **meta_accounts** — Synced Meta ad accounts
   - Fields: id, user_id, meta_account_id, meta_account_name, currency, timezone, last_synced
   - Updated hourly by `sync-meta-ad-accounts` Inngest cron job
   - RLS: Users see only their own accounts

5. **campaign_drafts** — Wizard progress (one per user)
   - Fields: id (UUID), user_id, state_json (JSONB), created_at, updated_at
   - Constraint: UNIQUE(user_id) — one draft per user
   - RLS: Users can only manage their own draft

6. **meta_pages** — Facebook pages linked to ad accounts
   - Fields: id, user_id, meta_page_id, page_name, picture_url
   - Synced during `sync-all`

7. **meta_pixels** — Conversion tracking pixels
   - Fields: id, user_id, pixel_id, pixel_name, meta_account_id

8. **sync_logs** — Audit trail of sync operations
   - Fields: id, user_id, operation, status, error_message, created_at
   - Visible in `/logs` page for debugging

**Indexes**: UNIQUE(user_id) on campaign_drafts; composite indexes on (user_id, meta_account_id) for fast filtering

**Migrations**: Located in `supabase/migrations/`; executed via Supabase CLI or dashboard

### Async Jobs (Inngest)

**Technology**: Inngest v3.52+ for event-driven and scheduled workflows

**Inngest Functions** (`src/inngest/functions/`):

1. **syncMetaAdAccounts** — Cron-triggered (`*/15 * * * *`)
   - Fetches user's connected Meta ad accounts
   - Calls `GET /me/adaccounts` on Meta Graph API
   - Upserts into `meta_accounts` table
   - Updates `last_synced` timestamp
   - Handles 401 (expired token), 429 (rate limit), network timeouts with exponential backoff

2. **refreshMetaToken** — Cron-triggered (`0 8 * * *` — daily at 8 AM UTC)
   - Queries `meta_connections` for tokens expiring within 7 days
   - Calls Meta token refresh endpoint
   - Updates `expires_at` in DB
   - Prevents abrupt token expiration mid-user session

3. **bulkCreateCampaigns** — Event-triggered (`bulk-create-campaigns`)
   - Creates campaigns, adsets, and ads in parallel
   - Receives campaign config, distribution map, adset types
   - Calls Meta API 3 times per ad (create campaign → adset → ad)
   - Returns job status (success/failed count) stored in `publish_jobs` table

4. **syncMetaInsights** — Cron-triggered (configurable)
   - Fetches campaign performance metrics (spend, reach, conversions)
   - Updates analytics cache in DB or external cache layer

5. **checkAlertRules** — Cron-triggered (configurable)
   - Evaluates user-defined alert rules (e.g., "notify if spend > $1000")
   - Sends notifications via email or in-app

**Rate Limiting Handling**:
- Implements 500ms delay between Meta API calls to avoid code 17/32/4 errors
- Exponential backoff for transient failures (429, 5xx)
- Inngest retries up to 3 times with jitter

**Configuration**:
- Client initialized in `src/inngest/client.ts`
- Event key and signing key from environment variables (`INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`)
- Served at `/api/inngest` for Inngest dashboard webhooks

### Auth

**Frontend Authentication**:
- Supabase Auth with JWT tokens stored in localStorage
- Redirect to `/login` if not authenticated
- Automatic JWT refresh before expiration

**OAuth Providers**:
1. **Meta (Facebook) OAuth**:
   - User initiates login at `/api/auth/meta`
   - CSRF state generated, stored in `oauth_states` table with 10-min TTL
   - Callback (`/api/auth/meta/callback`) receives code, exchanges for long-lived token
   - Token stored in `meta_connections` table
   - User header displays token status (green/yellow/red based on expiry)

2. **Google OAuth**:
   - Configured in Supabase Auth → Providers
   - Used for:
     - User login (Google account)
     - Google Drive access (list creative files)
     - Google Ads sync (partial — read-only accounts)

**Token Management**:
- Supabase JWT (short-lived): Automatically refreshed by Supabase client
- Meta OAuth token (long-lived, 60 days): Refreshed daily by Inngest job if <7 days to expiry
- Stored securely in HttpOnly cookies (Supabase) or database (Meta token)

**Authorization**:
- RLS policies enforce user_id-based row filtering
- API routes validate JWT and extract user context before querying

## Data Flow

### Campaign Creation Workflow (Bulk Publish)

```
User fills 7-step Wizard (WizardContext)
  ↓
Clicks "Publish" → POST /api/meta/bulk-publish
  ↓
Validates configuration (distribution, budget, targeting)
  ↓
Loops through distribution (campaigns × accounts × pages)
  ↓
For each campaign:
  - POST /adaccounts/{accountId}/campaigns (create campaign)
  - POST /campaigns/{campaignId}/adsets (create adset with targeting)
  - POST /adsets/{adsetId}/ads (create ad with creative)
  - Log result to `publish_logs` table
  ↓
Collects results, returns job ID to frontend
  ↓
Frontend polls GET /api/meta/publish-status/{jobId} for progress
  ↓
User sees success/failure count on dashboard
```

### Sync Workflow (Data Pull)

```
Inngest cron (every 15 min)
  ↓
Calls POST /api/meta/sync-all
  ↓
1. Fetch Meta OAuth token from meta_connections
2. GET /me/adaccounts → list user's ad accounts
3. For each account:
   - GET /accounts/{id}/pages → list pages
   - GET /accounts/{id}/adsets?fields=targeting,status → list active adsets
   - GET /accounts/{id}/insights → fetch KPIs
4. Upsert into Supabase (meta_accounts, meta_pages, meta_pixels)
5. Log sync operation to sync_logs
  ↓
Frontend uses React Query to fetch data:
  - useMetaAccounts() → shows in dropdown
  - useMetaCampaigns() → loads campaigns table
  - useMetaAccountsKPIs() → displays KPI cards
```

### Draft Auto-Save

```
User modifies wizard state (e.g., budget, targeting)
  ↓
WizardContext dispatch() triggered
  ↓
useEffect detects state change → POST /api/drafts/save
  ↓
Stores state_json as JSONB in campaign_drafts
  ↓
On page reload: GET /api/drafts/current → restores wizard state
```

## Key Patterns

### Pattern: Lazy-Loading Singletons (Supabase Client)

**Location**: `src/lib/supabase.ts`

**Problem**: Supabase clients initialized at import time fail during Next.js build (SSR). Environment variables not yet loaded.

**Solution**: 
- `getSupabase()` creates client only on first use (lazy)
- Proxy wrapper returns lazy getter for backwards compatibility
- Prevents "missing env vars" errors during `next build`

```typescript
export const supabase: SupabaseClient<Database> = (() => {
  if (supabaseUrl && supabaseAnonKey) {
    return createClient(supabaseUrl, supabaseAnonKey);
  }
  return new Proxy({} as SupabaseClient<Database>, {
    get(_target, prop, receiver) {
      const client = getSupabase();
      const value = (client as any)[prop];
      return typeof value === 'function' ? value.bind(client) : value;
    },
  });
})();
```

### Pattern: Authenticated Fetch Wrapper

**Location**: `src/lib/api-client.ts`

**Problem**: Every API route needs to validate JWT; repeated code for token extraction.

**Solution**: `authenticatedFetch(url, options)` injects JWT from localStorage, catches 401s, redirects to login.

```typescript
const response = await authenticatedFetch('/api/meta/campaigns');
// JWT automatically added; handles refresh + redirect on expiry
```

### Pattern: RLS-Aware Queries

**Location**: `src/lib/supabase-rls.ts`

**Problem**: Queries must be filtered by user_id; manual filtering is error-prone.

**Solution**: Dedicated functions like `getUserAccounts(userId)` that enforce RLS via WHERE clause and JWT context.

```typescript
const { data } = await supabaseAdmin
  .from('meta_accounts')
  .select('*')
  .eq('user_id', userId); // RLS + explicit filter
```

### Pattern: React Query for Server State

**Location**: `src/hooks/`

**Problem**: Manage API state (loading, error, cache) across components.

**Solution**: React Query hooks with 15-min stale time, automatic refetch on focus.

```typescript
const { data: campaigns, isLoading, error } = useMetaCampaigns({
  accountId: selectedAccountId,
  limit: 50,
  offset: pageOffset,
});
```

### Pattern: WizardContext Reducer for Multi-Step Forms

**Location**: `src/contexts/WizardContext.tsx`

**Problem**: 7-step wizard state is complex; useState would fragment state across components.

**Solution**: useReducer + context to centralize state (step, config, distribution) and expose dispatch.

```typescript
const [state, dispatch] = useReducer(wizardReducer, initialState);
// dispatch({ type: 'SET_CAMPAIGN_OBJECTIVE', payload: 'OUTCOME_SALES' })
```

### Pattern: Error Catalog

**Location**: `src/lib/error-catalog.ts`

**Problem**: Meta API errors (code 17, 32, 4) need specific handling; user-facing messages differ from technical errors.

**Solution**: Map Meta error codes to user-readable messages and retry strategies.

```typescript
const catalog = {
  17: { message: 'Rate limit exceeded', retryable: true, delay: 500 },
  32: { message: 'Page ID invalid', retryable: false },
};
```

### Pattern: Distribution Algorithm (Adsets Across Accounts/Pages)

**Location**: `src/lib/distribution.ts`

**Problem**: User specifies N campaigns, M accounts, P pages, K adsets per campaign. System must map adsets to accounts/pages while respecting 250-adset-per-page limit.

**Solution**: Algorithm distributes adsets round-robin across accounts, validates page capacity.

```typescript
const distribution = distributeAdsetsToPages(
  totalCampaigns,
  selectedAccountIds,
  selectedPageIds,
  adsetsPerCampaign
);
// Returns: [{ campaignIndex, accountId, pageId, adsetCount }, ...]
```

### Pattern: Inngest Job Retry with Exponential Backoff

**Location**: `src/inngest/functions/`

**Problem**: Network calls to Meta API may timeout; need intelligent retry.

**Solution**: Inngest's built-in retry logic (configurable via function options).

```typescript
export const syncMetaAdAccounts = inngest.createFunction(
  {
    id: 'sync-meta-accounts',
    retries: 3,
    timeout: '5m',
  },
  { cron: '*/15 * * * *' },
  async ({ step }) => {
    const result = await step.run('fetch-accounts', async () => {
      return await fetch('https://graph.facebook.com/v23.0/me/adaccounts');
    });
  }
);
```

### Pattern: Zod Validation Schemas

**Location**: `src/lib/batch-schemas.ts`, `src/lib/validation.ts`

**Problem**: Validate user input (campaign config, adset targeting) before sending to Meta API.

**Solution**: Zod schemas parsed on API routes; return 400 if invalid.

```typescript
const CampaignCreateSchema = z.object({
  campaignName: z.string().min(1),
  campaignObjective: z.enum(['OUTCOME_SALES', 'OUTCOME_LEADS']),
  budgetValue: z.number().min(100),
});

const parsed = CampaignCreateSchema.parse(req.body); // Throws if invalid
```

### Pattern: React Query Invalidation on Mutation

**Location**: `src/pages/dashboard.tsx`

**Problem**: After publishing campaigns, old data in cache is stale.

**Solution**: After POST request, invalidate query key to trigger refetch.

```typescript
const queryClient = useQueryClient();
const response = await authenticatedFetch('/api/meta/campaigns-create', {
  method: 'POST',
  body: JSON.stringify(campaign),
});
queryClient.invalidateQueries({ queryKey: ['meta-campaigns'] });
```

### Pattern: Environment-Aware Configuration

**Location**: `.env.local`, `.env.example`

**Problem**: Different credentials for dev/staging/prod; avoid secrets in code.

**Solution**: Environment variables, with `.env.example` documenting required vars.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxx (server-side only)
META_APP_ID=xxxx
INNGEST_EVENT_KEY=xxxx
```

**Client-side** (`NEXT_PUBLIC_` prefix): Safe to expose (public Supabase key, Meta App ID)
**Server-side**: Kept secret (service role key, Meta app secret, Inngest signing key)
