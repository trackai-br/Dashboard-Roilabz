---
tipo: bugs
projeto: Roi-Labz
atualizado: 2026-03-30
---

# Bugs

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
