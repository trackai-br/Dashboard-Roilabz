---
tipo: testes
projeto: Roi-Labz
atualizado: 2026-03-23
---

# Testes

## [2026-03-23] Testes automatizados — drive-utils
- **O que foi testado:** extractFolderId com 30 cenarios (URLs validas, invalidas, edge cases)
- **Resultado:** 30/30 passando
- **Arquivo:** `src/__tests__/drive-utils.test.ts`

## [2026-03-23] Teste manual — bulk-publish campanha
- **O que foi testado:** Criacao de campanha via Meta API
- **Resultado:** OK — campanhas criadas com nome padronizado
- **Ambiente:** Producao (Vercel)

## [2026-03-23] Teste manual — bulk-publish adset (BIDCAP)
- **O que foi testado:** Criacao de adset com bid_strategy LOWEST_COST_WITH_BID_CAP + bid_amount
- **Resultado:** OK — adsets criados com todos os campos
- **Ambiente:** Producao (Vercel)

## [2026-03-23] Teste manual — bulk-publish adset (LOWEST_COST)
- **O que foi testado:** Criacao de adset sem bid_strategy (default)
- **Resultado:** PENDENTE — nao testado com codigo novo (optimization_goal adicionado)
- **Ambiente:** Producao (Vercel)

## [2026-03-23] Teste manual — bulk-publish ad
- **O que foi testado:** Criacao de ad com picture + call_to_action + url_tags
- **Resultado:** PENDENTE — deploy em andamento
- **Ambiente:** Producao (Vercel)

## [2026-03-23] Debug — url_tags no ad
- **O que foi testado:** Log de utmParams e urlTags para verificar se chegam ao payload
- **Resultado:** CONFIRMADO — url_tags chega ao payload mas Meta IGNORA para ads inline com object_story_spec
- **Conclusao:** url_tags nao funciona para inline ads. Corrigido para append UTM direto na URL.
- **Ambiente:** Producao (Vercel)

## [2026-03-23] Teste manual — bulk-publish ad com UTM na URL
- **O que foi testado:** UTM params appendados diretamente no campo `link` e `call_to_action.value.link`
- **Resultado:** PENDENTE — aguardando deploy e teste do usuario
- **Linha de log esperada:** `[bulk-publish] finalLink (com UTM): https://...?utm_source=...`
- **Ambiente:** Producao (Vercel)
