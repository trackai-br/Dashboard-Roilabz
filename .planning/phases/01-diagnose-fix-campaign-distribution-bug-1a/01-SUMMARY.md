---
phase: 01-diagnose-fix-campaign-distribution-bug-1a
plan: 01
subsystem: ui
tags: [distribution, bulk-publish, campaign-wizard, typescript, meta-api]

# Dependency graph
requires: []
provides:
  - Correct buildDistributionMap call in PreviewPublishStep.tsx (both handlePublish and handleRetryBatch)
  - Floor+remainder adapter converting batch.totalCampaigns into per-account campaignCount
  - Error handling for distributionResult.error at both call sites
affects:
  - 02-add-guard-assertion
  - 03-add-structured-logging
  - bulk-publish flow

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Floor+remainder distribution: Math.floor(total/n) + (i < total%n ? 1 : 0) ensures exactly N entries for N campaigns"
    - "Cast BatchAdsetType[] as unknown as AdsetTypeForDist[] when index signature is incompatible but fields overlap"

key-files:
  created: []
  modified:
    - apps/meta-ads-manager/src/components/campaign-wizard/PreviewPublishStep.tsx

key-decisions:
  - "Use floor+remainder adapter (not Math.ceil) so total distribution entries = batch.totalCampaigns exactly"
  - "Cast adsetTypes via unknown to satisfy AdsetTypeForDist index signature without modifying the BatchAdsetType interface"
  - "Delete local function entirely rather than rename — shadowing the import by same name creates permanent ambiguity"

patterns-established:
  - "Floor+remainder adapter: convert a global total into per-account counts for buildDistributionMap"
  - "Always extract .entries from BuildDistributionResult; check .error before proceeding"

requirements-completed:
  - BUG-1a

# Metrics
duration: 8min
completed: 2026-04-02
---

# Phase 1 Plan 1: Replace local buildDistributionMap with correct import from distribution.ts Summary

**Deleted Cartesian-product local function (accounts x pages x campaigns) and replaced both call sites with floor+remainder adapter calling the correct buildDistributionMap from @/lib/distribution, so 1 configured campaign now produces exactly 1 distribution entry instead of 4.**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-04-02T00:52:15Z
- **Completed:** 2026-04-02T01:00:00Z
- **Tasks:** 7 (1 verification, 5 code, 1 TS compile check)
- **Files modified:** 1

## Accomplishments
- Removed the buggy triple-nested loop (accounts x pages x campaigns) that multiplied campaign count by accounts*pages factor
- Both `handlePublish` and `handleRetryBatch` now use the tested `buildDistributionMap` from `@/lib/distribution`
- Floor+remainder adapter ensures `sum(campaignCount per account) === batch.totalCampaigns` exactly
- Error handling added at both call sites — if `distributionResult.error`, batch is marked failed immediately
- TypeScript compiles with zero errors (`npx tsc --noEmit`)

## Task Commits

1. **Tasks 1-7: Read, update import, fix handlePublish, fix handleRetryBatch, delete local function, TS check, math verification** - `ffdee6c` (fix)

**Plan metadata:** (committed with docs commit below)

## Files Created/Modified
- `apps/meta-ads-manager/src/components/campaign-wizard/PreviewPublishStep.tsx` - Removed local buildDistributionMap, updated import, fixed both call sites with floor+remainder adapter and error handling

## Decisions Made
- Used floor+remainder pattern (not Math.ceil) to guarantee `sum = totalCampaigns` — Math.ceil would produce `accounts.length` campaigns when 1 is configured
- Cast `batch.adsetTypes as unknown as AdsetTypeForDist[]` because `BatchAdsetType` lacks the `[key: string]: unknown` index signature required by `AdsetTypeForDist`, but both types share the required `adsetCount` and `creativesInAdset` fields
- Deleted local function rather than renaming — leaving two identically-named functions (local + import) in the same scope is a permanent source of confusion

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript cast via `unknown` required for BatchAdsetType → AdsetTypeForDist**
- **Found during:** Task 6 (TypeScript compile verification)
- **Issue:** Direct `as AdsetTypeForDist[]` cast rejected by TS ("neither type sufficiently overlaps") because `BatchAdsetType` lacks the `[key: string]: unknown` index signature on `AdsetTypeForDist`
- **Fix:** Changed to `batch.adsetTypes as unknown as AdsetTypeForDist[]` at both call sites (both in handlePublish and handleRetryBatch). The plan already mentioned this as a possible fix in Task 6 notes.
- **Files modified:** `apps/meta-ads-manager/src/components/campaign-wizard/PreviewPublishStep.tsx`
- **Verification:** `npx tsc --noEmit` exits with zero errors
- **Committed in:** `ffdee6c`

---

**Total deviations:** 1 auto-fixed (Rule 1 — type error blocking compilation)
**Impact on plan:** Necessary correctness fix. No scope creep. Plan already anticipated this scenario.

## Issues Encountered
None beyond the TypeScript cast which was pre-anticipated in Task 6 guidance.

## Known Stubs
None.

## Next Phase Readiness
- BUG-1a resolved: distribution math is now correct
- Phase 2 (BUG-1b: add guard assertion `campaigns.length === expected` before sending to API) can proceed immediately
- No blockers

---
*Phase: 01-diagnose-fix-campaign-distribution-bug-1a*
*Completed: 2026-04-02*

## Self-Check: PASSED
