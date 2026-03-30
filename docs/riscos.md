---
tipo: riscos
projeto: Roi-Labz
atualizado: 2026-03-25
---

# Riscos

## [2026-03-25] Migrations 004 + 010 precisam ser aplicadas manualmente
- **Contexto:** Codigo do pipeline ja esta deployed mas as tabelas (meta_ad_sets, meta_ads, meta_insights, meta_sync_status) ainda nao existem no Supabase.
- **Risco:** Se nao aplicar, sync vai falhar silenciosamente e frontend mostra dados vazios.
- **Mitigacao:** Aplicar migrations via Supabase SQL Editor o mais rapido possivel. Pipeline tem tratamento de erro que marca status como "failed" se tabela nao existir.
- **Tags:** [[Supabase]] [[migration]] [[pipeline]]

## [2026-03-25] Dados stale se sync Inngest parar
- **Contexto:** Frontend agora depende 100% do sync background. Se Inngest ficar down, metricas ficam desatualizadas.
- **Risco:** Usuario ve dados antigos sem saber. Sync status indica ultima atualizacao mas pode passar despercebido.
- **Mitigacao:** Indicador de sync no frontend mostra timestamp. Futuro: alerta se sync nao roda ha mais de 1h.
- **Tags:** [[Inngest]] [[sync]] [[stale-data]]


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
