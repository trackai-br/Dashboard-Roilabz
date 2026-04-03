---
tipo: decisoes
projeto: Roi-Labz
atualizado: 2026-04-02
---

## 2026-04-02 — Usar floor+remainder em vez de Math.ceil na distribuição de campanhas
- **Contexto:** Ao converter `batch.totalCampaigns` para `campaignCount` por conta, precisávamos de um método que garantisse exatamente N entradas totais.
- **Opções consideradas:**
  - Opção A — `Math.ceil(total / n)` → pode produzir mais entradas que o total quando não divisível
  - Opção B — `Math.floor(total / n) + (i < total % n ? 1 : 0)` → garante exatamente `total` entradas
- **Decisão:** Opção B (floor+remainder). `Math.ceil` produziria `accounts.length` campanhas quando 1 é configurada, reproduzindo o bug original de multiplicação.
- **Impacto no PRD:** Garante que `sum(campaignCount por conta) === batch.totalCampaigns` exatamente.
- **Tags:** [[distribuição]] [[buildDistributionMap]] [[bulk-publish]]

## 2026-04-02 — Cast `BatchAdsetType[] as unknown as AdsetTypeForDist[]` para compatibilidade de tipos
- **Contexto:** `BatchAdsetType` não possui o index signature `[key: string]: unknown` exigido por `AdsetTypeForDist`, mas ambos compartilham os campos `adsetCount` e `creativesInAdset`.
- **Opções consideradas:**
  - Opção A — Modificar interface `BatchAdsetType` para adicionar index signature
  - Opção B — Cast via `unknown` no ponto de uso
- **Decisão:** Opção B. Modificar `BatchAdsetType` afetaria todas as outras partes do wizard. O cast duplo via `unknown` é cirúrgico e não altera interfaces compartilhadas.
- **Impacto no PRD:** Zero impacto funcional — apenas satisfaz o compilador TypeScript.
- **Tags:** [[TypeScript]] [[BatchAdsetType]] [[AdsetTypeForDist]]

## 2026-04-02 — `continue` em handlePublish() e `return` em handleRetryBatch() para os guards
- **Contexto:** Os dois métodos têm contexto diferente: `handlePublish` itera sobre múltiplos batches (loop), `handleRetryBatch` processa um único batch (sem loop).
- **Opções consideradas:**
  - Opção A — Usar `throw` em ambos → interromperia toda a execução
  - Opção B — Usar `continue`/`return` conforme o contexto → pula apenas o batch afetado
- **Decisão:** Opção B. `throw` no guard principal cancelaria todos os outros batches que poderiam ser publicados com sucesso.
- **Tags:** [[guard]] [[bulk-publish]] [[handlePublish]] [[handleRetryBatch]]

## 2026-04-02 — createFullCampaign retorna `{ metaCampaignId, stats }` em vez de só string
- **Contexto:** Para saber se houve falhas parciais na criação, o caller precisa receber as stats junto com o ID.
- **Opções consideradas:**
  - Opção A — Retornar só `metaCampaignId` e expor stats via variável de escopo externo
  - Opção B — Retornar objeto `{ metaCampaignId, stats }` e destruturar no caller
- **Decisão:** Opção B. Mais explícito, sem efeitos colaterais de estado externo, e permite que o caller determine `'partial'` vs `'success'` de forma independente.
- **Tags:** [[bulk-publish]] [[createFullCampaign]] [[stats]] [[TypeScript]]

## 2026-04-02 — verifyCampaignStructure não recebe accountId (consulta só por campaignId)
- **Contexto:** O roadmap descrevia a assinatura como `(metaAccountId, metaCampaignId, userId)`, mas a Meta Graph API permite consultar adsets diretamente por `campaignId` sem precisar do `accountId`.
- **Opções consideradas:**
  - Opção A — Manter 3 parâmetros conforme roadmap para não desviar do plano
  - Opção B — Simplificar para `(metaCampaignId, userId)` — menos acoplamento
- **Decisão:** Opção B. O planner verificou que `getAdSets` e `getAds` em `meta-api.ts` já existiam com a assinatura necessária, sem precisar de `accountId`.
- **Tags:** [[bulk-publish]] [[verifyCampaignStructure]] [[Meta API]]

# Decisoes

## [2026-04-01] Distribuição em blocos proporcionais em vez de round-robin por campanha
- **Data:** 2026-04-01
- **Contexto:** Modelo de atribuição de tipos de adset para campanhas. Usuário tem N campanhas e M tipos de adset, quer dividir "metade pra cada em blocos".
- **Opções consideradas:**
  - A: Round-robin — cada campanha recebe o próximo tipo na fila (1→TypeA, 2→TypeB, 3→TypeA...). Mistura os tipos intercalados.
  - B: Aleatório — distribuição randômica. Imprevisível, não reproduzível.
  - C: Blocos proporcionais — N/M campanhas por bloco, sobra vai para o primeiro tipo. Ex: 7 camp + 2 tipos = [4, 3]. Previsível e agrupado.
- **Decisão:** Opção C (blocos proporcionais). Usuário confirmou explicitamente "metade pra cada em blocos". Vantagem: todas as campanhas de um tipo ficam agrupadas cronologicamente, facilitando análise de performance por tipo.
- **Implementação:** `calculateCampaignsPerType(N, M)` — base = floor(N/M), sobra (N mod M) distribuída nos primeiros tipos. `getAdsetTypeForCampaign(types, campaignIndex, total)` — acumula blocos para encontrar o tipo correto por índice.
- **Impacto:** `BatchAdsetType.campaignsCount` removido do store/schema — era o campo manual que tentava expressar essa lógica de forma imperativa. Agora calculado automaticamente.
- **Tags:** [[distribuição]] [[bulk-publish]] [[wizard]] [[blocos]]

## [2026-04-01] campaignCount por conta em vez de totalCampaigns global por batch
- **Data:** 2026-04-01
- **Contexto:** Antes, o batch tinha apenas `totalCampaigns: number` global. Para distribuir entre múltiplas contas, o algoritmo dividia ou iterava round-robin — causando bugs.
- **Opções consideradas:**
  - A: Manter totalCampaigns global e dividir uniformemente entre contas.
  - B: Manter totalCampaigns global com distribuição manual por conta (array de pesos).
  - C: `campaignCount` por conta em `BatchAccountEntry` — cada conta declara quantas campanhas quer.
- **Decisão:** Opção C. Usuário confirmou. Mais explícito: cada conta sabe quantas campanhas vai receber. Total é derivado (soma dos campaignCounts). Elimina ambiguidade de distribuição.
- **Implementação:** `BatchAccountEntry.campaignCount?: number` adicionado ao store. `batch-schemas.ts` valida `campaignCount >= 0`. UI (BatchCard) ainda precisa expor input por conta.
- **Tags:** [[wizard]] [[distribuição]] [[BatchAccountEntry]] [[campaignCount]]

## [2026-04-01] meta-ad-rules.ts como módulo centralizado de regras da Meta API
- **Data:** 2026-04-01
- **Contexto:** Lógica de optimization_goal, bid_strategy e budget estava duplicada em bulk-publish.ts e retry-publish.ts, com divergências (um tinha o bug de OUTCOME_SALES, o outro não).
- **Decisão:** Centralizar em `src/lib/meta-ad-rules.ts`. Funções puras, testáveis isoladamente, sem efeitos colaterais. APIs importam as funções em vez de reimplementar.
- **Benefício:** Um único lugar para corrigir/atualizar regras da Meta API. Testes TDD cobrem todas as combinações antes do deploy.
- **Tags:** [[meta-ad-rules]] [[bulk-publish]] [[retry-publish]] [[Meta-API]]

## [2026-03-29] Zustand para state management do novo wizard (batches/lotes)
- **Data:** 2026-03-29
- **Contexto:** Refactoring completo do wizard de 7 etapas lineares para 6 etapas com sistema de lotes (batches). Cada lote tem config independente (contas, paginas, adsets, criativos). O WizardContext atual (useReducer) re-renderiza todos os filhos a cada dispatch e nao suporta estado aninhado de batches eficientemente.
- **Opcoes consideradas:**
  - A: Estender WizardContext (useReducer) — sem nova dependencia, mas reducer gigante (~40+ actions), re-render global, sem middleware nativo (persist, devtools). Probabilidade: 65%.
  - B: Zustand (migracao completa) — selective re-renders via selectors, middleware persist resolve bug de auto-save, API simples, ~2KB gzipped. Probabilidade: 85%.
  - C: Zustand + WizardProvider facade — migracao gradual, mas wizard inteiro sera reescrito (facade desnecessaria). Probabilidade: 75%.
  - D: Jotai (atomico) — re-renders granulares, mas mental model diferente, boilerplate para estado aninhado complexo. Probabilidade: 60%.
- **Decisao:** Opcao B (Zustand migracao completa). O wizard inteiro esta sendo reescrito — nao ha custo de backward-compatibility. Selective re-renders essenciais para batch cards independentes. Middleware persist corrige bug de auto-save. DevTools facilitam debug de estado complexo.
- **Impacto no PRD:** Alinhado — wizard mais robusto, UX de lotes independentes, menor debito tecnico.
- **Tags:** [[Zustand]] [[state-management]] [[wizard]] [[refactoring]] [[batches]]

## [2026-03-25] Opcao C (Insights Pipeline) para corrigir bugs de metricas e drill-down
- **Contexto:** 2 bugs criticos: metricas vazias (N+1 calls) e drill-down quebrado (tabelas inexistentes). Necessario suportar ate 10.000 campanhas sem ban na Meta API.
- **Opcoes consideradas:**
  - A: Patch rapido — agrupar chamadas getInsights() com batch paralelo. Rapido mas nao escala para 10k campanhas.
  - B: Data layer unification — Supabase como cache, API fallback para Meta. Complexidade media.
  - C: Insights Pipeline — Supabase como source of truth, sync Inngest em background, frontend zero Meta API calls. Mais robusto, escala bem.
- **Decisao:** Opcao C. Maior investimento inicial mas resolve ambos os bugs estruturalmente, escala para 10k campanhas, e compliance com rate limits da Meta (adaptive delay, account-level batch).
- **Impacto no PRD:** Alinhado — dashboard de performance precisa de metricas confiaveis em escala.
- **Tags:** [[Supabase]] [[Inngest]] [[Meta-API]] [[insights-pipeline]]

## [2026-03-25] Account-level insights em vez de per-campaign calls
- **Contexto:** Meta Graph API permite GET /{account_id}/insights?level=campaign que retorna TODAS as metricas de campanha em uma unica chamada paginada.
- **Opcoes consideradas:**
  - A: Per-campaign calls (GET /{campaign_id}/insights) — 10.000 calls para 10k campanhas, rate limit garantido
  - B: Account-level batch (GET /{account_id}/insights?level=campaign&limit=500) — ~20 paginas para 10k campanhas
- **Decisao:** Opcao B. Reducao de 500x no numero de chamadas API. Paginacao de 500 registros por pagina com cursor.
- **Impacto no PRD:** Melhor performance + compliance com rate limits Meta.
- **Tags:** [[Meta-API]] [[rate-limit]] [[batch]]


## [2026-03-23] Usar campo `picture` em vez de `image_hash` para criativos
- **Contexto:** Meta API v23.0 rejeita `image_url` no `link_data`. Upload via `/adimages` falha com erro 3 (app sem capability).
- **Opcoes consideradas:**
  - A: Upload via `/adimages` + usar `image_hash` — bloqueado (app sem capability)
  - B: Criar `AdCreative` separado e referenciar por ID — mais complexo, mais chamadas API
  - C: Usar campo `picture` com URL direta — simples, funciona com URL publica
- **Decisao:** Opcao C. `picture` aceita URL publica e nao requer capability adicional do app.
- **Impacto:** Depende de URL publica acessivel sem redirect. URLs do Google Drive precisam ser convertidas.
- **Tags:** [[Meta-API]] [[creative]] [[object-story-spec]]

## [2026-03-23] Converter URLs do Drive para lh3.googleusercontent.com
- **Contexto:** `drive.google.com/uc?export=download` faz redirect que Meta nao segue
- **Opcoes consideradas:**
  - A: Proxy no servidor (download + re-upload para Supabase Storage) — confiavel mas lento e complexo
  - B: Converter para `lh3.googleusercontent.com/d/{id}=s0` — direto, sem redirect
- **Decisao:** Opcao B. Mais simples, sem storage adicional. Se falhar, implementar opcao A.
- **Impacto:** Funciona apenas para arquivos publicos do Drive.
- **Tags:** [[Google-Drive]] [[Meta-API]]

## [2026-03-23] Omitir bid_strategy quando default (LOWEST_COST_WITHOUT_CAP)
- **Contexto:** Meta API rejeita bid_strategy explicito sem bid_amount, mesmo quando e o valor default
- **Opcoes consideradas:**
  - A: Enviar bid_strategy + bid_amount obrigatorio — muda UX, usuario precisa sempre preencher
  - B: Omitir bid_strategy quando e default — Meta usa custo mais baixo automaticamente
- **Decisao:** Opcao B. Meta defaults para custo mais baixo quando campo esta ausente.
- **Impacto:** Menor controle explicito, mas comportamento identico ao Gerenciador de Anuncios.
- **Tags:** [[Meta-API]] [[bid-strategy]]

## [2026-03-23] Dropdown de criativos em vez de texto livre no Tab4
- **Contexto:** Usuarios digitavam nomes que nao batiam com arquivos do Drive
- **Decisao:** Trocar input de texto por `<select>` que lista arquivos do Tab5. Elimina erro de matching.
- **Impacto:** Tab4 depende do Tab5 ter sido preenchido primeiro (mensagem de aviso exibida).
- **Tags:** [[wizard]] [[UX]]
