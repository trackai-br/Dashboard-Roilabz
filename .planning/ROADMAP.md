# Roadmap — Bulk Publish Fix

## Overview
7 phases | 9 requirements | All v1 requirements covered ✓

**Goal:** Fix two critical bugs in bulk-publish system:
1. **BUG-1** — Campaign multiplication (4x factor) in PreviewPublishStep
2. **BUG-2** — Empty campaigns (no adsets/ads) due to missing error handling

## Execution Strategy

- **BUG-1 resolved first** (Phases 1-3): Fix multiplicação masking BUG-2
- **BUG-2 resolved second** (Phases 4-6): Granular error handling per level
- **Integrated testing** (Phase 7): Validate 3 modes with real scenarios

---

## Phases

### Phase 1: Diagnose & Fix Campaign Distribution (BUG-1a)

**Goal:** Replace buggy local `buildDistributionMap` with correct implementation from `src/lib/distribution.ts`

**Requirements:** BUG-1a

**Files to change:**
- `apps/meta-ads-manager/src/components/campaign-wizard/PreviewPublishStep.tsx` — lines 482-500 (delete local function), add import

**Success criteria:**
1. Local `buildDistributionMap` function removed from PreviewPublishStep.tsx
2. Import statement added: `import { buildDistributionMap } from '@/lib/distribution'`
3. Batch adapter applied to match distribution.ts function signature
4. With 2 accounts × 2 pages × 1 campaign → exactly 1 campaign entry (not 4)
5. With 3 accounts × 2 pages × 2 campaigns → exactly 2 campaign entries (not 12)

**Test scenario:**
```
Input: 2 accounts, 2 pages, 1 campaign
Before: buildDistributionMap returns 4 entries
After: buildDistributionMap returns 1 entry
```

---

### Phase 2: Add Guard Assertion Before Publish (BUG-1b)

**Goal:** Prevent malformed campaign arrays from reaching Meta API with explicit count validation

**Requirements:** BUG-1b

**Files to change:**
- `apps/meta-ads-manager/src/components/campaign-wizard/PreviewPublishStep.tsx` — `handlePublish()` function (around line 108-115)

**Success criteria:**
1. Before `POST /api/meta/bulk-publish` is called, compute expected campaign count
2. Assert `distribution.length === expectedCount` with meaningful error message
3. If assertion fails, throw error and prevent API call
4. Error message includes expected count and actual count
5. Guard runs AFTER distribution mapping and BEFORE API request

**Code pattern:**
```typescript
const expectedCount = batch.totalCampaigns;
if (distribution.length !== expectedCount) {
  throw new Error(
    `[bulk-publish] Guard failed: expected ${expectedCount} campaigns, ` +
    `but distribution generated ${distribution.length} entries`
  );
}
```

---

### Phase 3: Add Structured Logging for Campaign Counts (BUG-1c)

**Goal:** Provide visible, structured logs showing exact campaign count before sending to Meta

**Requirements:** BUG-1c

**Files to change:**
- `apps/meta-ads-manager/src/components/campaign-wizard/PreviewPublishStep.tsx` — `handlePublish()` (around line 108-118)
- `apps/meta-ads-manager/src/pages/api/meta/bulk-publish.ts` — request handler (around line 1-30)

**Success criteria:**
1. Frontend logs (via console.log) with structured format before API call:
   - Campaign count (configured)
   - Account count
   - Page count
   - Distribution entries generated
   - Expected vs actual comparison
2. Backend logs (via console.log) when POST /api/meta/bulk-publish is received:
   - Total entries in request payload
   - Batch index + account/page/campaign info per entry
   - Timestamp
3. Logs format: `[bulk-publish] [component] [timestamp] message`
4. Logs visible in browser DevTools Console (frontend) and server logs (backend)

**Log format example:**
```
[bulk-publish] [PreviewPublishStep] [2026-04-02T14:32:10Z] 
  Distribution plan: 2 accounts × 2 pages × 1 campaign = 1 entry (expected 1) ✓

[bulk-publish] [bulk-publish.ts] [2026-04-02T14:32:11Z]
  POST /api/meta/bulk-publish received with 1 campaign entry
```

---

### Phase 4: Add Granular Try-Catch for AdSet Creation (BUG-2a, BUG-2b)

**Goal:** Prevent adset failures from silencing entire campaign, with individual error handling per adset

**Requirements:** BUG-2a, BUG-2b (part 1)

**Plans:** 1/1 plans complete

Plans:
- [x] 04-01-PLAN.md — Wrap adset creation in individual try-catch with stats tracking

**Files to change:**
- `apps/meta-ads-manager/src/pages/api/meta/bulk-publish.ts` — `createFullCampaign()` function (around lines 185-210)

**Success criteria:**
1. Each adset creation wrapped in individual try-catch block
2. AdSet failure logs error but continues campaign creation (does not throw)
3. Adset error includes: adset index, error message, campaign ID
4. Campaign creation does NOT fail if 1 or more adsets fail
5. Failed adsets are tracked in campaign result object with count
6. DB insert for adset has error handling (check error response)

**Code pattern:**
```typescript
for (const adsetType of adsetTypes) {
  for (let a = 0; a < adsetType.adsetCount; a++) {
    let metaAdsetId: string | null = null;
    try {
      const adsetResult = await metaAPI.createAdSet(...);
      metaAdsetId = adsetResult?.id || null;
      
      if (metaAdsetId) {
        const { error: dbErr } = await supabase.from('meta_ad_sets').insert({...});
        if (dbErr) console.error(`[bulk-publish] DB insert adset failed:`, dbErr);
      }
    } catch (adsetErr: any) {
      console.error(`[bulk-publish] AdSet ${a} failed for campaign ${i}:`, adsetErr.message);
      statsPerCampaign.adsetsFailed++;
      continue; // Continue to next adset
    }
  }
}
```

---

### Phase 5: Add Granular Try-Catch for Ad Creation (BUG-2a, BUG-2b)

**Goal:** Prevent individual ad failures from silencing campaign, with error tracking per creative

**Requirements:** BUG-2a, BUG-2b (part 2)

**Files to change:**
- `apps/meta-ads-manager/src/pages/api/meta/bulk-publish.ts` — `createFullCampaign()` function (around lines 269-290)

**Success criteria:**
1. Each ad creation wrapped in individual try-catch block
2. Ad failure logs error but continues to next creative (does not throw)
3. Ad error includes: creative index, error message, adset ID, campaign ID
4. Campaign creation does NOT fail if 1 or more ads fail
5. Failed ads are tracked in campaign result object with count
6. DB insert for ad has error handling (check error response)
7. Campaign is marked 'partial' if any adset or ad failed; 'success' only if all succeeded

**Code pattern:**
```typescript
for (const creative of validCreatives) {
  try {
    const adResult = await metaAPI.createAd(metaAccountId, metaAdsetId, adBody, user.id);
    
    if (adResult?.id) {
      const { error: dbErr } = await supabase.from('meta_ads').insert({...});
      if (dbErr) console.error(`[bulk-publish] DB insert ad failed:`, dbErr);
    }
    statsPerCampaign.adsCreated++;
  } catch (adErr: any) {
    console.error(`[bulk-publish] Ad for creative failed:`, adErr.message);
    statsPerCampaign.adsFailed++;
    continue; // Continue to next creative
  }
}
```

---

### Phase 6: Add Post-Publication Verification (BUG-2c)

**Goal:** Query Meta API after campaign creation to verify structure (Campaign → AdSet → Ad hierarchy)

**Requirements:** BUG-2c

**Files to change:**
- `apps/meta-ads-manager/src/pages/api/meta/bulk-publish.ts` — add new function `verifyCampaignStructure()` and call after campaign creation
- `apps/meta-ads-manager/src/lib/meta-api.ts` — add query method if not exists

**Success criteria:**
1. After creating campaign (and before marking complete), query Meta API for:
   - Campaign object
   - AdSets under campaign (should be non-empty)
   - Ads under each AdSet (should be non-empty)
2. Verification returns structure object with:
   - `campaignId`
   - `adsetCount` (actual from Meta)
   - `adCount` (actual from Meta)
   - `status: 'complete' | 'partial' | 'empty'`
3. If campaign has no adsets, mark as 'empty' and log warning
4. Verification result stored alongside campaign result
5. Verification errors caught (do not fail campaign, log as warning)

**Verification pattern:**
```typescript
const verification = await verifyCampaignStructure(
  metaAccountId,
  metaCampaignId,
  user.id
);
// Returns: { campaignId, adsetCount, adCount, status: 'complete|partial|empty' }
```

---

### Phase 7: Integration Testing — 3 Modes (VERIFY)

**Goal:** Test all 3 bulk-publish modes with real scenarios to ensure no regressions

**Requirements:** VERIFY

**Files to test:**
- `apps/meta-ads-manager/src/pages/campaigns/setup` — Wizard UI
- `apps/meta-ads-manager/src/pages/api/meta/bulk-publish` — API handler
- `apps/meta-ads-manager/src/components/campaign-wizard/PreviewPublishStep.tsx` — Distribution & publish logic

**Test scenarios (executed manually with real Meta account):**

1. **Mode 1 — Quick Mode (homogeneous)**
   - Input: 1 campaign, 1 adset type (Conversions), 1 creative (image), 2 accounts, 2 pages
   - Expected: Exactly 1 campaign in Meta with 1 adset with 1 ad
   - Verify: Dashboard shows 1 campaign, click to inspect contains 1 adset + 1 ad

2. **Mode 2 — Advanced Mode (heterogeneous)**
   - Input: 3 campaigns with different creatives (image, video, carousel), different budgets, 2 accounts, 1 page
   - Expected: Exactly 3 campaigns in Meta, each with unique config
   - Verify: Dashboard shows 3 campaigns, each with correct creative + budget

3. **Mode 3 — Add AdSets to Existing**
   - Setup: Create 1 campaign via Mode 1 (gets metaCampaignId)
   - Action: Use "Add AdSets" mode to insert 2 new adsets to existing campaign
   - Expected: Existing campaign now has 3 adsets total (1 original + 2 new)
   - Verify: Dashboard shows same campaign ID, adset count increased

**Success criteria:**
1. All 3 modes create correct number of campaigns
2. Each campaign contains correct adsets and ads
3. No duplicate campaigns created
4. Logs show exact counts at each step
5. Guards prevent invalid submissions
6. Post-verification confirms hierarchy integrity
7. No silent failures (all errors logged)

---

## Requirement Traceability

| Requirement | Phase | Status | Notes |
|-------------|-------|--------|-------|
| BUG-1 | Phase 1-3 | Pending | Campaign multiplication fix + guards + logs |
| BUG-1a | Phase 1 | Pending | Root cause: local buildDistributionMap → import correct from distribution.ts |
| BUG-1b | Phase 2 | Pending | Guard assertion: distribution.length === expectedCount |
| BUG-1c | Phase 3 | Pending | Structured logs with counts before API call |
| BUG-2 | Phase 4-6 | Pending | Empty campaigns fix with granular error handling |
| BUG-2a | Phase 4-5 | Pending | Try-catch per adset + ad, sequential Campaign → AdSet → Ad |
| BUG-2b | Phase 4-5 | Pending | Error handling per level, adset failure doesn't silence campaign |
| BUG-2c | Phase 6 | Pending | Post-publication verification confirms hierarchy |
| VERIFY | Phase 7 | Pending | Manual testing of 3 modes with real scenarios |

---

## Key Dependencies

- Phase 1 MUST complete before Phase 2 (verify distribution is correct first)
- Phases 2-3 are sequential (assert → log)
- Phases 4-5 are sequential (adsets → ads)
- Phase 6 depends on Phases 4-5 completion (verification after creation)
- Phase 7 depends on all Phases 1-6 completion

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Import statement breaks (Phase 1) | Verify function signature matches batch adapter |
| Guard assertion too strict (Phase 2) | Allow partial deployments: log warning but don't throw if counts differ |
| Logging overhead (Phase 3) | Use conditional logging (only in dev or when flag enabled) |
| Try-catch swallows real bugs (Phase 4-5) | Ensure all errors logged with context (campaign ID, index, error message) |
| Verification API rate limit (Phase 6) | Add delay between verification queries, catch rate limit errors gracefully |
| Test data inconsistency (Phase 7) | Use fixed Meta test account with known assets; document setup steps |

