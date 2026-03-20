# Deployment Guide — Meta Ads Manager

## 📋 Pre-Deployment Checklist

- [ ] Todas as variáveis de ambiente estão configuradas
- [ ] Tests passam: `npm test`
- [ ] TypeScript type checking passa: `npm run typecheck`
- [ ] Linting passa: `npm run lint`
- [ ] `.env.example` está atualizado
- [ ] Documentação foi revisada

## 🔑 Environment Variables

Certifique-se que cada variável está configurada no seu ambiente de deploy:

```env
# Inngest
INNGEST_EVENT_KEY=evt_prod_... (obtém em https://app.inngest.com)
INNGEST_SIGNING_KEY=...         (obtém em https://app.inngest.com)

# Meta API (OAuth — token vem do banco, não da env)
META_APP_ID=...                 (obtém em Meta for Developers > Settings > Basic)
META_APP_SECRET=...             (obtém em Meta for Developers > Settings > Basic)
META_API_VERSION=v23.0
META_OAUTH_REDIRECT_URI=https://seu-dominio/api/auth/meta/callback
NEXT_PUBLIC_META_APP_ID=...     (mesmo valor de META_APP_ID)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Database
DATABASE_URL=postgresql://...   (opcional, se usando PgBouncer)
```

## 🚀 Deployment Steps

### 1. Staging Environment

```bash
# Clone/pull repositório
git clone <repo-url>
cd Dashboard/apps/meta-ads-manager

# Instalar dependências
npm ci

# Rodar testes
npm test
npm run typecheck
npm run lint

# Build
npm run build

# Start
npm start
```

### 2. Production Environment

#### Via Vercel (Recomendado para Next.js)

1. **Conectar repositório**:
   - Vá para vercel.com
   - Importe projeto: `Dashboard/apps/meta-ads-manager`

2. **Configurar Environment Variables**:
   - Adicione cada variável listada acima
   - Use Vercel Secrets Manager

3. **Deploy**:
   ```bash
   vercel deploy --prod
   ```

#### Via Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Deploy:
```bash
docker build -t meta-ads-manager .
docker push your-registry/meta-ads-manager:latest
```

#### Via Railway/Render

1. Conecte repositório
2. Defina Root Directory: `Dashboard/apps/meta-ads-manager`
3. Configure variáveis de ambiente
4. Deploy automático no push

### 3. Database Migration

**Primeira vez:**
```bash
# Via Supabase CLI
supabase migration up

# Ou manualmente:
# 1. Vá para Supabase Dashboard > SQL Editor
# 2. Cole conteúdo de migrations/001_create_meta_accounts.sql
# 3. Execute
```

**Verificar migração:**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'meta_accounts';
```

## ✅ Post-Deployment Validation

Após deploy, valide:

### 1. Health Check
```bash
curl https://your-domain/api/inngest

# Esperado: HTTP 200 (ou erro Inngest específico)
```

### 2. Inngest Dashboard
- Acesse: https://app.inngest.com
- Veja função `sync-meta-ad-accounts` registrada
- Aguarde próxima execução (máx 15 min)
- Verifique logs de execução

### 3. Database
```sql
SELECT COUNT(*) as total_accounts FROM meta_accounts;
SELECT MAX(last_synced) as ultima_sincronizacao FROM meta_accounts;
```

Esperado:
- `total_accounts` > 0 (contas sincronizadas)
- `ultima_sincronizacao` recente (nos últimos 15 min)

## 🔄 Rollback Procedure

Se algo der errado:

### Option 1: Revert Code
```bash
git revert <commit-hash>
git push
# Deployment automático acionado
```

### Option 2: Stop Scheduled Job
Se a função está causando danos:
1. Vá para Inngest Dashboard
2. Disable função `sync-meta-ad-accounts`
3. Investigue + fix
4. Re-enable

### Option 3: Database Rollback
Se migração corrueu dados:
```bash
# Supabase automático faz backup diário
# Acesse: Supabase Dashboard > Backups > Restore

# Ou restaure manualmente:
supabase db pull --linked
git checkout migrations/
supabase migration up
```

## 📊 Monitoring & Alerts

### Inngest Monitoring
- **Failed executions**: Configure alert em https://app.inngest.com/settings
- **Logs**: Tempo real em Dashboard
- **Metrics**: Latency, throughput, error rate

### Supabase Monitoring
- **Query Performance**: Supabase > Database > Performance
- **Storage**: Monitorar tamanho de tabela `meta_accounts`
- **API Usage**: Supabase > Database > Usage

### Application Monitoring
Integrate com seu sistema de monitoramento (Sentry, DataDog, etc):

```typescript
// src/inngest/functions/syncMetaAdAccounts.ts
import * as Sentry from "@sentry/nextjs";

try {
  // ... sync logic
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

## 🔐 Security Checklist

- [ ] Nenhuma credencial foi commitada em `.env` ou código
- [ ] RLS está habilitado em tabela `meta_accounts`
- [ ] Meta token é renovado automaticamente via Inngest job (`refresh-meta-token`)
- [ ] Inngest signing key é secreto (não expor cliente)
- [ ] Logs não expõem dados sensíveis

## 🆘 Troubleshooting

### Rota `/api/inngest` retorna 500
- Verifique environment variables
- Verifique logs em Inngest Dashboard
- Valide Meta token em https://developers.facebook.com/tools/

### Contas não são sincronizadas
- Verifique se cron foi executado (Inngest Dashboard)
- Verifique conexão Meta API (token, rate limiting)
- Verifique conexão Supabase (URL, chaves)

### Rate limiting (429)
- Normal em meta_accounts com muitas contas
- Retry automático (até 3x) — sem ação necessária
- Se persistir: implemente backoff exponencial

## 📞 Support

- **Inngest Issues**: https://inngest.com/support
- **Supabase Issues**: https://supabase.com/support
- **Meta API Issues**: https://developers.facebook.com/community/
