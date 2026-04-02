# External Integrations

## Meta Graph API (Facebook Ads Manager)
- **Type:** RESTful API with OAuth 2.0
- **Auth method:** OAuth 2.0 (user-initiated flow via Facebook Login Dialog)
- **Version:** v23.0 (configurable via `META_API_VERSION`)
- **Base URL:** `https://graph.facebook.com/{version}/{path}`
- **Key files:**
  - `/apps/meta-ads-manager/src/lib/meta-api.ts` — MetaAPIClient class with full Graph API integration
  - `/apps/meta-ads-manager/src/pages/api/auth/meta.ts` — OAuth flow initiation
  - `/apps/meta-ads-manager/src/pages/api/auth/meta/callback.ts` — OAuth callback handler
  - `/apps/meta-ads-manager/src/pages/api/auth/meta/connection.ts` — Connection management
  - `/apps/meta-ads-manager/src/pages/api/auth/meta/disconnect.ts` — Disconnection handler
  - `/apps/meta-ads-manager/src/pages/api/meta/*` — API proxy endpoints (campaigns, adsets, ads, insights, etc.)
  - `/apps/meta-ads-manager/src/inngest/functions/syncMetaAdAccounts.ts` — Account sync workflow
  - `/apps/meta-ads-manager/src/inngest/functions/refreshMetaToken.ts` — Token refresh automation
  - `/apps/meta-ads-manager/src/inngest/functions/syncMetaInsights.ts` — Insights sync workflow
  - `/apps/meta-ads-manager/src/inngest/functions/bulkCreateCampaigns.ts` — Bulk campaign creation
  - `/apps/meta-ads-manager/src/components/MetaAuthButton.tsx` — OAuth initiation UI
- **Env vars:**
  - `META_APP_ID` — App ID from Meta Developer Console
  - `META_APP_SECRET` — App secret (server-only)
  - `META_OAUTH_REDIRECT_URI` — OAuth callback URL
  - `META_API_VERSION` — API version (default: v23.0)
- **Capabilities:**
  - Account management (retrieve ad accounts, pages, pixels)
  - Campaign CRUD operations
  - AdSet management
  - Ad management
  - Insights & performance metrics
  - Pixel tracking
  - Token refresh/renewal
  - Bulk campaign/adset creation
- **Error Handling:** Custom `MetaAPIError` class captures Meta-specific error codes, user-facing messages, and trace IDs
- **Rate Limiting:** Implemented via Inngest workflow orchestration
- **Notes:**
  - Uses custom `MetaAPIClient` class with method chaining
  - Graph API token stored in Supabase `user_meta_accounts` table
  - CSRF protection via random state in OAuth flow (stored in `oauth_states` table with 10-min TTL)
  - User agent: "RoiLabz/1.0 (Meta Ads Dashboard)"

---

## Supabase (PostgreSQL + Auth + Realtime)
- **Type:** Backend-as-a-Service (BaaS) with managed PostgreSQL
- **Auth method:** 
  - Email/password (via `@supabase/auth-ui-react`)
  - OAuth with Meta/Facebook
  - JWT tokens (access + refresh)
- **Services used:**
  - **Authentication:** Email sign-up, OAuth, JWT-based sessions
  - **Database:** PostgreSQL with RLS (Row-Level Security)
  - **Storage:** File uploads
  - **Realtime:** Subscriptions for live updates (optional)
- **Key files:**
  - `/apps/meta-ads-manager/src/lib/supabase.ts` — Supabase client initialization (lazy singletons)
  - `/apps/meta-ads-manager/src/lib/supabase-rls.ts` — RLS policy helpers
  - `/apps/meta-ads-manager/src/lib/auth.ts` — Authentication utilities
  - `/apps/meta-ads-manager/src/pages/api/auth/callback.tsx` — OAuth callback handler
  - `/apps/meta-ads-manager/src/pages/auth/callback.tsx` — Client-side callback UI
  - `/apps/meta-ads-manager/src/pages/api/accounts/index.ts` — Account API
  - `/apps/meta-ads-manager/src/hooks/useAuth.ts` — Auth hook
- **Env vars:**
  - `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Anon key (public, safe for browser)
  - `SUPABASE_SERVICE_ROLE_KEY` — Service role key (server-only, full permissions)
- **Database tables (inferred from code):**
  - `user_meta_accounts` — User's connected Meta accounts
  - `user_google_accounts` — User's connected Google Ads accounts
  - `oauth_states` — OAuth state tokens with 10-min TTL
  - `campaigns` — Campaign data
  - `notifications` — User notifications
  - `alerts` — Alert rules and configurations
  - `drafts` — Unsaved campaign drafts
  - `templates` — Campaign templates
- **Policies:** Row-Level Security (RLS) enforces per-user data isolation
- **Client initialization:**
  - Lazy singleton pattern (only created on first use, safe for SSR)
  - Supports both anon (browser) and service role (server) clients
  - Proxy pattern for build-time safety when env vars missing
- **Notes:**
  - Service role client only initialized if `SUPABASE_SERVICE_ROLE_KEY` provided
  - Used for user auth, data persistence, and OAuth state management
  - RLS ensures users can only access their own data

---

## Inngest (Serverless Workflow Automation)
- **Type:** Event queue and workflow orchestrator
- **Auth method:** Event key + signing key (API authentication)
- **Key files:**
  - `/apps/meta-ads-manager/src/inngest/client.ts` — Inngest client
  - `/apps/meta-ads-manager/src/pages/api/inngest.ts` — Inngest webhook handler
  - `/apps/meta-ads-manager/src/inngest/functions/syncMetaAdAccounts.ts` — Sync Meta accounts
  - `/apps/meta-ads-manager/src/inngest/functions/syncGoogleAdsAccounts.ts` — Sync Google Ads accounts (mock)
  - `/apps/meta-ads-manager/src/inngest/functions/refreshMetaToken.ts` — Refresh Meta token
  - `/apps/meta-ads-manager/src/inngest/functions/syncMetaInsights.ts` — Sync performance insights
  - `/apps/meta-ads-manager/src/inngest/functions/bulkCreateCampaigns.ts` — Bulk campaign creation
  - `/apps/meta-ads-manager/src/inngest/functions/checkAlertRules.ts` — Alert rule evaluation
- **Env vars:**
  - `INNGEST_EVENT_KEY` — Public event key for triggering workflows
  - `INNGEST_SIGNING_KEY` — Secret key for validating webhook signatures
- **Workflows:**
  - **syncMetaAdAccounts** — Periodically fetches user's Meta ad accounts
  - **syncGoogleAdsAccounts** — Periodically fetches user's Google Ads accounts (mock only)
  - **refreshMetaToken** — Refreshes expired Meta OAuth tokens before expiry
  - **syncMetaInsights** — Fetches campaign performance metrics and insights
  - **bulkCreateCampaigns** — Creates multiple campaigns in batch (triggered manually)
  - **checkAlertRules** — Evaluates alert conditions and sends notifications
- **Integration pattern:** 
  - Triggered by webhook at `/api/inngest`
  - Functions poll Supabase for user accounts to sync
  - Results stored back to Supabase
- **Notes:**
  - Runs asynchronously (non-blocking)
  - Provides automatic retries and error handling
  - Used for background sync tasks and scheduled jobs

---

## Google Ads API
- **Type:** RESTful API with OAuth 2.0
- **Auth method:** OAuth 2.0 (via `google-ads-api` package)
- **Package:** `google-ads-api` v23.0.0
- **Key files:**
  - `/apps/meta-ads-manager/src/inngest/functions/syncGoogleAdsAccounts.ts` — Account sync (mock implementation)
  - `/apps/meta-ads-manager/src/hooks/useGoogleAdsAccounts.ts` — Hook for Google accounts
  - `/apps/meta-ads-manager/src/components/GoogleAuthButton.tsx` — OAuth button
- **Env vars:**
  - `GOOGLE_PICKER_API_KEY` — Google Picker API key for file/resource selection
- **Capabilities:**
  - Account discovery (customer accounts)
  - Campaign listing and management
  - Performance metrics
  - Ad group and keyword management
- **Status:** Mock implementation only
  - Real integration requires complex setup with Google Cloud Console
  - Currently returns empty data to avoid errors
  - Placeholder for future production implementation
- **Storage:** Tokens stored in Supabase `user_google_accounts` table
- **Notes:**
  - Integration framework in place but not yet fully implemented
  - Requires Google Ads API credentials and developer approval
  - Uses `google-ads-api` package as client library

---

## Authentication UI Components (Supabase)
- **Type:** Pre-built UI library
- **Package:** `@supabase/auth-ui-react` v0.4.7
- **Features:**
  - Email/password forms
  - Social login buttons
  - Magic link authentication
  - Multi-factor authentication UI
- **Key files:**
  - `/apps/meta-ads-manager/src/pages/auth/` — Auth pages
  - `/apps/meta-ads-manager/src/components/MetaAuthButton.tsx` — Meta login button
  - `/apps/meta-ads-manager/src/components/GoogleAuthButton.tsx` — Google login button
- **Notes:** Customizable with Tailwind CSS for theming

---

## Environment & Configuration Services
- **Type:** Configuration management
- **Key files:**
  - `/.env.example` — Template for all required environment variables
  - `/vercel.json` — Vercel deployment configuration
  - `/apps/meta-ads-manager/tsconfig.json` — TypeScript configuration
  - `/apps/meta-ads-manager/next.config.js` — Next.js configuration
  - `/apps/meta-ads-manager/tailwind.config.js` — Tailwind CSS configuration
- **Env vars template locations:**
  - Root `.env.example` documents all integration keys
  - Organized by service category (LLM Providers, Search & Research, Database, CI/CD, etc.)
  - Includes setup URLs for each service

---

## Notification & Communication
- **Telegram Bot** (Optional)
- **Type:** Telegram Bot API
- **Env var:** `TELEGRAM_BOT_TOKEN`
- **Usage:** In-app notifications and alert delivery (if configured)
- **Status:** Placeholder integration

---

## Search & Research (Future Integration)
- **EXA API**
- **Type:** Web search API
- **Env var:** `EXA_API_KEY`
- **Status:** Configured but not yet used in current codebase
- **Notes:** Environment template suggests support for future implementation

---

## CI/CD & Deployment Integration
- **Vercel**
- **Type:** Platform-as-a-Service for Next.js
- **Configuration:** `vercel.json`
- **Env var:** `VERCEL_TOKEN`
- **Deployment settings:**
  - Root directory: `apps/meta-ads-manager`
  - Build command: `cd apps/meta-ads-manager && npm run build`
  - Install command: `cd apps/meta-ads-manager && npm install`
  - Output directory: `.next`
  - Framework detection: Next.js
- **Notes:** One-click deployments with environment variable sync

---

## GitHub Integration
- **Type:** Version control and CI/CD
- **Env var:** `GITHUB_TOKEN`
- **Usage:** API access for CI/CD workflows, releases, and automation
- **Status:** Available for future use

---

## API Request Patterns

### Authenticated Fetch Helper
- **File:** `/apps/meta-ads-manager/src/lib/api-client.ts`
- **Function:** `authenticatedFetch(url, options)`
- **Features:**
  - Automatic JWT bearer token injection
  - Session refresh on token expiry
  - Automatic redirect to login on auth failure
  - Supports custom headers and request init options
- **Usage:** All authenticated API calls use this wrapper

### Meta Graph API Client
- **Class:** `MetaAPIClient` in `/apps/meta-ads-manager/src/lib/meta-api.ts`
- **Methods:** GET, POST, PATCH, DELETE with automatic retry
- **Error handling:** Custom `MetaAPIError` with Meta error codes
- **Rate handling:** Extracts rate limit info from response headers

---

## Data Flow Summary

1. **User Auth** → Supabase JWT token → Stored in browser/session
2. **OAuth Flows** → State stored in Supabase → Token refreshed via Inngest
3. **Account Sync** → Inngest triggers sync functions → Data fetched from Meta/Google APIs → Results stored in Supabase
4. **API Calls** → Frontend → Next.js API routes → Authenticated fetch with Supabase token → Meta Graph API
5. **Notifications** → Supabase triggers → Inngest workflows → Telegram/in-app delivery

---

## Security Notes

- **CSRF Protection:** Random state tokens in OAuth flow
- **RLS Policies:** All database tables enforce per-user isolation
- **Token Rotation:** Meta tokens refreshed automatically before expiry
- **Scope Limitations:** Supabase anon key restricted to public operations
- **Service Role:** Only used on backend (server-only environment variables)
- **OAuth Secrets:** Stored server-side, never exposed to frontend

