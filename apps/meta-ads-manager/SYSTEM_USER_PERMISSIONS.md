# 🔐 Configurar Permissões do System User — Guia Passo-a-Passo

O **System User `61579001686652`** existe, mas está **sem as permissões corretas** para acessar as contas de anúncio.

## ⚠️ O que você precisa fazer

Você precisa dar permissões a este System User **no Business Manager** para que ele possa acessar:
- ✅ Suas contas de anúncio
- ✅ Campanhas, ad sets e anúncios
- ✅ Dados de performance

---

## 📋 Passo 1: Abrir Business Manager

1. Abra [business.facebook.com](https://business.facebook.com)
2. Faça login com a conta que gerencia seus anúncios
3. No **canto superior esquerdo**, confirme que você está no **Business Manager correto**

---

## 🔑 Passo 2: Acessar Usuários do Sistema

1. Clique em **⚙️ Configurações** (canto inferior esquerdo)
2. Vá para **Usuários e Permissões** (no menu lateral)
3. Clique em **Usuários do Sistema**

Você deve ver o System User `61579001686652` na lista.

---

## 👤 Passo 3: Selecionar o System User

1. **Clique no System User** `61579001686652`
2. Uma página abrirá com as permissões atuais dele

---

## 🔓 Passo 4: Dar Acesso às Contas de Anúncio

### Seção 1: Contas de Anúncio

1. Procure a seção **"Contas de Anúncio"** (ou **"Ad Accounts"**)
2. Você verá uma lista de suas contas de anúncio
3. Para **cada conta** que você quer sincronizar:
   - ✅ **Marque a checkbox** ao lado do nome da conta
   - Nível de acesso: selecione **"Administrador"** ou **"Analista"** (Analista é suficiente para read)

### Se aparecer "Todas as Contas de Anúncio"
- ✅ **Marque a opção "Todas as Contas de Anúncio"** — isso dá acesso automático a contas futuras também

---

## 📊 Passo 5: Dar Permissões Específicas

Scroll para baixo e procure a seção **"Permissões Adicionais"** (ou **"Additional Permissions"**)

Ative **todas essas permissões**:

- ✅ `ads_read` — Ler dados de anúncios (OBRIGATÓRIO)
- ✅ `ads_management` — Gerenciar campanhas (OBRIGATÓRIO se quiser editar)
- ✅ `pages_read_user_content` — Ler páginas
- ✅ `pages_manage_posts` — Publicar em páginas
- ✅ `pages_read_engagement` — Ler engagement
- ✅ `business_basic` — Info básica do business
- ✅ `business_management` — Gerenciar business

---

## 💾 Passo 6: Salvar as Alterações

1. **Clique em "Salvar"** (botão azul no final da página)
2. Aguarde a confirmação: "Alterações salvas com sucesso"

---

## ✔️ Passo 7: Validar as Permissões

Agora teste se funcionou:

### No seu terminal/projeto:

```bash
npm run dev
```

### Em outro terminal:

```bash
curl http://localhost:3000/api/test-meta-sync
```

### Deve retornar algo como:

```json
{
  "checks": {
    "meta_api": {
      "status": "success",
      "accounts_count": 2,
      "accounts": [
        {
          "id": "1234567890",
          "name": "Sua Conta de Anúncio 1",
          "currency": "BRL",
          "timezone": "America/Sao_Paulo"
        }
      ]
    },
    "supabase_accounts": {
      "status": "success",
      "count": 0
    }
  },
  "summary": {
    "status": "healthy"
  }
}
```

Se `meta_api.status` for `"success"` e aparecer `accounts_count > 0`, **funcionou!** 🎉

---

## 🔍 Checklist de Permissões

Depois de salvar, verifique se você vê:

- ✅ Contas de Anúncio listadas e marcadas
- ✅ Permissão `ads_read` ativada
- ✅ Permissão `ads_management` ativada
- ✅ Status do System User: "Ativo"

---

## ⚠️ Se ainda não funcionar

Se depois de fazer isso o endpoint ainda retornar erro, pode ser:

### 1. As permissões ainda não foram propagadas
- Aguarde **5-10 minutos** para a Meta propagar as mudanças
- Tente novamente

### 2. Falta de permissões no seu usuário
- Você precisa ser **Administrador do Business Manager** para editar System Users
- Verifique se você tem a permissão `business_management`

### 3. Token expirou
- Tokens da Meta expiram em algumas horas
- Você pode gerar um novo em [developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer)

### 4. System User precisa ser recriado
Se nada funcionar, você pode **criar um novo System User**:

1. Em **Usuários do Sistema**, clique em **"Adicionar System User"**
2. Dê um nome descritivo, ex: "Dashboard Sync"
3. Clique em **"Criar System User"**
4. Copie o ID que aparecer
5. **Atualize `META_SYSTEM_USER_ID` no `.env.local`** com o novo ID
6. Repita os passos de permissões acima

---

## 🚀 Depois que funcionar

Assim que o `/api/test-meta-sync` retornar `status: "success"` com contas encontradas:

1. A sincronização automática **começará a rodar a cada 15 minutos**
2. Suas contas aparecerão no Supabase table `meta_accounts`
3. Campanhas, ad sets e anúncios serão sincronizados automaticamente
4. O dashboard mostrará todos os dados em tempo real

---

## 📞 Precisa de ajuda?

Se tiver dúvidas sobre onde clicar, aqui estão os nomes das opções em **PT-BR** e **EN-US**:

| PT-BR | EN-US |
|-------|-------|
| Configurações | Settings |
| Usuários e Permissões | Users and Permissions |
| Usuários do Sistema | System Users |
| Contas de Anúncio | Ad Accounts |
| Permissões Adicionais | Additional Permissions |
| Salvar | Save |
| Administrador | Admin |
| Analista | Analyst |

Boa sorte! 💪
