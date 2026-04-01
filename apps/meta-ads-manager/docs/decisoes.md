---
tipo: decisoes
projeto: ROILabz Dashboard
atualizado: 2026-04-01
---

## Redesign — Estética Apple dark + Inter

- **Data:** 2026-04-01
- **Contexto:** Interface anterior "neon dashboard" foi rejeitada pelo usuário. Fizemos levantamento colaborativo de toda a UI antes de implementar.
- **Detalhes:**
  - Fonte: Inter (padrão web premium, usado por Linear/Vercel/Notion)
  - Paleta: zinc-950/900/800 para fundos, fafafa para texto, verde #16a34a
  - Motivo do verde: verde escuro sofisticado, legível, remete a dinheiro/resultado
  - Modo escuro padrão com toggle para claro
- **Tags:** [[design-system]] [[Inter]] [[Apple-dark]] [[ROILabz]]

---

## Verde #16a34a como cor principal

- **Data:** 2026-04-01
- **Contexto:** Usuário queria verde escuro e sofisticado mas muito legível.
- **Detalhes:** `#16a34a` (green-700 Tailwind) escolhido. Usado em: botões primários, itens ativos na sidebar, badges ativos, destaque de foco. Substituiu o neon `#39ff14` anterior.
- **Tags:** [[design-system]] [[verde]] [[btn-primary]]

---

## Vermelho + Amarelo para erros/avisos

- **Data:** 2026-04-01
- **Contexto:** Usuário definiu: vermelho para erros, amarelo para avisos.
- **Detalhes:** `#ef4444` (red-500) para erro, `#eab308` (yellow-500) para aviso. No modo claro, ajustados para red-600 e yellow-600 para manter legibilidade.
- **Tags:** [[design-system]] [[erros]] [[avisos]]

---

## Sidebar recolhível

- **Data:** 2026-04-01
- **Contexto:** Usuário quer sidebar que recolhe para só ícones.
- **Detalhes:** `open` prop controla largura: 220px (aberta) vs 56px (fechada). Animação CSS 220ms spring. Ícone tooltip quando fechada.
- **Tags:** [[sidebar]] [[UX]]

---

## Panda como logo

- **Data:** 2026-04-01
- **Contexto:** Usuário pediu um panda pequeno e animado como logo da empresa.
- **Detalhes:** SVG inline flat moderno cartoonizado. Animação de piscar os olhos via useState + setTimeout. Sem biblioteca externa.
- **Tags:** [[logo]] [[panda]] [[animação]]

---

## Grid pulsante no login

- **Data:** 2026-04-01
- **Contexto:** Usuário queria animação no login que desse sensação de "ligar uma Ferrari" — algo tech e premium.
- **Detalhes:** Background com `linear-gradient` criando grid de linhas verde. Animação CSS `gridPulse` que alterna opacidade 0.6–1.0 em 4s. Radial gradient overlay concentra o foco no centro.
- **Tags:** [[login]] [[animação]] [[grid]]

---

## ThemeContext para dark/light

- **Data:** 2026-04-01
- **Contexto:** Usuário quer dark mode padrão com opção de mudar para claro.
- **Detalhes:** React context (`ThemeContext`) gerencia estado do tema. Persiste em `localStorage`. Aplica `data-theme="light"` no `document.documentElement` para light mode; dark é o padrão (sem atributo). Toggle sol/lua no Header.
- **Tags:** [[tema]] [[dark-mode]] [[light-mode]]
