# Research: Campaign Hierarchy — Current Implementation

## Creation Order Analysis

**Finding: ORDEM CORRETA — Campaign → AdSet → Ad (sequential, com await)**

```
1. createCampaign() → get metaCampaignId
2. Store campaign no DB
3. createAdSet(metaCampaignId) → get metaAdsetId (por loop de adsetTypes)
4. Store adset no DB
5. createAd(metaAdsetId) → get metaAdId (por loop de criativos)
6. Store ad no DB
```

**Arquivo:** `apps/meta-ads-manager/src/pages/api/meta/bulk-publish.ts`, linhas 116-287 (`createFullCampaign`)

Não existe race condition. Os `await` garantem ordem estrita.

## ID Propagation

### Campaign → AdSet: CORRETO
```typescript
// linha 185 em bulk-publish.ts
const adsetResult = await metaAPI.createAdSet(
  metaAccountId,
  metaCampaignId,  // ← campaign_id passado corretamente
  adsetBody,
  user.id
);
```
Em `meta-api.ts` (linha 932): `campaign_id: campaignId` explícito no body.

### AdSet → Ad: CORRETO
```typescript
// linha 269 em bulk-publish.ts
const adResult = await metaAPI.createAd(
  metaAccountId,
  metaAdsetId,  // ← adset_id passado corretamente
  adBody,
  user.id
);
```
Em `meta-api.ts` (linha 999): `adset_id: adsetId` explícito no body.

## Required Fields Check

### Campaigns ✓ ADEQUADO
| Campo | Status |
|-------|--------|
| name | ✓ |
| objective | ✓ |
| status | ✓ |
| daily_budget | ✓ (apenas se CBO) |
| special_ad_categories | ✓ (array vazio) |

### AdSets ⚠ ADEQUADO com ressalva
| Campo | Status |
|-------|--------|
| campaign_id | ✓ |
| name | ✓ |
| status | ✓ |
| targeting | ✓ |
| billing_event | ⚠ Hardcoded `'IMPRESSIONS'` — pode conflitar em alguns objetivos |
| optimization_goal | ✓ (via buildAdsetPayloadExtras dinâmico) |
| daily_budget | ✓ (apenas se ABO) |
| bid_strategy | ✓ (explícito via BR-022) |
| promoted_object | ✓ (se pixel presente) |

### Ads ✓ ADEQUADO
| Campo | Status |
|-------|--------|
| adset_id | ✓ |
| name | ✓ |
| status | ✓ |
| creative (object_story_spec) | ✓ |
| page_id em creative | ✓ |
| picture (URL da imagem) | ✓ |
| link | ✓ |

## Error Handling Analysis — ROOT CAUSE DO BUG-2

### O Problema Central: Sem try-catch individual por adset/ad

Adset e ad creation **não têm try-catch próprio**. Se um adset falha:

1. Erro sobe para o catch externo (linha 298)
2. **Campanha inteira marcada como 'failed'**
3. **MAS a campanha já foi criada no Meta (vazia)**
4. Usuário vê falha e tenta novamente
5. **Nova campanha duplicada é criada** (a original continua vazia no Meta)

```
Cenário:
1. Campanha criada no Meta ✓
2. Criação de adset falha (ex: targeting, pixel, billing_event)
3. Erro capturado no catch externo
4. Dashboard: campaign = 'failed'
5. Meta: campanha existe mas sem adsets
6. Usuário: "Vou tentar de novo" → cria duplicata
```

### Problema Secundário: DB inserts sem error checking

```typescript
await supabase.from('meta_ads_campaigns').insert({...});
// SEM verificação de erro → falha silenciosa
await supabase.from('meta_ad_sets').insert({...});
// SEM verificação de erro → falha silenciosa
await supabase.from('meta_ads').insert({...});
// SEM verificação de erro → falha silenciosa
```

Se a inserção no Supabase falha:
- Meta tem os dados corretos
- Dashboard query DB, não encontra → exibe campanha "vazia"
- Usuário não percebe

### Problema Terciário: Timeout mid-creation

Se timeout (50s) ocorre **durante criação de adsets**:
- Campanha já criada no Meta
- Adsets parcialmente criados ou não criados
- Marcado como 'timeout' — sem retry automático para continuar onde parou

## Root Cause of Empty Campaigns

**Causa primária:** Erros de criação de adset/ad sobem para o catch da campanha inteira, deixando campanhas vazias no Meta sem que o retry corrija a situação (cria nova campanha em vez de completar a que existe).

**Causa secundária:** Falhas silenciosas no DB criam dessincronia entre Meta e Supabase.

## Recommended Fix

### 1. Try-catch granular por adset/ad

```typescript
// Em createFullCampaign, para cada adsetType:
for (const adsetType of adsetTypes) {
  for (let a = 0; a < adsetType.adsetCount; a++) {
    let metaAdsetId: string | null = null;
    
    try {
      const adsetResult = await metaAPI.createAdSet(metaAccountId, metaCampaignId, adsetBody, user.id);
      metaAdsetId = adsetResult!.id;
    } catch (adsetErr: any) {
      console.error(`[bulk-publish] Adset ${a} falhou na campanha ${i}:`, adsetErr.message);
      continue; // Não deixa 1 adset derrubar a campanha inteira
    }
    
    // Store adset (com error handling)
    const { error: dbErr } = await supabase.from('meta_ad_sets').insert({...});
    if (dbErr) console.error(`[bulk-publish] DB insert adset falhou:`, dbErr.message);
    
    // Ad creation com try-catch individual
    for (const creative of validCreatives) {
      try {
        const adResult = await metaAPI.createAd(metaAccountId, metaAdsetId, adBody, user.id);
        const { error: adDbErr } = await supabase.from('meta_ads').insert({...});
        if (adDbErr) console.error(`[bulk-publish] DB insert ad falhou:`, adDbErr.message);
      } catch (adErr: any) {
        console.error(`[bulk-publish] Ad falhou para criativo ${creative}:`, adErr.message);
        // Continue para próximo criativo
      }
    }
  }
}
```

### 2. Status parcial (partial) além de success/failed

```typescript
results.push({
  campaignIndex: entry.campaignIndex,
  status: adsetsCreated > 0 ? 'success' : 'failed',
  status_detail: adsetsFailed > 0 ? 'partial' : 'complete',
  meta_campaign_id: metaCampaignId,
  stats: { adsetsCreated, adsetsFailed, adsCreated, adsFailed }
});
```

### 3. Verificação billing_event vs optimization_goal

Adicionar função `validateAdsetPayload()` em `meta-ad-rules.ts` para alertar incompatibilidades antes de enviar para Meta.
