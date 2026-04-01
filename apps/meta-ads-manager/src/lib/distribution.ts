/**
 * Algoritmo de distribuição de campanhas em massa.
 *
 * BR-001: total_entries = soma de campaignCount por conta
 * BR-002: conta com campaignCount=0 → 0 entradas
 * BR-003: conta com campaignCount negativo → erro
 * BR-004: campanhas por conta são sequenciais (A antes de B)
 * BR-005: cada campanha recebe exatamente uma página
 * BR-006: páginas preenchidas sequencialmente (P1 até o limite, depois P2)
 * BR-007: capacidade padrão de página = 250 anúncios
 * BR-008: ads por campanha = adsetType_atribuído.adsetCount × len(creativesInAdset)
 * BR-009: se todas as páginas ficam cheias → erro, sem distribuição parcial
 * BR-010: lista de páginas vazia → erro
 * BR-011: lista de contas vazia → erro
 * BR-012: lista de adsetTypes vazia → erro
 * BR-013: campanha com 0 anúncios não consome capacidade de página
 * BR-028: cada campanha recebe exatamente UM tipo de adset
 * BR-029: tipos atribuídos em blocos (sobra no primeiro)
 * BR-030: 1 único tipo → todas as campanhas usam esse tipo
 * BR-031: ads por campanha variam conforme o tipo do bloco
 * BR-032: pageCurrentAdsets reduz capacidade disponível
 * BR-033: pageCurrentAdsets ausente → assume 0
 * BR-034: capacidade disponível = pageAdLimit - pageCurrentAdsets[pageId]
 * BR-035: página já no limite ou acima → capacidade = 0
 */

const DEFAULT_PAGE_AD_LIMIT = 250;

export interface AccountEntry {
  accountId: string;
  accountName?: string;
  campaignCount: number;
}

export interface PageEntry {
  pageId: string;
  pageName?: string;
}

export interface AdsetTypeForDist {
  adsetCount: number;
  creativesInAdset: string[];
  [key: string]: unknown;
}

export interface DistributionEntry {
  campaignIndex: number;
  accountId: string;
  pageId: string;
  adsetCount: number;
  adsCount: number;
}

export interface BuildDistributionInput {
  accounts: AccountEntry[];
  pages: PageEntry[];
  adsetTypes: AdsetTypeForDist[];
  pageAdLimit?: number;
  pageCurrentAdsets?: Record<string, number>;
}

export interface BuildDistributionResult {
  entries: DistributionEntry[];
  error?: string;
}

/**
 * BR-029: Distribui N campanhas em M blocos proporcionais.
 * A sobra (N mod M) vai para os primeiros tipos, um por tipo.
 * Exemplos: (6,2)=[3,3], (7,2)=[4,3], (5,3)=[2,2,1], (2,4)=[1,1,0,0]
 */
export function calculateCampaignsPerType(totalCampaigns: number, typeCount: number): number[] {
  if (typeCount === 0) return [];
  const base = Math.floor(totalCampaigns / typeCount);
  const remainder = totalCampaigns % typeCount;
  return Array.from({ length: typeCount }, (_, i) => base + (i < remainder ? 1 : 0));
}

/**
 * BR-028: Retorna o adset type correspondente à campanha de índice campaignIndex,
 * usando distribuição em blocos proporcionais.
 */
export function getAdsetTypeForCampaign<T extends AdsetTypeForDist>(
  adsetTypes: T[],
  campaignIndex: number,
  totalCampaigns: number
): T {
  if (adsetTypes.length === 1) return adsetTypes[0];

  const blocks = calculateCampaignsPerType(totalCampaigns, adsetTypes.length);
  let accumulated = 0;
  for (let i = 0; i < blocks.length; i++) {
    accumulated += blocks[i];
    if (campaignIndex < accumulated) return adsetTypes[i];
  }
  // Fallback ao último tipo (não deve acontecer com índices válidos)
  return adsetTypes[adsetTypes.length - 1];
}

/**
 * BR-008 + BR-031: Calcula o número de ads para a campanha no índice dado,
 * usando o tipo de adset atribuído pelo bloco.
 */
export function calculateAdsForCampaign(
  adsetTypes: AdsetTypeForDist[],
  campaignIndex: number,
  totalCampaigns: number
): number {
  const type = getAdsetTypeForCampaign(adsetTypes, campaignIndex, totalCampaigns);
  return type.adsetCount * type.creativesInAdset.length;
}

/**
 * Constrói o mapa de distribuição completo: associa cada campanha a uma conta,
 * uma página e um tipo de adset, respeitando capacidade de página.
 */
export function buildDistributionMap(input: BuildDistributionInput): BuildDistributionResult {
  const {
    accounts,
    pages,
    adsetTypes,
    pageAdLimit = DEFAULT_PAGE_AD_LIMIT,
    pageCurrentAdsets = {},
  } = input;

  // Validações de entrada
  if (accounts.length === 0) {
    return { entries: [], error: 'Nenhuma conta fornecida.' };
  }
  if (pages.length === 0) {
    return { entries: [], error: 'Nenhuma página fornecida.' };
  }
  if (adsetTypes.length === 0) {
    return { entries: [], error: 'Nenhum tipo de adset fornecido.' };
  }

  // BR-003: campaignCount negativo → erro imediato
  for (const acc of accounts) {
    if (acc.campaignCount < 0) {
      return {
        entries: [],
        error: `Conta ${acc.accountId} tem campaignCount negativo (${acc.campaignCount}).`,
      };
    }
  }

  // Calcula total de campanhas
  const totalCampaigns = accounts.reduce((sum, a) => sum + a.campaignCount, 0);
  if (totalCampaigns === 0) {
    return { entries: [], error: 'O total de campanhas é 0. Verifique o campaignCount das contas.' };
  }

  // Capacidade disponível por página (BR-034, BR-035)
  const pageCapacity: Record<string, number> = {};
  for (const page of pages) {
    const used = pageCurrentAdsets[page.pageId] ?? 0;
    pageCapacity[page.pageId] = Math.max(0, pageAdLimit - used);
  }

  const entries: DistributionEntry[] = [];
  let pageIndex = 0;
  let globalCampaignIndex = 0;

  for (const account of accounts) {
    // BR-002: conta com campaignCount=0 não gera entradas
    for (let i = 0; i < account.campaignCount; i++) {
      const adsCount = calculateAdsForCampaign(adsetTypes, globalCampaignIndex, totalCampaigns);
      const type = getAdsetTypeForCampaign(adsetTypes, globalCampaignIndex, totalCampaigns);

      // BR-006: avança para a próxima página quando a atual não comporta os ads
      // BR-013: campanha com 0 ads não consome capacidade
      if (adsCount > 0) {
        while (
          pageIndex < pages.length &&
          pageCapacity[pages[pageIndex].pageId] < adsCount
        ) {
          pageIndex++;
        }
      }

      // BR-009: sem página disponível → erro, sem entradas parciais
      if (pageIndex >= pages.length) {
        const remaining = totalCampaigns - globalCampaignIndex;
        return {
          entries: [],
          error: `Capacidade insuficiente: ${remaining} campanha(s) não couberam nas páginas disponíveis.`,
        };
      }

      const page = pages[pageIndex];
      pageCapacity[page.pageId] -= adsCount;

      entries.push({
        campaignIndex: globalCampaignIndex,
        accountId: account.accountId,
        pageId: page.pageId,
        adsetCount: type.adsetCount,
        adsCount,
      });

      globalCampaignIndex++;
    }
  }

  return { entries };
}
