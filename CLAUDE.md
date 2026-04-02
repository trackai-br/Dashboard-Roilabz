# Contexto deste Projeto: Roi labz

Este arquivo complementa o CLAUDE.md global (~/.claude/CLAUDE.md). As regras globais (framework de trabalho, formato de registros, permissões) já estão ativas. Aqui vai APENAS o que é específico 
deste projeto. Este é um documento VIVO — cresce junto com o projeto.

## Sobre o Projeto
- **Nome:** Roi labz
- **Descrição (linguagem simples):** Um dashboard de performance focado em análises de tráfego e subida de campanhas em massa diretamente pelo painel.
- **Stack:** Next.js, TypeScript, Supabase, Inngest, Tailwind CSS.
- **PRD / Requisitos:** [PREENCHER PELO CLAUDE CODE — ex: @docs/prd.md ou link externo]
- **Repositório:** `/Users/guilhermesimas/Documents/dashboard`

## Contexto Ativo
- **Trabalhando em:** Correção de erros na publicação em massa (createAdSet/createAd ignoravam campos críticos da Meta API).
- **Travado em:** Nenhum bloqueio atual.
- **Próximo passo:** Testar publicação completa (campanha + adset + ad) em produção após último deploy.

## Como Rodar e Testar este Projeto
- **Iniciar o projeto:** `npm run dev`
- **Rodar testes:** `npm run test`
- **Rodar testes de um arquivo só:** `npx jest src/__tests__/nome-do-teste.test.ts`
- **Build de produção:** `npm run build`

## Ambientes
| Ambiente | URL | Como acessar | Observações |
| :--- | :--- | :--- | :--- |
| **Desenvolvimento** | http://localhost:3000 | `npm run dev` | Usa banco Supabase (verificar se é local ou staging) |
| **Produção** | Vercel (auto-deploy da branch `main`) | `git push origin main` | Deploy automatico via Vercel |

## Integrações Externas
| Serviço | Pra que serve | Documentação | Limitações |
| :--- | :--- | :--- | :--- |
| **Supabase** | Banco de dados (PostgreSQL) + Auth (JWT) | https://supabase.com/docs | RLS ativo; singleton lazy para SSR |
| **Inngest** | Workflows async (sync contas, refresh token, bulk create) | https://www.inngest.com/docs | Hobby: 10s timeout; Pro: 60s |
| **Google Ads API** | Sync de contas Google Ads | https://developers.google.com/google-ads/api | Integracao parcial (sync apenas) |
| **Meta Graph API** | CRUD campanhas/adsets/ads, OAuth, sync contas | https://developers.facebook.com/docs/marketing-apis | Rate limit; v23.0; token 60 dias |
| **Google Drive API** | Buscar criativos (imagens/videos) de pastas publicas | https://developers.google.com/drive/api/v3 | Apenas API key (pastas publicas); max 100 arquivos |

## Processo de Deploy
1. Rodar testes: `npm test`
2. Build de producao: `npm run build`
3. Commit e push: `git push origin main`
4. Deploy automatico via Vercel (branch `main`)

## Páginas / Rotas do Projeto
### Páginas (frontend)
| Rota | O que faz | Observações |
| :--- | :--- | :--- |
| `/login` | Tela de login (Supabase Auth UI) | Redireciona para /dashboard se logado |
| `/auth/callback` | Callback do OAuth Supabase | Rota tecnica |
| `/dashboard` | Dashboard principal: KPIs, tabela de campanhas, sync | Pagina principal pos-login |
| `/campaigns` | Lista de campanhas com paginacao | Usa useMetaCampaigns |
| `/campaigns/setup` | Wizard de criacao de campanhas em massa (7 tabs) | WizardContext + ConfigPopup |
| `/campaigns/[campaignId]` | Detalhe de campanha especifica | EditCampaignDrawer |
| `/campaigns/[campaignId]/adsets/[adSetId]` | Detalhe de ad set especifico | Editor de ad set |
| `/connections` | Conexao OAuth Meta/Google | MetaAuthButton, GoogleAuthButton |
| `/alerts` | Gerenciamento de regras de alerta | CRUD de alertas |
| `/logs` | Historico de sincronizacoes | Debug e auditoria |
| `/settings` | Configuracoes do usuario | Preferencias |
| `/privacidade` | Politica de privacidade | Pagina estatica |

### Rotas de API (backend)

**Autenticacao**
| Rota | Metodo | O que faz | Auth? |
| :--- | :--- | :--- | :--- |
| `/api/auth/meta` | GET | Inicia fluxo OAuth Meta (gera CSRF state, redireciona) | Token via query |
| `/api/auth/meta/callback` | GET | Recebe code OAuth, troca por token longo (60 dias) | Nao (callback) |
| `/api/auth/meta/connection` | GET/POST | Verifica/gerencia conexao Meta ativa | Sim |
| `/api/auth/meta/disconnect` | POST | Revoga conexao Meta | Sim |

**Contas e Sync**
| Rota | Metodo | O que faz | Auth? |
| :--- | :--- | :--- | :--- |
| `/api/meta/sync-all` | POST | Sync completo: contas + paginas + pixels | Sim |
| `/api/meta/sync-accounts` | POST | Sync apenas ad accounts | Sim |
| `/api/meta/accounts` | GET | Lista contas Meta do usuario | Sim |
| `/api/meta/accounts/pages` | GET | Lista paginas Facebook da conta | Sim |
| `/api/meta/accounts/pixels` | GET | Lista pixels de conversao | Sim |
| `/api/meta/accounts/audiences` | GET | Lista publicos personalizados | Sim |
| `/api/accounts` | GET | Endpoint generico de contas | Sim |
| `/api/logs/sync` | GET | Historico de logs de sync | Sim |

**Campanhas, Adsets e Ads**
| Rota | Metodo | O que faz | Auth? |
| :--- | :--- | :--- | :--- |
| `/api/meta/campaigns` | GET | Lista campanhas (paginado, 50/pag) | Sim |
| `/api/meta/campaigns/[id]` | GET/PUT/DELETE | CRUD de campanha individual | Sim |
| `/api/meta/campaigns-create` | POST | Cria campanha unica | Sim |
| `/api/meta/bulk-campaigns-create` | POST | Cria campanhas em massa (via Inngest) | Sim |
| `/api/meta/bulk-publish` | POST | Publica campanhas+adsets+ads em massa (sincrono, 50s limit) | Sim |
| `/api/meta/publish-status/[jobId]` | GET | Status do job de publicacao | Sim |
| `/api/meta/retry-publish` | POST | Retry de publicacao falha | Sim |
| `/api/meta/adsets` | GET | Lista ad sets de campanha | Sim |
| `/api/meta/adsets/[id]` | GET/PUT/DELETE | CRUD de ad set | Sim |
| `/api/meta/ads` | GET | Lista ads de ad set | Sim |
| `/api/meta/ads/[id]` | GET/PUT/DELETE | CRUD de ad | Sim |
| `/api/meta/pages/[pageId]/adset-count` | GET | Conta adsets ativos na pagina (limite 250) | Sim |

**Drafts, Templates e Drive**
| Rota | Metodo | O que faz | Auth? |
| :--- | :--- | :--- | :--- |
| `/api/drafts/current` | GET | Carrega rascunho atual do wizard | Sim |
| `/api/drafts/save` | POST | Salva rascunho do wizard (auto-save) | Sim |
| `/api/templates/save` | GET/POST/DELETE | CRUD de templates de campanha | Sim |
| `/api/drive/list-files` | POST | Lista arquivos de midia de pasta Google Drive | Sim |

**Sistema**
| Rota | Metodo | O que faz | Auth? |
| :--- | :--- | :--- | :--- |
| `/api/health` | GET | Health check (env vars + DB) | Nao |
| `/api/inngest` | POST | Webhook handler do Inngest | Nao (assinado) |
| `/api/notifications` | GET/POST | Gerenciamento de notificacoes | Sim |
| `/api/alerts` | GET/POST | CRUD de regras de alerta | Sim |

## Arquitetura

| Camada | Tecnologia | Detalhes |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14.1 (Pages Router) + React 18.2 | SSR, Tailwind CSS 4.2, Framer Motion |
| **State** | React Query 5.90 + useReducer (WizardContext) | React Query: 15min stale, 10min GC |
| **Backend** | Next.js API Routes (serverless) | Vercel Functions (50s safety margin) |
| **Database** | Supabase PostgreSQL | RLS ativo, singleton lazy |
| **Auth** | Supabase Auth (JWT) + Meta OAuth (long-lived token 60d) | CSRF state com TTL 10min |
| **Async** | Inngest (cron + event-driven) | Sync contas 15min, refresh token diario |
| **Testes** | Jest 29 + React Testing Library | 90+ testes (validation, distribution, wizard, drive-utils) |
| **Deploy** | Vercel (auto-deploy branch main) | Hobby: 10s / Pro: 60s timeout |

### Fluxo de dados principal
```
Frontend (Pages + Hooks) → React Query → API Routes → Meta Graph API / Supabase
                                                    → Inngest (async workflows)
```

### Inngest Functions (cron/eventos)
| Funcao | Trigger | O que faz |
| :--- | :--- | :--- |
| `sync-meta-ad-accounts` | Cron `*/15 * * * *` | Sync contas Meta → DB |
| `refresh-meta-token` | Cron `0 8 * * *` | Renova tokens proximos de expirar (<7 dias) |
| `bulk-create-campaigns` | Evento `bulk-create-campaigns` | Cria campanhas/adsets/ads em paralelo |
| `check-alert-rules` | Cron (configuravel) | Verifica regras de alerta |

## Limitacoes Conhecidas
- Rate limit da Meta API pode bloquear subidas rapidas (erros 17, 32, 4 — delay de 500ms entre chamadas)
- Timeout de 50s no bulk-publish (Vercel); campanhas restantes marcadas como timeout
- Google Drive: apenas pastas publicas (API key), maximo 100 arquivos por pasta
- Video upload: usa `image_url` como fallback; upload via `/advideos` nao implementado
- Limite de 250 adsets por pagina Facebook (controlado pelo algoritmo de distribuicao)
- Google Ads: apenas sync de contas; CRUD de campanhas nao implementado

## Tratamento de Erros neste Projeto
- O tratamento de erros segue o framework global "Pensar Antes de Agir".
- **Padrão específico:** Toda falha em "Subida em Massa" deve gerar um log detalhado em `docs/bugs.md` com o ID da tentativa do Inngest.

## Regras Específicas deste Projeto
- **Inngest:** Nunca processar subida de campanhas diretamente na rota da API; use sempre workflows do Inngest.
- **Zod:** Todas as entradas de dados de campanhas devem ser validadas com schemas Zod.

## Agentes deste Projeto
- **Agente de Copy:** docs/agentes/copy.md (específico do Roi labz)
- **Vault central:** `~/Developer-Vault/agentes/copywriter/contexto.md`

## Sistema de Checkpoints
### Checkpoint automático — A CADA mudança significativa:
Após implementar qualquer funcionalidade, correção ou alteração, registre em `docs/checkpoints.md`:
## [YYYY-MM-DD HH:MM] — [Título curto]
- **O que mudou:** [descrição]
- **Arquivos alterados:** [lista]
- **Testes passando:** Sim/Não
- **Estado do projeto:** Funcionando / Quebrado / Parcial
- **Próximo passo se a sessão acabar aqui:** [descrição]

### Checkpoint de segurança — ANTES dos tokens acabarem:
## CHECKPOINT DE SESSÃO — [YYYY-MM-DD HH:MM]
- **Resumo da sessão:** [lista]
- **Estado atual:** [detalhes]
- **O que falta fazer:** [lista priorizada]
- **Comandos pra retomar:** [instruções]

## Regras Evolutivas
### Adicionadas por mim:
- [Vazio — adicione conforme o projeto avança]

### Sugeridas pelo Claude Code:
- [Vazio — o Claude Code sugerirá conforme encontrar padrões nas APIs de Ads]

## Estrutura de Documentação deste Projeto
A pasta `docs/` está no symlink para o Obsidian.
docs/
├── bugs.md
├── progresso.md
├── testes.md
├── checkpoints.md
├── decisoes.md
├── aprendizados.md
├── padroes-que-funcionam.md
├── antipadroes.md
├── dependencias.md
├── riscos.md
├── debitos-tecnicos.md
├── performance.md
├── seguranca.md
├── contexto-negocio.md
├── perguntas-frequentes.md
├── reunioes.md
├── ideias.md
└── agentes/

## Referências Externas
- **Vault central:** `~/Developer-Vault/`
- **Erros globais:** `~/Developer-Vault/conhecimento-global/erros-comuns.md`

