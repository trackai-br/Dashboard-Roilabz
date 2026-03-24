---
tipo: progresso
projeto: Roi-Labz
atualizado: 2026-03-23
---

# Progresso

## [2026-03-23] Investigacao UTM params no ad (url_tags)
- **Plano:** Verificar se `url_tags` esta chegando ao payload do ad. Adicionar log de debug.
- **Hipoteses:** (A) Deploy nao estava live, (B) UTM vazio, (C) url_tags nao aceito inline
- **Resultado:** url_tags chega ao payload e ad e criado com sucesso, mas UTM nao aparece no Gerenciador. `url_tags` no POST /ads NAO funciona para ads inline com object_story_spec.
- **Nova abordagem:** Append UTM params diretamente na URL do campo `link` e no `call_to_action.value.link`
- **Implementacao:** Concluida. `urlTags` appendado na URL com separador `?` ou `&`. Removido `adBody.url_tags`. Aguardando teste em producao.

## [2026-03-23] Correcao completa do fluxo bulk-publish
- **Plano:** Corrigir erros na publicacao em massa (campanha + adset + ad)
- **Resultado:**
  - Campanha: OK (ja funcionava)
  - AdSet: OK (corrigido double-encoding, bid_strategy, campos faltantes)
  - Ad: Em progresso (corrigido creative, image URL, CTA, UTM)
- **O que falta:**
  - Testar ad creation com campo `picture` (URL direta do Drive convertida)
  - Testar ad creation com `call_to_action` e `url_tags`
  - Testar bid_strategy LOWEST_COST_WITHOUT_CAP (sem BIDCAP)
  - Testar publicacao em massa com multiplas campanhas
  - Remover logs de debug apos estabilizacao

## [2026-03-23] Setup documentacao e CLAUDE.md
- **Plano:** Preencher CLAUDE.md local com rotas, arquitetura, stack
- **Resultado:** CLAUDE.md atualizado com 12 paginas, 30 rotas API, arquitetura completa, limitacoes conhecidas
- **O que falta:** Nada

## [2026-03-23] Refatoracao drive-utils
- **Plano:** Extrair `extractFolderId` para modulo reutilizavel com sanitizacao
- **Resultado:** `src/lib/drive-utils.ts` criado, 30 testes passando
- **O que falta:** Nada

## [2026-03-23] Seguranca anti-bloqueio Meta API
- **Plano:** Implementar 5 medidas contra deteccao de bot pela Meta
- **Resultado:** Jitter 800-2000ms, User-Agent, rate limit headers, backoff exponencial, nomes unicos
- **O que falta:** Nada
