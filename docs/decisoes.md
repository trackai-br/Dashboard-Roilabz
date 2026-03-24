---
tipo: decisoes
projeto: Roi-Labz
atualizado: 2026-03-23
---

# Decisoes

## [2026-03-23] Usar campo `picture` em vez de `image_hash` para criativos
- **Contexto:** Meta API v23.0 rejeita `image_url` no `link_data`. Upload via `/adimages` falha com erro 3 (app sem capability).
- **Opcoes consideradas:**
  - A: Upload via `/adimages` + usar `image_hash` — bloqueado (app sem capability)
  - B: Criar `AdCreative` separado e referenciar por ID — mais complexo, mais chamadas API
  - C: Usar campo `picture` com URL direta — simples, funciona com URL publica
- **Decisao:** Opcao C. `picture` aceita URL publica e nao requer capability adicional do app.
- **Impacto:** Depende de URL publica acessivel sem redirect. URLs do Google Drive precisam ser convertidas.
- **Tags:** [[Meta-API]] [[creative]] [[object-story-spec]]

## [2026-03-23] Converter URLs do Drive para lh3.googleusercontent.com
- **Contexto:** `drive.google.com/uc?export=download` faz redirect que Meta nao segue
- **Opcoes consideradas:**
  - A: Proxy no servidor (download + re-upload para Supabase Storage) — confiavel mas lento e complexo
  - B: Converter para `lh3.googleusercontent.com/d/{id}=s0` — direto, sem redirect
- **Decisao:** Opcao B. Mais simples, sem storage adicional. Se falhar, implementar opcao A.
- **Impacto:** Funciona apenas para arquivos publicos do Drive.
- **Tags:** [[Google-Drive]] [[Meta-API]]

## [2026-03-23] Omitir bid_strategy quando default (LOWEST_COST_WITHOUT_CAP)
- **Contexto:** Meta API rejeita bid_strategy explicito sem bid_amount, mesmo quando e o valor default
- **Opcoes consideradas:**
  - A: Enviar bid_strategy + bid_amount obrigatorio — muda UX, usuario precisa sempre preencher
  - B: Omitir bid_strategy quando e default — Meta usa custo mais baixo automaticamente
- **Decisao:** Opcao B. Meta defaults para custo mais baixo quando campo esta ausente.
- **Impacto:** Menor controle explicito, mas comportamento identico ao Gerenciador de Anuncios.
- **Tags:** [[Meta-API]] [[bid-strategy]]

## [2026-03-23] Dropdown de criativos em vez de texto livre no Tab4
- **Contexto:** Usuarios digitavam nomes que nao batiam com arquivos do Drive
- **Decisao:** Trocar input de texto por `<select>` que lista arquivos do Tab5. Elimina erro de matching.
- **Impacto:** Tab4 depende do Tab5 ter sido preenchido primeiro (mensagem de aviso exibida).
- **Tags:** [[wizard]] [[UX]]
