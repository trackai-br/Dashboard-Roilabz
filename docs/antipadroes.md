---
tipo: antipadroes
projeto: Roi-Labz
atualizado: 2026-04-02
---

## NUNCA definir buildDistributionMap (ou qualquer função de distribuição) localmente em componentes
- **Data:** 2026-04-02
- **Contexto:** `PreviewPublishStep.tsx` tinha uma cópia local de `buildDistributionMap` que produzia produto Cartesiano (4x o esperado). A função correta já existia em `@/lib/distribution.ts`.
- **O que aconteceu:** 1 campanha configurada virava 4 campanhas na Meta (accounts × pages × campaigns).
- **Regra:** A função de distribuição é a fonte única da verdade. Sempre importar de `@/lib/distribution`. Qualquer nova lógica de distribuição vai nesse arquivo, não em componentes.
- **Tags:** [[buildDistributionMap]] [[distribuição]] [[PreviewPublishStep]]

## NUNCA usar Math.ceil para distribuição de inteiros entre buckets
- **Data:** 2026-04-02
- **Contexto:** `Math.ceil(total / n)` produz mais entradas que o total quando `total` não é divisível por `n`.
- **O que aconteceu:** Com 1 campanha e 2 contas, `Math.ceil(1/2) = 1` por conta = 2 entradas totais ao invés de 1.
- **Regra:** Sempre usar floor+remainder: `Math.floor(total/n) + (i < total%n ? 1 : 0)`.
- **Tags:** [[matemática]] [[distribuição]] [[Math.ceil]]

## NUNCA usar throw dentro de loops de múltiplos itens para validação de pré-condição
- **Data:** 2026-04-02
- **Contexto:** Um throw em guards ou validações dentro de um loop de batches cancela todos os batches restantes, mesmo os que seriam válidos.
- **O que aconteceu:** Potencial de um único batch inválido cancelar publicações válidas.
- **Regra:** Usar `continue` (em loops) ou `return` (sem loop). Marcar o item como `failed` com mensagem descritiva antes de pular.
- **Tags:** [[guard]] [[bulk-publish]] [[error-handling]] [[throw]]

## NUNCA usar bang operator (!) em resultados de chamadas à Meta API
- **Data:** 2026-04-02
- **Contexto:** `adsetResult!.id` e `adResult!.id` assumem que a API sempre retorna um objeto com `id`, o que não é verdade em casos de erro ou timeout.
- **O que aconteceu:** Crash em runtime quando a Meta retorna resposta inesperada.
- **Regra:** Sempre usar optional chaining + null guard: `adsetResult?.id || null` com verificação explícita antes de usar o valor.
- **Tags:** [[TypeScript]] [[Meta API]] [[bang-operator]] [[null-safety]]

# Antipadroes

## [2026-03-25] NUNCA fazer chamadas Meta API no request path para listar metricas
- **Contexto:** Endpoint /api/meta/campaigns fazia N+1 calls a Meta API (1 getInsights por campanha). Com 10k campanhas = timeout + rate limit + metricas vazias.
- **Detalhes:** Sempre usar Supabase como source of truth. Dados populados por sync Inngest em background. Frontend faz zero chamadas Meta API.
- **Tags:** [[Meta-API]] [[N+1]] [[performance]] [[Supabase]]

## [2026-03-25] NUNCA buscar insights per-campaign — usar account-level batch
- **Contexto:** GET /{campaign_id}/insights faz 1 call por campanha. Para 10k campanhas = 10k calls = ban garantido.
- **Detalhes:** Usar GET /{account_id}/insights?level=campaign&limit=500. Retorna tudo em ~20 paginas paginadas.
- **Tags:** [[Meta-API]] [[insights]] [[batch]]


## [2026-03-23] NUNCA fazer JSON.stringify em campos antes de passar para graphPost
- **Contexto:** `graphPost()` ja faz `JSON.stringify` no body inteiro. Pre-stringificar campos como `targeting`, `promoted_object`, `creative` causa double-encoding — a Meta recebe strings escapadas em vez de objetos.
- **Detalhes:** Resultava em erro 100/1815857 "Invalid parameter". Afetava `createAdSet` e `createAd`.
- **Tags:** [[Meta-API]] [[double-encoding]] [[graphPost]]

## [2026-03-23] NUNCA enviar bid_strategy LOWEST_COST_WITHOUT_CAP explicitamente
- **Contexto:** Meta API v23.0 rejeita o campo quando enviado sem bid_amount
- **Detalhes:** Omitir o campo inteiramente. Meta usa custo mais baixo como default.
- **Tags:** [[Meta-API]] [[bid-strategy]]

## [2026-03-23] NUNCA usar image_url em link_data do object_story_spec
- **Contexto:** Campo nao aceito na API v23.0. Usar `picture` (URL) ou `image_hash`.
- **Tags:** [[Meta-API]] [[creative]]

## [2026-03-23] NUNCA usar URLs de download do Google Drive diretamente na Meta API
- **Contexto:** URLs com redirect 302 sao bloqueadas pela Meta
- **Detalhes:** Converter para `lh3.googleusercontent.com/d/{id}=s0`
- **Tags:** [[Google-Drive]] [[Meta-API]]

## [2026-03-23] NUNCA usar campo de texto livre para selecao de criativos
- **Contexto:** Usuarios digitam nomes errados que nao batem com arquivos do Drive
- **Detalhes:** Usar dropdown com lista de arquivos carregados
- **Tags:** [[wizard]] [[UX]]

## [2026-03-23] NUNCA usar url_tags para ads inline com object_story_spec
- **Contexto:** Campo `url_tags` no POST /ads e aceito sem erro mas Meta IGNORA o valor para ads criados com `object_story_spec` inline
- **Detalhes:** Append UTM params diretamente na URL do campo `link` e `call_to_action.value.link` dentro do `link_data`
- **Tags:** [[Meta-API]] [[UTM]] [[object-story-spec]]
