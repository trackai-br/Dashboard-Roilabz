---
tipo: seguranca
projeto: Roi-Labz
atualizado: 2026-03-25
---

# Seguranca

## [2026-03-25] Rate limiting adaptativo no sync pipeline
- **Contexto:** Sync Inngest faz chamadas paginadas a Meta API em background. Sem controle, pode exceder rate limits e causar ban.
- **Detalhes:**
  - Adaptive delay baseado no header x-business-use-case-usage (0s a 12s + jitter)
  - Throw RateLimitError em >=95% de uso — Inngest faz retry automatico com backoff
  - Sync status marcado como "partial" quando rate limited (retoma no proximo ciclo)
  - Account-level batch (20 paginas vs 10k calls) reduz exposicao ao rate limit
- **Tags:** [[Meta-API]] [[rate-limit]] [[Inngest]] [[anti-ban]]


## [2026-03-23] Medidas anti-bloqueio Meta API implementadas
- **Contexto:** Meta pode bloquear apps que fazem chamadas com padrao de bot
- **Detalhes:**
  - Jitter aleatorio 800-2000ms entre chamadas (evita cadencia fixa)
  - User-Agent customizado `RoiLabz/1.0 (Meta Ads Dashboard)` (evita fingerprint vazio)
  - Monitoramento de headers de rate limit (x-business-use-case-usage, x-app-usage)
  - Backoff exponencial com jitter em rate limits (2s, 4s, 8s, max 3 retries)
  - Sufixo unico hex nos nomes de campanha (evita nomes duplicados)
- **Tags:** [[Meta-API]] [[anti-bloqueio]] [[rate-limit]]
