---
tipo: aprendizados
projeto: Roi-Labz
atualizado: 2026-03-25
---

# Aprendizados

## [2026-03-25] Meta API — account-level insights vs per-campaign
- **Contexto:** Buscar metricas de 10k campanhas individualmente e inviavel (rate limit + timeout)
- **Detalhes:**
  - `GET /{account_id}/insights?level=campaign&limit=500` retorna TODAS as metricas em uma chamada paginada
  - ~20 paginas para 10k campanhas vs 10.000 calls individuais (reducao de 500x)
  - Header `x-business-use-case-usage` informa % de uso em tempo real — usar para adaptive delay
  - Rate limit erros 17 (user), 32 (page), 4 (app) — tratar com exponential backoff + jitter
- **Tags:** [[Meta-API]] [[insights]] [[rate-limit]] [[batch]]

## [2026-03-25] Inngest — funcoes precisam ser registradas no handler
- **Contexto:** bulkCreateCampaigns e checkAlertRules existiam como arquivos mas nunca executavam
- **Detalhes:** O `serve()` do Inngest so executa funcoes explicitamente listadas no array `functions`. Criar o arquivo nao e suficiente — precisa importar e registrar em `/api/inngest.ts`.
- **Tags:** [[Inngest]] [[handler]] [[registration]]


## [2026-03-23] Meta API v23.0 — campos de link_data no object_story_spec
- **Contexto:** Tentativas de criar ads falhavam com erros variados
- **Detalhes:**
  - `image_url` NAO e aceito no `link_data` do `object_story_spec` — usar `picture` (URL direta) ou `image_hash`
  - `caption` esta DEPRECIADO — usar `description`
  - `call_to_action` e necessario para ativar a opcao "Website" automaticamente no Gerenciador
  - `url_tags` e o campo correto para parametros UTM (nao `tracking_specs`)
  - `tracking_specs` e para rastreamento de pixel (conversoes), nao para UTM
- **Tags:** [[Meta-API]] [[link-data]] [[object-story-spec]]

## [2026-03-23] Meta API — bid_strategy e o valor default
- **Contexto:** Erro persistente "bid_amount obrigatorio" mesmo com estrategia de custo mais baixo
- **Detalhes:** Meta v23.0 NAO aceita `LOWEST_COST_WITHOUT_CAP` como valor explicito do campo `bid_strategy`. O campo deve ser OMITIDO inteiramente — Meta aplica custo mais baixo como default automatico.
- **Tags:** [[Meta-API]] [[bid-strategy]]

## [2026-03-23] Google Drive — URLs de download vs serve direto
- **Contexto:** Meta nao conseguia baixar imagens do Drive
- **Detalhes:**
  - `drive.google.com/uc?export=download&id=X` — faz redirect 302, bloqueado pela Meta
  - `lh3.googleusercontent.com/d/X=s0` — serve direto, sem redirect, funciona para arquivos publicos
  - Regex para extrair ID: `/[?&]id=([a-zA-Z0-9_-]+)/`
- **Tags:** [[Google-Drive]] [[URLs]]

## [2026-03-23] Meta API — error codes enganosos
- **Contexto:** Erros da Meta frequentemente apontam para causa errada
- **Detalhes:**
  - Erro "permissions" (200/1815694) pode significar creative incompleto, nao necessariamente falta de permissao
  - Erro "invalid parameter" (100/1815857) pode ser bid_strategy, creative, ou campo depreciado
  - Sempre verificar `error_user_msg` que geralmente tem a causa real
- **Tags:** [[Meta-API]] [[debug]]
