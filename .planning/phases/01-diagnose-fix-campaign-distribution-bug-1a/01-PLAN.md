---
phase: 1
plan: 1
wave: 1
depends_on: []
files_modified:
  - apps/meta-ads-manager/src/components/campaign-wizard/PreviewPublishStep.tsx
autonomous: true
---

# Plan 1: Replace local buildDistributionMap with correct import from distribution.ts

## Goal

Remove the buggy local `buildDistributionMap` function from `PreviewPublishStep.tsx` (which produces a Cartesian product) and replace all call sites with the correct `buildDistributionMap` from `@/lib/distribution`, adapting the batch config to match its expected signature.

## Requirements
- BUG-1a

---

## Tasks

### Task 1: Read and understand the current local function and all its call sites

<read_first>
- `apps/meta-ads-manager/src/components/campaign-wizard/PreviewPublishStep.tsx` — understand lines 481-500 (the buggy local function) and every place it is called (lines 113 and 161)
- `apps/meta-ads-manager/src/lib/distribution.ts` — understand the exact signature of `buildDistributionMap`: it accepts `BuildDistributionInput` and returns `BuildDistributionResult` (an object `{ entries, error? }`, NOT the flat array the local function returns)
</read_first>

<action>
No code changes in this task — this is a verification step.

Confirm the following facts before proceeding:

1. The local function is at lines 482-500:
   ```typescript
   function buildDistributionMap(batch: BatchConfig) { ... }
   ```

2. It is called in TWO places:
   - Line 113 inside `handlePublish()`: `const distribution = buildDistributionMap(batch);`
   - Line 161 inside `handleRetryBatch()`: `const distribution = buildDistributionMap(batch);`

3. The correct function signature in `distribution.ts`:
   ```typescript
   export function buildDistributionMap(input: BuildDistributionInput): BuildDistributionResult
   // where BuildDistributionInput = { accounts: AccountEntry[], pages: PageEntry[], adsetTypes: AdsetTypeForDist[], ... }
   // where AccountEntry = { accountId: string, accountName?: string, campaignCount: number }
   // where BuildDistributionResult = { entries: DistributionEntry[], error?: string }
   ```

4. The existing import line at line 7 already imports `calculateCampaignsPerType` from `@/lib/distribution`:
   ```typescript
   import { calculateCampaignsPerType } from '@/lib/distribution';
   ```
   This means the path `@/lib/distribution` is valid and already in use — we only need to ADD `buildDistributionMap` to this existing import.
</action>

<acceptance_criteria>
- [ ] Confirmed: `function buildDistributionMap` exists at lines 482-500 in PreviewPublishStep.tsx
- [ ] Confirmed: `buildDistributionMap(batch)` is called on line 113
- [ ] Confirmed: `buildDistributionMap(batch)` is called on line 161
- [ ] Confirmed: line 7 already imports from `@/lib/distribution`
- [ ] Confirmed: `distribution.ts` exports `buildDistributionMap` that returns `{ entries, error? }`, not a flat array
</acceptance_criteria>

---

### Task 2: Update the import line to include buildDistributionMap

<read_first>
- `apps/meta-ads-manager/src/components/campaign-wizard/PreviewPublishStep.tsx` — line 7: the existing import from `@/lib/distribution`
</read_first>

<action>
Find line 7 in `PreviewPublishStep.tsx`:
```typescript
import { calculateCampaignsPerType } from '@/lib/distribution';
```

Replace it with:
```typescript
import { calculateCampaignsPerType, buildDistributionMap } from '@/lib/distribution';
```

This adds `buildDistributionMap` to the existing named import. The path does not change.
</action>

<acceptance_criteria>
- [ ] `PreviewPublishStep.tsx` contains `import { calculateCampaignsPerType, buildDistributionMap } from '@/lib/distribution';`
- [ ] The old import `import { calculateCampaignsPerType } from '@/lib/distribution';` no longer exists as a standalone line
</acceptance_criteria>

---

### Task 3: Replace the call site in handlePublish() with the correct adapter

<read_first>
- `apps/meta-ads-manager/src/components/campaign-wizard/PreviewPublishStep.tsx` — lines 108-123: the full `handlePublish` batch loop where `buildDistributionMap(batch)` is called on line 113
- `apps/meta-ads-manager/src/lib/distribution.ts` — lines 29-65: the `AccountEntry`, `PageEntry`, `AdsetTypeForDist`, `DistributionEntry`, `BuildDistributionInput`, `BuildDistributionResult` interfaces to understand what the adapter must produce
</read_first>

<action>
Find in `handlePublish()` (around line 113):
```typescript
          // Build distribution map for this batch
          const distribution = buildDistributionMap(batch);

          const res = await authenticatedFetch('/api/meta/bulk-publish', {
```

Replace it with:
```typescript
          // Build distribution map for this batch using the correct algorithm from distribution.ts
          // Adapter: distribute batch.totalCampaigns evenly across accounts (no Cartesian product)
          const distributionResult = buildDistributionMap({
            accounts: batch.accounts.map((a) => ({
              accountId: a.accountId,
              accountName: a.accountName,
              campaignCount: Math.ceil(batch.totalCampaigns / batch.accounts.length),
            })),
            pages: batch.pages,
            adsetTypes: batch.adsetTypes,
          });

          if (distributionResult.error) {
            updatePublishBatch(batch.id, {
              status: 'failed',
              results: [{ campaignIndex: 0, status: 'failed', error: distributionResult.error }],
            });
            continue;
          }

          const distribution = distributionResult.entries;

          const res = await authenticatedFetch('/api/meta/bulk-publish', {
```

**Why `Math.ceil(batch.totalCampaigns / batch.accounts.length)`:**
- `batch.totalCampaigns` is the global campaign count configured by the user
- The correct `buildDistributionMap` expects `campaignCount` per account (not a global total)
- `Math.ceil(total / accounts.length)` distributes N campaigns across M accounts as evenly as possible
- Example: 1 campaign, 2 accounts → Math.ceil(1/2) = 1 per account → total entries = 2 (one per account, each with 1 campaign)

**IMPORTANT NOTE for executor:** After writing this, check if `Math.ceil` produces the correct result for the primary use case (1 campaign, 2 accounts). With `Math.ceil(1/2) = 1`, both accounts get `campaignCount: 1`, so `buildDistributionMap` will produce 2 entries (one per account). This may still be wrong if the intent is "1 campaign total" across all accounts combined.

If the intent is "1 total campaign split across accounts" (not "1 campaign per account"), the correct adapter is:
```typescript
// Distribute totalCampaigns as evenly as possible: first accounts get floor+1, rest get floor
const baseCount = Math.floor(batch.totalCampaigns / batch.accounts.length);
const remainder = batch.totalCampaigns % batch.accounts.length;
accounts: batch.accounts.map((a, i) => ({
  accountId: a.accountId,
  accountName: a.accountName,
  campaignCount: baseCount + (i < remainder ? 1 : 0),
})),
```
This produces exactly `totalCampaigns` entries total (e.g., 1 campaign, 2 accounts → [1, 0] → 1 entry).

**USE THE SECOND (floor+remainder) ADAPTER** as it matches the requirement "1 campaign configured → exactly 1 entry in distribution". The complete replacement block becomes:

```typescript
          // Build distribution map for this batch using the correct algorithm from distribution.ts
          // Distribute totalCampaigns evenly across accounts (floor + remainder pattern)
          const baseCount = Math.floor(batch.totalCampaigns / batch.accounts.length);
          const remainder = batch.totalCampaigns % batch.accounts.length;
          const distributionResult = buildDistributionMap({
            accounts: batch.accounts.map((a, i) => ({
              accountId: a.accountId,
              accountName: a.accountName,
              campaignCount: baseCount + (i < remainder ? 1 : 0),
            })),
            pages: batch.pages,
            adsetTypes: batch.adsetTypes,
          });

          if (distributionResult.error) {
            updatePublishBatch(batch.id, {
              status: 'failed',
              results: [{ campaignIndex: 0, status: 'failed', error: distributionResult.error }],
            });
            continue;
          }

          const distribution = distributionResult.entries;

          const res = await authenticatedFetch('/api/meta/bulk-publish', {
```
</action>

<acceptance_criteria>
- [ ] `handlePublish()` no longer contains `const distribution = buildDistributionMap(batch);` (flat call)
- [ ] `handlePublish()` contains `const distributionResult = buildDistributionMap({`
- [ ] `handlePublish()` contains `campaignCount: baseCount + (i < remainder ? 1 : 0),`
- [ ] `handlePublish()` contains `if (distributionResult.error) {`
- [ ] `handlePublish()` contains `const distribution = distributionResult.entries;`
- [ ] The `authenticatedFetch` call still uses `distribution` (same variable name, now set from `.entries`)
</acceptance_criteria>

---

### Task 4: Replace the call site in handleRetryBatch() with the same correct adapter

<read_first>
- `apps/meta-ads-manager/src/components/campaign-wizard/PreviewPublishStep.tsx` — lines 154-194: the full `handleRetryBatch` function where `buildDistributionMap(batch)` is called on line 161
</read_first>

<action>
Find in `handleRetryBatch()` (around line 161):
```typescript
    try {
      const distribution = buildDistributionMap(batch);
      const res = await authenticatedFetch('/api/meta/bulk-publish', {
```

Replace it with exactly the same adapter pattern used in Task 3:
```typescript
    try {
      // Build distribution map using the correct algorithm from distribution.ts
      const baseCount = Math.floor(batch.totalCampaigns / batch.accounts.length);
      const remainder = batch.totalCampaigns % batch.accounts.length;
      const distributionResult = buildDistributionMap({
        accounts: batch.accounts.map((a, i) => ({
          accountId: a.accountId,
          accountName: a.accountName,
          campaignCount: baseCount + (i < remainder ? 1 : 0),
        })),
        pages: batch.pages,
        adsetTypes: batch.adsetTypes,
      });

      if (distributionResult.error) {
        updatePublishBatch(batchId, {
          status: 'failed',
          results: [{ campaignIndex: 0, status: 'failed', error: distributionResult.error }],
        });
        return;
      }

      const distribution = distributionResult.entries;
      const res = await authenticatedFetch('/api/meta/bulk-publish', {
```
</action>

<acceptance_criteria>
- [ ] `handleRetryBatch()` no longer contains `const distribution = buildDistributionMap(batch);` (flat call)
- [ ] `handleRetryBatch()` contains `const distributionResult = buildDistributionMap({`
- [ ] `handleRetryBatch()` contains `campaignCount: baseCount + (i < remainder ? 1 : 0),`
- [ ] `handleRetryBatch()` contains `if (distributionResult.error) {`
- [ ] `handleRetryBatch()` contains `const distribution = distributionResult.entries;`
</acceptance_criteria>

---

### Task 5: Delete the local buggy buildDistributionMap function

<read_first>
- `apps/meta-ads-manager/src/components/campaign-wizard/PreviewPublishStep.tsx` — lines 481-500: the comment and local function to delete
</read_first>

<action>
Find and DELETE the entire local function at the bottom of the file (lines 481-500):

```typescript
// Build distribution map from batch config (maps accounts x pages x campaigns)
function buildDistributionMap(batch: BatchConfig) {
  const entries: any[] = [];
  let campaignIndex = 0;
  for (const account of batch.accounts) {
    for (const page of batch.pages) {
      for (let i = 0; i < batch.totalCampaigns; i++) {
        entries.push({
          campaignIndex: campaignIndex++,
          accountId: account.accountId,
          accountName: account.accountName,
          pageId: page.pageId,
          pageName: page.pageName,
          adsetCount: batch.adsetsPerCampaign,
        });
      }
    }
  }
  return entries;
}
```

After deletion, the file should end with the closing `}` of the `PreviewPublishStep` component at what was line 479. No trailing blank lines needed beyond what existed before.

**Why delete instead of rename:** The local function has no other consumers. It shadows the imported function by name if both exist in scope. Deleting it forces TypeScript to resolve `buildDistributionMap` to the imported version, removing the ambiguity permanently.
</action>

<acceptance_criteria>
- [ ] `PreviewPublishStep.tsx` does NOT contain `function buildDistributionMap(batch: BatchConfig)`
- [ ] `PreviewPublishStep.tsx` does NOT contain `for (const account of batch.accounts) {` followed by `for (const page of batch.pages) {` (the nested Cartesian product pattern)
- [ ] `PreviewPublishStep.tsx` does NOT contain `// Build distribution map from batch config (maps accounts x pages x campaigns)`
- [ ] The file still compiles (no dangling references to the deleted function)
</acceptance_criteria>

---

### Task 6: Verify TypeScript compiles without errors

<read_first>
- `apps/meta-ads-manager/src/components/campaign-wizard/PreviewPublishStep.tsx` — final state after all edits
- `apps/meta-ads-manager/src/lib/distribution.ts` — confirm `AdsetTypeForDist` interface (requires `adsetCount: number` and `creativesInAdset: string[]`)
</read_first>

<action>
Run the TypeScript compiler check from the `apps/meta-ads-manager` directory:

```bash
cd /Users/guilhermesimas/Documents/Dashboard/apps/meta-ads-manager && npx tsc --noEmit 2>&1 | head -50
```

**Expected:** Zero errors related to `PreviewPublishStep.tsx` or `distribution.ts`.

**If TypeScript reports errors about `adsetTypes`:** The `batch.adsetTypes` array in `BatchConfig` may use a different type than `AdsetTypeForDist`. Check that each adset type object in `batch.adsetTypes` has at minimum `adsetCount: number` and `creativesInAdset: string[]`. If `creativesInAdset` is missing in `BatchConfig`'s adset types, the adapter will need a cast:
```typescript
adsetTypes: batch.adsetTypes as AdsetTypeForDist[],
```
Or add `creativesInAdset: []` as a fallback:
```typescript
adsetTypes: batch.adsetTypes.map((t) => ({ ...t, creativesInAdset: t.creativesInAdset ?? [] })),
```

**If TypeScript reports errors about the import:** Verify the import line reads exactly:
```typescript
import { calculateCampaignsPerType, buildDistributionMap } from '@/lib/distribution';
```

**Do not proceed to done until `npx tsc --noEmit` exits with 0 errors in the modified files.**
</action>

<acceptance_criteria>
- [ ] `npx tsc --noEmit` exits with no errors in `PreviewPublishStep.tsx`
- [ ] `npx tsc --noEmit` exits with no errors in `distribution.ts`
- [ ] No TypeScript error: `Cannot find name 'buildDistributionMap'`
- [ ] No TypeScript error: `Type ... is not assignable to type 'BuildDistributionInput'`
</acceptance_criteria>

---

### Task 7: Verify distribution math is correct for the primary test scenarios

<read_first>
- `apps/meta-ads-manager/src/lib/distribution.ts` — lines 117-206: the full `buildDistributionMap` implementation to mentally trace through
</read_first>

<action>
Manually trace the two required test scenarios to confirm the fix is correct before marking Phase 1 done.

**Scenario A: 2 accounts, 2 pages, 1 campaign (must produce 1 entry)**

Adapter produces:
- `accounts[0].campaignCount = floor(1/2) + (0 < 1 ? 1 : 0) = 0 + 1 = 1`
- `accounts[1].campaignCount = floor(1/2) + (1 < 1 ? 1 : 0) = 0 + 0 = 0`
- `totalCampaigns = 1 + 0 = 1`

`buildDistributionMap` iterates:
- account[0]: 1 campaign → pushed 1 entry (campaignIndex=0, accountId=accounts[0].accountId, pageId=pages[0].pageId)
- account[1]: 0 campaigns → no loop iterations

**Result: 1 entry** ✓ (was 4 before)

**Scenario B: 3 accounts, 2 pages, 2 campaigns (must produce 2 entries)**

Adapter produces:
- `baseCount = floor(2/3) = 0`, `remainder = 2 % 3 = 2`
- `accounts[0].campaignCount = 0 + (0 < 2 ? 1 : 0) = 1`
- `accounts[1].campaignCount = 0 + (1 < 2 ? 1 : 0) = 1`
- `accounts[2].campaignCount = 0 + (2 < 2 ? 1 : 0) = 0`
- `totalCampaigns = 1 + 1 + 0 = 2`

`buildDistributionMap` iterates:
- account[0]: 1 campaign → entry 0
- account[1]: 1 campaign → entry 1
- account[2]: 0 campaigns → no loop

**Result: 2 entries** ✓ (was 12 before with 3×2×2)

If the traces above do NOT match the implementation output, diagnose before shipping.
</action>

<acceptance_criteria>
- [ ] Mental trace for Scenario A (2 accounts × 2 pages × 1 campaign) confirms 1 distribution entry
- [ ] Mental trace for Scenario B (3 accounts × 2 pages × 2 campaigns) confirms 2 distribution entries
- [ ] `buildDistributionMap` trace confirms it does NOT iterate over pages in a nested loop over accounts
</acceptance_criteria>

---

## must_haves
- [ ] Local `buildDistributionMap` function deleted from PreviewPublishStep.tsx (lines 481-500 removed entirely)
- [ ] Import from distribution.ts added: `import { calculateCampaignsPerType, buildDistributionMap } from '@/lib/distribution';`
- [ ] Both call sites (handlePublish and handleRetryBatch) updated to use `distributionResult.entries` instead of the flat return
- [ ] Error handling added at both call sites: if `distributionResult.error`, mark batch as failed and skip
- [ ] Adapter uses floor + remainder pattern (not Math.ceil) so total entries = batch.totalCampaigns (not totalCampaigns × accounts)
- [ ] 2 accounts × 2 pages × 1 campaign → exactly 1 distribution entry (not 4)
- [ ] 3 accounts × 2 pages × 2 campaigns → exactly 2 distribution entries (not 12)
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)

---

## Verification

After completing all tasks, run:

```bash
# 1. TypeScript check
cd /Users/guilhermesimas/Documents/Dashboard/apps/meta-ads-manager && npx tsc --noEmit 2>&1 | grep -E "(error|PreviewPublish|distribution)"

# 2. Confirm local function is gone
grep -n "function buildDistributionMap" apps/meta-ads-manager/src/components/campaign-wizard/PreviewPublishStep.tsx
# Expected: no output (function deleted)

# 3. Confirm import is correct
grep -n "buildDistributionMap" apps/meta-ads-manager/src/components/campaign-wizard/PreviewPublishStep.tsx
# Expected: 3 lines — the import line, the call in handlePublish, the call in handleRetryBatch

# 4. Confirm the Cartesian product loops are gone
grep -n "for (const page of batch.pages)" apps/meta-ads-manager/src/components/campaign-wizard/PreviewPublishStep.tsx
# Expected: no output

# 5. Confirm .entries extraction is present
grep -n "distributionResult.entries" apps/meta-ads-manager/src/components/campaign-wizard/PreviewPublishStep.tsx
# Expected: 2 lines (one per call site)
```

All 5 checks must pass. Phase 1 is complete when:
1. Zero TypeScript errors in affected files
2. Local `buildDistributionMap` function is absent from the file
3. Import from `@/lib/distribution` includes `buildDistributionMap`
4. Both call sites use the correct adapter and extract `.entries` from the result
5. The distribution math produces exactly N entries for N configured campaigns
