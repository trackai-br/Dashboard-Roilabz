# Setup da Meta API — Guia Completo

## 🔴 PROBLEMA IDENTIFICADO

Seu Dashboard não está sincronizando dados da Meta porque:

1. **Token de acesso inválido/expirado** — `META_ACCESS_TOKEN` no `.env.local` não é reconhecido pela API da Meta
2. **System User ID pode estar incorreto** — `META_SYSTEM_USER_ID` precisa ser validado

## ✅ SOLUÇÃO — Obter um novo token válido

### Passo 1: Acesso ao Meta Business Manager

1. Abra [business.facebook.com](https://business.facebook.com)
2. Faça login com a conta que gerencia seus anúncios
3. Confirme que você está no **Business Manager correto** (canto superior esquerdo)

### Passo 2: Criar ou localizar um System User

1. No Business Manager, vá para **Configurações** → **Usuários e Permissões** → **Usuários do Sistema**
2. Se não existir um, clique em **Adicionar** e crie um novo (ex: "Dashboard Integration")
3. **Copie o ID do System User** (ele aparece em formato numérico como `123456789`)
4. Cole em `META_SYSTEM_USER_ID` no `.env.local`

### Passo 3: Gerar um Token de Acesso Válido

#### Opção A: Usar o Graph API Explorer (Recomendado para teste)

1. Abra [developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer)
2. No dropdown no topo esquerdo, selecione seu **Business App**
3. Mude para **versão 23.0** (ou a versão que você estiver usando)
4. No campo de busca/endpoint, coloque:
   ```
   /{ID-DO-SYSTEM-USER}?fields=id,name,currency,timezone
   ```
   Substituindo `{ID-DO-SYSTEM-USER}` pelo ID obtido no Passo 2
5. Clique em **Get**
6. Se funcionar, copie o token que aparece no topo
7. Se der erro, significa que o System User não tem as permissões corretas (veja Passo 4)

#### Opção B: Gerar um Token Permanente (Recomendado para produção)

1. No **Meta App Dashboard**, vá para **Settings** → **Basic**
2. Copie **App ID** e **App Secret**
3. No seu backend ou terminal, execute:
   ```bash
   curl -X GET \
     "https://graph.instagram.com/v23.0/oauth/access_token?\
     client_id=SEU_APP_ID&\
     client_secret=SEU_APP_SECRET&\
     grant_type=client_credentials"
   ```
4. Isso retornará um `access_token` válido
5. Cole em `META_ACCESS_TOKEN` no `.env.local`

### Passo 4: Garantir Permissões do System User

O System User precisa ter as seguintes permissões:

1. Volte para **Usuários do Sistema** no Business Manager
2. Clique no seu System User
3. Vá para a guia **Permissões**
4. Certifique-se de que ele tem acesso a:
   - ✅ **Todas as Contas de Anúncios** (ou as contas específicas que quer sincronizar)
   - ✅ **Acesso de Analista** (no mínimo) ou **Acesso de Administrador**
5. Em **Permissões Adicionais**, ative:
   - ✅ `ads_read` (Ler dados de anúncios)
   - ✅ `ads_management` (Gerenciar campanhas)

### Passo 5: Validar a Configuração

Depois de atualizar `.env.local` com os novos valores:

1. Execute o script de verificação:
   ```bash
   npm run check-tables
   ```
   Deve retornar: **✅ Criadas: 7/7 — Banco pronto!**

2. Teste o endpoint de diagnóstico:
   ```bash
   npm run dev
   # Em outro terminal:
   curl http://localhost:3000/api/test-meta-sync
   ```
   Deve retornar:
   ```json
   {
     "meta_api": {
       "status": "success",
       "accounts_count": X
     },
     "supabase_accounts": {
       "status": "success",
       "count": 0 (antes do primeiro sync)
     }
   }
   ```

### Passo 6: Trigger Inicial da Sincronização

Depois que o token estiver válido, a sincronização acontecerá automaticamente **a cada 15 minutos** via Inngest.

**Para sincronizar agora**, execute:
```bash
curl -X POST http://localhost:3000/api/inngest \
  -H "Content-Type: application/json" \
  -d '{"event": "sync/meta-accounts"}'
```

Ou aguarde 15 minutos e recarregue o dashboard.

## 📋 Checklist Final

- [ ] System User ID obtido e copiado para `META_SYSTEM_USER_ID`
- [ ] Access Token válido obtido e copiado para `META_ACCESS_TOKEN`
- [ ] `.env.local` atualizado
- [ ] `npm run check-tables` retorna ✅ 7/7
- [ ] `/api/test-meta-sync` retorna `meta_api.status = success`
- [ ] Contas aparecem no Dashboard após 15 minutos (ou após manual trigger)

## 🔗 Links Úteis

- [Meta Business Manager](https://business.facebook.com)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer)
- [Facebook Ads API Docs](https://developers.facebook.com/docs/marketing-api)
- [System User Permissions](https://www.facebook.com/business/help/755843607430921)

## ❓ Troubleshooting

### "Invalid OAuth access token"
- Token expirou ou é inválido
- Gere um novo usando o Graph API Explorer ou a API do app

### "Object does not exist or does not support this operation"
- System User ID está errado
- System User não tem permissões suficientes
- Verifique em Business Manager → Usuários do Sistema

### "401 Unauthorized"
- Credenciais incorretas
- App não tem permissões para acessar o recurso
- Verifique as permissões do System User

### Ainda não funciona?
Execute o script de diagnóstico detalhado:
```bash
npm run dev
# Em outro terminal:
node -e "
const meta = require('./src/lib/meta-api').metaAPI;
meta.getAdAccounts()
  .then(accs => console.log('✅ Success:', accs))
  .catch(e => console.error('❌ Error:', e.message))
"
```
