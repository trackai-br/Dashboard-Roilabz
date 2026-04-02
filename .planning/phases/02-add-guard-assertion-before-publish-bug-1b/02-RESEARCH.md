# Phase 2: Add Guard Assertion Before Publish (BUG-1b) - Research

**Researched:** 2026-04-02
**Domain:** TypeScript — React component error handling, pre-flight validation before async API call
**Confidence:** HIGH

---

## Summary

Phase 1 replaced the buggy local `buildDistributionMap` (Cartesian product) with the correct function from `@/lib/distribution`, using a floor+remainder adapter. The fix is confirmed in the file: both `handlePublish()` and `handleRetryBatch()` now call `buildDistributionMap` from the import and extract `distributionResult.entries` into a `distribution` variable before calling the API.

Phase 2 adds a single guard assertion: after `const distribution = distributionResult.entries` and before `await authenticatedFetch('/api/meta/bulk-publish', ...)`, verify that `distribution.length === batch.totalCampaigns`. If they differ, throw an error (or follow the existing batch-failure pattern) and skip the API call.

**Primary recommendation:** Follow the existing error-handling pattern in both functions — do NOT throw (which would skip the `finally` block cleanup in `handlePublish`), instead call `updatePublishBatch` with `status: 'failed'` and `continue` (in `handlePublish`) or `return` (in `handleRetryBatch`). This matches Phase 1's error handling for `distributionResult.error`.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

No CONTEXT.md file exists for this phase. Constraints are derived from ROADMAP.md and STATE.md decisions.

### Locked Decisions
- Use floor+remainder adapter (not Math.ceil) — already implemented in Phase 1
- Delete local buildDistributionMap rather than rename — already done in Phase 1
- Cast BatchAdsetType as unknown as AdsetTypeForDist[] — already done in Phase 1
- Guard assertion MUST run AFTER distribution mapping and BEFORE API request (ROADMAP Phase 2)
- Error message MUST include expected count and actual count (ROADMAP Phase 2)
- API call MUST be prevented if guard fails (ROADMAP Phase 2)

### Claude's Discretion
- Whether guard uses `throw` or `updatePublishBatch + continue/return` (analysis below resolves this)
- Whether `handleRetryBatch()` also needs the guard (analysis below resolves this: YES)

### Deferred Ideas (OUT OF SCOPE)
- Structured logging (Phase 3)
- AdSet/Ad try-catch (Phases 4-5)
- Post-publication verification (Phase 6)
- Integration testing (Phase 7)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BUG-1b | Compute expected campaign count in handlePublish() | `batch.totalCampaigns` is a `number` — confirmed in file line 103 |
| BUG-1b | Assert `distribution.length === expectedCount` before API call | `distribution` is `DistributionEntry[]` — `.length` is always defined |
| BUG-1b | Throw error with expected vs actual if guard fails | Use batch-failure pattern (see Architecture Patterns) |
| BUG-1b | Prevent API call if guard fails | Achieved with `continue` in handlePublish, `return` in handleRetryBatch |
| BUG-1b | Guard runs AFTER distribution mapping and BEFORE API request | Insertion point is line 134-136 (after `.entries` extraction, before `authenticatedFetch`) |
</phase_requirements>

---

## Current State Validation (Phase 1 Output — VERIFIED)

Reading `PreviewPublishStep.tsx` confirmed Phase 1 completed successfully:

### handlePublish() — Lines 111-144
```typescript
// Line 112-124: floor+remainder adapter calling buildDistributionMap
const baseCount = Math.floor(batch.totalCampaigns / batch.accounts.length);
const remainder = batch.totalCampaigns % batch.accounts.length;
const distributionResult = buildDistributionMap({
  accounts: batch.accounts.map((a, i) => ({
    accountId: a.accountId,
    accountName: a.accountName,
    campaignCount: baseCount + (i < remainder ? 1 : 0),
  })),
  pages: batch.pages,
  adsetTypes: batch.adsetTypes as unknown as AdsetTypeForDist[],
});

// Line 126-133: error check for distributionResult.error
if (distributionResult.error) {
  updatePublishBatch(batch.id, {
    status: 'failed',
    results: [{ campaignIndex: 0, status: 'failed', error: distributionResult.error }],
  });
  continue;
}

// Line 134: THE INSERTION POINT — after this line, before authenticatedFetch
const distribution = distributionResult.entries;

// Line 136: the API call the guard must precede
const res = await authenticatedFetch('/api/meta/bulk-publish', {
```

### handleRetryBatch() — Lines 182-204
```typescript
// Lines 183-203: same adapter pattern
const baseCount = Math.floor(batch.totalCampaigns / batch.accounts.length);
const remainder = batch.totalCampaigns % batch.accounts.length;
const distributionResult = buildDistributionMap({ ... });

if (distributionResult.error) {
  updatePublishBatch(batchId, {
    status: 'failed',
    results: [{ campaignIndex: 0, status: 'failed', error: distributionResult.error }],
  });
  return;
}

// Line 203: THE INSERTION POINT — after this line, before authenticatedFetch
const distribution = distributionResult.entries;
const res = await authenticatedFetch('/api/meta/bulk-publish', {   // Line 204
```

---

## Architecture Patterns

### Pattern 1: Existing Error Handling in handlePublish() — USE THIS

**What:** When an error condition is detected inside the `for (const batch of batches)` loop in `handlePublish()`, the pattern is:
1. Call `updatePublishBatch(batch.id, { status: 'failed', results: [...] })`
2. `continue` to the next batch

**Why this instead of `throw`:** `handlePublish()` wraps the entire batch loop in `try { ... } finally { setIsPublishing(false) }`. Throwing inside the loop exits the `try` block prematurely, skips remaining batches, but DOES correctly reach `finally`. However, it also means one batch failure aborts all subsequent batches. The existing pattern of `continue` is more resilient: one batch failing does not prevent others from being processed.

**The guard should follow the same pattern:**
```typescript
// After: const distribution = distributionResult.entries;
// Before: const res = await authenticatedFetch(...)

const expectedCount = batch.totalCampaigns;
if (distribution.length !== expectedCount) {
  updatePublishBatch(batch.id, {
    status: 'failed',
    results: [{
      campaignIndex: 0,
      status: 'failed',
      error: `[bulk-publish] Guard failed: expected ${expectedCount} campaigns, ` +
             `but distribution generated ${distribution.length} entries`,
    }],
  });
  continue;
}
```

**Why NOT `throw`:** `throw` would exit the batch loop, skip remaining batches, and only be caught by the outer `catch (err)` at line 162, which also calls `updatePublishBatch` with `status: 'failed'` — but only for `batch.id` of the current iteration, not with a meaningful guard message. The `continue` pattern is more correct and consistent with Phase 1's `distributionResult.error` handling.

### Pattern 2: Existing Error Handling in handleRetryBatch() — USE THIS

**What:** When an error condition is detected in `handleRetryBatch()`, the pattern is:
1. Call `updatePublishBatch(batchId, { status: 'failed', results: [...] })`
2. `return` (exits the function)

**The guard should follow the same pattern:**
```typescript
// After: const distribution = distributionResult.entries;
// Before: const res = await authenticatedFetch(...)

const expectedCount = batch.totalCampaigns;
if (distribution.length !== expectedCount) {
  updatePublishBatch(batchId, {
    status: 'failed',
    results: [{
      campaignIndex: 0,
      status: 'failed',
      error: `[bulk-publish] Guard failed: expected ${expectedCount} campaigns, ` +
             `but distribution generated ${distribution.length} entries`,
    }],
  });
  return;
}
```

### Pattern 3: `batch.totalCampaigns` type verification — CONFIRMED

`batch.totalCampaigns` is used as a `number` throughout the file:
- Line 103: `totalCampaigns: b.totalCampaigns` (assigned to a `PublishBatchResult` field typed as `number`)
- Line 114: `Math.floor(batch.totalCampaigns / batch.accounts.length)` (arithmetic — must be number)
- Line 115: `batch.totalCampaigns % batch.accounts.length` (arithmetic — must be number)
- Line 488: `totalCampaigns` computed as `batches.reduce((s, b) => s + b.totalCampaigns, 0)` (numeric reduce)

No transformation needed. `batch.totalCampaigns` is directly usable as `expectedCount`.

### Pattern 4: `distribution.length` availability — CONFIRMED

After Phase 1, `distribution` is assigned as `const distribution = distributionResult.entries` where `distributionResult.entries` is `DistributionEntry[]` (from `distribution.ts` line 62: `entries: DistributionEntry[]`). Arrays always have `.length`. No null check needed.

---

## Precise Insertion Points

### In handlePublish() — After line 134, before line 136

**Current lines 134-136:**
```typescript
          const distribution = distributionResult.entries;

          const res = await authenticatedFetch('/api/meta/bulk-publish', {
```

**After insertion (lines 134-148):**
```typescript
          const distribution = distributionResult.entries;

          // Guard: verify distribution.length matches configured campaign count
          const expectedCount = batch.totalCampaigns;
          if (distribution.length !== expectedCount) {
            updatePublishBatch(batch.id, {
              status: 'failed',
              results: [{
                campaignIndex: 0,
                status: 'failed',
                error: `[bulk-publish] Guard failed: expected ${expectedCount} campaigns, ` +
                       `but distribution generated ${distribution.length} entries`,
              }],
            });
            continue;
          }

          const res = await authenticatedFetch('/api/meta/bulk-publish', {
```

### In handleRetryBatch() — After line 203, before line 204

**Current lines 203-204:**
```typescript
      const distribution = distributionResult.entries;
      const res = await authenticatedFetch('/api/meta/bulk-publish', {
```

**After insertion:**
```typescript
      const distribution = distributionResult.entries;

      // Guard: verify distribution.length matches configured campaign count
      const expectedCount = batch.totalCampaigns;
      if (distribution.length !== expectedCount) {
        updatePublishBatch(batchId, {
          status: 'failed',
          results: [{
            campaignIndex: 0,
            status: 'failed',
            error: `[bulk-publish] Guard failed: expected ${expectedCount} campaigns, ` +
                   `but distribution generated ${distribution.length} entries`,
          }],
        });
        return;
      }

      const res = await authenticatedFetch('/api/meta/bulk-publish', {
```

**Indentation note:** `handlePublish()` uses 10 spaces of indentation for the inner try block (inside `for (const batch of batches)`, inside `try`). `handleRetryBatch()` uses 6 spaces (inside the outer `try`). Match existing indentation exactly.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Guard condition | Custom validation framework | Plain `if` statement | Guard is a single numeric comparison — no library needed |
| Error message construction | Template string library | Template literal | Simple interpolation, no external deps needed |
| Error state reporting | Custom error type | Existing `updatePublishBatch` pattern | Already in use for Phase 1 error cases, consistent UX |

---

## Common Pitfalls

### Pitfall 1: Using `throw` inside the handlePublish batch loop
**What goes wrong:** Throws exit the loop, skipping remaining batches. The outer `catch` catches it but marks only the current batch as failed with a generic message.
**Why it happens:** `throw` is the natural instinct for guard failures.
**How to avoid:** Use `updatePublishBatch + continue` — mirrors the existing `distributionResult.error` handling from Phase 1.
**Warning signs:** If the guard code uses `throw new Error(...)` without `updatePublishBatch`, this pitfall is active.

### Pitfall 2: Wrong variable name — `batchId` vs `batch.id`
**What goes wrong:** `handlePublish()` uses `batch.id` (from the for-loop variable). `handleRetryBatch()` uses `batchId` (the function parameter). Using the wrong name causes a TypeScript error or runtime bug.
**How to avoid:** Check which function you are editing. In `handlePublish`: `batch.id`. In `handleRetryBatch`: `batchId`.

### Pitfall 3: Inserting guard BEFORE the `distributionResult.error` check
**What goes wrong:** `distribution` is not yet defined (it's assigned at `const distribution = distributionResult.entries`). Accessing `distribution.length` before that line would cause a ReferenceError.
**How to avoid:** The guard must go AFTER `const distribution = distributionResult.entries`, not before.

### Pitfall 4: Indentation mismatch causing lint errors
**What goes wrong:** The two functions have different indentation depths (10 spaces vs 6 spaces). Copy-pasting from one into the other with wrong indentation triggers ESLint or Prettier errors.
**How to avoid:** Match existing indentation in each function separately.

---

## Key Questions — Answered

| Question | Answer | Confidence | Source |
|----------|--------|------------|--------|
| What does handlePublish() look like NOW? | Verified above — `distribution` is at line 134, API call at line 136 | HIGH | Direct file read |
| Does handleRetryBatch() also need the guard? | YES — it calls the same API with the same distribution variable | HIGH | Direct file read (line 203-204) |
| Is `distribution` still a variable in scope? | YES — `const distribution = distributionResult.entries` exists at both sites | HIGH | Direct file read |
| What is `batch.totalCampaigns`? | Plain `number` — no transformation needed | HIGH | Type usage throughout file (arithmetic at lines 114-115) |
| Should guard throw or use batch-failure pattern? | Use `updatePublishBatch + continue/return` — matches Phase 1 pattern, more resilient | HIGH | Code analysis |

---

## Standard Stack

No new libraries required. This phase is a pure code insertion using:
- TypeScript template literals (built-in)
- Existing `updatePublishBatch` store action (already imported at line 29)
- Existing `batch.totalCampaigns` (already accessed in the same scope)

---

## Environment Availability

Step 2.6: SKIPPED — This phase is purely a code insertion with no external dependencies. TypeScript compile check (`npx tsc --noEmit`) is the only verification needed, and the TypeScript toolchain was confirmed available in Phase 1.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 + React Testing Library |
| Config file | `apps/meta-ads-manager/jest.config.js` (confirmed in CLAUDE.md) |
| Quick run command | `npx jest src/__tests__/ --testPathPattern="distribution" -x` |
| Full suite command | `npm test` (from `apps/meta-ads-manager/`) |
| TypeScript check | `cd apps/meta-ads-manager && npx tsc --noEmit` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| BUG-1b | Guard fires when distribution.length != totalCampaigns | Unit | Not yet written | Wave 0 gap |
| BUG-1b | Guard does NOT fire when distribution.length == totalCampaigns | Unit | Not yet written | Wave 0 gap |
| BUG-1b | API call prevented on guard failure | Unit | Not yet written | Wave 0 gap |
| BUG-1b | Error message contains expected and actual counts | Unit | Not yet written | Wave 0 gap |

**Practical note:** The guard logic is a 3-line if statement. Unit tests for the guard itself may be disproportionately complex relative to the change. The primary verification is:
1. TypeScript compiles (`npx tsc --noEmit`)
2. Manual trace: if `distribution.length === batch.totalCampaigns`, guard passes silently
3. Manual trace: if `distribution.length !== batch.totalCampaigns`, `updatePublishBatch` called with guard error message, API call skipped

### Wave 0 Gaps
- [ ] Unit test for guard in handlePublish — confirms `updatePublishBatch` called with guard message when `distribution.length !== totalCampaigns`
- [ ] Unit test for guard in handleRetryBatch — same check for retry path

*(If existing test infrastructure covers these: "None" — but the distribution test files cover `distribution.ts` logic, not the component guard.)*

---

## Sources

### Primary (HIGH confidence)
- Direct read of `apps/meta-ads-manager/src/components/campaign-wizard/PreviewPublishStep.tsx` — current state after Phase 1, line numbers for exact insertion points
- Direct read of `apps/meta-ads-manager/src/lib/distribution.ts` — `DistributionEntry[]` type, `BuildDistributionResult.entries` field
- Direct read of `.planning/phases/01-diagnose-fix-campaign-distribution-bug-1a/01-SUMMARY.md` — Phase 1 completion confirmed
- Direct read of `.planning/ROADMAP.md` — Phase 2 requirements and code pattern

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — confirms Phase 1 complete, Phase 2 unblocked

---

## Metadata

**Confidence breakdown:**
- Insertion points: HIGH — directly verified from file read, exact line numbers
- Variable names and types: HIGH — directly verified from file read
- Error handling pattern: HIGH — mirrors existing Phase 1 pattern in the same file
- Should handleRetryBatch also get the guard: HIGH — same distribution + same API call = same risk

**Research date:** 2026-04-02
**Valid until:** Until PreviewPublishStep.tsx is modified again (stable — single file, small change)
