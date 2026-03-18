# 🔑 Como Gerar um Novo Meta Access Token

O token que você forneceu está inválido/expirado. Siga **exatamente** estes passos:

## ✅ Opção 1: Usando Graph API Explorer (Mais Fácil)

### Passo 1: Preparar a URL
Abra esta URL substituindo `SEU_APP_ID`:
```
https://developers.facebook.com/tools/explorer?app=SEU_APP_ID
```

**Como encontrar seu App ID:**
1. Abra [facebook.com/apps](https://facebook.com/apps)
2. Selecione seu app (Meta Ads Manager)
3. Em **Settings → Basic**, copie o **App ID**
4. Substitua em `SEU_APP_ID` acima

### Passo 2: No Explorer
1. Abra a URL do Passo 1 (você será logado automaticamente)
2. No dropdown no topo esquerdo, mude para sua **Business App**
3. Na lista de versões, selecione **v23.0**

### Passo 3: Gerar Token
1. No campo **Get**, clique no dropdown (ao lado do botão **Get**)
2. Selecione: **System User** (não "User")
3. Escolha seu System User: `61579001686652`

### Passo 4: Executar Query
Na caixa de entrada, cole:
```
/61579001686652?fields=id,name
```

Clique em **Get** (o botão azul grande)

### Passo 5: Copiar Token
Se aparecer `{"id":"61579001686652","name":"..."}`, ótimo!

Agora, clique no **token** que aparece no topo (próximo ao seu nome):
- Ele está em um campo chamado **Access Token**
- Copie **exatamente** como aparece (sem quebras de linha)

---

## ✅ Opção 2: Usando Terminal/Curl (Mais Rápido)

Se você já tem um **User Access Token** válido (do seu Facebook), pode usar:

```bash
curl -X GET \
  "https://graph.instagram.com/v23.0/me/business_account?access_token=SEU_USER_TOKEN" \
  -H "Content-Type: application/json"
```

Se funcionar, você pode fazer login do Business Manager:

```bash
curl -X GET \
  "https://graph.instagram.com/v23.0/SEU_BUSINESS_ID?fields=id,name&access_token=SEU_USER_TOKEN"
```

---

## ✅ Opção 3: Gerador Automático (Recomendado para Produção)

Se você tem um **App Secret**, use este script:

```bash
# Primeiro, obtenha um App-Scoped Token
curl -X GET \
  "https://graph.instagram.com/v23.0/oauth/access_token?client_id=SEU_APP_ID&client_secret=SEU_APP_SECRET&grant_type=client_credentials"
```

Isso retornará:
```json
{
  "access_token": "EAAxxxxxxxxxxxxxxxx...",
  "token_type": "bearer"
}
```

---

## 🧪 Validar o Token Antes de Usar

Depois de copiar o token, **valide-o** com este comando:

```bash
curl -X GET \
  "https://graph.instagram.com/v23.0/me?access_token=SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json"
```

Você deve receber:
```json
{
  "id": "seu_id_aqui",
  "name": "seu_nome"
}
```

Se receber:
```json
{
  "error": {
    "message": "Invalid OAuth access token",
    "code": 190
  }
}
```

O token é inválido. Tente novamente.

---

## 📝 Depois de Validar

Assim que tiver um token **válido**:

1. Atualize `.env.local`:
   ```env
   META_ACCESS_TOKEN=seu_novo_token_aqui
   META_SYSTEM_USER_ID=61579001686652
   ```

2. Reinicie o servidor:
   ```bash
   npm run dev
   ```

3. Teste o endpoint de diagnóstico:
   ```bash
   curl http://localhost:3000/api/test-meta-sync
   ```

Deve retornar:
```json
{
  "meta_api": {
    "status": "success",
    "accounts_count": X
  }
}
```

Se ainda não funcionar, execute isto no terminal do seu projeto:

```bash
npm run dev
# Em outro terminal:
node -e "
const meta = require('./dist/lib/meta-api').metaAPI;
meta.getAdAccounts()
  .then(accs => console.log('✅ Contas encontradas:', accs))
  .catch(e => console.error('❌ Erro:', e.message))
"
```

---

## ⚠️ Problemas Comuns

### "Token expires after X hours"
Tokens da Meta são **temporários**. Para produção, use um **Long-Lived Token** ou **System User**.

### "Missing permissions"
O System User precisa ter:
- ✅ Acesso a **Todas as Contas de Anúncios**
- ✅ Permissão **Analista** ou **Administrador**
- ✅ Escopo: `ads_read` e `ads_management`

### "System User ID not found"
Verifique em [business.facebook.com](https://business.facebook.com):
1. **Configurações** → **Usuários e Permissões** → **Usuários do Sistema**
2. Copie o ID exato (deve ser numérico)

---

Assim que gerar um token válido, **me avisa** que eu atualizo e testamos! 🚀
