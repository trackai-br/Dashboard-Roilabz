---
tipo: aprendizados
projeto: Roi-Labz
atualizado: 2026-04-02
---

## Funções utilitárias duplicadas em componentes mascaram bugs silenciosamente
- **Data:** 2026-04-02
- **Contexto:** `buildDistributionMap` existia em `@/lib/distribution` e também localmente em `PreviewPublishStep.tsx` com lógica diferente e incorreta. O TypeScript não alertou porque a assinatura era similar.
- **Detalhes:** Quando uma função de lib já existe testada e correta, o componente que cria uma cópia local introduz divergência sem aviso. O bug só foi descoberto observando o comportamento em produção (4x campanhas). Aprendizado: sempre buscar se a função já existe em `src/lib/` antes de reimplementar.
- **Tags:** [[distribuição]] [[duplicação]] [[boas-práticas]]

## A Meta API não falha explicitamente quando recebe dados duplicados — cria duplicatas silenciosamente
- **Data:** 2026-04-02
- **Contexto:** Enviar 4 entradas de distribuição para uma campanha configurada como 1 não gerava erro 400 nem 422 — a Meta simplesmente criava 4 campanhas.
- **Detalhes:** APIs externas como a Meta não validam a intenção do cliente, apenas a estrutura do payload. A validação de lógica de negócio (quantas campanhas deveriam ser criadas) é responsabilidade do cliente. Guards e assertions antes das chamadas são essenciais, não opcionais.
- **Tags:** [[Meta API]] [[validação]] [[guard]] [[bulk-publish]]

## Erros silenciosos em loops de criação de recursos são o pior tipo de bug
- **Data:** 2026-04-02
- **Contexto:** Sem try-catch granular, um erro em um adset ou ad se propagava e cancelava toda a campanha. O resultado na Meta era uma campanha vazia (sem adsets/ads) marcada como "falha" no dashboard, sem nenhuma mensagem útil.
- **Detalhes:** Em sistemas que criam recursos em hierarquia (Campaign → AdSet → Ad), cada nível precisa de tratamento de erro independente. A falha de um filho não deve matar o pai nem os irmãos. Usar try-catch por iteração com `continue` é o padrão correto.
- **Tags:** [[error-handling]] [[try-catch]] [[bulk-publish]] [[hierarquia]]

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
