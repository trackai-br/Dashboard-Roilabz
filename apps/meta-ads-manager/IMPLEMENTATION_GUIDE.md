# 🎉 Meta Ads Manager - Guia de Implementação Completo

## Status: 100% Implementado ✅

Todas as 5 fases do Meta Ads Manager foram implementadas com sucesso!

---

## 📋 O Que Foi Construído

### **Fase 1: Fundação** ✅
- ✅ Camada de integração com Meta API (`src/lib/meta-api.ts`)
- ✅ Migrações de banco de dados (ad sets e ads)
- ✅ Função de sincronização Inngest aprimorada
- ✅ 5 rotas de API para campanhas, ad sets, ads, páginas, pixels, públicos
- ✅ Páginas de navegação em cascata com breadcrumbs
- ✅ Date picker para filtragem de métricas

### **Fase 2: Criação de Campanha Única** ✅
- ✅ Assistente de 3 etapas
- ✅ Configuração de campanha, ad set e criativo
- ✅ Integração completa com Meta SDK
- ✅ Hooks React Query para dados Meta

### **Fase 3: Criação em Massa** ✅
- ✅ UI para seleção de múltiplas contas
- ✅ Substituições por conta (orçamento, página, pixel)
- ✅ Job Inngest para processamento paralelo

### **Fase 4: Editor de Campanhas** ✅
- ✅ Drawer para edição de status, orçamento e datas
- ✅ Toggle em massa para ativar/pausar múltiplas campanhas
- ✅ Rotas PUT de API para atualização

### **Fase 5: Sistema de Alertas** ✅
- ✅ Migrações de banco de dados (regras e notificações)
- ✅ Página de gerenciamento de regras
- ✅ Job cron do Inngest para verificar regras
- ✅ Componentes de notificação (sino + drawer)
- ✅ API CRUD para alertas e notificações

---

## 🚀 Primeiros Passos

### 1. Executar Migrações no Supabase

```bash
# Execute estes arquivos na ordem no Supabase SQL Editor:
migrations/004_add_ad_sets_and_ads.sql
migrations/005_add_alerts_and_notifications.sql
```

### 2. Configurar Variáveis de Ambiente

Adicione ao `.env.local`:

```bash
# Meta API (OAuth — token vem do banco via Facebook Login)
META_APP_ID=seu-app-id
META_APP_SECRET=seu-app-secret
META_API_VERSION=v23.0
META_OAUTH_REDIRECT_URI=https://seu-dominio/api/auth/meta/callback
NEXT_PUBLIC_META_APP_ID=seu-app-id

# Telegram (para notificações via Telegram - opcional)
TELEGRAM_BOT_TOKEN=seu-bot-token

# App URL (para links em notificações)
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

### 3. Iniciar o Servidor

```bash
cd apps/meta-ads-manager
npm run dev
```

---

## 📖 Guia de Recursos

### **Campanhas**
- 🔗 `/campaigns` - Lista principal de campanhas com métricas
- 🔗 `/campaigns/create` - Criar campanha única
- 🔗 `/campaigns/bulk-create` - Criar em múltiplas contas
- 🔗 `/campaigns/[id]` - Ver ad sets da campanha
- 🔗 `/campaigns/[id]/adsets/[id]` - Ver ads do ad set

### **Alertas**
- 🔗 `/alerts` - Gerenciar regras de alerta
- 📱 Sino no header - Ver notificações em tempo real

### **APIs (Todas com autenticação)**
```
GET  /api/meta/campaigns              # Listar campanhas
POST /api/meta/campaigns-create       # Criar campanha
PUT  /api/meta/campaigns/[id]         # Atualizar campanha

GET  /api/meta/adsets                 # Listar ad sets
PUT  /api/meta/adsets/[id]            # Atualizar ad set

GET  /api/meta/ads                    # Listar ads
PUT  /api/meta/ads/[id]               # Atualizar ad

GET  /api/meta/accounts/pages         # Páginas Facebook
GET  /api/meta/accounts/pixels        # Pixels
GET  /api/meta/accounts/audiences     # Públicos

POST /api/meta/bulk-campaigns-create  # Criar em massa

GET  /api/alerts                      # Listar regras
POST /api/alerts                      # Criar regra

GET  /api/notifications               # Listar notificações
POST /api/notifications               # Marcar como lida/deletar
```

---

## 🔔 Sistema de Alertas

### Tipos de Regras Suportadas:
- **ROAS Abaixo de** - Quando ROAS cai abaixo do threshold
- **Gasto Diário Acima de** - Quando o gasto diário ultrapassa limite
- **CPC Acima de** - Quando o custo por clique é alto demais
- **CTR Abaixo de** - Quando a taxa de cliques cai
- **Taxa de Conversão Abaixo de** - Quando conversões caem

### Como Funcionam:
1. Usuário cria regra em `/alerts`
2. Inngest verifica a cada 15 minutos (cron `*/15 * * * *`)
3. Se condição for atingida:
   - ✅ Notificação no dashboard (sino)
   - ✅ Notificação em Telegram (se habilitado)

### Configurar Telegram:
1. Criar bot: `@BotFather` no Telegram
2. Obter Chat ID: conversar com `@userinfobot`
3. Adicionar `TELEGRAM_BOT_TOKEN` ao `.env.local`
4. Ao criar alerta, habilitar "Enviar para Telegram" e informar Chat ID

---

## 🔐 Segurança

### RLS (Row Level Security) Implementado:
- ✅ Usuários só veem suas contas
- ✅ Usuários só podem editar campanhas que têm acesso
- ✅ Alertas são privados por usuário
- ✅ Notificações isoladas por usuário

### Autenticação:
- ✅ Google OAuth via Supabase Auth
- ✅ `requireAuth()` em todas as rotas
- ✅ `getUserAccounts()` para filtrar por usuário

---

## 📊 Arquitetura Técnica

### Stack:
- **Frontend**: Next.js 14 + React 18 + Tailwind CSS
- **Backend**: Next.js API Routes + Inngest
- **Database**: Supabase (PostgreSQL) + RLS
- **Auth**: Google OAuth + Supabase Auth
- **Meta API**: fetch() direto na Graph API (OAuth token do banco)
- **Jobs**: Inngest cron jobs

### Fluxo de Sincronização:
```
Inngest Cron (a cada 15 min)
  ↓
syncMetaAdAccounts()
  ↓
Busca Campanhas do Meta API
  ↓
Para cada Campanha:
  - Busca Ad Sets
  - Para cada Ad Set: Busca Ads
  ↓
Armazena no Supabase
```

### Fluxo de Criação:
```
Usuário Preenche Wizard
  ↓
POST /api/meta/campaigns-create
  ↓
Meta SDK cria:
  1. Campaign
  2. Ad Set
  3. Ad (com criativo)
  ↓
Armazena no Supabase
  ↓
Redirect para /campaigns/[id]
```

### Fluxo de Alertas:
```
Inngest Cron (a cada 15 min)
  ↓
checkAlertRules()
  ↓
Para cada regra habilitada:
  - Busca campanhas da conta
  - Busca insights do Meta API
  - Avalia condição
  - Se acionada:
    → Cria notificação no DB
    → Envia para Telegram (se habilitado)
```

---

## 🧪 Testes Recomendados

### 1. Autenticação
- [ ] Login com Google
- [ ] Redirect para dashboard após login
- [ ] Logout

### 2. Campanhas
- [ ] Listar campanhas (GET /api/meta/campaigns)
- [ ] Criar campanha única (POST /api/meta/campaigns-create)
- [ ] Criar em massa (POST /api/meta/bulk-campaigns-create)
- [ ] Editar status/orçamento (PUT /api/meta/campaigns/[id])
- [ ] Navegação drill-down funciona

### 3. Alertas
- [ ] Criar regra de alerta
- [ ] Regra aparece na lista
- [ ] Verificar que cron roda a cada 15 min (logs do Inngest)
- [ ] Notificação aparecer no sino quando acionada

### 4. Telegram (Opcional)
- [ ] Habilitar Telegram em regra de alerta
- [ ] Quando alerta acionado, mensagem chega no Telegram

---

## 📦 Arquivos Criados

**API Routes (13 arquivos)**
- `/api/meta/campaigns.ts`, `/campaigns/[id].ts`
- `/api/meta/adsets.ts`, `/adsets/[id].ts`
- `/api/meta/ads.ts`, `/ads/[id].ts`
- `/api/meta/accounts/{pages,pixels,audiences}.ts`
- `/api/meta/campaigns-create.ts`
- `/api/meta/bulk-campaigns-create.ts`
- `/api/alerts/index.ts`
- `/api/notifications/index.ts`

**Componentes (12 arquivos)**
- `Breadcrumb.tsx`
- `Step1Campaign.tsx`, `Step2AdSet.tsx`, `Step3Ad.tsx`
- `EditCampaignDrawer.tsx`
- `BulkStatusToggle.tsx`
- `NotificationBell.tsx`
- `NotificationDrawer.tsx`
- Hooks: `useMetaPages.ts`, `useMetaPixels.ts`, `useMetaAudiences.ts`

**Páginas (5 arquivos)**
- `/campaigns/index.tsx`
- `/campaigns/create.tsx`
- `/campaigns/bulk-create.tsx`
- `/campaigns/[campaignId].tsx`
- `/campaigns/[campaignId]/adsets/[adSetId].tsx`
- `/alerts.tsx`

**Backend (3 arquivos)**
- `/inngest/functions/syncMetaAdAccounts.ts` (atualizado)
- `/inngest/functions/bulkCreateCampaigns.ts`
- `/inngest/functions/checkAlertRules.ts`

**Migrations (2 arquivos)**
- `004_add_ad_sets_and_ads.sql`
- `005_add_alerts_and_notifications.sql`

**Lib (1 arquivo)**
- `/lib/meta-api.ts` (client Meta Graph API via fetch, token OAuth do banco)

---

## 🐛 Troubleshooting

### "Campaign not found" ao editar
- Verifique se o usuário tem acesso à conta
- Confirme que a campanha foi sincronizada (rodar sync manual se necessário)

### Alertas não acionando
- Confirme que `INNGEST_EVENT_KEY` está correto
- Verifique logs do Inngest em https://app.inngest.com
- Confirme que regra está habilitada em `/alerts`

### Telegram não recebendo mensagens
- Verifique `TELEGRAM_BOT_TOKEN` em `.env.local`
- Confirme Chat ID está correto
- Verifique que Bot tem permissão para enviar mensagens

---

## 📝 Variáveis de Ambiente Completas

```bash
# === SUPABASE ===
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

# === META (OAuth — token vem do banco) ===
META_APP_ID=
META_APP_SECRET=
META_API_VERSION=v23.0
META_OAUTH_REDIRECT_URI=https://seu-dominio/api/auth/meta/callback
NEXT_PUBLIC_META_APP_ID=

# === GOOGLE OAuth ===
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# === INNGEST ===
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# === TELEGRAM (Opcional) ===
TELEGRAM_BOT_TOKEN=

# === APP ===
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
```

---

## 🎯 Próximos Passos Opcionais

1. **Integrar com Analytics**
   - Adicionar mais métricas (conversões, valor de pedido)
   - Dashboard de KPIs por período

2. **Automações**
   - Auto-pause quando CPC > threshold
   - Auto-scale quando ROAS > threshold

3. **Relatórios**
   - Relatórios semanais por email
   - Exportar dados para CSV/Excel

4. **Multi-tenancy**
   - Suportar múltiplas agências
   - Permissões granulares por usuário

5. **Melhorias de UX**
   - Edição em linha na tabela
   - Bulk edit com drag-and-drop
   - Templates de campanhas

---

## 📞 Suporte

Para dúvidas ou issues, consulte:
- Documentação do Meta: https://developers.facebook.com/docs/marketing-api
- Inngest: https://www.inngest.com/docs
- Supabase: https://supabase.com/docs

---

## ✅ Checklist Final

- [ ] Migrações executadas no Supabase
- [ ] `.env.local` configurado com todas as variáveis
- [ ] `npm run dev` executando sem erros
- [ ] Login via Google OAuth funciona
- [ ] Dashboard carrega campanhas
- [ ] Pode criar campanha
- [ ] Pode editar campanha
- [ ] Pode criar alerta
- [ ] Inngest cron está configurado
- [ ] (Opcional) Telegram configurado e funcionando

---

**Implementação completa em: 17 de Março de 2026** 🚀
