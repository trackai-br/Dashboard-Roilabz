# 🚀 Setup Guide — Dashboard Meta Ads Manager

## Pré-requisitos
- ✅ Vercel deployed (`https://dashboard-roilabz.vercel.app`)
- ✅ Supabase project criado (`avcappbznnecuryuekgt`)
- ✅ Google Cloud OAuth credentials criadas

---

## 1️⃣ Executar Migrations (Banco de Dados)

### Passo 1: Acessar Supabase SQL Editor
1. Vá para: https://app.supabase.com
2. Selecione seu projeto `avcappbznnecuryuekgt`
3. Clique em **SQL Editor** (lado esquerdo)

### Passo 2: Executar SQL Master
1. Clique em **+ New Query**
2. Copie TODO o conteúdo do arquivo `migrations/000_master_migrations.sql`
3. Cole no editor
4. Clique em **RUN** (ou Cmd+Enter)
5. Aguarde aparecer: ✅ Success (verde)

**Status esperado:**
```
✅ 8 queries executed successfully
```

Se houver erro tipo `"relation already exists"`, é normal - significa que a tabela já foi criada. Ignore.

---

## 2️⃣ Configurar Google OAuth

### Passo 1: Supabase — Habilitar Google Provider
1. Em Supabase, vá para **Authentication** → **Providers**
2. Procure por **Google**
3. Toggle para **Enabled** (verde)
4. Copie seu **Client ID** e **Client Secret** do Google Cloud Console

### Passo 2: Google Cloud Console
1. Vá para: https://console.cloud.google.com
2. Selecione seu projeto
3. Vá para **APIs & Services** → **Credentials**
4. Procure a credencial OAuth 2.0 (tipo "Credencial de aplicativo web")
5. Clique em editar
6. Em **URIs de redirecionamento autorizados**, adicione:
   ```
   https://avcappbznnecuryuekgt.supabase.co/auth/v1/callback
   https://dashboard-roilabz.vercel.app/auth/callback
   ```
7. Salve

### Passo 3: Conectar Supabase com Google Cloud
1. De volta a Supabase, em **Authentication** → **Providers** → **Google**
2. Cole o **Client ID** do Google Cloud
3. Cole o **Client Secret** do Google Cloud
4. Clique em **Save**

**Status esperado:**
```
✅ Google Provider enabled
Status: Configured
```

---

## 3️⃣ Testar o Fluxo Completo

### Local (Development)
```bash
npm run dev
# Acesse http://localhost:3000/login
# Clique em "Sign in with Google"
# Autorize o app
# Deve redirecionar para /dashboard
```

### Vercel (Production)
```
https://dashboard-roilabz.vercel.app/login
```

**Testes esperados:**
- ✅ Página de login carrega sem logo gigante
- ✅ Botão "Sign in with Google" funciona
- ✅ Redireciona para autenticação Google
- ✅ Após autorizar, redireciona para `/dashboard`
- ✅ Dashboard carrega com KPIs (dados vazios é normal, pois não há contas vinculadas ainda)

---

## 4️⃣ Verificar Status do Banco de Dados

### No Supabase Dashboard
1. Vá para **Table Editor**
2. Você deve ver as seguintes tabelas:
   - ✅ `meta_accounts`
   - ✅ `users`
   - ✅ `user_account_access`
   - ✅ `access_logs`
   - ✅ `google_ads_accounts`
   - ✅ `google_ads_campaigns`

Se estiverem com ícone de cadeado 🔒, significa que RLS está habilitado (correto).

---

## 5️⃣ Troubleshooting

### Erro: "Unsupported provider: provider is not enabled"
**Causa:** Google OAuth não configurado
**Solução:** Siga **Passo 2** acima

### Erro: "Could not find the table 'public.meta_accounts'"
**Causa:** Migrations não executadas
**Solução:** Siga **Passo 1** acima

### Erro: "Invalid Client ID"
**Causa:** Client ID errado do Google Cloud
**Solução:** Copie exatamente de: Google Cloud Console → Credentials → OAuth 2.0 Client

### Página de login não carrega
**Causa:** Possível problema com CSS/build
**Solução:**
```bash
npm run build
npm run dev
```

---

## 📊 Status Checklist

- [ ] SQL Master executado com sucesso
- [ ] Google OAuth habilitado no Supabase
- [ ] Google Cloud redirect URIs configuradas
- [ ] Página `/login` carrega sem erro
- [ ] Botão Google funciona (abre tela de autorização)
- [ ] Após autorizar, redireciona para `/dashboard`
- [ ] Dashboard carrega (pode estar vazio de dados)
- [ ] Sidebar e KPI cards renderizam

---

## 🎨 UX Review Needed

A página de login foi refatorada com:
- ✅ Layout responsivo profissional
- ✅ Dark mode suportado
- ✅ Logo minimizado (sem gigante)
- ✅ Botão Google com tamanho apropriado

**Próximo passo:** Chamar @ux-designer para review da página de login
