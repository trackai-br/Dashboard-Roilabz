# Project Structure

## Directory Tree (Annotated)

```
/Users/guilhermesimas/Documents/Dashboard/
│
├── bin/                                    — CLI entry points & utilities
│   ├── aios.js                             — Main AIOS CLI (44KB, orchestrator)
│   ├── aios-minimal.js                     — Minimal CLI version
│   ├── aios-init.js                        — Project initialization wizard
│   ├── aios-ids.js                         — ID/identifier management
│   ├── modules/                            — CLI module plugins
│   └── utils/                              — CLI utility functions
│
├── .aios-core/                             — AIOS framework (core runtime, ~31 dirs)
│   ├── cli/                                — CLI implementation
│   ├── core/                               — Core framework (config, elicitation, session)
│   ├── data/                               — Framework knowledge base & patterns
│   ├── development/                        — Agent templates, task definitions
│   ├── docs/                               — Internal documentation
│   ├── elicitation/                        — Interactive prompting system
│   ├── hooks/                              — AIOS hooks for IDE integration
│   ├── infrastructure/                     — Build scripts, validation, IDE sync
│   ├── manifests/                          — Installation manifests
│   ├── monitor/                            — Health & performance monitoring
│   ├── presets/                            — Pre-built configurations
│   ├── product/                            — Product specs, user stories
│   ├── quality/                            — QA, testing, compliance
│   ├── schemas/                            — JSON schemas for validation
│   ├── scripts/                            — Utility scripts
│   ├── utils/                              — Core utilities
│   └── workflow-intelligence/              — Advanced workflow engine
│
├── .aiox-core/                             — AIOX fork/variant (same structure as .aios-core)
│
├── .claude/                                — Claude IDE integration
│   ├── CLAUDE.md                           — Global Claude rules
│   ├── commands/                           — Custom slash commands
│   ├── hooks/                              — Pre/post-task hooks
│   ├── rules/                              — IDE rules (MCP usage, git workflow)
│   └── worktrees/                          — Git worktree configs
│
├── .planning/                              — Project planning & codebase docs
│   └── codebase/
│       ├── ARCHITECTURE.md                 — System architecture (this file)
│       └── STRUCTURE.md                    — Directory structure (this file)
│
├── .github/                                — GitHub configuration
│   └── workflows/                          — CI/CD pipelines
│
├── .husky/                                 — Git hooks
│   └── _/                                  — Hook scripts
│
├── development/                            — Development templates & workflows
│   ├── agents/                             — Agent definitions
│   ├── agent-teams/                        — Multi-agent team configs
│   ├── checklists/                         — Task checklists
│   ├── data/                               — Development data sets
│   ├── scripts/                            — Development scripts
│   ├── tasks/                              — Task definitions for agents
│   ├── templates/                          — Boilerplate templates (service, squad)
│   └── workflows/                          — Complex workflow definitions
│
├── infrastructure/                         — Deployment & system infrastructure
│   ├── contracts/                          — Contract/interface definitions
│   ├── integrations/                       — Third-party service integrations
│   ├── schemas/                            — API schemas, validation
│   ├── scripts/                            — Deploy, setup scripts
│   ├── templates/                          — Infrastructure templates (terraform, docker)
│   └── tools/                              — DevOps & system tools
│
├── docs/                                   — User & API documentation
│   ├── agentes/                            — Agent documentation (Spanish: agents)
│   └── stories/                            — User story documentation
│
├── apps/
│   └── meta-ads-manager/                   — **PRIMARY PRODUCTION APP**
│       │
│       ├── package.json                    — Dependencies (Next.js 14, React 18, Supabase, Inngest)
│       ├── tsconfig.json                   — TypeScript config (target: ES2020, strict: true)
│       ├── next.config.js                  — Next.js config
│       ├── tailwind.config.js              — Tailwind CSS theme config
│       ├── jest.config.js                  — Jest testing config
│       │
│       ├── src/
│       │   ├── pages/                      — Next.js pages (file-based routing)
│       │   │   ├── _app.tsx                — Root layout (providers, global setup)
│       │   │   ├── _document.tsx           — HTML structure
│       │   │   ├── login.tsx               — Auth entry (Supabase UI)
│       │   │   ├── dashboard.tsx           — **Main dashboard** (KPIs, campaigns table)
│       │   │   ├── campaigns.tsx           — Campaign list page
│       │   │   ├── campaigns/ setup.tsx    — 7-step wizard for bulk campaign creation
│       │   │   ├── campaigns/ [id].tsx     — Campaign detail page
│       │   │   ├── connections.tsx        — OAuth connection management
│       │   │   ├── alerts.tsx              — Alert rules management
│       │   │   ├── logs.tsx                — Sync history viewer
│       │   │   ├── settings.tsx            — User settings
│       │   │   ├── auth/
│       │   │   │   └── callback.tsx        — Supabase OAuth callback
│       │   │   └── api/                    — API routes (serverless)
│       │   │       ├── health.ts           — Health check (no auth)
│       │   │       ├── inngest.ts          — Inngest webhook handler
│       │   │       ├── auth/
│       │   │       │   ├── meta.ts         — Meta OAuth initiation
│       │   │       │   └── meta/
│       │   │       │       ├── callback.ts — Meta OAuth callback
│       │   │       │       ├── connection.ts — Check/manage connection
│       │   │       │       └── disconnect.ts — Revoke Meta token
│       │   │       ├── meta/               — Meta API routes
│       │   │       │   ├── sync-all.ts     — Orchestrate full sync
│       │   │       │   ├── sync-accounts.ts — Sync ad accounts only
│       │   │       │   ├── accounts/
│       │   │       │   │   ├── index.ts    — List user's ad accounts
│       │   │       │   │   ├── pages.ts    — List pages by account
│       │   │       │   │   ├── pixels.ts   — List pixels by account
│       │   │       │   │   └── audiences.ts — List custom audiences
│       │   │       │   ├── campaigns*      — Campaign CRUD (list, create, update, delete)
│       │   │       │   ├── campaigns-create.ts — Create single campaign
│       │   │       │   ├── bulk-campaigns-create.ts — Queue batch creation (Inngest)
│       │   │       │   ├── bulk-publish.ts — Sync batch publish (sync, <50s limit)
│       │   │       │   ├── publish-status/ — Poll job status
│       │   │       │   ├── retry-publish.ts — Retry failed publish
│       │   │       │   ├── adsets*         — Ad set CRUD
│       │   │       │   ├── ads*            — Ad CRUD
│       │   │       │   ├── insights.ts     — Fetch campaign metrics
│       │   │       │   └── pages/
│       │   │       │       └── [pageId]/
│       │   │       │           └── adset-count.ts — Count active adsets on page
│       │   │       ├── drafts/
│       │   │       │   ├── current.ts      — Load current wizard draft
│       │   │       │   └── save.ts         — Save wizard auto-save
│       │   │       ├── templates/
│       │   │       │   └── save.ts         — CRUD campaign templates
│       │   │       ├── drive/
│       │   │       │   └── list-files.ts   — List Google Drive creative files
│       │   │       ├── logs/
│       │   │       │   └── sync.ts         — Fetch sync history logs
│       │   │       ├── notifications/
│       │   │       │   └── index.ts        — User notifications
│       │   │       ├── alerts/
│       │   │       │   └── index.ts        — Alert rules CRUD
│       │   │       └── admin/              — Admin-only routes (optional)
│       │   │
│       │   ├── components/                 — React components
│       │   │   ├── DashboardLayout.tsx     — Main shell (header, sidebar)
│       │   │   ├── KPISection.tsx          — Metrics cards (spend, reach, ROAS)
│       │   │   ├── CampaignsTableNew.tsx   — Paginated campaign table
│       │   │   ├── CampaignEditor/         — Full campaign detail editor
│       │   │   ├── CampaignWizard/         — 7-step wizard (file-based layout)
│       │   │   │   ├── index.tsx           — Wizard shell
│       │   │   │   └── tabs/               — Individual step components
│       │   │   │       ├── Step1_Accounts.tsx
│       │   │   │       ├── Step2_Objectives.tsx
│       │   │   │       ├── Step3_Budget.tsx
│       │   │   │       ├── Step4_Targeting.tsx
│       │   │   │       ├── Step5_CreativeAssets.tsx
│       │   │   │       ├── Step6_DistributionMap.tsx
│       │   │   │       └── Step7_Review.tsx
│       │   │   ├── MetaAuthButton.tsx      — Meta OAuth button
│       │   │   ├── GoogleAuthButton.tsx    — Google OAuth button
│       │   │   ├── TokenStatusIndicator.tsx — Token expiry badge (green/yellow/red)
│       │   │   └── ...other UI components
│       │   │
│       │   ├── hooks/                      — Custom React hooks
│       │   │   ├── useAuth.ts              — Supabase auth state & context
│       │   │   ├── useMetaConnection.ts    — Meta OAuth token management
│       │   │   ├── useMetaAccounts.ts      — Fetch ad accounts (React Query)
│       │   │   ├── useMetaCampaigns.ts     — Fetch campaigns with pagination
│       │   │   ├── useMetaAudiences.ts     — Fetch custom audiences
│       │   │   ├── useMetaPixels.ts        — Fetch conversion pixels
│       │   │   ├── useMetaPages.ts         — Fetch Facebook pages
│       │   │   ├── useMetaSync.ts          — Trigger sync endpoints
│       │   │   ├── useSyncLogs.ts          — Fetch sync history
│       │   │   ├── useDriveFiles.ts        — List Google Drive files
│       │   │   ├── useMetaAccountsKPIs.ts  — Fetch account-level KPIs
│       │   │   └── ...other hooks
│       │   │
│       │   ├── contexts/                   — React Context providers
│       │   │   ├── WizardContext.tsx       — Campaign wizard state (useReducer + context)
│       │   │   │                           — Types: DistributionEntry, CampaignConfig, AdsetTypeConfig, etc.
│       │   │   └── ThemeContext.tsx        — Light/dark theme
│       │   │
│       │   ├── stores/                     — State management (Zustand)
│       │   │   └── wizard-store.ts         — Alternative to context (optional)
│       │   │
│       │   ├── lib/                        — Utility libraries
│       │   │   ├── supabase.ts             — Lazy-loading Supabase client singletons
│       │   │   ├── meta-api.ts             — Meta Graph API wrapper (error handling, types)
│       │   │   ├── auth.ts                 — JWT validation, requireAuth()
│       │   │   ├── supabase-rls.ts         — RLS-aware Supabase queries
│       │   │   ├── api-client.ts           — authenticatedFetch() wrapper
│       │   │   ├── validation.ts           — Zod schemas for campaign creation
│       │   │   ├── batch-schemas.ts        — Schemas for bulk operations
│       │   │   ├── distribution.ts         — Algorithm to distribute adsets across accounts/pages
│       │   │   ├── drive-utils.ts          — Google Drive API helpers
│       │   │   ├── error-catalog.ts        — Meta API error codes → user messages
│       │   │   └── meta-ad-rules.ts        — Ad validation rules
│       │   │
│       │   ├── types/                      — TypeScript type definitions
│       │   │   ├── database.ts             — Supabase schema types (auto-generated)
│       │   │   └── ...other types
│       │   │
│       │   ├── inngest/                    — Async job orchestration (Inngest)
│       │   │   ├── client.ts               — Inngest client config
│       │   │   └── functions/              — Job function definitions
│       │   │       ├── syncMetaAdAccounts.ts — Cron: sync accounts every 15 min
│       │   │       ├── refreshMetaToken.ts  — Cron: refresh tokens daily (8 AM)
│       │   │       ├── bulkCreateCampaigns.ts — Event: create campaigns in parallel
│       │   │       ├── syncMetaInsights.ts  — Cron: fetch campaign metrics
│       │   │       ├── checkAlertRules.ts   — Cron: evaluate alert rules
│       │   │       ├── syncGoogleAdsAccounts.ts — Cron: sync Google Ads accounts
│       │   │       └── ...test files
│       │   │
│       │   ├── styles/                     — CSS/Tailwind styles
│       │   │   └── globals.css             — Global styles
│       │   │
│       │   └── __tests__/                  — Unit tests
│       │       ├── ...test files
│       │       └── coverage/               — Test coverage reports
│       │
│       ├── supabase/                       — Supabase database configuration
│       │   └── migrations/                 — SQL migration files
│       │       ├── 000_master_migrations.sql — Create all tables (RLS, indexes)
│       │       ├── 001_users.sql
│       │       ├── 002_meta_connections.sql
│       │       ├── 003_oauth_states.sql
│       │       ├── 004_meta_accounts.sql
│       │       ├── 005_meta_pages.sql
│       │       ├── 006_meta_pixels.sql
│       │       ├── 007_sync_logs.sql
│       │       └── 20260319_create_campaign_drafts.sql
│       │
│       ├── .next/                          — Next.js build output (gitignored)
│       ├── node_modules/                   — npm dependencies (gitignored)
│       ├── tests/                          — E2E tests
│       │   └── e2e/                        — Playwright/Cypress tests (optional)
│       ├── .env.local                      — Local environment variables (gitignored)
│       ├── .env.example                    — Template for required env vars
│       ├── README.md                       — App-specific documentation
│       ├── DEPLOYMENT.md                   — Vercel deployment guide
│       ├── IMPLEMENTATION_GUIDE.md         — Feature implementation docs
│       ├── SYSTEM_USER_PERMISSIONS.md      — Meta API permissions guide
│       ├── GET_NEW_TOKEN.md                — Token refresh guide
│       ├── META_API_SETUP.md               — Meta API configuration
│       └── TEST_OAUTH_FLOW.md              — OAuth testing guide
│
├── package.json                            — Root monorepo (v4.2.13, workspaces)
├── tsconfig.json                           — Root TypeScript config
├── .gitignore                              — Git exclusions
├── .env                                    — Root env vars (gitignored)
├── .env.example                            — Root env template
│
├── AGENTS.md                               — AI agent definitions (for AIOS framework)
├── CLAUDE.md                               — Project-specific Claude IDE rules
├── SETUP_GUIDE.md                          — Onboarding & local setup
│
└── tests/                                  — Root test suite
    ├── health-check/                       — Health check tests
    └── ...other integration tests
```

## Key Files

| File | Purpose |
|------|---------|
| `apps/meta-ads-manager/package.json` | App dependencies (Next.js, Supabase, Inngest, TailwindCSS) |
| `apps/meta-ads-manager/src/pages/_app.tsx` | Root component (providers, layout) |
| `apps/meta-ads-manager/src/pages/dashboard.tsx` | Main analytics dashboard with KPIs and campaigns table |
| `apps/meta-ads-manager/src/pages/campaigns/setup.tsx` | 7-step campaign wizard |
| `apps/meta-ads-manager/src/contexts/WizardContext.tsx` | Wizard state management (types, reducer, context) |
| `apps/meta-ads-manager/src/lib/supabase.ts` | Lazy-loading Supabase client (handles SSR) |
| `apps/meta-ads-manager/src/lib/meta-api.ts` | Meta Graph API wrapper with error handling |
| `apps/meta-ads-manager/src/lib/api-client.ts` | Authenticated fetch with JWT injection |
| `apps/meta-ads-manager/src/lib/distribution.ts` | Algorithm to distribute adsets across accounts/pages |
| `apps/meta-ads-manager/src/pages/api/inngest.ts` | Inngest webhook handler (entry for async jobs) |
| `apps/meta-ads-manager/src/pages/api/meta/sync-all.ts` | Orchestrates sync of accounts, pages, pixels |
| `apps/meta-ads-manager/src/pages/api/meta/bulk-publish.ts` | Sync batch publish (creates campaigns/adsets/ads) |
| `apps/meta-ads-manager/src/inngest/client.ts` | Inngest client initialization |
| `apps/meta-ads-manager/src/inngest/functions/syncMetaAdAccounts.ts` | Cron job: sync accounts every 15 min |
| `apps/meta-ads-manager/src/inngest/functions/refreshMetaToken.ts` | Cron job: refresh Meta tokens daily |
| `apps/meta-ads-manager/src/inngest/functions/bulkCreateCampaigns.ts` | Event job: parallel campaign creation |
| `apps/meta-ads-manager/src/types/database.ts` | Supabase schema types (auto-generated) |
| `apps/meta-ads-manager/supabase/migrations/` | SQL migration files (tables, RLS, indexes) |
| `bin/aios.js` | CLI orchestrator (44KB, entry point for commands) |
| `.aios-core/core/` | AIOS framework core (config, elicitation, session) |
| `CLAUDE.md` | Project-specific Claude IDE rules & context |
| `SETUP_GUIDE.md` | Onboarding guide (migrations, Google OAuth, testing) |

## Module Boundaries

### 1. **Frontend Layer** (`src/pages/`, `src/components/`, `src/hooks/`, `src/contexts/`)

**Ownership**: UI rendering, user interactions, local state management

**Responsibilities**:
- Render pages via Next.js file-based routing
- Manage form state (WizardContext for multi-step wizard)
- Fetch data via React Query hooks
- Display errors and loading states
- Call API routes via authenticated fetch

**Boundaries**:
- Cannot directly access Supabase (use API routes instead)
- Cannot manage OAuth tokens (delegated to API routes)
- Cannot call Meta API (delegated to backend)

**Dependencies**: React, Next.js, React Query, Zustand, Tailwind CSS, Framer Motion

---

### 2. **API Routes Layer** (`src/pages/api/`)

**Ownership**: HTTP endpoints, authentication, authorization, business logic orchestration

**Responsibilities**:
- Validate JWT (via `requireAuth()`)
- Apply RLS filters (via `getUserAccounts()`)
- Validate input (via Zod schemas)
- Call Meta API / Supabase with proper error handling
- Queue async jobs (via Inngest)
- Return JSON responses

**Boundaries**:
- Cannot render UI (return JSON only)
- Cannot store secrets in response (only in Set-Cookie)
- Must validate all user input
- Must enforce user_id-based filtering

**Dependencies**: Next.js API routes, Supabase SDK, Meta Graph API, Inngest, Zod

---

### 3. **Database Layer** (`supabase/migrations/`, `src/lib/supabase.ts`, `src/types/database.ts`)

**Ownership**: Data schema, persistence, RLS policies

**Responsibilities**:
- Define tables (users, meta_connections, meta_accounts, etc.)
- Enforce RLS (Row-Level Security) policies
- Create indexes for performance
- Provide TypeScript types for schema

**Boundaries**:
- Cannot contain business logic (stored procedures are minimal)
- All queries must include RLS filters (WHERE user_id = auth.uid())
- Schema changes via migrations only (no direct SQL edits)

**Dependencies**: PostgreSQL (via Supabase), Zod for validation, TypeScript for types

---

### 4. **Async Jobs Layer** (`src/inngest/client.ts`, `src/inngest/functions/`)

**Ownership**: Background workflows, scheduled tasks, event-driven processing

**Responsibilities**:
- Define Inngest functions (cron-triggered or event-triggered)
- Fetch data from Meta API / Supabase
- Handle retries and timeouts
- Log job results

**Boundaries**:
- Cannot expose HTTP endpoints (Inngest manages webhook at `/api/inngest`)
- Cannot access browser localStorage (server-side only)
- Must handle long-running tasks (retries, exponential backoff)

**Dependencies**: Inngest, Supabase SDK, Meta Graph API, TypeScript

---

### 5. **Library Layer** (`src/lib/`)

**Ownership**: Shared utilities, wrappers, validation, error handling

**Sub-modules**:

| Module | Purpose | Used By |
|--------|---------|---------|
| `supabase.ts` | Lazy-loading Supabase clients | API routes, Inngest functions |
| `meta-api.ts` | Meta Graph API wrapper | API routes, Inngest functions |
| `auth.ts` | JWT validation | All API routes |
| `api-client.ts` | Authenticated fetch | Frontend components/hooks |
| `validation.ts` | Zod schemas | API routes (input validation) |
| `distribution.ts` | Adset distribution algorithm | Frontend (wizard), API routes |
| `error-catalog.ts` | Meta error codes → messages | API routes, Inngest |
| `drive-utils.ts` | Google Drive API helpers | API routes |

---

### 6. **Infrastructure/Build** (`bin/`, `.aios-core/`, `infrastructure/`)

**Ownership**: CLI tools, framework boilerplate, deployment scripts

**Responsibilities**:
- CLI commands (aios.js, aios-init.js)
- Agent scaffolding templates
- Build scripts, validation, IDE sync
- Infrastructure templates (docker, terraform)

**Boundaries**:
- Separate from core app (apps/meta-ads-manager)
- Used during development/deployment, not runtime

---

## Data Flow Between Modules

### Campaign Creation (Bulk Publish)

```
Frontend (WizardContext)
  ↓ (POST /api/meta/bulk-publish)
API Route (validation via Zod)
  ↓
Library (distribution algorithm, error handling)
  ↓
Meta Graph API + Supabase
  ↓
Response (job ID + status)
  ↓
React Query (invalidate, refetch)
  ↓
Frontend (KPI cards, campaign table updated)
```

### Async Sync (Background)

```
Inngest Cron (`*/15 * * * *`)
  ↓
Inngest Function (syncMetaAdAccounts)
  ↓
Library (meta-api.ts wrapper)
  ↓
Meta Graph API
  ↓
Database (upsert meta_accounts)
  ↓
Frontend (React Query auto-refetch on tab focus)
  ↓
Dashboard updated (KPI cards, account dropdown)
```

### OAuth Token Refresh

```
Inngest Cron (`0 8 * * *`)
  ↓
Inngest Function (refreshMetaToken)
  ↓
Library (meta-api.ts, error-catalog.ts)
  ↓
Meta API token endpoint
  ↓
Database (update meta_connections.expires_at)
  ↓
Frontend (Header indicator: green token status)
```

---

## Dependency Graph (High-Level)

```
┌─────────────────────────────────────────────────────────┐
│                  Frontend Layer                         │
│  (Pages, Components, Hooks, Contexts)                  │
└───────────────────┬─────────────────────────────────────┘
                    │ (REST API calls via api-client)
                    ↓
┌─────────────────────────────────────────────────────────┐
│                   API Routes Layer                       │
│  (Validation, Auth, RLS filtering, Business Logic)     │
└────┬──────────────────────────────────────────┬─────────┘
     │ (Supabase queries)                       │ (Inngest events)
     ↓                                          ↓
┌──────────────┐                     ┌──────────────────────┐
│   Database   │                     │  Async Jobs Layer    │
│  (PostgreSQL)│←─────────────────→  │  (Inngest Functions) │
└──────────────┘   (Bidirectional)   └──────────────────────┘
                                              │
                                              ↓
                                    ┌──────────────────────┐
                                    │ External APIs        │
                                    │ (Meta, Google, etc)  │
                                    └──────────────────────┘

                    ↑
                    │ (Shared)
                    │
            ┌───────────────┐
            │ Library Layer │
            │  (utils, val) │
            └───────────────┘
```

---

## File Organization Principles

1. **Feature-Based Organization**: Pages, components, hooks grouped by feature (campaigns, connections, auth)
2. **API Routes Mimic URL Structure**: `src/pages/api/meta/campaigns.ts` → `GET /api/meta/campaigns`
3. **Context for Complex State**: WizardContext for multi-step form (not props drilling)
4. **Hooks for Data Fetching**: useMetaCampaigns, useMetaAccounts (not inline queries)
5. **Library for Shared Logic**: distribution, error-catalog, validation shared across routes & hooks
6. **Type Safety**: Supabase types auto-generated, Zod for runtime validation
7. **Migrations Version-Numbered**: `001_users.sql`, `002_meta_connections.sql` (sequential execution)
8. **Tests Colocated**: `*.test.ts` files next to implementation

