---
phase: 02-add-guard-assertion-before-publish-bug-1b
plan: "01"
subsystem: campaign-wizard
tags: [guard, bulk-publish, BUG-1b, typescript]
dependency_graph:
  requires: [01-01-PLAN.md]
  provides: [BUG-1b]
  affects: [PreviewPublishStep.tsx]
tech_stack:
  added: []
  patterns: [guard-assertion, fail-fast]
key_files:
  created: []
  modified:
    - apps/meta-ads-manager/src/components/campaign-wizard/PreviewPublishStep.tsx
decisions:
  - Use `continue` in handlePublish (loop context) and `return` in handleRetryBatch (no loop)
  - Mirror existing `if (distributionResult.error)` pattern for consistent error shape
  - Use `expectedCount` local variable for clarity in the error message
metrics:
  duration: "2 min"
  completed: "2026-04-02"
  tasks_completed: 2
  files_modified: 1
---

# Phase 02 Plan 01: Guard Assertion Before Bulk-Publish Summary

Guard assertions inserted in both publish paths of `PreviewPublishStep.tsx` to block mismatched distribution arrays from reaching the Meta API — any regression in BUG-1a's distribution logic now fails loudly at the client rather than silently multiplying campaigns.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Insert guard in handlePublish() | 4f16bed | PreviewPublishStep.tsx (+10 lines) |
| 2 | Insert guard in handleRetryBatch() | 788a60d | PreviewPublishStep.tsx (+11 lines) |

## What Was Done

Two guard blocks were inserted in `PreviewPublishStep.tsx`:

**handlePublish() — line ~136 (loop context, uses `continue`):**
```typescript
// Guard: verify distribution count matches configured campaign count
const expectedCount = batch.totalCampaigns;
if (distribution.length !== expectedCount) {
  updatePublishBatch(batch.id, {
    status: 'failed',
    results: [{ campaignIndex: 0, status: 'failed', error: `[bulk-publish] Guard failed: expected ${expectedCount} campaigns, but distribution generated ${distribution.length} entries` }],
  });
  continue;
}
```

**handleRetryBatch() — line ~213 (no loop, uses `return`, uses `batchId` not `batch.id`):**
```typescript
// Guard: verify distribution count matches configured campaign count
const expectedCount = batch.totalCampaigns;
if (distribution.length !== expectedCount) {
  updatePublishBatch(batchId, {
    status: 'failed',
    results: [{ campaignIndex: 0, status: 'failed', error: `[bulk-publish] Guard failed: expected ${expectedCount} campaigns, but distribution generated ${distribution.length} entries` }],
  });
  return;
}
```

## Verification Results

```
# TypeScript compilation
npx tsc --noEmit → exit 0 (no errors)

# Guard count
grep -n "Guard failed" PreviewPublishStep.tsx → 2 lines (line 141, line 220)

# continue count in guards
grep -A 8 "Guard failed" | grep -c "continue" → 1

# return count in guards
grep -A 8 "Guard failed" | grep -c "return" → 1

# authenticatedFetch call sites
grep -n "authenticatedFetch" → line 4 (import), 146 (handlePublish), 225 (handleRetryBatch), 262 (templates)
Both bulk-publish calls remain after their respective guards.
```

## Success Criteria Met

1. PreviewPublishStep.tsx contains guard in handlePublish() with `updatePublishBatch + continue` — YES
2. PreviewPublishStep.tsx contains guard in handleRetryBatch() with `updatePublishBatch + return` — YES
3. Both guards use exact message: `[bulk-publish] Guard failed: expected ${expectedCount} campaigns, but distribution generated ${distribution.length} entries` — YES
4. `npx tsc --noEmit` passes with zero errors — YES
5. Normal flow (distribution.length === totalCampaigns) not affected — YES (guard is transparent)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — no stubs or placeholders introduced.

## Self-Check: PASSED

- File exists: apps/meta-ads-manager/src/components/campaign-wizard/PreviewPublishStep.tsx — FOUND
- Commit 4f16bed exists — FOUND
- Commit 788a60d exists — FOUND
- Guard strings (2): FOUND at lines 141 and 220
- tsc exit 0: CONFIRMED
