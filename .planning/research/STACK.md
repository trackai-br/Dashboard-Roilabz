# Research: Meta API Bulk Publish — Codebase Analysis

## Root Cause Found: BUG-1 (Multiplicação 4x)

**Arquivo:** `apps/meta-ads-manager/src/components/campaign-wizard/PreviewPublishStep.tsx`, linhas 482-500

## Current Implementation Flow

1. UI (`PreviewPublishStep.tsx`, linha 113): chama `buildDistributionMap(batch)` **local** (não a da lib)
2. Construção da distribuição (linhas 482-500): cria entradas com **3 loops aninhados**
3. API call (linha 115): envia distribuição malformada para `/api/meta/bulk-publish`
4. Backend (`bulk-publish.ts`, linha 92): itera sobre as entradas — 1 campanha completa por entrada

## Campaign Array Construction

A função `buildDistributionMap` local em `PreviewPublishStep.tsx` faz:

```typescript
function buildDistributionMap(batch: BatchConfig) {
  const entries: any[] = [];
  let campaignIndex = 0;
  for (const account of batch.accounts) {        // LOOP 1: Contas
    for (const page of batch.pages) {            // LOOP 2: Páginas (ANINHADO)
      for (let i = 0; i < batch.totalCampaigns; i++) { // LOOP 3: Campanhas (ANINHADO)
        entries.push({ campaignIndex: campaignIndex++, accountId: account.accountId, ... });
      }
    }
  }
  return entries;
}
```

**Isso cria um produto cartesiano: contas × páginas × campanhas**

## Iteration Points (fontes de multiplicação)

| Loop | Localização | Problema |
|------|------------|---------|
| `for account of batch.accounts` | PreviewPublishStep.tsx:483 | Correto |
| `for page of batch.pages` | PreviewPublishStep.tsx:484 | **CAUSA RAIZ** — aninhado em accounts |
| `for i < batch.totalCampaigns` | PreviewPublishStep.tsx:485 | **CAUSA RAIZ** — aninhado em ambos |

## Fator de Multiplicação

| Cenário | Contas | Páginas | Campanhas config. | Saída | Fator |
|---------|--------|---------|-------------------|-------|-------|
| Caso 1  | 2      | 2       | 1                 | 4     | **4x** |
| Caso 2  | 3      | 2       | 1                 | 6     | **6x** |
| Caso 3  | 2      | 3       | 2                 | 12    | **6x** |

O caso 4x é consistente quando 2 contas × 2 páginas = 4 entradas por campanha configurada.

## Solução Existente no Codebase (não utilizada!)

Existe uma função **correta** em:
`apps/meta-ads-manager/src/lib/distribution.ts` (linhas 117-206)

Esta função:
- Aceita `campaignCount` por conta (não `totalCampaigns` global)
- Respeita limites de capacidade de páginas
- Distribui campanhas sequencialmente
- **NÃO cria produto cartesiano**
- Retorna 1 entrada por campanha (não por conta×página×campanha)

## Identified Root Cause Hypothesis

A função `buildDistributionMap` foi reimplementada localmente em `PreviewPublishStep.tsx` com lógica incorreta (produto cartesiano), ignorando a implementação correta já existente em `src/lib/distribution.ts`.

## Recommended Fix

Substituir a função local em `PreviewPublishStep.tsx` pelo import correto:

```typescript
// Remover a função local buildDistributionMap em PreviewPublishStep.tsx
// Importar a correta:
import { buildDistributionMap } from '@/lib/distribution';

// Adaptar o batch config para o formato esperado:
const distribution = buildDistributionMap({
  accounts: batch.accounts.map(a => ({
    accountId: a.accountId,
    accountName: a.accountName,
    campaignCount: batch.totalCampaigns  // campanhas por conta, não total global
  })),
  pages: batch.pages,
  adsetTypes: batch.adsetTypes,
});
```

**Verificação:** Antes de enviar, adicionar assertion:
```typescript
if (distribution.length !== expectedCampaignCount) {
  throw new Error(`[bulk-publish] Guard: esperado ${expectedCampaignCount}, gerou ${distribution.length}`);
}
console.log(`[bulk-publish] Preparando ${distribution.length} campanhas para publicação`);
```
