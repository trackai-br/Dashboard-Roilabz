---
tipo: progresso
projeto: Roi-Labz
atualizado: 2026-04-02
---

## [2026-04-02] Correção completa do bulk-publish — BUG-1 e BUG-2
- **Data:** 2026-04-02
- **Contexto:** Sessão de correção dos dois bugs críticos no sistema de publicação em massa: multiplicação de campanhas (BUG-1) e campanhas vazias por erro silencioso (BUG-2).
- **Detalhes:**
  - **Fase 1 (BUG-1a):** Deletada função `buildDistributionMap` local de `PreviewPublishStep.tsx`. Substituída pelo import correto de `@/lib/distribution` com adaptador floor+remainder.
  - **Fase 2 (BUG-1b):** Inseridos guard assertions em `handlePublish()` e `handleRetryBatch()` verificando `distribution.length === batch.totalCampaigns` antes de qualquer chamada à Meta API.
  - **Fase 3 (BUG-1c):** Adicionados logs estruturados `[bulk-publish] [component] [timestamp]` no frontend (PreviewPublishStep) e backend (bulk-publish.ts) para diagnóstico via DevTools e server logs.
  - **Fase 4 (BUG-2a/2b pt1):** Try-catch granular por adset em `createFullCampaign()`. Stats tracking com `adsetsFailed/adsetsCreated`. Status `'partial'` quando há falhas.
  - **Fase 5 (BUG-2a/2b pt2):** Try-catch granular por ad/criativo. `adsFailed/adsCreated` tracking. DB inserts de ads com verificação de erro.
  - **Fase 6 (BUG-2c):** Função `verifyCampaignStructure()` que consulta a Meta após criação e retorna `{ adsetCount, adCount, status }`. Resultado anexado ao retorno de cada campanha.
  - **Deploy:** Push para `origin/main` → Vercel auto-deploy ativo.
- **Estado:** BUG-1 e BUG-2 corrigidos e em produção. Fase 7 (testes manuais com conta real) pendente.
- **Próximo passo:** Testar os 3 modos de publicação em massa com conta Meta real e validar logs no DevTools.
- **Tags:** [[bulk-publish]] [[BUG-1]] [[BUG-2]] [[distribuição]] [[try-catch]] [[verificação]]

# Progresso

## [2026-04-01] Fix BUG-AD-NOT-CREATED + BUG-ADSET-NO-NAME: ads e nomes de adset
- **Plano:** Após BUG-2490487-V3 resolvido, publicação criava campanhas e adsets mas nenhum anúncio. Investigar fluxo de dados frontend → API para criativos.
- **Causa raiz:** `PreviewPublishStep` não enviava `creativePool` ao servidor; `adConfig.creativeFiles` era `undefined`; `creativesInAdset` sempre `[]` por falta de UI de atribuição.
- **Resultado:** COMPLETO — commit 3de9af9
  - `PreviewPublishStep.tsx`: inclui `creativeFiles: creativePool` no payload (publish + retry)
  - `bulk-publish.ts`: fallback usa todos os criativos do pool quando `creativesInAdset` está vazio; fallback de nome de adset quando `adsetType.name` está vazio
- **O que falta:** UI para atribuir criativos específicos por tipo de adset (atualmente todos os criativos vão para todos os adsets)

## [2026-04-01] Fix BUG-2490487-V3: LOWEST_COST_WITHOUT_CAP omitir bid_strategy → Meta assume ROAS
- **Plano:** Após deploy do V2, erro 2490487 persistia. Debug logs confirmaram: payload com `optimization_goal: LINK_CLICKS` (inválido para OUTCOME_SALES) e sem `bid_strategy`.
- **Causa raiz confirmada via debug logs:** Dois problemas: LINK_CLICKS inválido para OUTCOME_SALES, e omitir bid_strategy faz Meta assumir ROAS internamente.
- **Resultado:** COMPLETO — commit 735094c, 34 testes passando
  - `meta-ad-rules.ts`: pixel → sempre OFFSITE_CONVERSIONS + promoted_object; LOWEST_COST_WITHOUT_CAP → bid_strategy explícito no payload
  - `meta-ad-rules.test.ts`: 34 testes, BR-020 e BR-022 atualizados
  - `bulk-publish.ts`: debug logs removidos
- **O que falta:** — (resolvido)

## [2026-04-01] Fix BUG-2490487-V2: OFFSITE_CONVERSIONS sem bid constraints (TDD)
- **Plano:** Corrigir erro 2490487 que persistia após fix anterior: LOWEST_COST_WITHOUT_CAP + pixel → OFFSITE_CONVERSIONS sem bid_amount → Meta rejeita.
- **Abordagem:** Ajustar `buildAdsetPayloadExtras` em `meta-ad-rules.ts` para que `OFFSITE_CONVERSIONS` + `promoted_object` só sejam usados quando bidStrategy é BID_CAP ou COST_CAP (constraints explícitas fornecidas). Para LOWEST_COST_WITHOUT_CAP, sempre usar o objetivo mapeado (LINK_CLICKS para OUTCOME_SALES), independente de pixel.
- **Resultado:** COMPLETO — 4 testes RED → GREEN, 344/344 suite completa, TypeScript limpo.
  - `meta-ad-rules.ts`: `needsConversionOptimization = pixelId && (BID_CAP || COST_CAP)` controla OFFSITE_CONVERSIONS
  - `meta-ad-rules.test.ts`: 10 testes atualizados/adicionados para BR-020 com nova regra + regressão BUG-2490487-V2
- **O que falta:** Deploy + teste em produção com Volume Mais Alto + pixel

## [2026-04-01] Fix bugs críticos bulk-publish: distribuição + optimization_goal (TDD)
- **Plano:**
  1. Identificar causa raiz de 2 bugs produção: distribuição 24 campanhas (deveria ser 6) + erro 2490487 (OFFSITE_CONVERSIONS sem pixel)
  2. Gerar 35 regras de negócio (BR-001 a BR-035) antes de implementar
  3. Escrever testes TDD que quebrem todas as regras (tudo RED primeiro)
  4. Implementar `src/lib/distribution.ts` e `src/lib/meta-ad-rules.ts` para verde
  5. Atualizar wizard-store, batch-schemas, componentes e APIs
  6. Deploy e documentação
- **Abordagem escolhida:** TDD puro — 50+ testes antes de qualquer implementação. Dois módulos novos com responsabilidades isoladas. APIs refatoradas para usar os módulos.
- **Resultado:** COMPLETO — 339/339 testes, TypeScript limpo, build limpo, deployed a632340
  - `src/lib/distribution.ts`: reescrito. `calculateCampaignsPerType`, `getAdsetTypeForCampaign`, `calculateAdsForCampaign`, `buildDistributionMap` (com `pageCurrentAdsets`)
  - `src/lib/meta-ad-rules.ts`: criado. `getOptimizationGoalForObjective` (correto), `buildAdsetPayloadExtras`, `buildCampaignPayloadExtras`
  - `wizard-store.ts`: `BatchAccountEntry.campaignCount` adicionado; `BatchAdsetType.campaignsCount` removido
  - `batch-schemas.ts`: validação de `campaignCount` adicionada; `campaignsCount` removido
  - `bulk-publish.ts` e `retry-publish.ts`: importam funções dos módulos novos
  - `PreviewPublishStep.tsx` e `BatchCard.tsx`: removidas refs a `campaignsCount`
  - Código morto deletado: `distribution.test.ts` (V1), `Tab2PagesVolume.tsx` (V1)
- **O que falta:**
  - UI: input de `campaignCount` por conta no `BatchCard` (atualmente o campo existe no store mas não há UI para editá-lo)
  - API: chamar `/api/meta/pages/[pageId]/adset-count` antes de publicar para alimentar `pageCurrentAdsets`
  - Teste em produção: verificar contagem correta de campanhas e ausência de erro 2490487

## [2026-04-01] Débitos técnicos de publicação — retry-publish bug + limpeza de logs
- **Plano:**
  1. Fix BUG no retry-publish.ts: adicionar `getOptimizationGoalForObjective()` e fallback quando não há pixel (igual ao bulk-publish). Sem isso, retry falha com erro 2490487.
  2. Remover debug logs do bulk-publish.ts: 25+ console.log com payloads completos em produção. Manter apenas console.error para erros reais e console.warn para criativos pulados.
  3. TypeScript: adicionar interfaces para tabelas sem tipos (publish_jobs, meta_ads_campaigns) para eliminar `as any` nos inserts.
- **Abordagem escolhida:** Fix cirúrgico por arquivo — retry-publish primeiro (bug crítico), depois bulk-publish (limpeza), depois TypeScript (qualidade).
- **Probabilidade de sucesso:** Alta — mudanças isoladas, testes existentes cobrem o store/wizard, build local valida o TypeScript.
- **Resultado:** COMPLETO
  - retry-publish.ts: `getOptimizationGoalForObjective()` adicionado com fallback correto. Sem pixel → goal mapeado por objective (igual ao bulk-publish).
  - bulk-publish.ts: 20+ console.log removidos. Mantidos apenas console.error para erros reais e rate limit retries. Dados sensíveis não mais expostos nos logs do Vercel.
  - database.ts: tipos `publish_jobs`, `meta_insights`, `meta_sync_status` adicionados. Insert do publish_job sem `as any`.
  - 268/268 testes ✅ | build limpo ✅
- **O que falta:** Deploy em produção + testar publicação real

## [2026-03-31] Integração Zod no PreviewPublishStep
- **Plano:** Integrar validateAllBatches no PreviewPublishStep para bloquear publicação quando há erros de validação nos lotes.
- **Resultado:** COMPLETO
  - Seção vermelha "Erros de validação" aparece quando algum lote falha no schema Zod (lista por lote + campo)
  - Seção amarela "Avisos" para problemas não-bloqueantes (URL/texto/criativos ausentes, orçamento alto, ROAS)
  - Botão "Publicar" desabilitado quando `!batchValidation.isValid || warnings.length > 0`
  - Removidas checagens manuais redundantes (accounts/pages/adsets/budget já cobertas pelo Zod)
  - 268/268 testes passando.
- **O que falta:**
  - Deploy + testar em produção

## [2026-03-31] Validação Zod por batch — batch-schemas.ts
- **Plano:** Criar schemas Zod para BatchConfig e função validateBatch/validateAllBatches.
- **Abordagem:** Instalar Zod (v4), criar src/lib/batch-schemas.ts com schemas tipados e superRefine para regra de bid cap. Funções validateBatch (retorna errors/warnings) e validateAllBatches (valida array com índices).
- **Resultado:** COMPLETO — 21 testes, 268/268 passando. Zod v4.3.6 instalado.
- **O que falta:**
  - Integrar validateBatch no PreviewPublishStep (bloquear publicação se batch inválido)
  - Deploy + testar em produção

## [2026-03-31] Testes do BatchCard — 24 testes novos
- **Plano:** Escrever testes unitários para BatchCard (pendência identificada em sessão anterior como complexa por depender de mocks de useQuery e authenticatedFetch).
- **Abordagem:** Mock de useMetaAccounts, useMetaPages e authenticatedFetch. QueryClientProvider como wrapper. Helpers setupOneBatch/setupTwoBatches para isolar estado do store entre testes.
- **Resultado:** COMPLETO — 24 testes cobrindo renderização, expansão, contas, páginas, volume, ad sets, config de campanha e ações do card. Suite total: 247/247 passando.
- **O que falta:**
  - Validação Zod por batch
  - Deploy + testar pixels e draft/template em produção

## [2026-03-31] Execucao de pendencias — pixels v2, ConfigPopupV2, testes, SQL
- **Plano:** Resolver 4 pendencias acumuladas: (1) fix pixels Business Manager v2, (2) draft/template loading no ConfigPopupV2, (3) testes de componentes wizard, (4) SQL consolidado das migrations.
- **Abordagem:** Framework "Pensar Antes de Agir" — 4 agentes de pesquisa em paralelo para analise, seguido de execucao sequencial por prioridade.
- **Resultado:** COMPLETO
  - Fix pixels v2: getPixels() com fallback robusto (account → Business Manager), deduplicacao por Map, parseLastFiredTime() seguro. Endpoint /api/meta/accounts/pixels com fallback para API + cache automatico.
  - ConfigPopupV2: props draftState/draftId/templateState adicionados, useEffect no mount carrega no Zustand store. Codigo comentado do V1 removido de setup.tsx.
  - Testes: 28 novos testes (ModeSelector: 6, ChecklistSidebar: 6, ConfigPopupV2: 16). Total: 219 passando.
  - SQL: migrations/APPLY_PENDING.sql consolidado (004 + 010 + 15 ALTER FUNCTION search_path). Idempotente com IF NOT EXISTS.
- **Descoberta:** Migrations 004, 010 e search_path fix JA estavam aplicadas no banco (verificado via psql). DB tem 125 contas, 76.683 ad_sets, 86.120 ads, 253 pixels. Docs estavam desatualizados.
- **O que falta:**
  - Testar pixels em producao apos deploy
  - Testar draft/template loading apos deploy
  - Testes de BatchCard (depende de mocks mais complexos: useQuery, authenticatedFetch)

## [2026-03-30] Refactoring Wizard — PROMPT 2/3 + 3/3: Criativos, Campanha, Copy, Preview
- **Plano:** Implementar Etapas 3-6 do wizard refatorado: (3) Pool de criativos com Drive integration + 4 modos de distribuicao, (4) Campanha + nomenclatura com sistema de naming tags arrastavel, (5) Copy do anuncio simplificado (URL, texto, headline, descricao, UTMs), (6) Preview + publicacao por lote com KPI cards, retry por batch, e save template pos-publicacao.
- **Abordagem:** 6 fases incrementais (A-F), cada uma compilando sem erros.
- **Resultado:** COMPLETO
  - Phase A: Store atualizado — novos tipos (DistributionMode, NamingTag, PublishBatchResult), actions (distribution, naming tags, publishing), AdConfig simplificado (removido creativeFormat/driveLink/creativeFiles). 45 testes passando.
  - Phase B: CreativePoolStep criado — input Drive URL, thumbnail grid 4 colunas, selecao individual/importar todos, 4 modos de distribuicao (per_campaign/sequential/random/manual), preview de distribuicao.
  - Phase C: CampaignConfigStep criado — objective selector, naming tags arrastavel (drag-and-drop reorder), texto customizado, leva/creative label inputs, preview real-time do nome, budget CBO/ABO, bid strategy, status. Toggle "Personalizar por lote".
  - Phase D: AdCopyStep criado — URL destino, texto principal (125 char rec), headline (40 char rec), descricao, 5 UTM params, preview de URL final com UTMs. Toggle "Copy diferente por lote".
  - Phase E: PreviewPublishStep criado — KPI cards 2x3 (campanhas, adsets, criativos, contas, paginas, orcamento total), warnings bar, tabela de distribuicao agrupada por lote, publicacao sequencial por batch via bulk-publish, progress bar por batch, retry por batch falho, save template pos-publicacao.
  - Phase F: ConfigPopupV2 atualizado — placeholders substituidos pelos componentes reais, steps renomeados (Modo, Lotes, Criativos, Campanha, Copy, Publicar).
- **O que falta:**
  - Conectar ConfigPopupV2 na pagina campaigns/setup (trocar ConfigPopup → ConfigPopupV2)
  - Pages selector, campaign config e adset types dentro do BatchCard (Etapa 2)
  - Testes de componentes (unitarios + integracao)
  - Validacao Zod por batch
  - UI polish (animacoes, responsive)

## [2026-03-29] Refactoring Wizard — PROMPT 1/3: Modo + Lotes + Seletores
- **Plano:** Transformar wizard de 7 etapas lineares em 6 etapas com sistema de lotes (batches). Cada lote tem config independente. Nova Etapa 1 (selecao de modo: rapido/avancado/add_adsets), nova Etapa 2 (engenharia de lotes com cards, seletores com busca, calculo real-time, checklist sidebar).
- **Abordagem escolhida:** Zustand (migracao completa) — avaliadas 4 opcoes, Zustand ganhou com 85% de probabilidade (selective re-renders, middleware persist, API simples, ~2KB).
- **Plano de execucao (7 fases):**
  1. Instalar Zustand + criar store com slices (mode, batches, creativePool, ui)
  2. Criar tipos TypeScript (BatchConfig, WizardMode, BatchStore)
  3. Criar componentes base: ModeSelector, BatchCard, ChecklistSidebar
  4. Implementar Etapa 1 (modo) e Etapa 2 (lotes) com novos componentes
  5. Migrar Tab3-Tab7 para consumir do Zustand store
  6. Middleware persist (auto-save) + validacao Zod por batch
  7. Testes unitarios + integracao
- **Resultado:** Parcial — Store Zustand + componentes base concluidos
  - Fase 1 (Zustand): COMPLETA — store com 507 LOC, 45 testes passando
  - Fase 2 (Tipos): COMPLETA — BatchConfig, WizardMode, BatchStore, selectors
  - Fase 3 (Componentes base): COMPLETA — ModeSelector, BatchCard, ChecklistSidebar, ConfigPopupV2
  - Fase 4 (Etapas 0 e 1): PARCIAL — ModeSelector funcional, BatchCard com accounts/volume. Faltam: pages selector, campaign config, adset types dentro do card
  - Fase 5 (Migrar Tabs): PENDENTE
  - Fase 6 (Persist + Zod): PARCIAL — persist via middleware ja funciona, Zod pendente
  - Fase 7 (Testes): PARCIAL — store testado, componentes pendentes
- **O que falta:**
  - Conectar ConfigPopupV2 na pagina campaigns/setup
  - Pages selector, campaign config e adset types dentro do BatchCard
  - PROMPT 2/3: Pool de criativos + nomenclatura com tags
  - PROMPT 3/3: UI polish

## [2026-03-29] Fix BUG-013 createAdSet + retry-publish rewrite + fix testes
- **Plano:** Corrigir 3 problemas: (1) optimization_goal faltando em createAdSet, (2) retry-publish incompleto, (3) testes falhando.
- **Resultado:**
  - meta-api.ts: adicionado optimization_goal na interface e body mapping de createAdSet
  - retry-publish.ts: reescrito com fluxo completo (campanha + adsets + ads + DB + UTM + pixel)
  - DashboardLayout.test.tsx: adicionado mocks para useRouter, useAuth, QueryClientProvider
  - GoogleAuthButton.test.tsx: corrigido textos para portugues
  - Jobs fantasma: SQL para marcar running→failed jobs com results vazios
  - Push feito (commit com todos os fixes)
- **O que falta:** Nada — fix completo

## [2026-03-27] Estabilizacao critica — auth, insights, Supabase overload
- **Plano:** Corrigir 4 problemas criticos: (1) landing_page_views invalido na Meta API, (2) login bypassing OAuth, (3) 401 em todos endpoints (auth.ts com anon client), (4) Supabase Nano sobrecarregado por Inngest retries.
- **Resultado:**
  - meta-api.ts: removido `landing_page_views`/`landing_page_view` dos fields; extraido de actions array no sync
  - auth.ts: trocado `supabase` (anon) por `supabaseAdmin` (service_role) em getUserFromRequest
  - /api/auth/meta.ts: mesmo fix de anon→supabaseAdmin
  - GoogleAuthButton: removido onSuccess() que competia com redirect OAuth
  - DashboardLayout: adicionado useAuth() com redirect para /login se nao autenticado
  - Todos os crons Inngest reduzidos de 15-30min para 6-12h, retries de 3→1
  - 5 commits pushed (e71df96, 58fecc8, 1307bd2, a907156, 88c0987)
- **O que falta:**
  - Testar login Google OAuth apos Supabase recuperar do overload
  - Testar conexao Facebook OAuth
  - Rodar SQL de search_path fix (14 ALTER FUNCTION statements)
  - Considerar upgrade Supabase Free→Pro ($25/mo) dado volume (109 contas, 63k+ ads)
  - Apos estabilizar, ajustar crons para frequencia razoavel (1-2h em vez de 6h)

## [2026-03-25] Insights Pipeline (Opcao C) — Supabase como source of truth
- **Plano:** Corrigir 2 bugs criticos: (1) metricas nao exibidas na aba Campanhas (N+1 calls a Meta API), (2) drill-down quebrado (migrations 004 nao aplicada). Solucao: pipeline Inngest em background, frontend le apenas do Supabase.
- **Resultado:**
  - Migration 010 criada (meta_insights + meta_sync_status)
  - meta-api.ts expandido: rate limiting adaptativo, getAccountInsights(), getAllCampaigns/AdSets/Ads()
  - syncMetaAdAccounts expandido com sync de campaigns/adsets/ads
  - syncMetaInsights criado (cron */30, account-level batch fetch, incremental sync)
  - Inngest handler atualizado (3 funcoes faltantes registradas)
  - /api/meta/campaigns refatorado para ler do Supabase (zero Meta API calls)
  - /api/meta/insights criado para consultas historicas
  - Frontend campaigns/index.tsx atualizado com indicador de sync status
  - Build OK, push feito (commit f2ed75c)
- **O que falta:**
  - Aplicar migrations 004 + 010 no Supabase SQL Editor (manual)
  - Testar sync completo em producao apos migrations aplicadas
  - Atualizar tipos TypeScript do Database (meta_insights, meta_sync_status)
  - Verificar metricas exibidas corretamente apos primeiro sync


## [2026-03-23] Investigacao UTM params no ad (url_tags)
- **Plano:** Verificar se `url_tags` esta chegando ao payload do ad. Adicionar log de debug.
- **Hipoteses:** (A) Deploy nao estava live, (B) UTM vazio, (C) url_tags nao aceito inline
- **Resultado:** url_tags chega ao payload e ad e criado com sucesso, mas UTM nao aparece no Gerenciador. `url_tags` no POST /ads NAO funciona para ads inline com object_story_spec.
- **Nova abordagem:** Append UTM params diretamente na URL do campo `link` e no `call_to_action.value.link`
- **Implementacao:** Concluida. `urlTags` appendado na URL com separador `?` ou `&`. Removido `adBody.url_tags`. Aguardando teste em producao.

## [2026-03-23] Correcao completa do fluxo bulk-publish
- **Plano:** Corrigir erros na publicacao em massa (campanha + adset + ad)
- **Resultado:**
  - Campanha: OK (ja funcionava)
  - AdSet: OK (corrigido double-encoding, bid_strategy, campos faltantes)
  - Ad: Em progresso (corrigido creative, image URL, CTA, UTM)
- **O que falta:**
  - Testar ad creation com campo `picture` (URL direta do Drive convertida)
  - Testar ad creation com `call_to_action` e `url_tags`
  - Testar bid_strategy LOWEST_COST_WITHOUT_CAP (sem BIDCAP)
  - Testar publicacao em massa com multiplas campanhas
  - Remover logs de debug apos estabilizacao

## [2026-03-23] Setup documentacao e CLAUDE.md
- **Plano:** Preencher CLAUDE.md local com rotas, arquitetura, stack
- **Resultado:** CLAUDE.md atualizado com 12 paginas, 30 rotas API, arquitetura completa, limitacoes conhecidas
- **O que falta:** Nada

## [2026-03-23] Refatoracao drive-utils
- **Plano:** Extrair `extractFolderId` para modulo reutilizavel com sanitizacao
- **Resultado:** `src/lib/drive-utils.ts` criado, 30 testes passando
- **O que falta:** Nada

## [2026-03-23] Seguranca anti-bloqueio Meta API
- **Plano:** Implementar 5 medidas contra deteccao de bot pela Meta
- **Resultado:** Jitter 800-2000ms, User-Agent, rate limit headers, backoff exponencial, nomes unicos
- **O que falta:** Nada
