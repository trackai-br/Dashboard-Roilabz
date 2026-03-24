---
tipo: ideias
projeto: Roi-Labz
atualizado: 2026-03-23
---

# Ideias

## [2026-03-23] Migrar para System User Token
- **Descricao:** Usar System User Token do Business Manager em vez de User Access Token. Nao expira, acessa todos os recursos da BM automaticamente.
- **Beneficio:** Elimina renovacao de token a cada 60 dias, acesso mais amplo
- **Complexidade:** Media — precisa de interface para colar o token manualmente
- **Tags:** [[Meta-API]] [[OAuth]] [[tokens]]

## [2026-03-23] Proxy de imagens via Supabase Storage
- **Descricao:** Download de criativos do Drive no servidor + upload para Supabase Storage. Usar URL do Supabase no campo `picture`.
- **Beneficio:** URLs confiaveis sem depender do Google Drive, funciona com qualquer fonte de midia
- **Complexidade:** Media — precisa de bucket publico no Supabase, logica de upload
- **Tags:** [[Google-Drive]] [[Supabase]] [[creative]]

## [2026-03-23] Upload de video via /advideos
- **Descricao:** Implementar upload de criativos de video via endpoint `/act_{id}/advideos`
- **Beneficio:** Suporte completo a video ads
- **Complexidade:** Alta — precisa de capability do app + possivelmente multipart upload
- **Tags:** [[Meta-API]] [[video]]
