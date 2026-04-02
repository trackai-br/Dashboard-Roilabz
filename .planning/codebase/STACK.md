# Tech Stack

## Runtime & Framework
- **Node.js**: >= 18.0.0 (runtime requirement)
- **npm**: >= 9.0.0 (package manager)
- **Next.js**: 14.1.0 (React meta-framework for full-stack web apps)
  - Uses SWC for minification (`swcMinify: true`)
  - Strict React mode enabled
  - Pages router pattern with API routes
- **React**: 18.2.0 (UI library)
- **React DOM**: 18.2.0 (DOM rendering)

## Language & Type System
- **TypeScript**: 5.9.3 (strict mode enabled)
  - Compiler target: ES2020
  - Module resolution: ESNext (bundler)
  - JSX: preserve (Next.js handles JSX)
  - Strict type checking enabled
  - Path aliases: `@/*` → `./src/*`, `@/inngest/*` → `./src/inngest/*`
- **JavaScript**: Supported via `allowJs: true`

## Styling
- **Tailwind CSS**: 4.2.1 (utility-first CSS framework)
  - PostCSS: 8.5.8 (CSS transformation)
  - Autoprefixer: 10.4.27 (vendor prefixes)
  - Custom design tokens configured (dark theme, custom colors, shadows, border radius)
  - Dark mode support: class-based + `[data-theme="dark"]` attribute
  - Custom color palette (green accent #16a34a, dark backgrounds, gray text hierarchy)
  - Custom typography (Inter, IBM Plex Mono)
- **@tailwindcss/postcss**: 4.2.1 (Tailwind CSS with PostCSS)

## State Management
- **Zustand**: 5.0.12 (lightweight state management)
  - Persistence middleware for local storage
  - Used in `wizard-store.ts` for campaign creation wizard state
- **TanStack React Query**: 5.90.21 (server state management)
  - Query caching and synchronization
  - Mutation management for API calls
  - Used for notifications, campaign updates, and data fetching

## Component Library & UI
- **Lucide React**: 0.577.0 (icon library)
  - 20+ icons used throughout app (TrendingUp, Bell, Target, Zap, etc.)
- **Framer Motion**: 12.38.0 (animation library)
  - Smooth transitions and interactive animations

## Authentication & Database
- **Supabase**: 2.99.2 (PostgreSQL + Auth + Realtime BaaS)
  - `@supabase/supabase-js`: 2.99.2 (JavaScript client library)
  - `@supabase/auth-helpers-nextjs`: 0.15.0 (Next.js authentication helpers)
  - `@supabase/auth-ui-react`: 0.4.7 (pre-built auth UI components)
  - Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - RLS (Row-Level Security) policies configured

## Workflow & Task Automation
- **Inngest**: 3.52.7 (serverless event queue and workflow engine)
  - Event-driven architecture for async tasks
  - Functions: syncMetaAdAccounts, syncGoogleAdsAccounts, refreshMetaToken, syncMetaInsights, bulkCreateCampaigns, checkAlertRules
  - Environment variables: `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`
  - Next.js API integration at `/api/inngest`

## External API Integration
- **Google Ads API**: Via `google-ads-api` (23.0.0)
  - Mock implementation in place (real API requires complex setup)
  - Supports campaign, account, and metrics retrieval
- **Meta Graph API**: Direct HTTP client via fetch
  - API Version: v23.0 (configurable via `META_API_VERSION`)
  - OAuth flow for authorization
  - Endpoints for: accounts, campaigns, adsets, ads, insights, pixels
  - Token refresh mechanism
  - Custom error handling with Meta-specific error codes

## Testing
- **Jest**: 29.7.0 / 30.2.0 (test runner and framework)
  - `@types/jest`: 29.5.11 / 30.0.0 (TypeScript types)
  - `jest-environment-jsdom`: 30.3.0 (DOM environment for React testing)
  - Configuration: `ts-jest` preset
- **Testing Library**: 
  - `@testing-library/react`: 16.3.2 (React component testing)
  - `@testing-library/jest-dom`: 6.9.1 (custom matchers)
- **Mocha**: 11.7.5 (alternative test runner for health checks)

## Build & Deploy
- **Vercel**: Deployment platform
  - Environment: `vercel.json` configured
  - Build command: `cd apps/meta-ads-manager && npm run build`
  - Install command: `cd apps/meta-ads-manager && npm install`
  - Output directory: `apps/meta-ads-manager/.next`
  - Framework: Next.js
- **Environment Management**:
  - `.env.example` template with all required variables
  - Public vars: `NEXT_PUBLIC_*`
  - Secret vars: API keys, tokens, service role keys

## Linting & Code Quality
- **ESLint**: 8.57.1 / 9.38.0 (JavaScript linting)
  - `@typescript-eslint/parser`: 8.46.2 (TypeScript support)
  - `@typescript-eslint/eslint-plugin`: 8.46.2 (TypeScript rules)
  - `eslint-config-next`: 14.2.35 (Next.js recommended rules)
  - Caching enabled (`.eslintcache`)
- **Prettier**: 3.5.3 (code formatter)
- **TypeScript Compiler**: `typecheck` script with `--noEmit`

## Utilities & Dependencies
- **Data Validation**:
  - **Zod**: 4.3.6 (schema validation)
  - **ajv**: 8.17.1 (JSON schema validator)
  - **ajv-formats**: 3.0.1 (format validation)
- **CLI & Interactivity**:
  - **Commander**: 12.1.0 (CLI framework)
  - **Inquirer**: 8.2.6 (interactive CLI prompts)
  - **@clack/prompts**: 0.11.0 (beautiful CLI prompts)
  - **Chalk**: 4.1.2 (terminal colors)
  - **Ora**: 5.4.1 (spinners and progress indicators)
- **File System**:
  - **fs-extra**: 11.3.2 (enhanced fs operations)
  - **glob**: 10.4.4 (file pattern matching)
  - **fast-glob**: 3.3.3 (fast glob matching)
- **Process & Execution**:
  - **execa**: 5.1.1 (cross-platform process execution)
  - **chokidar**: 3.5.3 (file system watcher)
  - **proper-lockfile**: 4.1.2 (file locking)
- **Utilities**:
  - **semver**: 7.7.2 (semantic versioning)
  - **validator**: 13.15.15 (string validation)
  - **js-yaml**: 4.1.0 (YAML parser)
  - **Handlebars**: 4.7.8 (template engine)
  - **ansi-to-html**: 0.7.2 (ANSI color to HTML conversion)
  - **picocolors**: 1.1.1 (small color library)
  - **cli-progress**: 3.12.0 (progress bars)
- **HTTP Client**:
  - **postgres**: 3.4.8 (PostgreSQL client)
  - **pg**: 8.20.0 (Node-postgres adapter)
  - Native **fetch** API for HTTP calls

## Database
- **PostgreSQL**: Via Supabase
  - Managed by Supabase
  - TypeScript types generated in `@/types/database`
  - Migration scripts: `npm run migrate`, `npm run check-tables`

## Development Tools
- **Husky**: 9.1.7 (Git hooks)
  - Pre-commit hooks configured
- **lint-staged**: 16.1.1 (run linters on staged files)
- **dotenv**: 17.3.1 (environment variable loading)

## Monorepo Structure
- **Workspaces**: Root-level npm workspaces
- **Root package**: `aios-core` (4.2.13) — core framework
- **Application**: `meta-ads-manager` (1.0.0) — main Next.js app in `apps/meta-ads-manager/`
- **Core modules**: `.aios-core/` and `.aiox-core/` directories

---

## Key Dependencies (with versions)

| Package | Version | Purpose |
|---------|---------|---------|
| next | 14.1.0 | React meta-framework |
| react | 18.2.0 | UI library |
| react-dom | 18.2.0 | DOM rendering |
| typescript | 5.9.3 | Type safety |
| tailwindcss | 4.2.1 | Styling |
| @supabase/supabase-js | 2.99.2 | Database & auth |
| @tanstack/react-query | 5.90.21 | Server state |
| zustand | 5.0.12 | Client state |
| inngest | 3.52.7 | Workflow automation |
| google-ads-api | 23.0.0 | Google Ads integration |
| lucide-react | 0.577.0 | Icons |
| framer-motion | 12.38.0 | Animations |
| zod | 4.3.6 | Schema validation |
| commander | 12.1.0 | CLI framework |
| inquirer | 8.2.6 | CLI prompts |

---

## Dev Dependencies (notable)

| Package | Version | Purpose |
|---------|---------|---------|
| jest | 29.7.0 / 30.2.0 | Testing framework |
| @testing-library/react | 16.3.2 | React component testing |
| @testing-library/jest-dom | 6.9.1 | Testing utilities |
| ts-jest | 29.1.1 | TypeScript + Jest integration |
| eslint | 8.57.1 / 9.38.0 | Code linting |
| @typescript-eslint/eslint-plugin | 8.46.2 | TypeScript linting |
| prettier | 3.5.3 | Code formatting |
| husky | 9.1.7 | Git hooks |
| lint-staged | 16.1.1 | Pre-commit linting |
| mocha | 11.7.5 | Test framework (health checks) |

---

## Environment Configuration

### Public Variables
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `NEXT_PUBLIC_APP_URL` — Application base URL
- `GOOGLE_PICKER_API_KEY` — Google Picker API

### Secret Variables
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase admin key
- `META_APP_ID` — Meta/Facebook App ID
- `META_APP_SECRET` — Meta/Facebook App Secret
- `META_OAUTH_REDIRECT_URI` — OAuth callback URL
- `INNGEST_EVENT_KEY` — Inngest event publishing key
- `INNGEST_SIGNING_KEY` — Inngest signing key
- `TELEGRAM_BOT_TOKEN` — Telegram bot token (optional)

---

## Build Targets
- **Runtime**: Node.js 18+
- **Browser**: Modern browsers with ES2020 support
- **Output**: Next.js optimized production builds
- **Deployment**: Vercel (configured) or self-hosted Node.js server

