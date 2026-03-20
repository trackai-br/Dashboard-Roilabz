# Setup da Meta API

## DEPRECATED

Este guia de setup manual de token foi substituído pelo fluxo OAuth.

### Como conectar agora:
1. Acesse o dashboard em `/connections`
2. Clique em "Conectar com Facebook"
3. Autorize as permissões
4. Token é salvo automaticamente no banco (tabela `meta_connections`)
5. Refresh automático via Inngest job `refresh-meta-token` (diariamente)

### Variáveis de ambiente necessárias:
```env
META_APP_ID=...
META_APP_SECRET=...
META_API_VERSION=v23.0
META_OAUTH_REDIRECT_URI=https://seu-dominio/api/auth/meta/callback
NEXT_PUBLIC_META_APP_ID=...
```

### Permissões OAuth:
- `ads_read`, `ads_management`
- `pages_show_list`, `pages_read_engagement`
- `read_insights`, `business_management`

Ver [README.md](./README.md) para mais detalhes.
