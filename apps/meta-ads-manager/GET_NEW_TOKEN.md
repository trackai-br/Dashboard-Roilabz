# Como Renovar o Token Meta

## DEPRECATED

Tokens agora sao gerenciados automaticamente via OAuth.

### Fluxo atual:
1. Token obtido via Facebook Login (OAuth) na pagina `/connections`
2. Token salvo na tabela `meta_connections` no Supabase
3. Token valido por ~60 dias (long-lived token)
4. Inngest job `refresh-meta-token` renova automaticamente tokens com <7 dias para expirar
5. Se token expirar, indicador no header avisa para reconectar

### Se o token expirou:
1. Acesse `/connections` no dashboard
2. Clique em "Reconectar"
3. Autorize novamente no Facebook
4. Pronto — novo token salvo automaticamente

Ver [README.md](./README.md) para mais detalhes.
