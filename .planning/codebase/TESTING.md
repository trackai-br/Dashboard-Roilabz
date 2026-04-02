# Testing

## Test Framework & Tools

### Main Testing Stack
- **Jest 30.2.0**: Test runner and assertion library
- **ts-jest**: TypeScript preset for Jest
- **@testing-library/react 16.3.2**: React component testing utilities
- **@testing-library/jest-dom**: Jest matchers for DOM assertions
- **Mocha 11.7.5**: Alternative test runner for health-check tests

### Configuration Files
- `jest.config.js` (in `apps/meta-ads-manager/`): Main Jest configuration
- `jest.setup.js`: Test environment setup, mocks global variables
- `tsconfig.json`: Includes Jest types

### Test Environments
- **jsdom**: For React component tests (browser-like environment)
- **node**: For infrastructure/utility tests (Node.js environment)
- Specified via `@jest-environment` comment or jest config

## Test Coverage

### Total Test Files: 11+

### Test Locations

#### Frontend Tests (apps/meta-ads-manager/src)
1. **Component Tests**
   - `src/components/GoogleAuthButton.test.tsx` — Login button component
   - `src/__tests__/KPICard.test.tsx` — KPI display card
   - `src/__tests__/CampaignTable.test.tsx` — Campaign table display
   - `src/__tests__/BatchCard.test.tsx` — Batch configuration card
   - `src/__tests__/DashboardLayout.test.tsx` — Layout wrapper
   - `src/__tests__/ModeSelector.test.tsx` — Mode selection component

2. **Hook Tests**
   - `src/hooks/useAuth.test.ts` — Authentication hook (inferred location)
   - `src/hooks/useGoogleAdsAccounts.test.ts` — Google Ads hook

3. **Store Tests**
   - `src/__tests__/wizard-store.test.ts` — Zustand wizard state management

4. **Utility Tests**
   - `src/__tests__/drive-utils.test.ts` — Drive file utility functions

5. **Inngest Function Tests**
   - `src/inngest/functions/syncGoogleAdsAccounts.test.ts` — Placeholder test
   - `src/inngest/functions/syncMetaAdAccounts.test.ts.skip` — Skipped (no setup)

#### Infrastructure Tests (infrastructure/tests)
1. **Worktree Management**
   - `infrastructure/tests/worktree-manager.test.js` — Git worktree operations

2. **Project Status**
   - `infrastructure/tests/project-status-loader.test.js` — Project metadata loading

3. **Module Validation**
   - `infrastructure/tests/validate-module.js` — Module validation utility

### What IS Tested

#### Component Testing
- **Rendering**: Components render with correct props
- **DOM Output**: Text content, classes, styles present
- **Loading States**: Skeleton screens and disabled states
- **User Interaction**: Click handlers, input changes (expected, not yet implemented)
- **Accessibility**: Roles, aria-hidden attributes

Example from `KPICard.test.tsx`:
```typescript
describe('KPICard', () => {
  it('renders with correct title and value', () => {
    render(<KPICard title="Total Spend" value="$1,234.56" unit="USD" />);
    expect(screen.getByText('Total Spend')).toBeInTheDocument();
    expect(screen.getByText('$1,234.56')).toBeInTheDocument();
  });

  it('renders loading skeleton when loading is true', () => {
    const { container } = render(<KPICard title="..." loading={true} />);
    const skeleton = container.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('renders trend percentage when provided', () => {
    render(<KPICard title="..." value="..." trend={15} />);
    expect(screen.getByText('+15% mês anterior')).toBeInTheDocument();
  });
});
```

#### Hook Testing
- Authentication state management
- Async data fetching (mocked)
- Error handling
- Component integration

#### Store Testing
- State initialization
- State mutations (via Zustand actions)
- Persistence (if enabled)
- Selectors

#### Infrastructure Testing
- **WorktreeManager**: Git worktree creation, merging, conflict detection
  - Tests cover: create, list, remove, get, merge, conflict detection
  - Tests skip gracefully if Git not available in CI
  - Comprehensive merge scenarios: staged merges, squash, cleanup

- **ProjectStatusLoader**: Reading project metadata, Git status
  - Tests verify: git detection, branch detection, file modification tracking
  - Fallback behavior for non-git directories

### What IS NOT Tested

#### High-Coverage Gaps
1. **Inngest Functions**: Only placeholder test (`expect(true).toBe(true)`)
   - `syncGoogleAdsAccounts.ts` — No real sync logic tested
   - `syncMetaAdAccounts.ts` — Marked as `.skip`, needs Supabase setup
   - `checkAlertRules.ts` — No tests
   - `refreshMetaToken.ts` — No tests
   - `syncMetaInsights.ts` — No tests
   - `bulkCreateCampaigns.ts` — No tests

2. **API Routes**: No tests for Next.js API handlers
   - `/api/auth/meta.ts` — OAuth flow not tested
   - `/api/auth/meta/callback.ts` — OAuth callback not tested
   - `/api/auth/meta/disconnect.ts` — Disconnect flow not tested
   - `/api/drafts/current.ts` — Draft loading not tested
   - `/api/drafts/save.ts` — Draft saving not tested

3. **Integration Tests**: No end-to-end flow tests
   - Authentication flow (login → token → authenticated state)
   - Sync workflows (trigger → execution → completion)
   - Campaign creation workflow
   - Data validation and error recovery

4. **User Interactions**: Component interaction tests minimal
   - Button clicks
   - Form submissions
   - Wizard navigation
   - Table sorting/filtering

5. **Mocking**: Limited mock setup
   - Supabase mocked at jest.setup.js level (basic)
   - No API mock server (MSW)
   - No Inngest client mocking for function tests
   - Google/Meta API responses not mocked

6. **Error Scenarios**: Limited error path coverage
   - Network failures
   - Invalid credentials
   - Rate limiting
   - Database conflicts
   - Timeout handling

7. **Custom Hooks**: No isolated hook tests visible
   - `useMetaSync.ts` — Not tested
   - `useMetaConnection.ts` — Not tested
   - `useMetaPages.ts` — Not tested
   - `useDriveFiles.ts` — Not tested
   - `useSyncLogs.ts` — Not tested

8. **Context Providers**: No Context tests
   - `ThemeContext.tsx` — Not tested
   - `WizardContext.tsx` — Not tested

9. **Utility Functions**: Limited utility coverage
   - Only `drive-utils.test.ts` found
   - Missing tests for lib functions (Supabase client, etc.)

## Test Patterns

### Jest Configuration (jest.config.js)
```javascript
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  testMatch: ["**/__tests__/**/*.{ts,tsx,js}", "**/?(*.)+(spec|test).{ts,tsx,js}"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/pages/**",
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};
```

### Component Test Pattern
```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { KPICard } from '@/components/KPICard';

describe('KPICard', () => {
  it('renders with correct props', () => {
    render(<KPICard title="Test" value="100" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <KPICard title="Test" value="100" className="custom-class" />
    );
    const card = container.firstChild;
    expect(card).toHaveClass('custom-class');
  });

  it('renders with custom styles', () => {
    render(<KPICard title="Test" value="100" />);
    expect(screen.getByText('Test')).toHaveStyle({
      color: 'var(--color-text-primary)',
    });
  });
});
```

### Infrastructure Test Pattern (with Git fallback)
```javascript
describe('WorktreeManager', () => {
  beforeEach(async () => {
    testRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'aios-test-'));
    manager = new WorktreeManager(testRoot);
  });

  afterEach(async () => {
    try {
      await fs.rm(testRoot, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('create', () => {
    it('should create worktree with correct structure', async () => {
      try {
        const info = await manager.create('STORY-42');
        expect(info.storyId).toBe('STORY-42');
        expect(info.status).toBe('active');
      } catch (error) {
        if (error.message.includes('Git command failed')) {
          console.warn('Git not available, skipping test');
          expect(true).toBe(true); // Skip gracefully
        } else {
          throw error;
        }
      }
    });
  });
});
```

### Test Setup Pattern (jest.setup.js)
```javascript
require('@testing-library/jest-dom');

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
```

### Mock Pattern (component-level)
```typescript
jest.mock('@supabase/supabase-js');

describe('GoogleAuthButton', () => {
  test('renders login button', () => {
    render(<GoogleAuthButton />);
    expect(screen.getByText('Entrar com Google')).toBeInTheDocument();
  });
});
```

## Running Tests

### Single Test Run
```bash
npm test
```

### Watch Mode
```bash
npm test:watch
```
Continuously runs tests as files change, useful during development.

### Coverage Report
```bash
npm test:coverage
```
Generates coverage metrics (targets: 60% branches, functions, lines, statements).

### Health Check Tests (Mocha)
```bash
npm run test:health-check
```
Runs Mocha tests in `tests/health-check/**/*.test.js` with 30-second timeout.

### From Root (Monorepo)
```bash
cd /Users/guilhermesimas/Documents/Dashboard
npm test
```
Runs all tests in all workspaces.

### Specific Test File
```bash
npm test -- src/__tests__/KPICard.test.tsx
```

### Specific Test Suite
```bash
npm test -- --testNamePattern="KPICard"
```

## Gaps & Recommendations

### Critical Testing Gaps

1. **Inngest Function Testing** (HIGHEST PRIORITY)
   - Currently: Only placeholder tests
   - Need: Mock Inngest client and Supabase
   - Recommendation: Create test fixtures for Google Ads and Meta API responses
   - Impact: Sync operations are core business logic

   ```typescript
   // Proposed pattern
   jest.mock('../client');
   jest.mock('@/lib/supabase');

   describe('syncGoogleAdsAccounts', () => {
     it('should sync accounts from Google Ads API', async () => {
       const mockData = [{ customerId: '123', name: 'Test Account' }];
       mockGoogleAdsClient.listAccounts.mockResolvedValue(mockData);
       
       const result = await syncGoogleAdsAccounts({ userId: 'user-1' });
       expect(result.success).toBe(true);
       expect(mockSupabase.from).toHaveBeenCalled();
     });
   });
   ```

2. **API Route Testing** (HIGH PRIORITY)
   - Currently: No tests for OAuth or draft endpoints
   - Need: Mock Next.js req/res objects and third-party services
   - Recommendation: Use http mocking library (MSW) or custom mocks
   - Impact: Authentication flows are critical path

   ```typescript
   // Proposed pattern
   import { createMocks } from 'node-mocks-http';

   describe('POST /api/auth/meta', () => {
     it('should initiate OAuth flow', async () => {
       const { req, res } = createMocks({
         method: 'GET',
         query: { token: 'valid-token' },
       });

       await handler(req, res);
       expect(res._getStatusCode()).toBe(302);
       expect(res._getRedirectUrl()).toContain('facebook.com');
     });
   });
   ```

3. **Hook Integration Tests** (MEDIUM PRIORITY)
   - Currently: useAuth possibly has tests, others unclear
   - Need: Isolated tests for async hooks (useGoogleAdsAccounts, useSyncLogs)
   - Recommendation: Use @testing-library/react-hooks or component-based testing
   - Impact: Hooks manage data fetching and UI state

4. **End-to-End User Flows** (MEDIUM PRIORITY)
   - Currently: No integration tests
   - Need: Test complete workflows (login → connect account → sync → view data)
   - Recommendation: E2E framework (Playwright, Cypress, or Inngest testing)
   - Impact: Catches integration issues between components

5. **Error Handling Coverage** (MEDIUM PRIORITY)
   - Currently: Happy path primarily tested
   - Need: Error state, retry logic, timeout handling
   - Recommendation: Test error boundaries, fallback UI, user messaging
   - Impact: Robustness and UX in failure scenarios

### Recommended Next Steps

1. **Inngest Testing Setup** (Week 1)
   - Create `inngest/__mocks__/client.js` with mock functions
   - Create `inngest/__fixtures__/` with sample API responses
   - Write tests for each sync function with various response scenarios
   - Add error path tests (rate limits, auth failures)

2. **API Route Testing** (Week 1-2)
   - Install `node-mocks-http` package
   - Create test helper for creating mock req/res
   - Test each API route with valid and invalid inputs
   - Test error responses and redirects

3. **Hook Testing** (Week 2)
   - Add tests for all custom hooks in `hooks/` directory
   - Test async operations and state updates
   - Test cleanup (subscriptions, event listeners)

4. **Component Interaction Tests** (Week 2-3)
   - Expand existing component tests with user interactions
   - Add userEvent for more realistic interactions
   - Test form submissions and navigation
   - Test loading and error states

5. **Coverage Targets** (Ongoing)
   - Current target: 60% global
   - Increase to: 80% for critical paths (auth, sync, UI)
   - Track: Generate coverage reports in CI/CD

6. **CI/CD Integration** (Week 3)
   - Add `npm test` to GitHub Actions
   - Block PRs on test failures
   - Generate and track coverage trends
   - Add test result artifacts

### Testing Best Practices to Adopt

1. **Avoid Implementation Testing**
   - ✅ Test what users see/do
   - ❌ Don't test internal state updates
   - Example: Test that form submits, not that useState updates

2. **Use Descriptive Test Names**
   - Current: `it('renders loading skeleton when loading is true', ...)`
   - Good: Names match user perspective

3. **Test Accessibility**
   - Use `screen.getByRole()` instead of `container.querySelector()`
   - Encourages accessible component design

4. **Mock External Dependencies**
   - Supabase client
   - Inngest functions
   - Google/Meta APIs
   - Keep mocks focused, not over-mocked

5. **Test Error Boundaries**
   - Component error handling
   - API error responses
   - Network timeout recovery

6. **Create Test Utilities**
   - Custom render functions with providers
   - Mock data generators
   - API response fixtures

### Tools to Consider Adding

1. **@testing-library/user-event**: More realistic user interactions
2. **node-mocks-http**: Mock HTTP requests for API routes
3. **ts-node**: Run TypeScript tests directly
4. **Playwright**: E2E browser testing
5. **MSW (Mock Service Worker)**: API mocking at network level
6. **jest-coverage-report**: Better coverage visualization

### Coverage Threshold Analysis

Current thresholds (60%):
```javascript
coverageThreshold: {
  global: {
    branches: 60,
    functions: 60,
    lines: 60,
    statements: 60,
  },
}
```

Based on gaps identified:
- **Inngest functions**: 0% (no real tests)
- **API routes**: 0% (no tests)
- **Components**: ~70-80% (good coverage)
- **Hooks**: ~50-60% (partial coverage)

Recommendation: Increase thresholds after fixing gaps:
```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 75,
    lines: 75,
    statements: 75,
  },
  './src/inngest/': { // Critical path
    branches: 80,
    functions: 85,
    lines: 85,
    statements: 85,
  },
}
```

