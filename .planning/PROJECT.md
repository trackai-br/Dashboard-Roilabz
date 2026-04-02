# Roi Labz — Bulk Publish Fix

## What This Is

Dashboard de performance e produção em massa de campanhas Facebook Ads.
Este milestone foca na correção dos bugs críticos do sistema de bulk-publish.

**O problema central:** A publicação em massa está multiplicando campanhas por um fator de 4x e publicando campanhas sem adsets/ads, tornando o sistema inutilizável em produção.

## Core Value

**Publicar exatamente N campanhas completas (com adsets e ads) em uma única ação de bulk-publish.**

Sem isso, o sistema não serve ao propósito principal de produção em massa de campanhas.

## Context

**Stack:** Next.js 14.1 (Pages Router), TypeScript, Supabase, Inngest, Meta Graph API v23.0

**Fluxo atual de bulk-publish:**
- Frontend: `src/pages/campaigns/setup` → Wizard 7 steps → WizardContext → `handlePublish`
- API: `POST /api/meta/bulk-publish` → cria campanhas/adsets/ads sequencialmente
- Estrutura esperada: Campaign → AdSet → AdCreative → Ad (cada nível usa o ID do anterior)

**3 modos de operação:**
1. **Modo Rápido** — Todos os adsets com mesma config e criativo; só variam página e conta de anúncio
2. **Modo Avançado** — Estrutura heterogênea: múltiplas campanhas com criativos e budgets diferentes
3. **Adicionar Adsets** — Insere adsets numa campanha já existente no Facebook Ads Manager

## Requirements

### Validated (existente no codebase)

- ✓ Wizard 7-step para configuração de campanhas em massa — existing
- ✓ OAuth Meta com token de 60 dias — existing
- ✓ Sync de contas, páginas e pixels via Inngest — existing
- ✓ Dashboard de KPIs e listagem de campanhas — existing
- ✓ API route `/api/meta/bulk-publish` existe e faz chamadas à Meta API — existing
- ✓ WizardContext com estado de configuração — existing
- ✓ Distribuição de adsets por contas/páginas (algoritmo) — existing

### Active (este milestone)

- [ ] **BUG-1**: bulk-publish publica exatamente N campanhas (sem multiplicação)
- [ ] **BUG-1a**: identificar e corrigir causa raiz do fator 4x
- [ ] **BUG-1b**: adicionar guard/assertion antes do envio (`campaigns.length === expected`)
- [ ] **BUG-1c**: logs estruturados mostrando contagem exata antes do envio
- [ ] **BUG-2**: cada campanha publicada contém seus adsets e ads
- [ ] **BUG-2a**: garantir ordem sequencial Campaign → AdSet → Ad (cada nível usa ID do anterior)
- [ ] **BUG-2b**: tratamento de erro por nível (falha em adset não silencia)
- [ ] **BUG-2c**: verificação pós-publicação (query na API confirma estrutura)
- [ ] **VERIFY**: testar os 3 modos (rápido, avançado, adicionar adsets) com cenários reais

### Out of Scope

- Google Ads CRUD — não priorizado neste milestone
- Upload de vídeo nativo — workaround com `image_url` continua
- Refatoração de arquitetura Inngest — não é causa raiz dos bugs atuais
- Novas features do dashboard — foco exclusivo em estabilidade do bulk-publish

## Key Decisions

| Decisão | Racional | Status |
|---------|----------|--------|
| Corrigir BUG-1 antes do BUG-2 | BUG-1 pode mascarar BUG-2; limpar multiplicação primeiro isola o problema | — Pendente |
| Research de padrões Meta API batch | Aumenta assertividade da correção; evita reintroduzir bugs | — Pendente |
| Status PAUSED na criação | Evita gastos acidentais durante debug; ativar manualmente após verificar | — Pendente |

## Success Criteria

1. Publicar 1, 3 e 6 campanhas → Facebook Ads Manager mostra exatamente 1, 3 e 6 campanhas
2. Cada campanha no Facebook Ads Manager contém os adsets e ads configurados
3. Modo Avançado com configurações heterogêneas (vídeo/imagem/carrossel, budgets diferentes) funciona corretamente
4. Modo "Adicionar Adsets" insere em campanha existente sem criar nova campanha

## Evolution

Este documento evolui a cada transição de fase.

**Após cada fase:**
1. Requirements resolvidos → mover para Validated com referência da fase
2. Novos findings → adicionar em Active
3. Scope changes → documentar em Out of Scope com motivo

---
*Last updated: 2026-04-02 after initialization*
