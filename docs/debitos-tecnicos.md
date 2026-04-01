---
tipo: debitos-tecnicos
projeto: Roi-Labz
atualizado: 2026-04-01
---

# Debitos Tecnicos

## [2026-04-01] BatchCard sem UI para campaignCount por conta
- **Contexto:** `BatchAccountEntry.campaignCount` foi adicionado ao store e ao schema Zod, mas o `BatchCard.tsx` ainda não expõe um input numérico por conta para o usuário definir quantas campanhas cada conta vai publicar.
- **Detalhes:** O campo existe no store mas sem UI, o default é `undefined` (tratado como `1` pelo algoritmo). Usuário não consegue configurar 4 campanhas para Conta A e 2 para Conta B pela interface — precisa editar o store diretamente.
- **Prioridade:** Alta (bloqueia o uso real do novo modelo de distribuição)
- **Fix:** Adicionar input numérico por conta na seção de contas do `BatchCard.tsx`. Derivar `totalCampaigns` como soma dos campaignCounts.
- **Tags:** [[BatchCard]] [[wizard]] [[campaignCount]] [[UI]]

## [2026-04-01] PreviewPublishStep não consulta pageCurrentAdsets antes de distribuir
- **Contexto:** `buildDistributionMap` suporta `pageCurrentAdsets` (BR-032 a BR-035) para evitar ultrapassar o limite de 250 adsets por página no Facebook. Mas o `PreviewPublishStep` não faz a chamada ao endpoint `/api/meta/pages/[pageId]/adset-count` antes de montar a distribuição.
- **Detalhes:** Sem esse dado, o algoritmo assume capacidade máxima (250) para todas as páginas, ignorando adsets já existentes. Pode causar falhas na Meta API se a página já estiver próxima do limite.
- **Prioridade:** Média (afeta quem tem páginas com muitos adsets ativos)
- **Fix:** Antes de chamar `buildDistributionMap`, fazer `Promise.all` com chamadas ao endpoint de contagem para cada página selecionada. Passar resultado como `pageCurrentAdsets`.
- **Tags:** [[PreviewPublishStep]] [[pageCurrentAdsets]] [[distribuição]] [[bulk-publish]]

## [2026-03-25] Tipos TypeScript do Database desatualizados
- **Contexto:** Tabelas meta_insights e meta_sync_status (migration 010) nao estao nos tipos do Supabase. Usando `as any` como workaround em queries dessas tabelas.
- **Detalhes:** Regenerar tipos com `supabase gen types typescript` apos aplicar migrations. Remover todos os `as any` das queries.
- **Prioridade:** Alta (apos aplicar migrations)
- **Tags:** [[Supabase]] [[TypeScript]] [[types]]

## [2026-03-25] Paginacao server-side nao implementada em /api/meta/campaigns
- **Contexto:** Endpoint refatorado retorna todas as campanhas de uma vez. Para 10k campanhas, a response pode ser grande.
- **Detalhes:** Implementar paginacao via `.range(offset, offset + limit)` no Supabase query. Frontend ja suporta via query params.
- **Prioridade:** Media
- **Tags:** [[Supabase]] [[paginacao]] [[campaigns]]

## [2026-03-23] Upload de video nao implementado
- **Contexto:** Criativos de video sao ignorados no bulk-publish (skip com warning)
- **Detalhes:** Precisaria do endpoint `/act_{id}/advideos` para upload, mas app nao tem capability. Alternativa: usar URL direta no campo `video_data.video_url` ou `source`.
- **Prioridade:** Media
- **Tags:** [[Meta-API]] [[video]] [[bulk-publish]]

## [2026-03-23] App Meta sem capability para /adimages
- **Contexto:** Erro 3 "Application does not have the capability" ao tentar upload
- **Detalhes:** O app precisa de "Ads Management Standard Access" ou revisao pela Meta. Workaround atual: usar campo `picture` com URL direta.
- **Prioridade:** Baixa (workaround funciona)
- **Tags:** [[Meta-API]] [[adimages]] [[app-review]]

## [2026-03-23] Logs de debug no bulk-publish
- **Contexto:** Logs extensos de payload e diagnostico adicionados durante debugging
- **Detalhes:** Remover apos estabilizacao do fluxo completo. Logs incluem payloads completos de campaign, adset e ad.
- **Prioridade:** Baixa
- **Tags:** [[bulk-publish]] [[logging]]

## [2026-03-23] Metodo uploadImage em meta-api.ts sem uso
- **Contexto:** Adicionado para upload via /adimages mas endpoint bloqueado
- **Detalhes:** Manter por enquanto caso capability seja liberada no futuro. Remover se nunca for usado.
- **Prioridade:** Baixa
- **Tags:** [[Meta-API]] [[dead-code]]
