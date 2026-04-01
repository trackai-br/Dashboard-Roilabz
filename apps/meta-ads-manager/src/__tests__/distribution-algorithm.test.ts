/**
 * TDD — Algoritmo de Distribuição de Campanhas
 *
 * Regras de negócio testadas:
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
 * BR-029: tipos atribuídos em blocos proporcionais (N camp ÷ M tipos = blocos iguais, sobra vai para o primeiro)
 * BR-030: 1 único tipo de adset → todas as campanhas usam esse tipo
 * BR-031: ads por campanha variam conforme o tipo atribuído ao bloco
 * BR-032: pageCurrentAdsets (count real da API) reduz capacidade disponível da página
 * BR-033: se pageCurrentAdsets não informado → assume 0 (página vazia) para todas
 * BR-034: capacidade disponível = pageAdLimit - pageCurrentAdsets[pageId]
 * BR-035: página com adsets existentes que já ultrapassaram o limite → capacidade = 0
 */

import {
  buildDistributionMap,
  calculateCampaignsPerType,
  calculateAdsForCampaign,
  getAdsetTypeForCampaign,
} from '@/lib/distribution';

// --- Helpers ---

function makeAccount(id: string, campaignCount: number) {
  return { accountId: id, accountName: `Conta ${id}`, campaignCount };
}

function makeAdsetType(adsetCount: number, creativesCount: number) {
  return {
    adsetCount,
    creativesInAdset: Array.from({ length: creativesCount }, (_, i) => `cr${i}.jpg`),
  };
}

const PAGE_1 = { pageId: 'p1', pageName: 'Página 1' };
const PAGE_2 = { pageId: 'p2', pageName: 'Página 2' };
const PAGE_3 = { pageId: 'p3', pageName: 'Página 3' };

const DEFAULT_ADSET = [makeAdsetType(2, 3)]; // 6 ads per campaign

// --- BR-029: calculateCampaignsPerType (blocos proporcionais) ---

describe('calculateCampaignsPerType — distribuição em blocos', () => {
  it('BR-029: divisão exata — 6 camp ÷ 2 tipos = [3, 3]', () => {
    expect(calculateCampaignsPerType(6, 2)).toEqual([3, 3]);
  });

  it('BR-029: divisão exata — 9 camp ÷ 3 tipos = [3, 3, 3]', () => {
    expect(calculateCampaignsPerType(9, 3)).toEqual([3, 3, 3]);
  });

  it('BR-029: sobra vai para o PRIMEIRO tipo — 7 camp ÷ 2 tipos = [4, 3]', () => {
    expect(calculateCampaignsPerType(7, 2)).toEqual([4, 3]);
  });

  it('BR-029: sobra 2 — 8 camp ÷ 3 tipos = [3, 3, 2]', () => {
    expect(calculateCampaignsPerType(8, 3)).toEqual([3, 3, 2]);
  });

  it('BR-029: sobra distribuída nos primeiros — 5 camp ÷ 3 tipos = [2, 2, 1]', () => {
    expect(calculateCampaignsPerType(5, 3)).toEqual([2, 2, 1]);
  });

  it('BR-030: 1 único tipo — todas as campanhas ficam no bloco único', () => {
    expect(calculateCampaignsPerType(6, 1)).toEqual([6]);
  });

  it('mais tipos que campanhas — tipos excedentes recebem 0', () => {
    expect(calculateCampaignsPerType(2, 4)).toEqual([1, 1, 0, 0]);
  });

  it('0 campanhas — todos os tipos recebem 0', () => {
    expect(calculateCampaignsPerType(0, 3)).toEqual([0, 0, 0]);
  });
});

// --- BR-028: getAdsetTypeForCampaign (bloco correto) ---

describe('getAdsetTypeForCampaign — tipo correto por índice de campanha', () => {
  const typeA = makeAdsetType(2, 3); // 6 ads
  const typeB = makeAdsetType(1, 5); // 5 ads

  it('BR-028: campanha 0 recebe TypeA (bloco 0)', () => {
    expect(getAdsetTypeForCampaign([typeA, typeB], 0, 6)).toBe(typeA);
  });

  it('BR-028: campanha 1 ainda é TypeA (bloco 0 tem 3 campanhas)', () => {
    expect(getAdsetTypeForCampaign([typeA, typeB], 1, 6)).toBe(typeA);
  });

  it('BR-028: campanha 2 ainda é TypeA (último do bloco 0)', () => {
    expect(getAdsetTypeForCampaign([typeA, typeB], 2, 6)).toBe(typeA);
  });

  it('BR-028: campanha 3 é TypeB (primeiro do bloco 1)', () => {
    expect(getAdsetTypeForCampaign([typeA, typeB], 3, 6)).toBe(typeB);
  });

  it('BR-028: campanha 5 é TypeB (último do bloco 1)', () => {
    expect(getAdsetTypeForCampaign([typeA, typeB], 5, 6)).toBe(typeB);
  });

  it('BR-030: único tipo → todas as campanhas recebem esse tipo', () => {
    expect(getAdsetTypeForCampaign([typeA], 0, 6)).toBe(typeA);
    expect(getAdsetTypeForCampaign([typeA], 5, 6)).toBe(typeA);
  });

  it('BR-029: sobra vai para o primeiro — 7 camp ÷ 2 tipos: camp 3 ainda é TypeA', () => {
    // [4, 3] → TypeA: 0-3, TypeB: 4-6
    expect(getAdsetTypeForCampaign([typeA, typeB], 3, 7)).toBe(typeA);
    expect(getAdsetTypeForCampaign([typeA, typeB], 4, 7)).toBe(typeB);
  });
});

// --- BR-008 + BR-031: calculateAdsForCampaign (ads do tipo atribuído) ---

describe('calculateAdsForCampaign — ads do tipo atribuído ao bloco', () => {
  const typeA = makeAdsetType(2, 3); // 6 ads
  const typeB = makeAdsetType(1, 5); // 5 ads

  it('BR-008: campanha no bloco TypeA → 6 ads (2×3)', () => {
    expect(calculateAdsForCampaign([typeA, typeB], 0, 6)).toBe(6);
  });

  it('BR-031: campanha no bloco TypeB → 5 ads (1×5)', () => {
    expect(calculateAdsForCampaign([typeA, typeB], 3, 6)).toBe(5);
  });

  it('BR-031: tipos com ads diferentes produzem consumo diferente de capacidade de página', () => {
    const adsCP0 = calculateAdsForCampaign([typeA, typeB], 0, 6); // TypeA block
    const adsCP3 = calculateAdsForCampaign([typeA, typeB], 3, 6); // TypeB block
    expect(adsCP0).not.toBe(adsCP3);
  });

  it('BR-013: campanha com criativo vazio → 0 ads', () => {
    const noCreatives = makeAdsetType(3, 0); // 0 criativos → 0 ads
    expect(calculateAdsForCampaign([noCreatives], 0, 6)).toBe(0);
  });

  it('BR-030: único tipo → mesma contagem para todas as campanhas', () => {
    expect(calculateAdsForCampaign([typeA], 0, 6)).toBe(6);
    expect(calculateAdsForCampaign([typeA], 5, 6)).toBe(6);
  });
});

// --- BR-001 a BR-013: buildDistributionMap ---

describe('buildDistributionMap — entradas e contagem', () => {
  it('BR-001: total de entradas = soma de campaignCount por conta', () => {
    const result = buildDistributionMap({
      accounts: [makeAccount('A', 3), makeAccount('B', 2)],
      pages: [PAGE_1],
      adsetTypes: DEFAULT_ADSET,
      pageAdLimit: 1000,
    });
    expect(result.error).toBeUndefined();
    expect(result.entries).toHaveLength(5);
  });

  it('BR-001: uma única conta com 6 campanhas → 6 entradas', () => {
    const result = buildDistributionMap({
      accounts: [makeAccount('A', 6)],
      pages: [PAGE_1],
      adsetTypes: DEFAULT_ADSET,
      pageAdLimit: 1000,
    });
    expect(result.entries).toHaveLength(6);
  });

  it('BR-002: conta com campaignCount=0 não gera entradas', () => {
    const result = buildDistributionMap({
      accounts: [makeAccount('A', 3), makeAccount('B', 0)],
      pages: [PAGE_1],
      adsetTypes: DEFAULT_ADSET,
      pageAdLimit: 1000,
    });
    const b_entries = result.entries.filter((e) => e.accountId === 'B');
    expect(b_entries).toHaveLength(0);
    expect(result.entries).toHaveLength(3);
  });

  it('BR-003: conta com campaignCount negativo → retorna erro', () => {
    const result = buildDistributionMap({
      accounts: [makeAccount('A', -1)],
      pages: [PAGE_1],
      adsetTypes: DEFAULT_ADSET,
    });
    expect(result.error).toBeDefined();
    expect(result.entries).toHaveLength(0);
  });

  it('REGRESSÃO BUG-DIST: 2 contas + 2 páginas não devem multiplicar campanhas (bug anterior: 2×2×N)', () => {
    const result = buildDistributionMap({
      accounts: [makeAccount('A', 3), makeAccount('B', 3)],
      pages: [PAGE_1, PAGE_2],
      adsetTypes: DEFAULT_ADSET,
      pageAdLimit: 1000,
    });
    // Devem ser 6, não 24 (2 contas × 2 páginas × 6 — bug anterior)
    expect(result.entries).toHaveLength(6);
  });
});

describe('buildDistributionMap — ordem de contas', () => {
  it('BR-004: campanhas da conta A são geradas antes das da conta B', () => {
    const result = buildDistributionMap({
      accounts: [makeAccount('A', 2), makeAccount('B', 2)],
      pages: [PAGE_1],
      adsetTypes: DEFAULT_ADSET,
      pageAdLimit: 1000,
    });
    const [cp0, cp1, cp2, cp3] = result.entries;
    expect(cp0.accountId).toBe('A');
    expect(cp1.accountId).toBe('A');
    expect(cp2.accountId).toBe('B');
    expect(cp3.accountId).toBe('B');
  });

  it('BR-004: campaignIndex é sequencial e único globalmente', () => {
    const result = buildDistributionMap({
      accounts: [makeAccount('A', 2), makeAccount('B', 2)],
      pages: [PAGE_1],
      adsetTypes: DEFAULT_ADSET,
      pageAdLimit: 1000,
    });
    const indexes = result.entries.map((e) => e.campaignIndex);
    expect(indexes).toEqual([0, 1, 2, 3]);
  });
});

describe('buildDistributionMap — atribuição de páginas', () => {
  it('BR-005: cada campanha tem exatamente uma página atribuída', () => {
    const result = buildDistributionMap({
      accounts: [makeAccount('A', 4)],
      pages: [PAGE_1, PAGE_2],
      adsetTypes: DEFAULT_ADSET,
      pageAdLimit: 1000,
    });
    result.entries.forEach((entry) => {
      expect(entry.pageId).toBeDefined();
      expect(typeof entry.pageId).toBe('string');
    });
  });

  it('BR-006: todas as campanhas vão para P1 quando há espaço suficiente', () => {
    const result = buildDistributionMap({
      accounts: [makeAccount('A', 3)],
      pages: [PAGE_1, PAGE_2],
      adsetTypes: DEFAULT_ADSET, // 6 ads/campanha
      pageAdLimit: 1000,
    });
    expect(result.entries.every((e) => e.pageId === 'p1')).toBe(true);
  });

  it('BR-006: quando P1 atinge o limite, restante vai para P2', () => {
    // 6 ads/camp, limite 12 → 2 campanhas em P1, 3ª em P2
    const result = buildDistributionMap({
      accounts: [makeAccount('A', 3)],
      pages: [PAGE_1, PAGE_2],
      adsetTypes: DEFAULT_ADSET, // 6 ads/camp
      pageAdLimit: 12,
    });
    expect(result.entries[0].pageId).toBe('p1');
    expect(result.entries[1].pageId).toBe('p1');
    expect(result.entries[2].pageId).toBe('p2');
  });

  it('BR-006: quando P2 também fica cheia, usa P3', () => {
    // 6 ads/camp, limite 6 → 1 campanha por página
    const result = buildDistributionMap({
      accounts: [makeAccount('A', 3)],
      pages: [PAGE_1, PAGE_2, PAGE_3],
      adsetTypes: DEFAULT_ADSET, // 6 ads/camp
      pageAdLimit: 6,
    });
    expect(result.entries[0].pageId).toBe('p1');
    expect(result.entries[1].pageId).toBe('p2');
    expect(result.entries[2].pageId).toBe('p3');
  });

  it('BR-007: capacidade padrão de página é 250 anúncios', () => {
    // 50 ads/camp → 5 campanhas = 250 (P1 cheia), 6ª vai para P2
    const result = buildDistributionMap({
      accounts: [makeAccount('A', 6)],
      pages: [PAGE_1, PAGE_2],
      adsetTypes: [makeAdsetType(5, 10)], // 50 ads/camp
      // pageAdLimit omitido → deve usar 250 como default
    });
    const p1 = result.entries.filter((e) => e.pageId === 'p1');
    const p2 = result.entries.filter((e) => e.pageId === 'p2');
    expect(p1).toHaveLength(5);
    expect(p2).toHaveLength(1);
  });

  it('cenário real: 2 contas (4+2 camp), 2 páginas, 50 ads/camp, limite 250', () => {
    // Conta A: 4 campanhas, Conta B: 2 campanhas
    // P1 aguenta 5 (5×50=250), 6ª vai para P2
    // A entrega CP1-CP4 para A, CP5-CP6 para B
    // CP1-CP5 vão para P1 (250 ads), CP6 vai para P2
    const result = buildDistributionMap({
      accounts: [makeAccount('A', 4), makeAccount('B', 2)],
      pages: [PAGE_1, PAGE_2],
      adsetTypes: [makeAdsetType(5, 10)], // 50 ads/camp
    });
    expect(result.error).toBeUndefined();
    expect(result.entries).toHaveLength(6);

    const p1 = result.entries.filter((e) => e.pageId === 'p1');
    const p2 = result.entries.filter((e) => e.pageId === 'p2');
    expect(p1).toHaveLength(5);
    expect(p2).toHaveLength(1);
    // A 6ª campanha pertence à conta B
    expect(p2[0].accountId).toBe('B');
  });
});

describe('buildDistributionMap — erros e casos limite', () => {
  it('BR-009: todas as páginas cheias antes do fim → erro, sem entradas parciais', () => {
    // 6 ads/camp, 1 página com limite 6 → apenas 1 campanha cabe
    // 3 campanhas solicitadas → erro na 2ª
    const result = buildDistributionMap({
      accounts: [makeAccount('A', 3)],
      pages: [PAGE_1],
      adsetTypes: DEFAULT_ADSET, // 6 ads/camp
      pageAdLimit: 6, // apenas 1 campanha cabe
    });
    expect(result.error).toBeDefined();
    expect(result.entries).toHaveLength(0);
  });

  it('BR-009: erro de capacidade menciona quantas campanhas não couberem', () => {
    const result = buildDistributionMap({
      accounts: [makeAccount('A', 5)],
      pages: [PAGE_1],
      adsetTypes: DEFAULT_ADSET, // 6 ads/camp
      pageAdLimit: 12, // 2 campanhas cabem, 3 não cabem
    });
    expect(result.error).toMatch(/3/); // deve mencionar que 3 campanhas não couberam
  });

  it('BR-010: lista de páginas vazia → erro', () => {
    const result = buildDistributionMap({
      accounts: [makeAccount('A', 3)],
      pages: [],
      adsetTypes: DEFAULT_ADSET,
    });
    expect(result.error).toBeDefined();
    expect(result.entries).toHaveLength(0);
  });

  it('BR-011: lista de contas vazia → erro', () => {
    const result = buildDistributionMap({
      accounts: [],
      pages: [PAGE_1],
      adsetTypes: DEFAULT_ADSET,
    });
    expect(result.error).toBeDefined();
    expect(result.entries).toHaveLength(0);
  });

  it('BR-012: lista de adsetTypes vazia → erro', () => {
    const result = buildDistributionMap({
      accounts: [makeAccount('A', 3)],
      pages: [PAGE_1],
      adsetTypes: [],
    });
    expect(result.error).toBeDefined();
    expect(result.entries).toHaveLength(0);
  });

  it('BR-013: campanha com 0 ads (sem criativos) não consome capacidade de página', () => {
    // 0 ads/camp → não consome capacidade → todas as campanhas cabem mesmo com limite=1
    const result = buildDistributionMap({
      accounts: [makeAccount('A', 5)],
      pages: [PAGE_1],
      adsetTypes: [makeAdsetType(3, 0)], // 0 criativos → 0 ads
      pageAdLimit: 1, // limite extremamente baixo — não deve importar
    });
    expect(result.error).toBeUndefined();
    expect(result.entries).toHaveLength(5);
    // Todas vão para P1 (0 ads cada)
    expect(result.entries.every((e) => e.pageId === 'p1')).toBe(true);
  });

  it('contas com apenas zeros de campaignCount → erro (total = 0)', () => {
    const result = buildDistributionMap({
      accounts: [makeAccount('A', 0), makeAccount('B', 0)],
      pages: [PAGE_1],
      adsetTypes: DEFAULT_ADSET,
    });
    expect(result.error).toBeDefined();
    expect(result.entries).toHaveLength(0);
  });
});

describe('buildDistributionMap — bloco de tipos (BR-028 a BR-031)', () => {
  const typeA = makeAdsetType(2, 3); // 6 ads
  const typeB = makeAdsetType(1, 5); // 5 ads

  it('BR-028: cenário real com 2 tipos em blocos — 6 camp (3+3): CP0-CP2=TypeA, CP3-CP5=TypeB', () => {
    const result = buildDistributionMap({
      accounts: [makeAccount('A', 6)],
      pages: [PAGE_1],
      adsetTypes: [typeA, typeB],
      pageAdLimit: 1000,
    });
    expect(result.error).toBeUndefined();
    expect(result.entries).toHaveLength(6);
    // Primeiras 3 campanhas → TypeA (adsetCount=2)
    expect(result.entries[0].adsetCount).toBe(2);
    expect(result.entries[1].adsetCount).toBe(2);
    expect(result.entries[2].adsetCount).toBe(2);
    // Últimas 3 campanhas → TypeB (adsetCount=1)
    expect(result.entries[3].adsetCount).toBe(1);
    expect(result.entries[4].adsetCount).toBe(1);
    expect(result.entries[5].adsetCount).toBe(1);
  });

  it('BR-031: 2 tipos com ads diferentes afetam troca de página corretamente', () => {
    // TypeA: 3 ads/camp, TypeB: 5 ads/camp; limite=10
    // [2,2] blocos → CP0,CP1=TypeA(3ads), CP2,CP3=TypeB(5ads)
    // CP0: 3ads→p1=7; CP1: 3ads→p1=4; 4<5 (prox é TypeB)→troca para P2
    // CP2: 5ads→p2=5; CP3: 5ads→p2=0 ✓
    const typeSmall = makeAdsetType(1, 3); // 3 ads
    const typeLarge = makeAdsetType(1, 5); // 5 ads
    const result = buildDistributionMap({
      accounts: [makeAccount('A', 4)],
      pages: [PAGE_1, PAGE_2],
      adsetTypes: [typeSmall, typeLarge],
      pageAdLimit: 10,
    });
    expect(result.error).toBeUndefined();
    expect(result.entries).toHaveLength(4);
    expect(result.entries[0].pageId).toBe('p1');
    expect(result.entries[1].pageId).toBe('p1');
    expect(result.entries[2].pageId).toBe('p2');
    expect(result.entries[3].pageId).toBe('p2');
  });
});

describe('buildDistributionMap — pageCurrentAdsets (BR-032 a BR-035)', () => {
  it('BR-033: sem pageCurrentAdsets → assume 0 para todas as páginas', () => {
    // pageAdLimit=12, 6 ads/camp → sem adsets existentes, 2 campanhas cabem em P1
    const result = buildDistributionMap({
      accounts: [makeAccount('A', 3)],
      pages: [PAGE_1, PAGE_2],
      adsetTypes: DEFAULT_ADSET, // 6 ads/camp
      pageAdLimit: 12,
      // pageCurrentAdsets omitido
    });
    expect(result.error).toBeUndefined();
    // P1 fica com 2 (0+6+6=12), P2 com 1
    expect(result.entries.filter((e) => e.pageId === 'p1')).toHaveLength(2);
    expect(result.entries.filter((e) => e.pageId === 'p2')).toHaveLength(1);
  });

  it('BR-032: página com 200 adsets existentes → apenas 50 de capacidade restante (limite 250)', () => {
    // P1 já tem 200 adsets, restam 50; 6 ads/camp → 8 campanhas cabem (8×6=48≤50), 9ª não
    const result = buildDistributionMap({
      accounts: [makeAccount('A', 9)],
      pages: [PAGE_1, PAGE_2],
      adsetTypes: DEFAULT_ADSET, // 6 ads/camp
      pageAdLimit: 250,
      pageCurrentAdsets: { p1: 200 },
    });
    expect(result.error).toBeUndefined();
    const p1 = result.entries.filter((e) => e.pageId === 'p1');
    const p2 = result.entries.filter((e) => e.pageId === 'p2');
    // P1 aceita 8 (8×6=48 ≤ 50 de capacidade restante), P2 recebe a 9ª
    expect(p1).toHaveLength(8);
    expect(p2).toHaveLength(1);
  });

  it('BR-034: capacidade disponível = pageAdLimit - pageCurrentAdsets[pageId]', () => {
    // P1 já tem 245 adsets, limite 250 → apenas 5 de capacidade; 6 ads/camp → P1 cheia, vai para P2
    const result = buildDistributionMap({
      accounts: [makeAccount('A', 2)],
      pages: [PAGE_1, PAGE_2],
      adsetTypes: DEFAULT_ADSET, // 6 ads/camp
      pageAdLimit: 250,
      pageCurrentAdsets: { p1: 245 },
    });
    expect(result.error).toBeUndefined();
    // P1 com 5 de capacidade não comporta 6 ads → todas vão para P2
    expect(result.entries.every((e) => e.pageId === 'p2')).toBe(true);
  });

  it('BR-035: página já no limite ou acima → capacidade = 0', () => {
    // P1 com 250/250 → 0 capacidade, campanha vai direto para P2
    const result = buildDistributionMap({
      accounts: [makeAccount('A', 2)],
      pages: [PAGE_1, PAGE_2],
      adsetTypes: DEFAULT_ADSET, // 6 ads/camp
      pageAdLimit: 250,
      pageCurrentAdsets: { p1: 250 },
    });
    expect(result.error).toBeUndefined();
    expect(result.entries.every((e) => e.pageId === 'p2')).toBe(true);
  });

  it('BR-035 + BR-009: todas as páginas no limite → erro, sem entradas parciais', () => {
    // P1 com 250, P2 com 250 → 0 capacidade em todas → erro
    const result = buildDistributionMap({
      accounts: [makeAccount('A', 3)],
      pages: [PAGE_1, PAGE_2],
      adsetTypes: DEFAULT_ADSET, // 6 ads/camp
      pageAdLimit: 250,
      pageCurrentAdsets: { p1: 250, p2: 250 },
    });
    expect(result.error).toBeDefined();
    expect(result.entries).toHaveLength(0);
  });

  it('BR-033: pageCurrentAdsets parcial → páginas não mencionadas assumem 0', () => {
    // P1 sem registro → assume 0; P2 com 248 → 2 de capacidade
    // 6 ads/camp, limite 250 → P1 comporta 41 camps (246 ads), mas usamos apenas 3
    const result = buildDistributionMap({
      accounts: [makeAccount('A', 3)],
      pages: [PAGE_1, PAGE_2],
      adsetTypes: DEFAULT_ADSET, // 6 ads/camp
      pageAdLimit: 250,
      pageCurrentAdsets: { p2: 248 }, // P1 não mencionada → assume 0
    });
    expect(result.error).toBeUndefined();
    // Todas as 3 campanhas cabem em P1 (18 ads ≤ 250)
    expect(result.entries.every((e) => e.pageId === 'p1')).toBe(true);
  });
});
