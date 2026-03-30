---
tipo: performance
projeto: Roi-Labz
atualizado: 2026-03-25
---

# Performance

## [2026-03-25] Eliminacao do N+1 problem em /api/meta/campaigns
- **Contexto:** Endpoint fazia 1 chamada getInsights() por campanha a Meta API. Com 10k campanhas = 10k calls = timeout + rate limit.
- **Detalhes:** Refatorado para ler metricas do Supabase (populadas em background pelo Inngest). Request path agora faz 1-2 queries SQL vs 10.000+ HTTP calls.
- **Ganho:** Latencia de ~30s+ (timeout) para ~100ms. Zero risco de rate limit no request path.
- **Tags:** [[N+1]] [[Supabase]] [[Meta-API]]

## [2026-03-25] Account-level insights batch — reducao de 500x em chamadas API
- **Contexto:** Sync de insights usaria 10.000 calls individuais por conta.
- **Detalhes:** GET /{account_id}/insights?level=campaign&limit=500 retorna todas as metricas de campanha em ~20 paginas paginadas. Adaptive delay entre paginas (0-12s baseado no header x-business-use-case-usage).
- **Ganho:** 10.000 calls → ~20 calls por conta. Compliance com rate limits da Meta.
- **Tags:** [[Meta-API]] [[batch]] [[rate-limit]]
