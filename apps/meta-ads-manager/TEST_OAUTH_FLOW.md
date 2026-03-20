# Teste Manual do Fluxo OAuth - Meta Ads Manager

## Checklist de Testes

### 1. Teste de Inicialização OAuth ✅
- [ ] Ir para `/settings`
- [ ] Ver componente "MetaConnectionCard"
- [ ] Status deve mostrar "Not Connected"
- [ ] Botão "Connect with Meta" deve estar visível

### 2. Teste do Clique no Botão
- [ ] Clicar em "Connect with Meta"
- [ ] Deve redirecionar para Facebook OAuth dialog
- [ ] URL deve ser: `https://www.facebook.com/v21.0/dialog/oauth?...`

### 3. Teste da Validação de State (CSRF)
O state é gerado aleatoriamente e salvo em `oauth_states` com TTL de 10 minutos.

**Verificar:**
- [ ] State foi salvo em Supabase (table: `oauth_states`)
- [ ] Ao fazer login no Facebook, o state volta na URL de callback
- [ ] O state é validado contra a tabela

**Para debugar:**
```sql
-- Ver states salvos (Supabase SQL Editor)
SELECT * FROM oauth_states;
SELECT * FROM oauth_states WHERE provider = 'meta';
```

### 4. Teste de Troca de Tokens
Quando Facebook redireciona para `/api/auth/meta/callback`:

- [ ] Código é trocado por short-lived token (5400s ≈ 1.5h)
- [ ] Short-lived é trocado por long-lived token (5184000s ≈ 60 dias)
- [ ] Validar nos logs: `[OAuth] Exchanging code for short-lived token...`

### 5. Teste de Salvamento de Conexão
Após o fluxo OAuth:

- [ ] Deve ser criada/atualizada row em `meta_connections`
- [ ] Campos preenchidos:
  - `user_id` — ID do usuário autenticado
  - `meta_user_id` — ID da conta Meta
  - `meta_user_name` — Nome da conta Meta
  - `meta_access_token` — Token long-lived
  - `meta_token_expires_at` — Expiração (60 dias)
  - `meta_scopes` — Permissões concedidas
  - `connection_status` — 'active'

**Verificar no Supabase:**
```sql
SELECT * FROM meta_connections WHERE user_id = 'seu_user_id';
```

### 6. Teste da URL de Sucesso
Após salvar conexão:

- [ ] Redirecionar para `/connections?connected=true&provider=meta`
- [ ] URL deve limpar via `window.history.replaceState()`
- [ ] Página deve mostrar conexão ativa

### 7. Teste do Card de Conexão
Componente `MetaConnectionCard.tsx`:

- [ ] Deve mostrar nome da conta Meta
- [ ] Data de conexão
- [ ] Data de expiração
- [ ] Badge de status (🟢 Valid / 🟡 Expiring / 🔴 Expired)
- [ ] Botão "Disconnect"

### 8. Teste de Desconexão
- [ ] Clicar em "Disconnect"
- [ ] Confirmação modal deve aparecer
- [ ] Ao confirmar, fazer POST para `/api/auth/meta/disconnect`
- [ ] Row deve ser deletada de `meta_connections`
- [ ] Card deve voltar a "Not Connected"

### 9. Teste de Reconexão
- [ ] Clicar novamente em "Connect with Meta"
- [ ] Seguir fluxo OAuth novamente
- [ ] Deve atualizar row existente (não criar nova)

## Logs para Debugar

Ver console do servidor (Vercel logs):

```bash
# Inicialização
[OAuth] Initiating Meta OAuth flow...
[OAuth] State saved to Supabase: xxxxx...

# Callback
[OAuth] Validating state from Supabase...
[OAuth] State validated successfully
[OAuth] Exchanging code for short-lived token...
[OAuth] Exchanging short-lived for long-lived token...
[OAuth] Fetching user info...
[OAuth] Fetching granted permissions...
[OAuth] Saving connection for user: xxxxx
[OAuth] Success - redirecting to connections page
```

## Testes de Erro (Edge Cases)

### CSRF Attack - State Inválido
```bash
# Simular request com state fake
curl "http://localhost:3000/api/auth/meta/callback?code=FAKE&state=INVALID"
# Esperado: Redirecionar com error=csrf&message=state_mismatch
```

### CSRF Attack - State Expirado
```bash
# Inserir state que expirou há 15 minutos
INSERT INTO oauth_states (state, provider, expires_at, created_at)
VALUES ('test_expired', 'meta', NOW() - INTERVAL '15 minutes', NOW());

# Usar esse state no callback
# Esperado: Redirecionar com error=csrf&message=state_expired
```

### Replay Attack Prevention
```bash
# Usar mesmo state 2x
# 1ª tentativa: ✅ Sucesso, state é deletado
# 2ª tentativa: ❌ Falha, state_mismatch
```

## Verificar Integração com User Session

Após conexão:

```javascript
// No browser console
const { data: session } = await supabase.auth.getSession();
console.log(session.user.id); // Deve ser preenchido

// Verificar que a conexão foi salva com esse user_id
```

## Se der Erro...

### Error: CSRF validation failed
- [ ] State pode ter expirado (10 minutos TTL)
- [ ] Refazer do início

### Error: Token exchange failed
- [ ] Verificar se `META_APP_ID` e `META_APP_SECRET` estão corretos
- [ ] Verificar se `META_OAUTH_REDIRECT_URI` está correto
- [ ] Verificar se app Meta está aprovado

### Error: Failed to fetch user info
- [ ] Facebook pode ter rejeitado o token
- [ ] Verificar permissões concedidas
- [ ] Verificar versão da API (v21.0)

### Error: Unauthorized callback attempt
- [ ] Usuário não está autenticado
- [ ] Verificar se `getUserFromRequest()` está funcionando
- [ ] Limpar cookies e refazer login

## Próximas Etapas Após Teste

- [ ] Deploy para production (Vercel)
- [ ] Testar com conta Meta real
- [ ] Testar renovação de token (se implementado)
- [ ] Testar revogação de permissões do lado do Facebook
