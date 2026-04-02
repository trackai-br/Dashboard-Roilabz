---
phase: 01-diagnose-fix-campaign-distribution-bug-1a
verified: 2026-04-02T01:30:00Z
status: passed
score: 8/8 must-haves verified
re_verification: false
---

# Phase 1: Replace local buildDistributionMap Verification Report

**Phase Goal:** Replace buggy local `buildDistributionMap` (Cartesian product) with correct implementation from `src/lib/distribution.ts`
**Verified:** 2026-04-02T01:30:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Local `buildDistributionMap` function deleted from PreviewPublishStep.tsx | VERIFIED | `grep "function buildDistributionMap" PreviewPublishStep.tsx` → no matches; file ends at line 521 with component closing brace |
| 2 | Import from distribution.ts includes `buildDistributionMap` | VERIFIED | Line 6: `import { calculateCampaignsPerType, buildDistributionMap, type AdsetTypeForDist } from '@/lib/distribution';` |
| 3 | `handlePublish` call site uses floor+remainder adapter and extracts `.entries` | VERIFIED | Lines 113-134: `baseCount + (i < remainder ? 1 : 0)`, `distributionResult.entries` |
| 4 | `handleRetryBatch` call site uses floor+remainder adapter and extracts `.entries` | VERIFIED | Lines 183-203: same pattern confirmed |
| 5 | Error handling present at both call sites | VERIFIED | `if (distributionResult.error) { ... continue/return }` at both sites |
| 6 | Cartesian product loop (`for (const page of batch.pages)`) removed | VERIFIED | grep → no matches |
| 7 | TypeScript compiles without errors | VERIFIED | `npx tsc --noEmit` produced zero output (zero errors) |
| 8 | distribution.ts exports correct signature returning `{ entries, error? }` | VERIFIED | Line 117 in distribution.ts: `export function buildDistributionMap(input: BuildDistributionInput): BuildDistributionResult` |

**Score:** 8/8 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/meta-ads-manager/src/components/campaign-wizard/PreviewPublishStep.tsx` | Local buggy function removed, both call sites updated with floor+remainder adapter | VERIFIED | 521 lines; no local function; 3 occurrences of `buildDistributionMap` (1 import + 2 call sites) |
| `apps/meta-ads-manager/src/lib/distribution.ts` | Exports `buildDistributionMap(input: BuildDistributionInput): BuildDistributionResult` | VERIFIED | Line 117 confirmed; returns `{ entries: DistributionEntry[], error?: string }` |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `PreviewPublishStep.tsx` | `@/lib/distribution` | named import line 6 | WIRED | `buildDistributionMap`, `calculateCampaignsPerType`, `AdsetTypeForDist` all imported |
| `handlePublish` | `buildDistributionMap` | call at line 116 with adapter | WIRED | Floor+remainder adapter feeds correct `BuildDistributionInput`; `.entries` extracted at line 134 |
| `handleRetryBatch` | `buildDistributionMap` | call at line 185 with adapter | WIRED | Same pattern; `.entries` extracted at line 203 |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `PreviewPublishStep.tsx` handlePublish | `distribution` | `distributionResult.entries` from `buildDistributionMap` in `@/lib/distribution` | Yes — iterates account array with real campaignCount math | FLOWING |
| `PreviewPublishStep.tsx` handleRetryBatch | `distribution` | same source | Yes | FLOWING |

The `distribution` variable is passed directly into the `bulk-publish` API call body (`JSON.stringify({ distribution, ... })`), so real data flows end-to-end.

---

### Behavioral Spot-Checks

Step 7b: SKIPPED — behavioral correctness of this fix (distribution math) was verified through manual trace in PLAN Task 7. Running the app would require a full Meta API test environment. TypeScript compilation with zero errors confirms structural correctness.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| BUG-1a | 01-PLAN.md | Buggy local `buildDistributionMap` produces Cartesian product (accounts × pages × campaigns) instead of N entries for N campaigns | SATISFIED | Local function deleted; floor+remainder adapter ensures `sum(campaignCount) === batch.totalCampaigns`; verified at both call sites |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| — | — | — | — | No anti-patterns found |

No TODOs, placeholders, empty handlers, stub returns, or hardcoded empty data detected in the modified file.

---

### Human Verification Required

#### 1. End-to-end bulk publish with 1 campaign × 2 accounts

**Test:** Open `/campaigns/setup`, configure 1 campaign with 2 accounts and 2 pages, click Publish.
**Expected:** Exactly 1 campaign created in Meta Ads (not 4). The `bulk-publish` API receives a `distribution` array of length 1.
**Why human:** Requires live Meta API credentials and actual campaign creation; cannot verify without running the full app against Meta Ads sandbox.

#### 2. Retry behavior after partial publish failure

**Test:** Simulate a failed batch publish, then click Retry for that batch.
**Expected:** Retry uses the same floor+remainder adapter; distribution length matches `batch.totalCampaigns`.
**Why human:** Requires UI interaction and a pre-existing failed publish state.

---

### Gaps Summary

No gaps. All 8 must-haves from the PLAN are satisfied by the actual code in `PreviewPublishStep.tsx`:

1. Local function absent (confirmed by grep and file inspection).
2. Import correct and complete.
3. Both call sites use the floor+remainder adapter with `.entries` extraction.
4. Error handling present at both call sites.
5. Cartesian product loop (`for page of batch.pages`) is gone.
6. TypeScript compiles clean.
7. distribution.ts exports the correct signature.
8. The `distribution` variable flows directly into the API payload.

The only items not automatable are live Meta API integration tests, which are flagged for human verification above.

---

_Verified: 2026-04-02T01:30:00Z_
_Verifier: Claude (gsd-verifier)_
