# Meta Ads Manager — Inngest Integration

Sincronização automática de contas Meta Ads a cada 15 minutos via Inngest job queue.

## 🚀 Quick Start

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Copie `.env.example` para `.env` e preencha:
```bash
cp .env.example .env
```

**Variáveis obrigatórias:**
- `INNGEST_EVENT_KEY` — Chave de evento Inngest
- `INNGEST_SIGNING_KEY` — Chave de assinatura Inngest
- `META_ACCESS_TOKEN` — Token de acesso Meta Graph API
- `NEXT_PUBLIC_SUPABASE_URL` — URL da base Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — Chave de serviço Supabase

### 3. Preparar Banco de Dados
Execute a migração Supabase:
```bash
# Via Supabase CLI
supabase migration up

# Ou copie o SQL de migrations/001_create_meta_accounts.sql
# e execute no dashboard Supabase
```

### 4. Rodas Localmente
```bash
npm run dev
```

Acesse: `http://localhost:3000/api/inngest`

## 📋 Estrutura do Projeto

```
src/
├── inngest/
│   ├── client.ts                    # Cliente Inngest configurado
│   └── functions/
│       ├── syncMetaAdAccounts.ts    # Função de sync principal
│       └── syncMetaAdAccounts.test.ts
├── pages/
│   └── api/
│       └── inngest.ts              # Rota API para Inngest
```

## 🧪 Testes

### Rodar Unit Tests
```bash
npm test
```

### Testar Localmente
1. Certifique-se de que a rota `/api/inngest` responde:
   ```bash
   curl http://localhost:3000/api/inngest
   ```
   Deve retornar: `HTTP 200`

2. Verifique logs no **Inngest Dashboard**

3. Monitore a tabela `meta_accounts` no Supabase

## 🔄 Fluxo de Sincronização

1. **Trigger**: Cron job a cada 15 minutos (`*/15 * * * *`)
2. **Fetch**: Busca contas em `https://graph.facebook.com/v23.0/me/adaccounts`
3. **Process**: Extrai `meta_account_id`, `meta_account_name`, `currency`, `timezone`
4. **Store**: INSERT/UPDATE em tabela Supabase `meta_accounts`
5. **Track**: Atualiza `last_synced` com timestamp atual

## ⚠️ Tratamento de Erros

A função trata automaticamente:
- **401 (Unauthorized)**: Token Meta inválido ou expirado
- **429 (Too Many Requests)**: Rate limiting — retry automático (até 3x)
- **Timeout**: Falha de conexão — retry automático

## 📊 Monitoramento

### Inngest Dashboard
- Acesse: https://app.inngest.com
- Veja execuções em tempo real
- Monitore logs de função

### Supabase
```sql
SELECT
  meta_account_id,
  meta_account_name,
  last_synced,
  created_at
FROM meta_accounts
ORDER BY last_synced DESC;
```

## 🚢 Deploy

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para instruções completas.

## 📝 Desenvolvimento

### Adicionar Nova Função Inngest
1. Crie arquivo em `src/inngest/functions/`
2. Exporte função em `src/pages/api/inngest.ts`
3. Registre em `inngest.serve()`

### Modificar Schema
1. Crie nova migração em `migrations/`
2. Execute em Supabase via CLI ou dashboard

## 🔐 Segurança

- RLS habilitado em `meta_accounts` — apenas service role pode modificar
- Tokens armazenados em variáveis de ambiente (nunca commitar `.env`)
- Validação de assinatura Inngest automática

## 📞 Suporte

Para issues com:
- **Inngest**: Verifique dashboard em https://app.inngest.com
- **Meta API**: Consulte https://developers.facebook.com/docs/marketing-api
- **Supabase**: Acesse https://supabase.com/docs
