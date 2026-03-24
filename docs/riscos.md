---
tipo: riscos
projeto: Roi-Labz
atualizado: 2026-03-23
---

# Riscos

## [2026-03-23] URL do Google Drive pode parar de funcionar
- **Contexto:** Usando `lh3.googleusercontent.com/d/{id}=s0` como URL direta para criativos
- **Risco:** Google pode mudar o formato da URL ou bloquear acesso externo
- **Mitigacao:** Se falhar, implementar proxy: download no servidor + upload para Supabase Storage
- **Tags:** [[Google-Drive]] [[creative]]

## [2026-03-23] Rate limit da Meta API em publicacoes em massa
- **Contexto:** Cada campanha faz 3+ chamadas API (campaign + adset + ad). 50 campanhas = 150+ chamadas.
- **Risco:** Rate limit (erros 17, 32, 4) pode bloquear apos ~50 chamadas
- **Mitigacao:** Jitter 800-2000ms entre chamadas, backoff exponencial, monitoramento de headers x-business-use-case-usage
- **Tags:** [[Meta-API]] [[rate-limit]]

## [2026-03-23] Timeout de 50s no Vercel limita campanhas por lote
- **Contexto:** Cada campanha leva ~5-10s (com delays). Maximo ~8-10 campanhas por request.
- **Risco:** Lotes grandes (20+) vao ter timeouts parciais
- **Mitigacao:** Guard de timeout marca campanhas restantes como "timeout". Futuro: migrar para Inngest (async).
- **Tags:** [[Vercel]] [[timeout]] [[bulk-publish]]
