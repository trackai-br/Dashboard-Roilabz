---
tipo: debitos-tecnicos
projeto: Roi-Labz
atualizado: 2026-03-23
---

# Debitos Tecnicos

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
