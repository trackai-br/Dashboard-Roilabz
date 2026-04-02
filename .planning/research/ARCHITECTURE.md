# Research: WizardContext & Campaign Payload Construction

## Wizard State Structure

**File:** `apps/meta-ads-manager/src/stores/wizard-store.ts`

O WizardStore gerencia batches com:
- `accounts`: BatchAccountEntry[] — contas de anúncio selecionadas
- `pages`: BatchPageEntry[] — páginas Facebook selecionadas
- `totalCampaigns`: number — contagem GLOBAL de campanhas (campo problemático)
- `adsetTypes`: AdsetTypeConfig[] — configurações dos conjuntos
- `adsetsPerCampaign`: number
- `campaignCount` por conta — **campo existe no store mas sem UI para editar** (débito técnico HIGH)

## Publish Handler Flow

**Arquivo:** `PreviewPublishStep.tsx`

```
handlePublish() (linha 91)
  ↓ Check isPublishing flag (debounce guard)
  ↓ Loop sequencial por batch (linha 108)
    ↓ buildDistributionMap(batch)  ← FUNÇÃO LOCAL ERRADA (linha 482)
    ↓ POST /api/meta/bulk-publish com distribution
```

## Campaign Array Construction — O Produto Cartesiano

**Função local em PreviewPublishStep.tsx (linhas 482-500) — BUG:**

```typescript
function buildDistributionMap(batch: BatchConfig) {
  const entries: any[] = [];
  let campaignIndex = 0;
  for (const account of batch.accounts) {         // Loop 1
    for (const page of batch.pages) {             // Loop 2 (nested)
      for (let i = 0; i < batch.totalCampaigns; i++) { // Loop 3 (nested)
        entries.push({ campaignIndex: campaignIndex++, accountId, pageId, ... });
      }
    }
  }
  return entries;
}
```

Resultado com 2 contas, 2 páginas, 1 campanha: **4 entradas** (produto cartesiano)

## Account/Page Iteration Analysis

| Accounts | Pages | Campaigns | Entradas geradas | Fator |
|----------|-------|-----------|-----------------|-------|
| 2 | 2 | 1 | 4 | **4x** |
| 2 | 2 | 3 | 12 | **4x** |
| 2 | 3 | 1 | 6 | **6x** |

## Creative Files Iteration

`adConfig.creativeFiles = creativePool` — passado por batch, não por campanha. Com o bug de distribuição, as mesmas creativas são enviadas para 4x mais campanhas do que o esperado. Não é causa raiz, mas amplifica o problema.

## The 4x Multiplication Hypothesis — CONFIRMED

A função `buildDistributionMap` local em `PreviewPublishStep.tsx` cria um produto cartesiano (accounts × pages × totalCampaigns) em vez de distribuir N campanhas entre contas/páginas.

## Distribution Algorithm Correto (não utilizado)

**Arquivo:** `apps/meta-ads-manager/src/lib/distribution.ts` (linhas 117-206)

A função `buildDistributionMap()` CORRETA:
- Usa `campaignCount` por conta (não `totalCampaigns` global)
- Distribui sequencialmente (não Cartesian product)
- Respeita capacidade de páginas
- **NÃO está sendo chamada em PreviewPublishStep.tsx**

## Recommended Fix

### Opção 1 — Importar a função correta (PREFERIDA)
```typescript
// Remover função local (linhas 482-500) em PreviewPublishStep.tsx
import { buildDistributionMap } from '@/lib/distribution';

// Adaptar o batch:
const distribution = buildDistributionMap({
  accounts: batch.accounts.map(a => ({
    accountId: a.accountId,
    accountName: a.accountName,
    campaignCount: Math.ceil(batch.totalCampaigns / batch.accounts.length),
  })),
  pages: batch.pages,
  adsetTypes: batch.adsetTypes,
});
```

### Opção 2 — Corrigir o loop local
```typescript
function buildDistributionMap(batch: BatchConfig) {
  const entries: any[] = [];
  const accountCount = batch.accounts.length;
  const pageCount = batch.pages.length;
  
  for (let i = 0; i < batch.totalCampaigns; i++) {
    const accountIndex = i % accountCount;
    const pageIndex = Math.floor(i / accountCount) % pageCount;
    entries.push({
      campaignIndex: i,
      accountId: batch.accounts[accountIndex].accountId,
      pageId: batch.pages[pageIndex].pageId,
      adsetCount: batch.adsetsPerCampaign,
    });
  }
  return entries;
}
```
