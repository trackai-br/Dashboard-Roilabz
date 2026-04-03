---
phase: 05-add-granular-try-catch-for-ad-creation-bug-2a-bug-2b
plan: "01"
subsystem: bulk-publish
tags: [bug-fix, error-handling, try-catch, stats-tracking, meta-api]
dependency_graph:
  requires: ["04-01"]
  provides: ["per-ad-isolation", "ad-stats-tracking", "db-ad-error-check"]
  affects: ["apps/meta-ads-manager/src/pages/api/meta/bulk-publish.ts"]
tech_stack:
  added: []
  patterns: ["two-layer try-catch (adset outer, ad inner)", "continue on failure inside loop"]
key_files:
  created: []
  modified:
    - apps/meta-ads-manager/src/pages/api/meta/bulk-publish.ts
decisions:
  - "Move humanDelay() inside try block so failed ad creations skip rate-limit delay"
  - "Keep rawUrl empty guard and video type skip OUTSIDE try block — they are pre-filters, not fallible operations"
  - "Use adResult?.id (optional chaining) consistent with Phase 04 pattern — no bang operator"
metrics:
  duration: "5 min"
  completed_date: "2026-04-02"
  tasks: 2
  files_modified: 1
---

# Phase 05 Plan 01: Granular Per-Ad Try-Catch for Ad Creation (BUG-2a, BUG-2b) Summary

## One-liner

Per-creative try-catch inside ad creation loop with adsCreated/adsFailed stats tracking and DB insert error checking, isolating individual ad failures from the adset-level catch.

## What Was Built

Added a second layer of try-catch inside the `for (const creativeName of validCreatives)` loop in `bulk-publish.ts`. Previously, any `metaAPI.createAd` throw would bubble to the adset-level catch, which incorrectly incremented `adsetsFailed` and skipped all remaining creatives in the adset. Now:

- Each creative iteration has its own `try { ... } catch (adErr: any)` block
- A caught ad error logs the creative name, adset ID, and campaign ID then calls `continue`, allowing the loop to process the next creative
- `statsPerCampaign.adsCreated++` increments after each successful `createAd` + DB insert
- `statsPerCampaign.adsFailed++` increments in each caught ad error
- The DB insert for `meta_ads` now captures the error response and logs it with context (adset ID and creative name) instead of silently swallowing it
- The `humanDelay()` was moved inside the try block so failed ad creations do not consume the rate-limit delay

The `hasFailures` check at line 345 already included `stats.adsFailed > 0` (wired in Phase 04), so campaign status is automatically set to `'partial'` whenever any ad fails.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Wrap ad creation loop in per-creative try-catch with stats tracking | 297f7d8 | apps/meta-ads-manager/src/pages/api/meta/bulk-publish.ts |
| 2 | Verify per-ad try-catch behavior with grep checks and build | (verification only — no new commit) | — |

## Verification Results

All 7 grep checks passed:
- `catch (adErr` — 1 match (per-ad catch exists)
- `statsPerCampaign.adsCreated++` — 1 match
- `statsPerCampaign.adsFailed++` — 1 match
- `DB insert ad failed` — 1 match
- `Ad creation failed for creative` — 1 match
- `catch (adsetErr` — 1 match (adset-level catch still present, not removed)
- `hasFailures.*adsFailed` — 1 match (partial status wired)

Build: Next.js production build passed with zero TypeScript errors.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all stats counters are wired to real Meta API call outcomes. The `adsFailed > 0` partial status check is wired to the `hasFailures` variable that flows directly to the campaign result `status` field.

## Self-Check: PASSED

- [x] `apps/meta-ads-manager/src/pages/api/meta/bulk-publish.ts` modified and exists
- [x] Commit 297f7d8 exists in git log
- [x] All grep checks confirmed in Task 2 verification run
- [x] Next.js build passed without TypeScript errors
