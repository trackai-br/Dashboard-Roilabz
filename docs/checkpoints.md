---
tipo: checkpoints
projeto: Roi-Labz
atualizado: 2026-03-23
---

# Checkpoints

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
