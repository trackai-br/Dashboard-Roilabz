---
tipo: bugs
projeto: Roi-Labz
atualizado: 2026-04-02
---

## [BUG-1a] buildDistributionMap local com lógica Cartesiana — campanhas multiplicadas por 4x
- **Data:** 2026-04-02
- **Contexto:** Ao publicar 1 campanha com 2 contas e 2 páginas, a Meta recebia 4 entradas ao invés de 1. O resultado era a criação de 4 campanhas duplicadas.
- **Causa raiz:** `PreviewPublishStep.tsx` possuía uma função `buildDistributionMap` local com triplo loop aninhado (accounts × pages × campaigns), produzindo produto Cartesiano em vez de distribuição proporcional. A função correta já existia em `@/lib/distribution.ts` mas estava sendo ignorada.
- **Fix:** Deletada a função local. Adicionado import de `buildDistributionMap` de `@/lib/distribution`. Aplicado adaptador floor+remainder para converter `batch.totalCampaigns` no argumento `campaignCount` por conta.
- **Status:** CORRIGIDO — commit ffdee6c (Fase 1)
- **Tags:** [[bulk-publish]] [[buildDistributionMap]] [[distribuição]] [[PreviewPublishStep]]

## [BUG-1b] Ausência de guard assertion — array de distribuição incorreto chegava à Meta API
- **Data:** 2026-04-02
- **Contexto:** Mesmo após corrigir o cálculo, não havia nenhuma verificação antes de enviar o array para a API. Uma regressão no cálculo passaria despercebida.
- **Causa raiz:** Nenhum assert comparando `distribution.length` com `batch.totalCampaigns` antes da chamada `authenticatedFetch`.
- **Fix:** Inserido bloco guard em `handlePublish()` (usa `continue`) e em `handleRetryBatch()` (usa `return`). Mensagem: `[bulk-publish] Guard failed: expected N campaigns, but distribution generated M entries`. Batch marcado como `failed` e chamada à Meta cancelada.
- **Status:** CORRIGIDO — commits 4f16bed, 788a60d (Fase 2)
- **Tags:** [[bulk-publish]] [[guard]] [[PreviewPublishStep]] [[BUG-1b]]

## [BUG-2a/2b] Falha em adset ou ad silenciava toda a campanha
- **Data:** 2026-04-02
- **Contexto:** Qualquer erro na criação de um adset ou ad (rate limit, payload inválido) subia pelo call stack e abortava a campanha inteira, deixando-a vazia na Meta.
- **Causa raiz:** Sem try-catch granular por adset nem por ad. Um único erro quebrava o loop todo.
- **Fix (Fase 4):** Cada iteração do loop de adsets envoluta em try-catch individual. Falha incrementa `statsPerCampaign.adsetsFailed`, loga com campaign ID + índice, e chama `continue`. DB insert de adset agora verifica erro. `createFullCampaign` retorna `{ metaCampaignId, stats }` e caller usa status `'partial'` quando há falhas.
- **Fix (Fase 5):** Cada criativo envoluto em try-catch individual dentro do loop de ads. Falha incrementa `statsPerCampaign.adsFailed`, loga com creative name + adset ID + campaign ID, e chama `continue`. DB insert de ad verifica erro. `humanDelay()` movido para dentro do try para não consumir delay em ads que falham.
- **Status:** CORRIGIDO — commits 87b47a3 (Fase 4), 297f7d8 (Fase 5)
- **Tags:** [[bulk-publish]] [[try-catch]] [[adset]] [[ad]] [[BUG-2a]] [[BUG-2b]]

## [BUG-2c] Sem verificação pós-publicação — campanhas vazias passavam sem aviso
- **Data:** 2026-04-02
- **Contexto:** Após criação, não havia nenhuma consulta à Meta para confirmar que a hierarquia Campanha → AdSet → Ad foi criada corretamente. Campanhas vazias podiam ser retornadas como sucesso.
- **Causa raiz:** Ausência de step de verificação pós-criação.
- **Fix:** Função `verifyCampaignStructure(metaCampaignId, userId)` adicionada em `bulk-publish.ts`. Consulta `metaAPI.getAdSets` e `metaAPI.getAds` com campos mínimos (`['id']`). Retorna `{ campaignId, adsetCount, adCount, status: 'complete' | 'partial' | 'empty' }`. Delay de 200ms entre chamadas. Erros nunca propagam (toda função em try-catch). Resultado anexado ao objeto de resultado da campanha.
- **Status:** CORRIGIDO — commits 2c4821a, 38a2009 (Fase 6)
- **Tags:** [[bulk-publish]] [[verificação]] [[Meta API]] [[BUG-2c]]

## [BUG-AD-NOT-CREATED] adConfig.creativeFiles undefined → ads nunca criados
- **Data:** 2026-04-01
- **Contexto:** Após correção do erro 2490487, campanhas e adsets eram criados com sucesso mas nenhum anúncio era criado.
- **Causa raiz:** `PreviewPublishStep.tsx` enviava `adConfig` sem incluir o `creativePool`. O servidor fazia `adConfig.creativeFiles.find(...)` → `undefined.find()` → todos os criativos eram pulados silenciosamente. Adicionalmente, `creativesInAdset` em cada `BatchAdsetType` sempre inicia como `[]` (sem UI de atribuição), então o loop de criativos nunca executava.
- **Fix em `PreviewPublishStep.tsx`:** Inclui `creativeFiles: creativePool` no adConfig enviado ao servidor (publish + retry).
- **Fix em `bulk-publish.ts`:** Se `creativesInAdset` estiver vazio, usa todos os criativos do pool como fallback. Referência ao `adConfig.creativeFiles` agora com fallback para `[]` evitando crash.
- **Status:** CORRIGIDO — commit 3de9af9
- **Tags:** [[bulk-publish]] [[creativeFiles]] [[creativePool]] [[ads]]

## [BUG-ADSET-NO-NAME] adsetType.name vazio → adset criado sem nome na Meta
- **Data:** 2026-04-01
- **Contexto:** Adset aparecia sem nome na Meta Ads Manager quando o campo de nome era apagado no wizard (estado antigo do localStorage ou edição acidental).
- **Causa raiz:** `bulk-publish.ts` usava `adsetType.name` diretamente sem fallback. Se vazio, a Meta criava o adset com nome "".
- **Fix:** Fallback `adsetType.name || \`Conjunto ${a + 1}\`` antes de usar o nome.
- **Status:** CORRIGIDO — commit 3de9af9
- **Tags:** [[bulk-publish]] [[adset]] [[nome]]

## [BUG-2490487-V3] OUTCOME_SALES + LOWEST_COST_WITHOUT_CAP: omitir bid_strategy → Meta assume ROAS → erro 2490487
- **Data:** 2026-04-01
- **Contexto:** Após BUG-2490487-V2 (que mudou OFFSITE_CONVERSIONS → LINK_CLICKS para LOWEST_COST_WITHOUT_CAP + pixel), o erro 2490487 PERSISTIU. Debug logs confirmaram: payload enviado tinha `optimization_goal: LINK_CLICKS` sem `bid_strategy` — e Meta rejeitava com o mesmo erro.
- **Causa raiz confirmada via debug logs:** Dois problemas simultâneos:
  1. `LINK_CLICKS` não é `optimization_goal` válido para `OUTCOME_SALES` na Meta API v23.0. Precisa ser `OFFSITE_CONVERSIONS` (com pixel) ou outro mapeamento sem pixel.
  2. Omitir `bid_strategy` completamente para `OUTCOME_SALES` faz a Meta assumir internamente uma estratégia com restrições de lance (ROAS ou BID_CAP) → rejeita com 2490487 mesmo sem `bid_amount` no payload.
- **Por que BID_CAP funcionava:** Enviava `bid_strategy: LOWEST_COST_WITH_BID_CAP` + `bid_amount` + `OFFSITE_CONVERSIONS` → constraints explícitas → Meta aceitava.
- **Fix correto em `src/lib/meta-ad-rules.ts` → `buildAdsetPayloadExtras`:**
  - Pixel presente → SEMPRE `OFFSITE_CONVERSIONS` + `promoted_object` (independente do bid strategy)
  - `LOWEST_COST_WITHOUT_CAP` → `bid_strategy: 'LOWEST_COST_WITHOUT_CAP'` EXPLÍCITO no payload (não omitido)
  - BID_CAP/COST_CAP com valor → `bid_strategy` + `bid_amount` (comportamento anterior mantido)
- **Status:** CORRIGIDO (V3) — 34 testes passando
- **Tags:** [[bulk-publish]] [[Meta-API]] [[optimization_goal]] [[OFFSITE_CONVERSIONS]] [[bid-strategy]] [[BR-020]] [[BR-022]]

## [BUG-2490487-V2] LOWEST_COST_WITHOUT_CAP + pixel → OFFSITE_CONVERSIONS sem bid constraints → HIPÓTESE INCORRETA
- **Data:** 2026-04-01
- **Contexto:** Hipótese de que Meta API v23.0 rejeita OFFSITE_CONVERSIONS sem bid_amount estava INCORRETA para LOWEST_COST_WITHOUT_CAP. O erro real era a combinação de LINK_CLICKS (inválido para OUTCOME_SALES) + ausência de bid_strategy.
- **Status:** SUPERSEDIDO por BUG-2490487-V3
- **Tags:** [[bulk-publish]] [[Meta-API]] [[optimization_goal]] [[bid-strategy]]

## [BUG-DIST] buildDistributionMap multiplicava campanhas por contas × páginas (resultado 24 em vez de 6)
- **Data:** 2026-04-01
- **Contexto:** Publicação em massa com 2 contas e 2 páginas criava 24 campanhas em vez de 6. O algoritmo legado (`calculateDistribution`) multiplicava todas as combinações possíveis de conta × página × totalCampaigns.
- **Causa raiz:** Algoritmo round-robin que iterava `totalCampaigns` vezes e para cada campanha atribuía uma página, mas o loop de contas era feito por `i % accounts.length` — com qualquer múltiplo de páginas, o produto explodia.
- **Detalhes:** Reescrito do zero em `src/lib/distribution.ts`. Novo modelo:
  - Cada conta tem `campaignCount` próprio (ex: Conta A: 4, Conta B: 2 → total 6)
  - Páginas preenchidas sequencialmente por capacidade (não round-robin)
  - Tipos de adset distribuídos em blocos proporcionais (BR-029)
  - `pageCurrentAdsets` suporta capacidade real da API (BR-032 a BR-035)
- **Status:** CORRIGIDO — commit 6c2c4c7
- **Regressão:** Teste `REGRESSÃO BUG-DIST: 2 contas + 2 páginas não devem multiplicar campanhas` adicionado
- **Tags:** [[bulk-publish]] [[distribuição]] [[algoritmo]] [[BR-001]]

## [BUG-2490487] OUTCOME_SALES sem pixel → OFFSITE_CONVERSIONS → erro Meta API 2490487
- **Data:** 2026-04-01
- **Contexto:** Publicação com objetivo OUTCOME_SALES sem pixel configurado falhava com erro Meta API error_subcode 2490487 ("Valor ou restrições de lance obrigatórios"). O frontend enviava `optimization_goal: OFFSITE_CONVERSIONS` que requer pixel obrigatório.
- **Causa raiz:** `getOptimizationGoalForObjective()` em bulk-publish.ts e retry-publish.ts mapeava `OUTCOME_SALES → OFFSITE_CONVERSIONS`. Esse valor só é válido quando há pixel configurado.
- **Detalhes:** Criado `src/lib/meta-ad-rules.ts` com mapeamento correto:
  - `OUTCOME_SALES` sem pixel → `LINK_CLICKS`
  - Com pixel → `OFFSITE_CONVERSIONS` (via `buildAdsetPayloadExtras`)
  - Lógica centralizada: bulk-publish.ts e retry-publish.ts agora importam de meta-ad-rules.ts
- **Status:** CORRIGIDO — commit 6c2c4c7
- **Regressão:** Teste `REGRESSÃO BUG-2490487: OUTCOME_SALES NÃO deve retornar OFFSITE_CONVERSIONS sem pixel` adicionado
- **Tags:** [[bulk-publish]] [[retry-publish]] [[Meta-API]] [[optimization_goal]] [[pixel]]

## [BUG-018] retry-publish.ts sem optimization_goal fallback quando sem pixel
- **Data:** 2026-04-01
- **Contexto:** bulk-publish.ts tinha `getOptimizationGoalForObjective()` que mapeia o objective da campanha para um optimization_goal válido quando não há pixel. retry-publish.ts NÃO tinha esse fallback — só enviava `optimization_goal` dentro do bloco `if (adsetType.pixelId)`.
- **Detalhes:** Sem optimization_goal, Meta API retorna erro 2490487 ("Valor ou restrições de lance obrigatórios"). Qualquer retry de campanha sem pixel falharia com esse erro, mesmo que o bulk original tivesse funcionado.
- **Status:** CORRIGIDO — `getOptimizationGoalForObjective()` adicionada ao retry-publish.ts com mesma lógica do bulk-publish.
- **Tags:** [[bulk-publish]] [[retry-publish]] [[Meta-API]] [[optimization_goal]]

## [BUG-017 v2] Pixels — reimplementação robusta com fallback Business Manager
- **Data:** 2026-03-31
- **Contexto:** Fix anterior (v1) foi revertido por bugs de implementação (crash em last_fired_time inválido, falta de deduplicação). Reimplementado com abordagem limpa.
- **Detalhes:** Nova implementação em 3 camadas:
  1. **`getPixels()` em meta-api.ts**: account-level primeiro (`{accountId}/adspixels`), fallback para `me/businesses` → `{bizId}/owned_pixels` se account retorna 0. Deduplicação por Map. `parseLastFiredTime()` trata unix, ISO string e valores inválidos sem crash.
  2. **Endpoint `/api/meta/accounts/pixels`**: DB primeiro, fallback para Meta API se DB vazio. Cache automático via upsert no `meta_pixels`.
  3. **Diferenças da v1**: deduplicação por ID, parse seguro de timestamps, try-catch por business (não bloqueia se um falhar), log por estratégia.
- **Status:** CORRIGIDO (v2)
- **Tags:** [[Meta-API]] [[pixels]] [[Business-Manager]] [[wizard]] [[owned_pixels]]

## [BUG-017] Pixels não aparecem no wizard — adspixels retorna vazio para pixels de Business Manager (REVERTIDO)
- **Data:** 2026-03-31
- **Contexto:** No wizard de criação de campanhas, o seletor de pixels mostrava lista vazia. Log de produção confirmava `[Meta API] Pixels fetched: 0` repetidamente.
- **Detalhes:** Causa raiz em 2 camadas:
  1. **Endpoint `/api/meta/accounts/pixels`** só consultava o DB (`meta_pixels`), que estava vazio porque `sync-all` nunca foi executado. Fix: fallback para Meta API quando DB vazio, com cache automático.
  2. **`getPixels()` em `meta-api.ts`** usava `{accountId}/adspixels` — endpoint de nível de ad account. A maioria dos pixels são criados no nível do **Business Manager** e não aparecem nesse endpoint. Fix: estratégia em 2 tentativas — account-level primeiro, depois `me/businesses` → `{bizId}/owned_pixels`.
  3. **Mesmo problema em pages:** endpoint `/api/meta/accounts/pages` também só consultava DB vazio. Fix: fallback para `me/accounts` via Meta API.
- **Status:** CORRIGIDO — 3 commits (2b92879, 9cd870a)
- **Tags:** [[Meta-API]] [[pixels]] [[Business-Manager]] [[wizard]] [[adspixels]] [[owned_pixels]]

# Bugs

## [BUG-015] React error #185 — Maximum update depth exceeded em producao
- **Data:** 2026-03-30
- **Contexto:** Erro em produção (minified) no browser. Stack trace aponta para `main-4b423ec82b590a3f.js` e `framework-64ad27b21261a9ce.js`. Pagina afetada: provavelmente `/campaigns/setup`.
- **Detalhes:** `setup.tsx` tinha `useEffect` com `showPopup` no dependency array. Cada vez que o popup fechava, o effect re-buscava drafts/templates, cujos `setState` podiam re-triggerar renders que afetavam `showPopup`. Fix: trocar deps para `[]` (mount-only) e mover re-fetch de draft para dentro de `handlePopupClose`.
- **Status:** RESOLVIDO — causa real era selectChecklistProgress + selectIsBatchValid (ver abaixo)
- **Root cause:** 2 selectors Zustand retornavam novas referencias a cada render:
  - `selectChecklistProgress` retornava `{ total, done, percent }` novo → Zustand comparava por `===` → sempre diferente → re-render infinito. Fix: `useShallow` no ChecklistSidebar.
  - `selectIsBatchValid(batchId)` é factory function que criava novo selector a cada render do BatchCard. Fix: `useMemo` no BatchCard.
  - O loop acontecia ao clicar qualquer modo porque `ChecklistSidebar` renderiza em `currentStep > 0`.
- **Commits:** b2a2455 (setup.tsx), 65af0dd (BatchCard), b026906 (ChecklistSidebar — fix definitivo)
- **Tags:** [[React]] [[useEffect]] [[error-185]] [[infinite-loop]] [[setup.tsx]]

## [BUG-016] bulk-publish — 8 problemas identificados no fluxo de publicacao
- **Data:** 2026-03-30
- **Contexto:** Auditoria proativa do fluxo de publicacao em massa (bulk-publish + retry-publish + PreviewPublishStep).
- **Detalhes:**
  1. **CRITICO — Race condition duplica results:** Rate limit retry empurra result de sucesso, MAS o codigo apos o try-catch TAMBEM empurra. Resultado: campanhas duplicadas no array de results.
  2. **CRITICO — Retry so recria campanha:** Rate limit retry chama `createCampaign` mas NAO cria adsets/ads. Campanha fica vazia mas marcada como sucesso.
  3. **ALTO — AdSet sem end_time:** `start_time` e enviado mas `end_time` nao. Meta API pode rejeitar ou criar duracao inesperada.
  4. **ALTO — optimization_goal so com pixel:** Sem pixelId, nenhum optimization_goal e enviado. Meta API exige este campo em TODOS os adsets.
  5. **ALTO — isPublishing trava no erro:** Se `handlePublish` joga excecao antes de `setIsPublishing(false)`, botao fica desabilitado permanentemente.
  6. **MEDIO — retry-publish inconsistente:** Logica duplicada com bulk-publish mas com campos diferentes. Retry pode falhar onde bulk funcionou.
  7. **MEDIO — Resultado duplicado em falha:** Retry failure empurra result na linha 351 E na linha 362 (guard com find nao previne sempre).
  8. **MEDIO — Retry sem budget CBO:** Retry de campanha nao inclui `daily_budget` para CBO. Meta rejeita adsets sem budget.
- **Status:** FIX APLICADO — createFullCampaign() encapsula fluxo completo, retry recria tudo, optimization_goal sempre enviado, isPublishing com try/finally
- **Tags:** [[bulk-publish]] [[retry-publish]] [[Meta-API]] [[race-condition]] [[optimization_goal]] [[PreviewPublishStep]]

## [BUG-014] ESLint rules-of-hooks e useCallback deps instavel no wizard refatorado
- **Data:** 2026-03-30
- **Contexto:** Deploy Vercel falhou apos commit a3378ec (wizard etapas 3-6). Build local com `next build` tambem falhava.
- **Detalhes:** 2 problemas: (1) CampaignConfigStep tinha `if (!batch) return null` ANTES de `useCallback`/`useMemo` — ESLint rules-of-hooks bloqueia hooks condicionais. Fix: mover early return para depois de todos os hooks, usar guards internos. (2) AdCopyStep criava `config` com `adConfig ?? {...}` — o operador `??` gera objeto novo a cada render, desestabilizando deps dos useCallback. Fix: envolver em `useMemo`.
- **Tags:** [[ESLint]] [[rules-of-hooks]] [[useCallback]] [[useMemo]] [[Vercel]] [[build]]

## [BUG-013] createAdSet nao enviava optimization_goal para Meta API (erro 2490487)
- **Data:** 2026-03-29
- **Contexto:** Publicacao em massa falhava na criacao do AdSet com erro 100/2490487: "Valor ou restricoes de lance obrigatorios". Job `bdefc05b` em producao confirmou o erro.
- **Detalhes:** Causa raiz: `bulk-publish.ts` setava `adsetBody.optimization_goal = 'OFFSITE_CONVERSIONS'` mas `createAdSet()` em `meta-api.ts` NAO incluia `optimization_goal` na interface nem no mapeamento de body. O campo era silenciosamente descartado. Meta exige optimization_goal junto com bid_strategy para campanhas de conversao. Fix: adicionado `optimization_goal` na interface e no body mapping de `createAdSet()`.
- **Tags:** [[Meta-API]] [[bulk-publish]] [[optimization_goal]] [[bid-strategy]] [[createAdSet]]

## [BUG-012] Supabase Nano sobrecarregado por Inngest retry death spiral
- **Data:** 2026-03-27
- **Contexto:** CPU 91%, Disk IO 100%, Memory 50% no Supabase Nano (Free). Todas as queries falhando com timeout, circuit breaker ativado ("Failed to retrieve database credentials").
- **Detalhes:** Causa raiz: 4 Inngest cron jobs rodando a cada 15-30min com 3 retries cada, processando 109 contas Meta com 63k+ ads. Cada falha gerava retry, que falhava de novo, criando cascata exponencial de requests ao DB. Fix: reduzir frequencia de todos os crons (15min→6-12h) e retries (3→1). syncMetaAdAccounts: `*/15 * * * *` → `0 */6 * * *`. syncMetaInsights: `*/30 * * * *` → `0 */6 * * *`. checkAlertRules: `*/15 * * * *` → `0 */6 * * *`. syncGoogleAdsAccounts: `*/15 * * * *` → `0 */12 * * *`.
- **Tags:** [[Supabase]] [[Inngest]] [[rate-limit]] [[infrastructure]] [[cron]]

## [BUG-011] landing_page_views campo invalido na Meta API (erro #100)
- **Data:** 2026-03-27
- **Contexto:** syncMetaInsights falhava com erro 100 da Meta API. Campo `landing_page_views` (e `landing_page_view` no singular) NAO existe como campo direto em insights.
- **Detalhes:** `landing_page_view` e um `action_type` dentro do array `actions`, nao um campo de nivel superior. Fix: removido de `MetaInsight` interface, removido dos arrays `fields` em `getInsights()` e `getAccountInsights()`, e extraido via `ins.actions?.find(a => a.action_type === 'landing_page_view')?.value` no syncMetaInsights.
- **Tags:** [[Meta-API]] [[insights]] [[landing-page-view]] [[Inngest]]

## [BUG-010] 401 Unauthorized em todos os endpoints API (auth.ts usava anon client)
- **Data:** 2026-03-27
- **Contexto:** Todos os endpoints protegidos retornavam 401. Conexao Meta OAuth falhava com "unauthorized".
- **Detalhes:** Causa raiz centralizada: `getUserFromRequest()` em `auth.ts` usava o client `supabase` (anon key) para `getUser(token)`. O client anon NAO tem permissao para validar tokens server-side — precisa do `supabaseAdmin` (service_role key). Fix: trocado para `supabaseAdmin!.auth.getUser(token)`. Tambem corrigido em `/api/auth/meta.ts` que tinha o mesmo problema isoladamente.
- **Tags:** [[auth]] [[Supabase]] [[supabaseAdmin]] [[401]] [[OAuth]]

## [BUG-009] GoogleAuthButton chamava onSuccess antes do redirect OAuth
- **Data:** 2026-03-27
- **Contexto:** Botao "Entrar com Google" nao abria popup/redirect do Google. Ia direto para /dashboard.
- **Detalhes:** `signInWithOAuth()` com `redirectTo` navega o browser para o Google. Mas o codigo chamava `onSuccess()` imediatamente apos o `await`, antes do redirect acontecer. O `onSuccess` fazia `router.push('/dashboard')`, competindo com o redirect. Fix: removido `onSuccess()` — o redirect do Google cuida da navegacao.
- **Tags:** [[auth]] [[OAuth]] [[Google]] [[redirect]]

## [BUG-008] Login nao autentica — vai direto para dashboard sem sessao
- **Data:** 2026-03-27
- **Contexto:** Ao clicar "Entrar com Google", o botao nao abria o fluxo OAuth do Google. Em vez disso, navegava direto para /dashboard sem autenticacao. Console mostrava `AuthRetryableFetchError` com 504.
- **Detalhes:** Duas causas: (1) `GoogleAuthButton` chamava `onSuccess()` logo apos `signInWithOAuth` retornar, sem esperar o redirect acontecer. Como o redirect e assincrono (browser navega para Google), o `onSuccess` disparava antes e fazia `router.push('/dashboard')`. (2) `DashboardLayout` nao tinha protecao de rota — qualquer pessoa podia acessar /dashboard sem sessao ativa.
- **Fix:** (1) Removido `onSuccess()` do fluxo OAuth — o redirect do Google cuida da navegacao. (2) Adicionado `useAuth()` no `DashboardLayout` com redirect para /login se nao autenticado + loading spinner durante verificacao.
- **Tags:** [[auth]] [[OAuth]] [[Google]] [[Supabase]] [[route-protection]]

## [BUG-005] Metricas nao exibidas na aba Campanhas (N+1 problem)
- **Data:** 2026-03-25
- **Contexto:** Endpoint /api/meta/campaigns fazia N+1 chamadas getInsights() a Meta API (1 por campanha). Com 10.000 campanhas, timeout/rate limit. O catch silencioso retornava metricas vazias.
- **Detalhes:** Frontend tentava Number(undefined) / 100, exibindo NaN/0. Fix: refatorado endpoint para ler metricas do Supabase (populadas por sync Inngest em background). Zero chamadas Meta API no request path.
- **Tags:** [[Meta-API]] [[N+1]] [[performance]] [[Supabase]]

## [BUG-006] Drill-down de campanha para ad sets quebrado (migration 004 nao aplicada)
- **Data:** 2026-03-25
- **Contexto:** Tabelas meta_ad_sets e meta_ads NAO EXISTIAM no Supabase. Migration 004 existia no repo mas nunca foi aplicada. API routes retornavam erro de fetch.
- **Detalhes:** Fix parcial: migration 004 precisa ser aplicada manualmente no Supabase SQL Editor. Alem disso, syncMetaAdAccounts agora popula essas tabelas via sync Inngest.
- **Tags:** [[Supabase]] [[migration]] [[drill-down]]

## [BUG-007] Inngest functions nao registradas no handler
- **Data:** 2026-03-25
- **Contexto:** bulkCreateCampaigns e checkAlertRules existiam como arquivos mas NAO estavam registradas em /api/inngest.ts. Nunca eram executadas.
- **Detalhes:** Fix: adicionadas ao array de functions no serve(). Tambem adicionada syncMetaInsights (nova).
- **Tags:** [[Inngest]] [[handler]] [[registration]]


## [BUG-001] createAdSet/createAd ignoravam campos criticos da Meta API
- **Data:** 2026-03-23
- **Contexto:** Publicacao em massa criava campanha mas adset e ad falhavam com erro 100/1815857
- **Detalhes:** `createAdSet` nao enviava `start_time`, `promoted_object`, `targeting` como objetos (eram stringificados duas vezes). `createAd` ignorava `creative` e `tracking_specs`. Corrigido removendo double-encoding e adicionando campos faltantes.
- **Tags:** [[Meta-API]] [[bulk-publish]] [[double-encoding]]

## [BUG-002] bid_strategy enviado como LOWEST_COST_WITHOUT_CAP causava erro
- **Data:** 2026-03-23
- **Contexto:** Meta API v23.0 rejeita `bid_strategy: LOWEST_COST_WITHOUT_CAP` explicito — exige `bid_amount` para qualquer bid_strategy
- **Detalhes:** Fix: omitir `bid_strategy` inteiramente quando e o default. Meta usa custo mais baixo automaticamente quando o campo esta ausente. Apenas enviar quando BIDCAP/COST_CAP com `bid_amount` presente.
- **Tags:** [[Meta-API]] [[bid-strategy]] [[bulk-publish]]

## [BUG-003] image_url nao permitido em link_data do object_story_spec
- **Data:** 2026-03-23
- **Contexto:** Meta API v23.0 nao aceita `image_url` dentro de `link_data` em `object_story_spec`
- **Detalhes:** Tentativa 1: upload via `/adimages` — falhou com erro 3 (app sem capability). Tentativa 2: usar campo `image_hash` — dependia de `/adimages`. Fix final: usar campo `picture` (URL direta) que e o campo correto para URLs de imagem.
- **Tags:** [[Meta-API]] [[creative]] [[object-story-spec]]

## [BUG-004] Meta nao consegue baixar imagem do Google Drive (redirect)
- **Data:** 2026-03-23
- **Contexto:** URL `drive.google.com/uc?export=download` faz redirect 302 que Meta nao segue
- **Detalhes:** Fix: converter URL para formato de serve direto `lh3.googleusercontent.com/d/{FILE_ID}=s0` que nao faz redirect. Regex extrai o ID do arquivo da URL do Drive.
- **Tags:** [[Google-Drive]] [[Meta-API]] [[creative]]

## [BUG-005] Criativos nao batiam com arquivos do Drive (nome manual)
- **Data:** 2026-03-23
- **Contexto:** Campo de criativo no Tab4 era texto livre. Usuario digitava nomes que nao batiam com `fileName` dos arquivos do Drive.
- **Detalhes:** Fix: trocar input de texto por dropdown `<select>` que lista arquivos carregados do Drive no Tab5. Nomes sempre batem exatamente.
- **Tags:** [[wizard]] [[Tab4]] [[UX]]

## [BUG-006] Falta call_to_action, url_tags e optimization_goal
- **Data:** 2026-03-23
- **Contexto:** Ads criados sem CTA (opcao "site" precisava ser habilitada manualmente), sem UTM params na URL, e adsets sem optimization_goal
- **Detalhes:** Fix: (1) Adicionar `call_to_action: { type: LEARN_MORE, value: { link } }` no link_data. (2) Adicionar `url_tags` com UTM params no ad. (3) Adicionar `optimization_goal: OFFSITE_CONVERSIONS` no adset quando tem pixel. (4) Trocar `caption` (depreciado) por `description`.
- **Tags:** [[Meta-API]] [[bulk-publish]] [[UTM]] [[CTA]]

## [BUG-007] url_tags NAO funciona para ads inline com object_story_spec
- **Data:** 2026-03-23
- **Contexto:** Campo `url_tags` no POST /ads e aceito sem erro, ad e criado, mas UTM params NAO aparecem no Gerenciador de Anuncios do Facebook
- **Detalhes:** Investigacao confirmou que `url_tags` chega ao payload corretamente mas Meta ignora o campo para ads inline com `object_story_spec`. Fix: append UTM params diretamente na URL dos campos `link` e `call_to_action.value.link` dentro do `link_data`. Removido `url_tags` do body do ad.
- **Tags:** [[Meta-API]] [[UTM]] [[object-story-spec]] [[bulk-publish]]
