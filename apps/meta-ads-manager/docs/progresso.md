---
tipo: progresso
projeto: ROILabz Dashboard
atualizado: 2026-04-01
---

## Redesign UI/UX — Sessão 2 (2026-04-01)

- **Data:** 2026-04-01
- **Contexto:** Usuário insatisfeito com a interface anterior ("neon dashboard"). Iniciamos um processo de design colaborativo do zero, etapa por etapa, coletando referências e decisões antes de implementar.
- **Status:** Em progresso — fundação implementada, faltam páginas internas

### Decisões de Design Coletadas

#### Estética geral
- Referência: Apple escuro + moderno/ágil + premium
- Inspiração: Linear, Vercel, Apple macOS dark mode

#### Tokens de design
- **Fonte:** Inter (substituiu IBM Plex Sans)
- **Fundo base:** `#09090b` (zinc-950)
- **Surface:** `#18181b` (zinc-900)
- **Texto primário:** `#fafafa`
- **Verde principal:** `#16a34a` — dark, sofisticado, legível
- **Erro:** `#ef4444` (vermelho)
- **Aviso:** `#eab308` (amarelo)
- **Modo:** Dark por padrão, toggle para claro disponível

#### Login
- Layout centralizado e limpo
- Fundo: grid pulsante verde (animação CSS)
- Logo: panda flat moderno cartoonizado, pisca os olhos
- Formulário: email + senha + botão "Entrar" + divisor + "Entrar com Google"

#### Sidebar
- Recolhível (expandida ↔ só ícones)
- Item ativo: fundo verde sutil `rgba(22,163,74,0.12)` + ícone verde
- Itens: Dashboard, Subir Campanhas, Campanhas, Alertas, Logs, Configurações

#### Header
- Toggle de tema (sol/lua) — persiste em localStorage
- Botão "Nova Campanha" (btn-primary)
- Ícone de alertas

#### Dashboard (a implementar)
- Linha de cima: 3 containers grandes — Valor Usado, Número de Vendas, ROAS
- Linha de baixo: 2 containers menores — Campanhas Ativas, Páginas Ativas
- Abaixo: tabela de campanhas (linhas e colunas, todas as colunas mantidas)

#### Campanhas (a implementar)
- Mesma estrutura do Dashboard (sem os containers de KPI)

#### Configurações (a implementar)
- Remove seção de permissões
- Remove subtítulo "Integrações de publicidade"
- Corrige "notificacoes" → "Notificações"

#### Alertas e Logs (a implementar)
- Só o usuário usa — manter funcional, aplicar novo estilo

#### Subir Campanhas — página setup (a implementar)
- Header: botões "Editar Rascunho" + "Iniciar Configuração" (no lugar de "+ Criar Campanha")
- Topo (35%): 2 cards lado a lado — Contas de Anúncio e Páginas ativas
- Linha divisória
- Grade de cards de templates (65%)

#### Wizard de criação (a implementar)
- Abas distribuídas em largura total
- Tab Modo: 3 cards verticais com título + descrição detalhada + recomendação de uso
- Tab Lotes: cards busca+seleção para Contas e Páginas; configuração verticalizada com dropdowns; checklist integrado
- Tab Criativos: 4 cards de modo de distribuição com descrição
- Tab Campanha: objetivo e estratégia de lance em cards com descrição; campos verticalizados
- Tab Copy: todos os campos verticalizados (UTMs incluídos)
- Tab Publicar: manter estrutura, ajustar proporção e estilo

### O que foi implementado

| Arquivo | Status | O que mudou |
|---------|--------|-------------|
| `globals.css` | ✅ | Inter, tokens Apple dark, verde #16a34a, red/yellow, light mode |
| `tailwind.config.js` | ✅ | Sincronizado com novos tokens |
| `_app.tsx` | ✅ | ThemeProvider integrado |
| `ThemeContext.tsx` | ✅ | Contexto criado (novo arquivo) |
| `pages/login.tsx` | ✅ | Grid pulsante, panda animado, email+senha+Google |
| `components/Sidebar.tsx` | ✅ | Recolhível, active state verde sutil |
| `components/Header.tsx` | ✅ | Toggle tema, alerts icon, CTA |
| `components/DashboardLayout.tsx` | ✅ | Removeu classe `.dark` hardcoded |
| `__tests__/DashboardLayout.test.tsx` | ✅ | Atualizado para novo comportamento |

### O que falta implementar

- [ ] Dashboard — containers KPI + tabela
- [ ] Campanhas — aplicar estilo
- [ ] Configurações — fixes solicitados
- [ ] Alertas e Logs — aplicar estilo
- [ ] Subir Campanhas (setup) — cards, header, 2 info cards
- [ ] Wizard — todas as 6 tabs
- [ ] Detalhe de campanha — aplicar estilo

### Testes
- **268/268 passando** após as mudanças

### Próximo passo se a sessão acabar aqui
Continuar com o Dashboard — containers KPI (2 linhas) e tabela de campanhas. Arquivo: `src/pages/dashboard.tsx` e `src/components/KPISection.tsx` / `KPICard.tsx`.

- **Tags:** [[ROILabz]] [[redesign]] [[design-system]] [[Inter]] [[Apple-dark]]
