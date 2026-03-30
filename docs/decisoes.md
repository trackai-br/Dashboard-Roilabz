---
tipo: decisoes
projeto: Roi-Labz
atualizado: 2026-03-29
---

# Decisoes

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
