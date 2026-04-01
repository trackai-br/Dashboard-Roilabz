---
tipo: padroes-que-funcionam
projeto: Roi-Labz
atualizado: 2026-04-01
---

# Padroes Que Funcionam

## [2026-04-01] TDD antes de implementar: 35 regras de negócio → 50 testes → implementação
- **Contexto:** 2 bugs críticos em produção com causa raiz complexa (algoritmo de distribuição + mapeamento Meta API). Tentativas de fix sem TDD haviam introduzido regressões antes.
- **Detalhes:**
  - Passo 1: Definir regras de negócio (BRs) em linguagem clara antes de tocar no código
  - Passo 2: Escrever testes contra interfaces/módulos que ainda não existem (todos RED)
  - Passo 3: Implementar os módulos até tudo ficar GREEN
  - Resultado: zero regressões, 339/339 testes passando, TypeScript limpo
- **Por que funciona:** Os testes forçam pensar na API pública antes da implementação. Bugs de edge case (ex: mais tipos que campanhas, page capacity = 0) são capturados antes do deploy.
- **Tags:** [[TDD]] [[regras-de-negócio]] [[testes-unitários]] [[bulk-publish]]

## [2026-04-01] Centralizar regras de API externa em módulo de lib puro
- **Contexto:** Lógica de optimization_goal, bid_strategy e promoted_object estava duplicada em bulk-publish.ts e retry-publish.ts — com divergências que causaram bugs.
- **Detalhes:**
  - Criar `src/lib/meta-ad-rules.ts` com funções puras (sem efeitos colaterais, sem imports de Next.js/Supabase)
  - APIs importam as funções em vez de reimplementar
  - Regras testadas isoladamente em `meta-ad-rules.test.ts`
  - Se a Meta API mudar uma regra, só um arquivo precisa ser atualizado
- **Tags:** [[meta-ad-rules]] [[módulo]] [[separação-de-responsabilidades]]

## [2026-03-25] Inngest sync pipeline com Supabase como source of truth
- **Contexto:** Frontend precisava de metricas de 10k campanhas sem fazer chamadas Meta API no request path
- **Detalhes:**
  - Cron Inngest roda a cada 15-30min em background
  - Sync incremental: usa last_synced_at para buscar apenas dados novos
  - Upsert com onConflict na constraint UNIQUE evita duplicatas
  - Metricas denormalizadas na tabela de campanhas (evita JOIN pesado)
  - Frontend faz 1 query SQL vs 10k HTTP calls
  - Rate limiting adaptativo entre paginas (baseado no header x-business-use-case-usage)
  - Cada account processada como step.run() separado — retry automatico isolado por conta
- **Tags:** [[Inngest]] [[Supabase]] [[sync]] [[pipeline]]

## [2026-03-25] Adaptive delay com jitter para Meta API
- **Contexto:** Rate limit da Meta precisa ser respeitado em sync pesados
- **Detalhes:**
  - < 50% uso: sem delay
  - 50-75%: 1s + jitter random 0-1s
  - 75-85%: 3s + jitter
  - 85-95%: 10s + jitter 0-2s
  - >= 95%: throw RateLimitError (Inngest faz retry com backoff)
  - Jitter previne thundering herd entre contas paralelas
- **Tags:** [[Meta-API]] [[rate-limit]] [[adaptive-delay]]


## [2026-03-23] Payload de adset que funciona na Meta API v23.0
- **Contexto:** Apos multiplas tentativas, este e o payload minimo que cria adset com sucesso
- **Detalhes:**
  ```json
  {
    "name": "...",
    "campaign_id": "...",
    "status": "PAUSED",
    "targeting": { "geo_locations": { "countries": ["BR"] } },
    "billing_event": "IMPRESSIONS",
    "start_time": "2026-03-24",
    "bid_strategy": "LOWEST_COST_WITH_BID_CAP",
    "bid_amount": 15000,
    "promoted_object": { "pixel_id": "...", "custom_event_type": "PURCHASE" },
    "optimization_goal": "OFFSITE_CONVERSIONS"
  }
  ```
  - Campos como objetos nativos (sem stringify)
  - bid_strategy so quando BIDCAP/COST_CAP + bid_amount presente
  - Omitir bid_strategy para default (custo mais baixo)
- **Tags:** [[Meta-API]] [[adset]] [[payload]]

## [2026-03-23] graphPost com Content-Type application/json
- **Contexto:** Meta API aceita JSON no body do POST (nao precisa de form-data para campos simples)
- **Detalhes:** `Content-Type: application/json` + `JSON.stringify(body)`. Funciona para campaigns, adsets, ads. NAO funciona para `/adimages` (precisa de capability especial).
- **Tags:** [[Meta-API]] [[graphPost]]
