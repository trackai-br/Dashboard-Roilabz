# 🚀 Executar Migrations — Supabase

Como a autenticação direta ao PostgreSQL é restrita pelo Supabase por segurança, você precisa executar as migrations manualmente via SQL Editor. Leva **2 minutos**.

---

## ⚡ Passos (Rápido)

### 1️⃣ Abrir SQL Editor
1. Vá para: **https://app.supabase.com**
2. Selecione seu projeto: **avcappbznnecuryuekgt**
3. Clique em **SQL Editor** (lado esquerdo)
4. Clique em **+ New Query**

### 2️⃣ Copiar SQL
1. Abra o arquivo: `apps/meta-ads-manager/migrations/000_master_migrations.sql`
2. **Selecione TODO o conteúdo** (Cmd+A ou Ctrl+A)
3. **Copie** (Cmd+C ou Ctrl+C)

### 3️⃣ Executar
1. Cole no editor SQL do Supabase (Cmd+V ou Ctrl+V)
2. Clique em **RUN** (ou Cmd+Enter)
3. Aguarde aparecer a mensagem verde: ✅ **Success**

### 4️⃣ Verificar
```bash
# Volte ao terminal e execute:
npm run check-tables
```

Se aparecer:
```
✅ Criadas: 6/6 — Banco pronto!
```

Você está pronto para o próximo passo.

---

## 📋 Status Esperado

Se houver mensagens como:
```
"relation "meta_accounts" already exists"
```

**Não é erro!** Significa que a tabela já foi criada. É seguro ignorar.

---

## ❌ Se houver erro

Mensagens comuns e soluções:

| Erro | Solução |
|------|---------|
| `permission denied` | Verifique se está usando a **admin key** (SUPABASE_SERVICE_ROLE_KEY) |
| `syntax error` | Copie novamente o arquivo inteiro sem editar |
| `column does not exist` | Aguarde a página atualizar e tente novamente |

---

## ✅ Próximos Passos

Após confirmar que os 6 tables foram criados:

1. **Configurar Google OAuth** → Ver: `docs/SETUP_GUIDE.md` (Passo 2)
2. **Testar Login** → Acesse http://localhost:3000/login
3. **Verificar Dashboard** → Deve caregar com KPI cards vazios

---

**Tempo total:** ~2 minutos
**Status:** Manual via Supabase UI (não há automação possível por restricções de segurança)
