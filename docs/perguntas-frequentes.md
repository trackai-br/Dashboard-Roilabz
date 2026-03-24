---
tipo: perguntas-frequentes
projeto: Roi-Labz
atualizado: 2026-03-23
---

# Perguntas Frequentes

## [2026-03-23] O User Token permite criar ads em qualquer pagina?
- **Pergunta:** Com User Access Token + pages_manage_ads, consigo criar ads com qualquer pagina que meu perfil administra?
- **Resposta:** Sim, desde que: (1) o token tenha `pages_manage_ads` concedido, (2) o usuario tenha papel na pagina (Admin/Editor), (3) a pagina esteja associada a conta de anuncios no Business Manager. Se faltar a associacao pagina-conta, erro 200/1815694 (permissions).
- **Tags:** [[Meta-API]] [[OAuth]] [[permissions]]

## [2026-03-23] Qual a diferenca entre User Token e System User Token?
- **Pergunta:** Estamos usando System Token?
- **Resposta:** Nao. O fluxo OAuth (`facebook.com/dialog/oauth`) gera User Access Token vinculado ao perfil pessoal. System User Token e criado no Business Manager e da acesso a todos os recursos da BM sem depender de usuario especifico. O Roi labz usa User Token com validade de 60 dias.
- **Tags:** [[Meta-API]] [[OAuth]] [[tokens]]
