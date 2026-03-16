# 🚀 GUIA DE CORREÇÃO - Deploy Vercel + Inngest

## SITUAÇÃO ATUAL

✅ Arquivos do Inngest criados localmente:
   - src/inngest/client.ts
   - src/inngest/functions/syncMetaAdAccounts.ts
   - src/pages/api/inngest.ts

❌ Conflito de dependências (npm install falhou)
❌ Projeto não deployado na Vercel (404: DEPLOYMENT_NOT_FOUND)
❌ Inngest não consegue sincronizar (URL não existe)

---

## ✅ SOLUÇÃO - 3 ETAPAS

### ETAPA 1: Corrigir package.json

**1.1** Abra o arquivo `package.json` no seu projeto local:
```
/Users/guilhermesimas/Documents/Dashboard/apps/meta-ads-manager/package.json
```

**1.2** Substitua TODO o conteúdo pelo arquivo `package.json` que foi criado (versão estável com React 18 + Next 14)

**1.3** No terminal, rode:
```bash
cd /Users/guilhermesimas/Documents/Dashboard/apps/meta-ads-manager
rm -rf node_modules package-lock.json
npm install
```

**Resultado esperado:**
```
added 245 packages in 12s
```

---

### ETAPA 2: Deploy na Vercel

**2.1** Verifique se o projeto está conectado ao GitHub:
```bash
git status
git remote -v
```

Se não tiver remote, adicione:
```bash
git remote add origin https://github.com/trackai-br/Dashboard-Roilabz.git
```

**2.2** Faça commit dos arquivos:
```bash
git add .
git commit -m "feat: add Inngest integration with Meta Ads API"
git push origin main
```

**2.3** Vá na Vercel (vercel.com/dashboard)
- Clique no projeto "dashboard-roilabz"
- Clique em "Deployments"
- Aguarde o deploy terminar (2-3 minutos)

**2.4** Quando o deploy terminar, copie a URL de produção.

A URL correta será algo como:
```
https://dashboard-roilabz.vercel.app
```

(SEM aquele hash `-b7hy9f1a5-trackinginlead-9454s-projects`)

---

### ETAPA 3: Configurar Inngest com a URL correta

**3.1** Vá no Inngest (app.inngest.com)

**3.2** No menu lateral, clique em "Apps"

**3.3** Clique no app que você criou

**3.4** Vá em "Syncs" ou "Configuration"

**3.5** Atualize a URL para:
```
https://dashboard-roilabz.vercel.app/api/inngest
```

**3.6** Clique em "Sync Now" ou "Trigger Sync"

**Resultado esperado:**
```
✅ Sync successful
✅ 1 function registered: sync-meta-ad-accounts
```

---

### ETAPA 4: Pegar as variáveis do Inngest

**4.1** No Inngest, vá em "Settings" → "Keys"

**4.2** Copie as duas chaves:
```bash
INNGEST_EVENT_KEY=evt_xxxxxxxxxx
INNGEST_SIGNING_KEY=signkey_xxxxxxxxxx
```

**4.3** Adicione essas variáveis na Vercel:
- Vá em vercel.com/dashboard
- Clique no projeto "dashboard-roilabz"
- Settings → Environment Variables
- Add New
- Cole as duas variáveis
- Redeploy (Deployments → ... → Redeploy)

---

## 🧪 VALIDAÇÃO FINAL

Depois de tudo configurado, teste:

**Teste 1 - Endpoint existe:**
```
https://dashboard-roilabz.vercel.app/api/inngest
```
✅ Deve retornar: `{"message":"Inngest endpoint"}`

**Teste 2 - Sync funcionando:**
- No Inngest, vá em "Runs"
- Deve aparecer execuções da função `sync-meta-ad-accounts`
- Status: Completed

**Teste 3 - Dados no Supabase:**
- Abra o Supabase
- Vá na tabela `meta_ad_accounts`
- Deve ter registros com as contas de anúncio

---

## ⚠️ PROBLEMAS COMUNS

### "npm install ainda dá erro"
→ Rode: `npm install --legacy-peer-deps`

### "Deploy falhou na Vercel"
→ Verifique os logs em Deployments → Failed → View Logs
→ Provavelmente falta alguma variável de ambiente

### "Inngest ainda dá erro de URL"
→ Espere 2-3 minutos após o deploy da Vercel
→ Verifique se a URL não tem aquele hash do preview deploy

### "Função não aparece no Inngest"
→ Verifique se INNGEST_SIGNING_KEY está correta na Vercel
→ Force um redeploy

---

## 📞 PRÓXIMO PASSO

Depois que conseguir deployar e sincronizar:

1. Me manda print da tela "Runs" do Inngest mostrando execução bem-sucedida
2. Me manda print do Supabase mostrando dados na tabela `meta_ad_accounts`

Aí eu valido se está tudo certo! 🚀
