---
tipo: progresso
projeto: Roi-Labz
atualizado: 2026-03-30
---

# Progresso

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
