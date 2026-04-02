# Requirements — Bulk Publish Fix

## v1 Requirements

### BUG-1 — Campaign Multiplication

**Problem:** Bulk-publish creates 4x more campaigns than configured (e.g., 1 campaign request → 4 campaigns created in Meta)

**Root Cause:** Local `buildDistributionMap` function in `PreviewPublishStep.tsx` uses Cartesian product (accounts × pages × campaigns) instead of sequential distribution

**Solution:** Import correct `buildDistributionMap` from `src/lib/distribution.ts` and delete local buggy version

---

#### BUG-1: bulk-publish publica exatamente N campanhas (sem multiplicação)

- [ ] **Phase 1** — Fix distribution algorithm
- [ ] **Phase 2** — Add guard assertion before API call
- [ ] **Phase 3** — Add structured logging to show exact counts
- **Success:** Publish 1, 3, 6 campaigns → Meta shows exactly 1, 3, 6 (not 4, 12, 24)

---

#### BUG-1a: identificar e corrigir causa raiz do fator 4x

- [ ] **Phase 1** — Replace `PreviewPublishStep.tsx` local `buildDistributionMap` with import from `src/lib/distribution.ts`
- [ ] **Phase 1** — Remove buggy local function (lines 482-500)
- [ ] **Phase 1** — Add batch adapter to match function signature
- [ ] **Phase 1** — Verify with test: 2 accounts × 2 pages × 1 campaign = 1 entry (not 4)
- **Success:** Distribution mapping returns exactly N entries for N campaigns configured

---

#### BUG-1b: adicionar guard/assertion antes do envio

- [ ] **Phase 2** — Compute expected campaign count in `handlePublish()`
- [ ] **Phase 2** — Assert `distribution.length === expectedCount` before API call
- [ ] **Phase 2** — Throw error with message showing expected vs actual if guard fails
- [ ] **Phase 2** — Prevent API call if guard fails
- **Success:** If distribution generates wrong count, error thrown with clear message before reaching Meta API

---

#### BUG-1c: logs estruturados mostrando contagem exata

- [ ] **Phase 3** — Add frontend logs (console.log) before API call with:
  - Campaign count (configured)
  - Account count
  - Page count
  - Distribution entries generated
  - Expected vs actual comparison
- [ ] **Phase 3** — Add backend logs (console.log) when POST /api/meta/bulk-publish received with:
  - Total entries in payload
  - Batch details (account/page/campaign per entry)
  - Timestamp
- [ ] **Phase 3** — Use structured log format: `[bulk-publish] [component] [timestamp] message`
- **Success:** Logs visible in browser DevTools and server logs showing exact counts at each step

---

### BUG-2 — Empty Campaigns (No AdSets/Ads)

**Problem:** Campaigns created in Meta but contain no adsets or ads, rendering them unusable

**Root Cause:** Missing granular error handling — if adset creation fails, entire campaign marked as failed but campaign already exists in Meta (empty). User retries and creates duplicate instead of completing the empty campaign.

**Solution:** Add individual try-catch blocks around adset and ad creation so failures don't silence entire campaign

---

#### BUG-2: cada campanha publicada contém seus adsets e ads

- [ ] **Phase 4-5** — Add granular try-catch for adsets and ads
- [ ] **Phase 6** — Add post-publication verification to confirm structure
- [ ] **Phase 7** — Integration test with all 3 modes (quick, advanced, add-adsets)
- **Success:** Each published campaign in Meta contains configured adsets and ads; no empty campaigns

---

#### BUG-2a: garantir ordem sequencial Campaign → AdSet → Ad

- [ ] **Phase 4** — Wrap adset creation in try-catch, log errors but continue campaign
- [ ] **Phase 5** — Wrap ad creation in try-catch, log errors but continue campaign
- [ ] **Phase 5** — Track success/failure counts per campaign (adsetsCreated, adsetsFailed, adsCreated, adsFailed)
- **Success:** Creation order is strictly Campaign → AdSet(s) → Ad(s); all awaited sequentially

---

#### BUG-2b: tratamento de erro por nível (falha em adset não silencia)

- [ ] **Phase 4** — Each adset wrapped in individual try-catch
- [ ] **Phase 4** — Adset error logs error message with campaign ID, adset index
- [ ] **Phase 4** — Campaign continues after adset failure (no throw)
- [ ] **Phase 5** — Each ad wrapped in individual try-catch
- [ ] **Phase 5** — Ad error logs error message with campaign ID, adset ID, creative index
- [ ] **Phase 5** — Campaign continues after ad failure (no throw)
- [ ] **Phase 5** — Campaign marked 'partial' if any adset/ad failed, 'success' only if all succeeded
- [ ] **Phase 4** — DB insert for adset has error checking (not silent)
- [ ] **Phase 5** — DB insert for ad has error checking (not silent)
- **Success:** Failure in one adset does not prevent other adsets from creating; failure in one ad does not prevent other ads

---

#### BUG-2c: verificação pós-publicação (query na API confirma estrutura)

- [ ] **Phase 6** — Add `verifyCampaignStructure()` function
- [ ] **Phase 6** — After campaign creation, query Meta API for:
  - Campaign object
  - AdSets under campaign
  - Ads under each AdSet
- [ ] **Phase 6** — Return verification object: `{ campaignId, adsetCount, adCount, status }`
- [ ] **Phase 6** — If campaign has no adsets, mark status as 'empty' and log warning
- [ ] **Phase 6** — Catch verification errors (do not fail campaign)
- **Success:** Post-creation query confirms Campaign → AdSet → Ad hierarchy is intact; empty campaigns detected

---

### VERIFY — Integration Testing

**Goal:** Validate all 3 bulk-publish modes with real scenarios; no regressions

---

#### VERIFY: testar os 3 modos com cenários reais

- [ ] **Phase 7** — Setup test environment with Meta test account and known assets
- [ ] **Phase 7** — Test Mode 1 (Quick/Homogeneous):
  - Input: 1 campaign, 1 adset, 1 creative, 2 accounts, 2 pages
  - Expected: Exactly 1 campaign in Meta with 1 adset + 1 ad
  - Verify: Dashboard shows correct hierarchy
- [ ] **Phase 7** — Test Mode 2 (Advanced/Heterogeneous):
  - Input: 3 campaigns with different creatives/budgets, 2 accounts, 1 page
  - Expected: Exactly 3 campaigns in Meta, each with correct config
  - Verify: Each campaign has unique creative + budget
- [ ] **Phase 7** — Test Mode 3 (Add AdSets):
  - Setup: Create 1 campaign via Mode 1
  - Action: Add 2 new adsets to existing campaign
  - Expected: Existing campaign now has 3 adsets total
  - Verify: Same campaign ID, adset count increased
- [ ] **Phase 7** — Verify all modes show exact campaign counts in logs
- [ ] **Phase 7** — Verify guards prevent invalid submissions
- [ ] **Phase 7** — Verify no silent failures (all errors logged)
- **Success:** All 3 modes work correctly, no regressions, no duplicate campaigns

---

## Out of Scope

| Feature | Reason | Next Milestone |
|---------|--------|-----------------|
| Google Ads CRUD | Not related to Meta bulk-publish bugs | TBD |
| Upload de vídeo nativo | Workaround with `image_url` sufficient; no bugs | TBD |
| Refatoração de arquitetura Inngest | Not cause root of current bugs | TBD |
| Novas features do dashboard | Focus exclusive on stability | TBD |

---

## Traceability

| Req ID | Description | Phase | Status | Notes |
|--------|-------------|-------|--------|-------|
| BUG-1 | bulk-publish publica exatamente N campanhas | 1-3 | Pending | Campaign multiplication fix |
| BUG-1a | causa raiz do fator 4x | 1 | Pending | Import correct distribution.ts function |
| BUG-1b | guard/assertion antes do envio | 2 | Pending | Assert distribution.length === expected |
| BUG-1c | logs estruturados com contagem exata | 3 | Pending | Frontend + backend structured logs |
| BUG-2 | cada campanha tem seus adsets e ads | 4-6 | Pending | Granular try-catch + verification |
| BUG-2a | ordem sequencial Campaign → AdSet → Ad | 4-5 | Pending | Try-catch per level, track stats |
| BUG-2b | tratamento de erro por nível | 4-5 | Pending | Granular error handling, no silent failures |
| BUG-2c | verificação pós-publicação | 6 | Pending | Query Meta API, confirm hierarchy |
| VERIFY | testar os 3 modos com cenários reais | 7 | Pending | Integration testing all modes |

---

## Verification Checklist

Use this before marking a phase complete:

### Phase 1 — Distribution Fix
- [ ] Local `buildDistributionMap` removed from PreviewPublishStep.tsx
- [ ] Import statement added from distribution.ts
- [ ] Batch adapter correctly transforms batch config
- [ ] Test: 2 accts × 2 pages × 1 campaign = 1 entry (not 4)
- [ ] Test: 3 accts × 2 pages × 2 campaigns = 2 entries (not 12)

### Phase 2 — Guard Assertion
- [ ] `expectedCount` computed correctly
- [ ] Guard check added before API call
- [ ] Error thrown if mismatch with clear message
- [ ] API call prevented on guard failure
- [ ] Message includes expected vs actual counts

### Phase 3 — Logging
- [ ] Frontend logs show: campaign count, account count, page count, distribution entries, expected vs actual
- [ ] Backend logs show: total entries, batch details per entry, timestamp
- [ ] Log format consistent: `[bulk-publish] [component] [timestamp] message`
- [ ] Logs visible in browser DevTools Console
- [ ] Logs visible in server console

### Phase 4 — AdSet Try-Catch
- [ ] Each adset in try-catch block
- [ ] Adset error logged with campaign ID, adset index
- [ ] Campaign continues after adset failure
- [ ] DB insert error checked (not silent)
- [ ] Failure count tracked

### Phase 5 — Ad Try-Catch
- [ ] Each ad in try-catch block
- [ ] Ad error logged with campaign ID, adset ID, creative index
- [ ] Campaign continues after ad failure
- [ ] DB insert error checked (not silent)
- [ ] Campaign marked 'partial' vs 'success' correctly
- [ ] Failure count tracked

### Phase 6 — Post-Publication Verification
- [ ] `verifyCampaignStructure()` function exists
- [ ] Function queries: campaign, adsets, ads
- [ ] Returns: { campaignId, adsetCount, adCount, status }
- [ ] Empty campaigns marked status: 'empty'
- [ ] Verification errors caught (not propagated)

### Phase 7 — Integration Testing
- [ ] Mode 1 (Quick): 1 campaign → 1 campaign in Meta + 1 adset + 1 ad
- [ ] Mode 2 (Advanced): 3 campaigns → 3 campaigns in Meta with correct configs
- [ ] Mode 3 (Add AdSets): Add to existing → existing campaign adset count increased
- [ ] All logs show correct counts
- [ ] Guards prevent invalid submissions
- [ ] No duplicate campaigns
- [ ] No silent failures

---

## Acceptance Criteria

**Project is COMPLETE when:**

1. ✓ BUG-1 fixed: Publish N campaigns → exactly N campaigns in Meta (not 4N, 6N, etc.)
2. ✓ BUG-2 fixed: Each campaign contains configured adsets + ads (no empty campaigns)
3. ✓ All 3 modes (quick, advanced, add-adsets) tested with real scenarios
4. ✓ Logs show exact counts at each step (diagnose future issues)
5. ✓ Guards prevent invalid data reaching Meta API
6. ✓ Error handling granular (adset failure doesn't silence campaign)
7. ✓ Post-verification confirms Campaign → AdSet → Ad hierarchy
8. ✓ Zero silent failures (all errors logged)

---

## Last Updated
2026-04-02
