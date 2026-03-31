---
tipo: testes
projeto: Roi-Labz
atualizado: 2026-03-31
---

# Testes

## [2026-03-31] Testes de componentes wizard — ModeSelector, ChecklistSidebar, ConfigPopupV2
- **Data:** 2026-03-31
- **Contexto:** Wizard refatorado tinha zero testes de componentes UI. Store Zustand ja tinha 45 testes.
- **Detalhes:**
  - `ModeSelector.test.tsx` (6 testes): renderiza 3 modos, badge "Recomendado", selecao atualiza store e avanca step
  - `ChecklistSidebar.test.tsx` (6 testes): renderiza items do store, progresso 0%, atualiza com items completos, "Pronto para publicar" em 100%
  - `ConfigPopupV2.test.tsx` (16 testes): header, 6 tabs, step counter, close dialog, draft/template loading, renderiza componente correto por step (mocks de child components)
  - Infraestrutura: testes usam Zustand store diretamente (reset no beforeEach), sem necessidade de providers. Child components mockados com jest.mock().
- **Resultado:** 28/28 passando. Total suite: 219/223 (4 falhas pre-existentes em KPICard e rls)
- **Tags:** [[testes]] [[wizard]] [[componentes]] [[Zustand]] [[jest]]

## [2026-03-30] Wizard Store (Zustand) — 45 testes unitarios (atualizado PROMPT 2/3)
- **O que foi testado:** Store Zustand completo: mode selection (5 testes), batch CRUD (8 testes), accounts/pages toggle (5 testes), campaign config (2 testes), adset types (3 testes), creative pool (5 testes), ad config (3 testes), navigation (3 testes), template (1 teste), draft (1 teste), checklist (3 testes), selectors (5 testes), reset (1 teste)
- **Resultado:** 45/45 passando (0.783s)
- **Arquivo:** `src/__tests__/wizard-store.test.ts`
- **Cobertura:** Actions, selectors derivados (selectIsBatchValid, selectChecklistProgress), auto-criacao de batch no setMode, independencia de estado entre batches
- **Alteracoes PROMPT 2/3:** mockAdConfig atualizado (removido creativeFormat/driveLink/creativeFiles), namingTags adicionado aos objetos BatchCampaignConfig, import NamingTag adicionado
- **Tags:** [[Zustand]] [[wizard]] [[testes-unitarios]]

## [2026-03-25] Build validation — Insights Pipeline
- **O que foi testado:** `npm run build` apos todas as mudancas do pipeline
- **Resultado:** Build OK — todas as rotas compilam sem erros TypeScript
- **Arquivos validados:** meta-api.ts, syncMetaAdAccounts.ts, syncMetaInsights.ts, campaigns.ts, insights.ts, inngest.ts, campaigns/index.tsx
- **Pendente:** Teste funcional em producao apos aplicar migrations 004 + 010


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
