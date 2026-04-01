---
tipo: checkpoints
projeto: Roi-Labz
atualizado: 2026-04-01
---

# Checkpoints

## [2026-04-01] — Débitos técnicos de publicação: bug retry + logs + tipos TS
- **O que mudou:**
  - retry-publish.ts: fix BUG-018 — `optimization_goal` agora sempre enviado, com fallback por objective quando sem pixel
  - bulk-publish.ts: remoção de 20+ console.log com payloads em produção. Mantidos apenas console.error
  - src/types/database.ts: adicionados tipos `publish_jobs`, `meta_insights`, `meta_sync_status`. Insert do publish_job sem `as any`
- **Arquivos alterados:**
  - `src/pages/api/meta/retry-publish.ts`
  - `src/pages/api/meta/bulk-publish.ts`
  - `src/types/database.ts`
  - `docs/bugs.md`, `docs/progresso.md`, `docs/checkpoints.md`
- **Testes passando:** 268/268 ✅
- **Estado do projeto:** Funcionando — pronto para deploy
- **Próximo passo se a sessão acabar aqui:**
  1. `git push origin main` para deploy Vercel
  2. Testar publicação real com e sem pixel em produção
  3. Verificar logs do Vercel: sem payloads verbose, apenas erros

## [2026-03-31 00:00] — Execucao de 4 pendencias: pixels v2, ConfigPopupV2, testes, SQL
- **O que mudou:**
  - getPixels() reimplementado com fallback Business Manager + deduplicacao + parseLastFiredTime seguro
  - Endpoint /api/meta/accounts/pixels com fallback API + cache automatico no DB
  - ConfigPopupV2 recebe draftState/draftId/templateState e carrega no Zustand store
  - Codigo comentado V1 removido de setup.tsx
  - 28 novos testes de componentes (ModeSelector, ChecklistSidebar, ConfigPopupV2)
  - migrations/APPLY_PENDING.sql consolidado (004 + 010 + search_path fix)
- **Arquivos criados:**
  - `src/__tests__/ModeSelector.test.tsx`
  - `src/__tests__/ChecklistSidebar.test.tsx`
  - `src/__tests__/ConfigPopupV2.test.tsx`
  - `migrations/APPLY_PENDING.sql`
- **Arquivos alterados:**
  - `src/lib/meta-api.ts` (getPixels + parseLastFiredTime)
  - `src/pages/api/meta/accounts/pixels.ts` (fallback API + cache)
  - `src/components/campaign-wizard/ConfigPopupV2.tsx` (draft/template props + loading)
  - `src/pages/campaigns/setup.tsx` (passa props, remove codigo V1 comentado)
  - `docs/bugs.md`, `docs/progresso.md`, `docs/checkpoints.md`
- **Testes passando:** 219/223 (4 falhas pre-existentes: KPICard + rls)
- **Estado do projeto:** Funcional — pendente deploy + aplicar SQL
- **Proximo passo se a sessao acabar aqui:**
  1. Aplicar `migrations/APPLY_PENDING.sql` no Supabase SQL Editor
  2. Deploy (git push) para testar em producao
  3. Testar pixels no wizard apos deploy
  4. Testar "Editar Rascunho" e "Usar Template" com ConfigPopupV2

# Checkpoints

## [2026-03-30 04:00] — Wizard Refactoring PROMPT 2/3 + 3/3: Etapas 3-6 completas
- **O que mudou:**
  - Store Zustand expandido: DistributionMode, NamingTag, PublishBatchResult/PublishCampaignResult, actions de naming tags e publishing
  - AdConfig simplificado (removido creativeFormat/driveLink/creativeFiles — movidos para creative pool)
  - BatchCampaignConfig ganhou campo namingTags para sistema de tags arrastavel
  - 4 novos componentes criados: CreativePoolStep, CampaignConfigStep, AdCopyStep, PreviewPublishStep
  - ConfigPopupV2 atualizado: placeholders substituidos, steps renomeados
  - 45 testes do store passando (corrigidos para novo AdConfig/BatchCampaignConfig)
  - TypeScript: zero erros (tsc --noEmit limpo)
- **Arquivos criados:**
  - `src/components/campaign-wizard/CreativePoolStep.tsx`
  - `src/components/campaign-wizard/CampaignConfigStep.tsx`
  - `src/components/campaign-wizard/AdCopyStep.tsx`
  - `src/components/campaign-wizard/PreviewPublishStep.tsx`
- **Arquivos alterados:**
  - `src/stores/wizard-store.ts` (novos tipos, actions, selectors)
  - `src/__tests__/wizard-store.test.ts` (corrigido mockAdConfig e namingTags)
  - `src/components/campaign-wizard/ConfigPopupV2.tsx` (imports + steps reais)
  - `docs/progresso.md` (entrada PROMPT 2/3 + 3/3)
- **Testes passando:** 45/45 (wizard-store)
- **Estado do projeto:** Parcial — etapas 0-6 implementadas, faltam integracao e polish
- **Proximo passo se a sessao acabar aqui:**
  1. Conectar ConfigPopupV2 na pagina campaigns/setup (trocar ConfigPopup → ConfigPopupV2)
  2. Implementar pages selector e adset types dentro do BatchCard (Etapa 2)
  3. Testes de componentes (unitarios + integracao)
  4. Validacao Zod por batch
  5. UI polish (animacoes, responsive, micro-interacoes)

## [2026-03-30 02:00] — Wizard Refactoring PROMPT 1/3: Store + Componentes base (Etapas 0 e 1)
- **O que mudou:**
  - Zustand v5 instalado e store criado com sistema de lotes (batches)
  - 45 testes unitarios para o store (todos passando)
  - 3 componentes base criados: ModeSelector, BatchCard, ChecklistSidebar
  - ConfigPopupV2 criado com 6 etapas (substitui ConfigPopup de 7 etapas)
  - Etapa 0 (ModeSelector): 3 modos (quick/advanced/add_adsets) implementados
  - Etapa 1 (Batch Engineering): BatchCards com accounts, volume, calculo real-time
  - ChecklistSidebar: 10 items com progress bar, visivel em todas as etapas apos modo
  - TypeScript: zero erros (tsc --noEmit limpo)
- **Arquivos criados:**
  - `src/stores/wizard-store.ts` (507 LOC — store Zustand completo)
  - `src/__tests__/wizard-store.test.ts` (45 testes)
  - `src/components/campaign-wizard/ModeSelector.tsx`
  - `src/components/campaign-wizard/BatchCard.tsx`
  - `src/components/campaign-wizard/ChecklistSidebar.tsx`
  - `src/components/campaign-wizard/ConfigPopupV2.tsx`
- **Arquivos alterados:**
  - `package.json` (adicionado zustand ^5.0.12)
  - `docs/decisoes.md` (decisao Zustand)
  - `docs/progresso.md` (plano de execucao)
  - `docs/testes.md` (registro de 45 testes)
- **Testes passando:** 191/195 (4 falhas pre-existentes em rls.test.js e KPICard)
- **Estado do projeto:** Parcial — store + componentes base prontos, faltam:
  - Conectar ConfigPopupV2 ao ponto de entrada (campaigns/setup)
  - Implementar secoes de campaign config e adset types dentro do BatchCard
  - PROMPT 2/3: Pool de criativos + nomenclatura com tags
  - PROMPT 3/3: UI polish
- **Proximo passo se a sessao acabar aqui:**
  1. Conectar ConfigPopupV2 na pagina campaigns/setup (trocar ConfigPopup → ConfigPopupV2)
  2. Implementar campaign config por batch (reutilizar logica do Tab3Campaign)
  3. Implementar adset types por batch (reutilizar logica do Tab4Adsets)
  4. Implementar pages selector dentro do BatchCard
  5. Conectar bulk-publish com formato batch → distribution

## [2026-03-27 23:00] — Estabilizacao critica: auth + insights + Supabase overload (5 commits pushed)
- **O que mudou:**
  - Fix centralizado de auth (anon→supabaseAdmin) que causava 401 em todos os endpoints
  - Fix de landing_page_views (campo invalido Meta API → extraido de actions array)
  - Fix de login bypass (GoogleAuthButton + DashboardLayout route protection)
  - Reducao de cron frequencies Inngest (15-30min → 6-12h) para parar death spiral
  - Retries reduzidos de 3 para 1 em todas as funcoes Inngest
- **Arquivos alterados:**
  - `src/lib/auth.ts` (supabase → supabaseAdmin)
  - `src/lib/meta-api.ts` (removido landing_page_view dos fields)
  - `src/pages/api/auth/meta.ts` (supabase → supabaseAdmin)
  - `src/components/GoogleAuthButton.tsx` (removido onSuccess)
  - `src/components/DashboardLayout.tsx` (adicionado useAuth + redirect)
  - `src/inngest/functions/syncMetaInsights.ts` (cron 6h, retries 1, landing_page_view via actions)
  - `src/inngest/functions/syncMetaAdAccounts.ts` (cron 6h, retries 1)
  - `src/inngest/functions/checkAlertRules.ts` (cron 6h, retries 1)
  - `src/inngest/functions/syncGoogleAdsAccounts.ts` (cron 12h, retries 1)
- **Testes passando:** Build OK (Vercel deploy qwrziv1oj)
- **Estado do projeto:** Parcial — codigo deployed, aguardando Supabase recuperar do overload
- **Proximo passo se a sessao acabar aqui:**
  1. Verificar se Supabase ja recuperou (CPU/Disk IO normalizaram)
  2. Testar login Google OAuth
  3. Testar conexao Facebook OAuth
  4. Rodar search_path fix SQL (14 ALTER FUNCTION)
  5. Considerar upgrade Supabase Free→Pro

## [2026-03-25 00:00] — Insights Pipeline completa (commit f2ed75c, pushed)
- **O que mudou:**
  - Pipeline Inngest para sync de metricas em background (Supabase como source of truth)
  - Rate limiting adaptativo na Meta API (0-12s delay baseado em % de uso)
  - Account-level batch fetch (10k campanhas em ~20 paginas vs 10k calls)
  - Frontend refatorado para zero Meta API calls
  - 3 funcoes Inngest faltantes registradas no handler
  - Nova rota /api/meta/insights para consultas historicas
- **Arquivos criados:**
  - `migrations/010_create_insights_pipeline.sql`
  - `src/inngest/functions/syncMetaInsights.ts`
  - `src/pages/api/meta/insights.ts`
- **Arquivos alterados:**
  - `src/lib/meta-api.ts` (rate limiting + 4 novos metodos)
  - `src/inngest/functions/syncMetaAdAccounts.ts` (expandido com campaigns/adsets/ads)
  - `src/pages/api/inngest.ts` (3 funcoes registradas)
  - `src/pages/api/meta/campaigns.ts` (refatorado para Supabase)
  - `src/pages/campaigns/index.tsx` (sync status + metricas do DB)
- **Testes passando:** Build OK (next build)
- **Estado do projeto:** Parcial — codigo pronto, migrations precisam ser aplicadas no Supabase
- **Proximo passo se a sessao acabar aqui:**
  1. Aplicar migration 004 no Supabase SQL Editor (cria meta_ad_sets e meta_ads)
  2. Aplicar migration 010 no Supabase SQL Editor (cria meta_insights e meta_sync_status)
  3. Trigger manual do sync no Inngest para popular dados
  4. Verificar metricas exibidas corretamente no frontend
  5. Atualizar tipos TypeScript do Database (adicionar meta_insights, meta_sync_status)


## [2026-03-23 23:30] — Fix completo do fluxo bulk-publish (campanha + adset + ad)
- **O que mudou:**
  - Corrigido double-encoding JSON no createAdSet/createAd
  - Corrigido bid_strategy (omitir quando default, enviar com bid_amount quando BIDCAP)
  - Corrigido creative (picture em vez de image_url, URL do Drive convertida)
  - Adicionado call_to_action, url_tags, optimization_goal
  - Dropdown de criativos no Tab4 (substitui texto livre)
  - Medidas anti-bloqueio (jitter, User-Agent, backoff)
- **Arquivos alterados:**
  - `src/lib/meta-api.ts` (uploadImage, url_tags, campos adset/ad)
  - `src/pages/api/meta/bulk-publish.ts` (fluxo completo reescrito)
  - `src/components/campaign-wizard/tabs/Tab4Adsets.tsx` (dropdown criativos)
  - `src/pages/api/meta/retry-publish.ts` (unique suffix)
- **Testes passando:** Build OK (next build)
- **Estado do projeto:** Parcial — campanha e adset funcionam, ad em teste
- **Proximo passo se a sessao acabar aqui:**
  1. Testar publicacao com campo `picture` + `call_to_action` + `url_tags`
  2. Testar bid_strategy LOWEST_COST_WITHOUT_CAP (sem BIDCAP)
  3. Se `picture` com URL do Drive nao funcionar, implementar proxy via Supabase Storage
  4. Remover logs de debug apos estabilizacao
