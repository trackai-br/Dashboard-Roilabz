---
tipo: antipadroes
projeto: Roi-Labz
atualizado: 2026-03-23
---

# Antipadroes

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
