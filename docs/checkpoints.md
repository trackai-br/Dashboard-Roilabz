---
tipo: checkpoints
projeto: Roi-Labz
atualizado: 2026-03-27
---

# Checkpoints

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
