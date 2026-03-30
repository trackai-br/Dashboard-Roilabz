---
tipo: progresso
projeto: Roi-Labz
atualizado: 2026-03-27
---

# Progresso

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
