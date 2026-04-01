# Contexto de Negocio — Roi labz (Meta Ads Manager)

## Objetivo do Projeto

O Roi labz e um dashboard de gestao de trafego pago que permite a **criacao e publicacao de campanhas Meta Ads em massa** diretamente pelo painel, sem precisar usar o Gerenciador de Anuncios do Facebook.

O diferencial e a **automacao em escala**: o usuario configura uma vez (objetivo, orcamento, publicos, criativos, copy) e o sistema distribui e publica dezenas de campanhas, ad sets e anuncios simultaneamente em multiplas contas e paginas.

## Problema que Resolve

Gestores de trafego que operam **multiplas contas e paginas** precisam criar campanhas repetitivas manualmente no Gerenciador de Anuncios do Facebook. Isso e:
- **Demorado**: cada campanha exige 10+ cliques para configurar
- **Propenso a erros**: copiar/colar nomes, esquecer pixel, errar budget
- **Nao escalavel**: subir 50 campanhas leva horas

O Roi labz transforma isso em um fluxo de **7 passos** (wizard) que gera e publica tudo de uma vez.

## Fluxo Principal do Usuario

1. **Conectar conta Meta** (OAuth) → Dashboard ve KPIs e campanhas
2. **Abrir wizard de campanhas** → Selecionar contas e paginas
3. **Configurar campanha** → Objetivo, orcamento (CBO/ABO), bid strategy
4. **Definir ad sets** → Tipos, targeting por pais, pixel, evento de conversao
5. **Configurar anuncios** → Criativos do Google Drive, copy, URL destino, UTM
6. **Revisar e publicar** → Preview da distribuicao, publicar em massa
7. **Acompanhar resultado** → Dashboard com ROAS, gastos, conversoes

## Modelo de Distribuicao

O sistema distribui campanhas entre contas e paginas automaticamente:
- **Round-robin** entre contas selecionadas
- **First-fit** para paginas (respeitando limite de 250 adsets/pagina)
- Cada campanha recebe nome padronizado: `[DD.MM][Conta][CP 01][LEVA X][Pagina] Label`

## Usuarios-Alvo

- **Gestores de trafego** que operam 5-50+ contas Meta simultaneamente
- **Agencias de marketing** que gerenciam multiplos clientes
- **Media buyers** que precisam de volume e velocidade na subida de campanhas

## Metricas de Sucesso

- Tempo para subir X campanhas (comparado com Gerenciador de Anuncios)
- Taxa de sucesso na publicacao (campanhas sem erro / total)
- Adocao: quantidade de campanhas criadas pelo painel vs diretamente no Facebook

## Glossario do Dominio

| Termo | Significado |
| :--- | :--- |
| **Leva** | Lote/rodada de campanhas subidas de uma vez |
| **CBO** | Campaign Budget Optimization — orcamento no nivel da campanha |
| **ABO** | Ad Set Budget Optimization — orcamento no nivel do ad set |
| **Bid Cap** | Limite maximo de lance por conversao |
| **Pixel** | Codigo de rastreamento Meta para medir conversoes |
| **Ad Set Type** | Template de configuracao de ad set (targeting + pixel + criativos) |
| **Creative** | Arquivo de midia (imagem/video) usado no anuncio |
| **Drive Link** | Link de pasta publica do Google Drive com os criativos |
| **Bulk Publish** | Publicacao em massa de campanha + ad sets + ads numa so operacao |
