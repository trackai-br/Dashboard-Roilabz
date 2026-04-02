# Code Conventions

## Naming

### Files
- **Components**: PascalCase (e.g., `KPICard.tsx`, `DashboardLayout.tsx`, `GoogleAuthButton.tsx`)
- **Hooks**: `use` + PascalCase (e.g., `useAuth.ts`, `useGoogleAdsAccounts.ts`, `useSyncLogs.ts`)
- **Types/Interfaces**: File named `index.ts` in types directory; interfaces use PascalCase (e.g., `User`, `MetaAccount`)
- **Stores**: Kebab-case with "store" suffix (e.g., `wizard-store.ts`)
- **API routes**: Kebab-case in nested folders (e.g., `/api/auth/meta.ts`, `/api/drafts/current.ts`)
- **Test files**: Colocated with source, use `.test.ts`, `.test.tsx`, or `.spec.ts` suffix (e.g., `KPICard.test.tsx`)
- **Infrastructure/Scripts**: Kebab-case (e.g., `project-status-loader.js`, `worktree-manager.js`)

### Components
- Named exports using `export const ComponentName: React.FC<Props> = (props) => {...}`
- Props interface always named `ComponentNameProps`
- Example: `export const KPICard: React.FC<KPICardProps> = ({ title, value, ... }) => {...}`

### Hooks
- Named exports starting with `use` prefix
- Return object with named properties (not tuple)
- Example: `export function useAuth(): UseAuthReturn { ... }`
- Return type explicitly defined (e.g., `UseAuthReturn`, `UseGoogleAdsAccountsReturn`)

### Types/Interfaces
- Use `interface` for object shapes (not `type`)
- Singular names for individual items (e.g., `User`, not `Users`)
- Plural names for collections/arrays when necessary
- Database fields use snake_case (e.g., `meta_account_id`, `created_at`, `updated_at`)
- API response wrappers use generic pattern (e.g., `ApiResponse<T>`)

### API Routes
- Handler function named `handler` or `default export function`
- Use Next.js typing: `NextApiRequest`, `NextApiResponse`
- Prefix logs with feature context in brackets (e.g., `[OAuth]`, `[Sync]`)

### Variables/Functions
- Constants in UPPER_SNAKE_CASE if global/module-level
- Variables and functions in camelCase
- Private/internal functions may use underscore prefix if needed
- Event handlers prefixed with `handle` (e.g., `handleMenuClick`, `onMouseEnter`)

## File Organization

### Component Structure
```
src/
├── components/
│   ├── KPICard.tsx                    # Standalone component
│   ├── DashboardLayout.tsx            # Layout component
│   ├── campaign-editor/               # Feature-grouped components
│   │   ├── EditCampaignDrawer.tsx
│   │   ├── BulkStatusToggle.tsx
│   │   └── ...
│   └── campaign-wizard/
│       └── tabs/
│           ├── Tab6Preview.tsx
│           └── Tab5Ads.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useAuth.test.ts
│   ├── useGoogleAdsAccounts.ts
│   ├── useGoogleAdsAccounts.test.ts
│   └── ...
├── stores/
│   ├── wizard-store.ts
│   └── wizard-store.test.ts
├── pages/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── meta.ts
│   │   │   └── meta/
│   │   │       ├── callback.ts
│   │   │       └── disconnect.ts
│   │   ├── drafts/
│   │   │   ├── current.ts
│   │   │   └── save.ts
│   │   └── inngest.ts
│   ├── dashboard.tsx
│   ├── login.tsx
│   ├── settings.tsx
│   └── ...
├── types/
│   └── index.ts                      # All type definitions
├── contexts/
│   ├── ThemeContext.tsx
│   └── WizardContext.tsx
├── lib/
│   └── supabase.ts                   # Client/service initialization
├── inngest/
│   ├── client.ts
│   └── functions/
│       ├── syncGoogleAdsAccounts.ts
│       ├── syncGoogleAdsAccounts.test.ts
│       └── ...
├── __tests__/
│   ├── wizard-store.test.ts
│   ├── KPICard.test.tsx
│   └── ...
└── styles/
    └── globals.css
```

### Infrastructure Structure
```
infrastructure/
├── tests/
│   ├── project-status-loader.test.js
│   ├── worktree-manager.test.js
│   └── validate-module.js
├── integrations/
│   ├── ai-providers/
│   │   ├── ai-provider.js           # Base interface
│   │   ├── claude-provider.js
│   │   └── gemini-provider.js
│   ├── pm-adapters/
│   │   ├── github-adapter.js
│   │   ├── jira-adapter.js
│   │   └── ...
│   └── gemini-extensions/
│       ├── workspace-adapter.js
│       └── ...
└── scripts/
    ├── worktree-manager.js
    ├── project-status-loader.js
    └── validate-module.js
```

## Import Style

### Absolute Imports (Preferred)
- Use path aliases defined in `tsconfig.json`
- Main alias: `@/*` maps to `./src/*`
- Sub-alias: `@/inngest/*` maps to `./src/inngest/*`
- Examples:
  ```typescript
  import { KPICard } from '@/components/KPICard';
  import { useAuth } from '@/hooks/useAuth';
  import { wizardStore } from '@/stores/wizard-store';
  import type { User } from '@/types';
  import { supabase } from '@/lib/supabase';
  ```

### Relative Imports (When Necessary)
- Used only for local module organization
- Example: `import { helper } from './helpers';`

### Import Organization
1. External packages first (React, Next.js, third-party)
2. Absolute imports from project (`@/`)
3. Relative imports (`.`)
4. Type imports grouped separately with `type` keyword

Example:
```typescript
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';
import { KPICard } from '@/components/KPICard';
```

## TypeScript Patterns

### Strict Mode
- tsconfig.json uses `"strict": true`
- All types must be explicitly defined
- No implicit `any`

### Type Definitions
- Interfaces preferred over type aliases for objects
- Use union types for variants (e.g., `'ACTIVE' | 'PAUSED'`)
- Database timestamp fields typed as `string` (ISO format)
- Optional properties use `?` modifier

Example:
```typescript
export interface MetaAccount {
  id: string;
  meta_account_id: string;
  meta_account_name: string;
  currency?: string;
  timezone?: string;
  last_synced?: string;
  created_at: string;
  updated_at: string;
}
```

### Generic Types
- Used for API responses and collections
- Example: `ApiResponse<T>` wraps data/error responses

```typescript
export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}
```

### No Default Exports for Components
- Named exports only for components and functions
- Makes refactoring and imports more explicit

## Component Patterns

### React Functional Components
- Use `React.FC<Props>` type annotation
- Props destructured in function signature
- JSX.Element or React.ReactNode for child content

Example:
```typescript
export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  unit,
  icon,
  trend,
  loading = false,
  className,
}) => {
  return <div>...</div>;
};
```

### Client Components
- Use `'use client'` directive for Next.js App Router compatibility
- Example in `DashboardLayout.tsx`: `'use client';` at top

### Context API
- Contexts stored in `src/contexts/` folder
- TypeScript interfaces for context values
- Example: `ThemeContext.tsx`, `WizardContext.tsx`

### State Management
- **React State**: For local component state
- **Context API**: For theme, auth state, wizard flow state
- **Zustand**: For complex shared state (e.g., `wizard-store.ts`)
  - Uses `create` from `zustand`
  - Supports middleware (e.g., `persist`)
  - Example: `create<WizardStoreState>((set) => ({ ... }))`

### Props Interface Pattern
```typescript
interface ComponentNameProps {
  // Required props
  title: string;
  value: string | number;
  
  // Optional props with defaults
  unit?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  className?: string;
}
```

### Event Handlers
- Named with `handle` prefix (e.g., `handleMenuClick`)
- Type with `React.MouseEventHandler<HTMLElement>`
- Can use inline arrows for simple cases

## API Route Patterns

### Handler Structure
- Typed with `NextApiRequest` and `NextApiResponse`
- Check method first, return 405 if not allowed
- All async/await for clarity
- Detailed logging with feature prefix in brackets

Example pattern from `/api/auth/meta.ts`:
```typescript
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[OAuth] Starting OAuth flow...');
    // Implementation
  } catch (error) {
    console.error('[OAuth] Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
```

### Error Responses
- Always include HTTP status code
- Return JSON with `error` field
- Log errors with context prefix

### Redirect Pattern
```typescript
return res.redirect(
  302,
  `${process.env.NEXT_PUBLIC_APP_URL}/path?error=code&message=${encodeURIComponent('Human readable message')}`
);
```

### State Management in Routes
- Short-lived state stored in Supabase tables (oauth_states with TTL)
- State validation on callback routes

## Error Handling Patterns

### Try-Catch in Components
- Error state in component state
- Display user-friendly error messages
- Log technical errors to console

Example from `useAuth.ts`:
```typescript
try {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  // Handle success
} catch (err) {
  const message = err instanceof Error ? err.message : 'Auth check failed';
  setError(message);
} finally {
  setIsLoading(false);
}
```

### Error Messages
- User-facing: Clear, non-technical language
- Technical: Include error codes and details
- Log prefix format: `[FeatureName]` for context

### Async Error Handling
- Always check both `data` and `error` from async operations
- Throw or return error state
- Never let errors silently fail

## Styling Patterns

### CSS Variables
- Component styling uses CSS custom properties (variables)
- Example: `backgroundColor: 'var(--color-bg-surface)'`
- Variables defined in global CSS (not shown in this codebase excerpt)

### Inline Styles for Dynamic Values
- Prefer inline styles for theme variables
- Example:
```typescript
style={{
  backgroundColor: 'var(--color-bg-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-lg)',
}}
```

### Tailwind CSS Classes
- Used alongside inline styles
- Examples: `p-4`, `flex`, `items-start`, `justify-between`, `gap-3`

## Testing Patterns

### Test Framework
- Jest with ts-jest preset
- Testing Library for React components
- Environment: `jsdom` for UI tests, `node` for infrastructure tests

### Test File Locations
- **Components**: `ComponentName.test.tsx` colocated
- **Hooks**: `hookName.test.ts` colocated
- **Utilities**: `__tests__` folder
- **Infrastructure**: `tests/` folder with descriptive names

### Test Naming
- `describe('ComponentName', ...)` for component tests
- `it('should ...')` for test cases
- Descriptive names matching user behavior

Example:
```typescript
describe('KPICard', () => {
  it('renders with correct title and value', () => {
    // Test implementation
  });
  
  it('renders loading skeleton when loading is true', () => {
    // Test implementation
  });
});
```

## Documentation

### Comments
- Use `//` for inline comments
- Use `/** */` for JSDoc on public APIs
- Example: API route handlers have comment blocks explaining the flow

### File Headers
- Infrastructure scripts may have `@jest-environment` directives

## Code Quality Tools

### ESLint
- Config: `extends: ["next/core-web-vitals"]` for Next.js projects
- Enforces Next.js and React best practices

### Prettier
- Configured for automatic formatting
- Used in lint-staged pre-commit hook

### TypeScript
- `tsc --noEmit` for type checking
- Full strict mode enabled

### Husky
- Pre-commit hooks via lint-staged
- Formats and lints staged files before commit

## Development Workflow

### Package Scripts (root `package.json`)
- `npm test` — Run Jest tests
- `npm test:watch` — Jest watch mode
- `npm test:coverage` — Coverage report
- `npm lint` — ESLint check
- `npm typecheck` — TypeScript check
- `npm format` — Prettier format markdown files

### Monorepo Structure
- Root uses npm workspaces
- Apps in `apps/` folder (e.g., `apps/meta-ads-manager`)
- Each app has own `package.json`, `tsconfig.json`, `jest.config.js`

