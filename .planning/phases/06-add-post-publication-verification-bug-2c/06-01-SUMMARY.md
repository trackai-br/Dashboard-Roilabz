---
phase: "06-add-post-publication-verification-bug-2c"
plan: "01"
subsystem: "bulk-publish API"
tags: [verification, meta-api, bug-2c, bulk-publish]
dependency_graph:
  requires: []
  provides: [post-publication-verification]
  affects: [bulk-publish-results]
tech_stack:
  added: []
  patterns: [try-catch-non-propagating, meta-api-query-after-write]
key_files:
  created: []
  modified:
    - apps/meta-ads-manager/src/pages/api/meta/bulk-publish.ts
key_decisions:
  - "Use minimal fields (['id'] only) in getAdSets/getAds calls to minimize API load and rate limit risk"
  - "200ms delay between getAds calls per adset to respect Meta rate limits without blocking too long"
  - "Verification errors return { adsetCount: -1, adCount: -1, status: 'empty' } — never propagate to fail campaign"
metrics:
  duration: "2 min"
  completed_date: "2026-04-03"
  tasks_completed: 2
  files_modified: 1
---

# Phase 06 Plan 01: Add Post-Publication Verification (BUG-2c) Summary

## One-liner

Post-publication verification via Meta API (getAdSets + getAds) queried after each campaign creation, returning adsetCount/adCount/status with warnings for empty/partial campaigns.

## What Was Built

Added `verifyCampaignStructure()` to `bulk-publish.ts` that queries the Meta Graph API after each campaign is created to confirm the Campaign -> AdSet -> Ad hierarchy actually exists. The result (including `adsetCount`, `adCount`, and `status`) is attached to every campaign result object returned to the client.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add verifyCampaignStructure function | 2c4821a | bulk-publish.ts |
| 2 | Call verification and attach to results | 38a2009 | bulk-publish.ts |

## Implementation Details

### verifyCampaignStructure function (lines 33-72)

- Accepts `(metaCampaignId: string, userId: string)`
- Calls `metaAPI.getAdSets(metaCampaignId, ['id'], 100, undefined, userId)`
- For each adset, calls `metaAPI.getAds(adset.id, ['id'], 100, undefined, userId)` with 200ms delay between calls
- Returns `{ campaignId, adsetCount, adCount, status: 'complete' | 'partial' | 'empty' }`
- Status logic: `complete` (adsets > 0 AND ads > 0), `partial` (adsets > 0 BUT ads = 0), `empty` (adsets = 0)
- Logs WARNING for `empty` and `partial` cases
- Entire body in try-catch; on error returns `{ adsetCount: -1, adCount: -1, status: 'empty' }`

### Integration in createFullCampaign (line 379)

- Called after all adset+ad creation loops finish, before the return statement
- `verification` included in the return value alongside `metaCampaignId` and `stats`

### Results attached in both paths

- Normal path: `verification` added to `results.push`
- Retry path: `retryVerification` destructured and added to `results.push`

## Verification Checks

1. `grep -n "verifyCampaignStructure"` — function definition (line 33) + call site (line 379)
2. `grep -n "verification"` — 10 occurrences covering function body, call site, return, destructuring, and results.push (both paths)
3. `grep "WARNING.*verification"` — 2 warning log lines (empty + partial)
4. `npx tsc --noEmit` — passes without errors
5. `grep "catch"` in verifyCampaignStructure — confirmed at line 64

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — verification is fully wired to the Meta API. No placeholder values.

## Self-Check: PASSED

- File modified: `apps/meta-ads-manager/src/pages/api/meta/bulk-publish.ts` — FOUND
- Commit 2c4821a — FOUND
- Commit 38a2009 — FOUND
- TypeScript compiles without errors — VERIFIED
