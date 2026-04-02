# Research: Known Pitfalls & Bug History

## Bug History (de docs/bugs.md e git log)

### BUG-DIST — Multiplicação de Campanhas
- Múltiplas tentativas de corrigir algoritmo de distribuição (4x com 2 contas + 2 páginas)
- **Causa raiz**: `buildDistributionMap` local usava iteração round-robin multiplicando todas as combinações
- **Fix aplicado** (commit 6c2c4c7): reescrita completa de `src/lib/distribution.ts` com model block-based
- Novo modelo: cada conta tem próprio `campaignCount`, páginas preenchidas sequencialmente por capacidade
- Teste de regressão adicionado
- ⚠️ **Porém**: `PreviewPublishStep.tsx` ainda tem função local com bug — não usa a correta de distribution.ts

### BUG-2490487 (3 iterações) — Error de Meta API
- **V1**: OUTCOME_SALES sem pixel → Meta rejeitava
  - Fix: `getOptimizationGoalForObjective()` (OUTCOME_SALES → LINK_CLICKS sem pixel)
- **V2**: Hipótese incorreta que OFFSITE_CONVERSIONS precisa de `bid_amount`
- **V3** (fix correto, commit 735094c): OFFSITE_CONVERSIONS + `bid_strategy` EXPLÍCITO no payload
  - Pixel → sempre OFFSITE_CONVERSIONS + promoted_object
  - LOWEST_COST_WITHOUT_CAP → bid_strategy explícito obrigatório (Meta rejeita sem ele)
  - 34 testes validando BR-020 e BR-022

### BUG-AD-NOT-CREATED — Campanhas sem Adsets/Ads
- Campanhas criadas mas sem adsets/ads (resolvido 2026-04-01, commit 3de9af9)
  - **Causa**: `PreviewPublishStep` não enviava `creativePool` → `adConfig.creativeFiles` undefined
  - Fix: fallback para todos os criativos do pool quando `creativesInAdset` está vazio

### BUG-ADSET-NO-NAME — Adsets sem nome
- Adsets criados com nome vazio
- Fix: fallback `Conjunto ${index}` quando blank

## Existing Anti-Patterns (de docs/antipadroes.md)

| Anti-padrão | Problema | Como evitar |
|-------------|---------|------------|
| Meta API calls no request path | N+1 calls → rate limit | Usar batch account-level |
| Double JSON encoding | Meta recebe string escapada | `graphPost()` já stringifica |
| Enviar `bid_strategy` padrão sem `bid_amount` | Meta v23.0 rejeita | Omitir quando default |
| `image_url` em `link_data` | Campo errado | Usar `picture` (URL) ou `image_hash` |
| URLs Google Drive diretas | Redirect 302 bloqueia Meta | Converter para `lh3.googleusercontent.com/d/{id}=s0` |
| `url_tags` em inline ads | Ignorado pela Meta | Append UTM direto na URL |

## Technical Debt Context

**Prioridade ALTA:**
- BatchCard sem UI para `campaignCount` por conta (campo existe no store mas inacessível)
- PreviewPublishStep não consulta `pageCurrentAdsets` antes de distribuir → pode exceder limite 250 adsets/página

**Prioridade MÉDIA:**
- Tipos Supabase desatualizados (migrations 004 e 010)
- Paginação de campanhas não server-side

## Previous Fix Attempts (git log)

| Commit | Data | Foco | Status |
|--------|------|------|--------|
| 3de9af9 | 2026-04-01 | creativeFiles payload + fallback criativo | FIXED |
| 735094c | 2026-04-01 | BUG-2490487-V3: bid_strategy explícito | FIXED |
| b271b5d | 2026-04-01 | Debug logs 2490487 | DIAGNOSTIC |
| b4efdc7 | 2026-04-01 | V2 tentativa: bid constraints | SUPERSEDED |
| 6c2c4c7 | 2026-03-27 | Distribution rewrite + optimization_goal | FIXED |

**Padrão**: BUG-2490487 levou 3 iterações porque comportamento da Meta API v23.0 não era documentado.

## Risk Assessment

**RISCO ALTO:**
1. `isPublishing` state trap — se erro antes do `setIsPublishing(false)`, botão fica desabilitado permanentemente
2. Sem fetch de `pageCurrentAdsets` → pode ultrapassar limite 250 adsets/página
3. Retry não recria hierarquia completa — se rate limit durante adsets, retry só recria campanha

**RISCO MÉDIO:**
1. Meta API comportamento undocumented (bid_strategy + optimization_goal frágil)
2. Rate limit sem feedback visual para o usuário

## Recommended Approach

Para corrigir BUG-1 (multiplicação):
- Algoritmo block-based em `distribution.ts` está sólido
- Basta `PreviewPublishStep.tsx` importar a função correta e parar de usar a local errada
- Risco: BAIXO

Para corrigir BUG-2 (campanhas vazias):
- Fix de creativePool (commit 3de9af9) já aplicado
- Verificar se o bug persiste ou se é regressão por outro motivo
- Risco: BAIXO para fix atual, MÉDIO para produção (usuário não pode targetar criativos por adset)

Para prevenir regressões:
- `isPublishing` precisa de try/finally
- Adicionar fetch `pageCurrentAdsets` antes de distribuir
- Testes de integração para os 3 cenários conhecidos (2 contas × 2 páginas = exatamente N campanhas)
