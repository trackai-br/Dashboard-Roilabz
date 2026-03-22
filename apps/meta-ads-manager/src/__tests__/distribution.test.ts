import { calculateDistribution } from '@/lib/distribution';

// --- Helpers ---

function criarContas(quantidade: number) {
  return Array.from({ length: quantidade }, (_, i) => ({
    id: `acc-${i + 1}`,
    name: `Conta ${i + 1}`,
  }));
}

function criarPaginas(quantidade: number, adsetsAtivos = 0) {
  return Array.from({ length: quantidade }, (_, i) => ({
    id: `page-${i + 1}`,
    name: `Pagina ${i + 1}`,
    activeAdsets: adsetsAtivos,
  }));
}

// ============================
// TESTES DE DISTRIBUICAO (15 testes)
// ============================

describe('calculateDistribution', () => {
  // --- Validacao de entrada ---

  test('1 — sem contas → erro', () => {
    const resultado = calculateDistribution({
      selectedAccounts: [],
      selectedPages: criarPaginas(1),
      adsetsPerCampaign: 2,
      totalCampaigns: 1,
    });
    expect(resultado.distribution).toHaveLength(0);
    expect(resultado.errors.length).toBeGreaterThan(0);
    expect(resultado.errors[0]).toContain('conta');
  });

  test('2 — sem paginas → erro', () => {
    const resultado = calculateDistribution({
      selectedAccounts: criarContas(1),
      selectedPages: [],
      adsetsPerCampaign: 2,
      totalCampaigns: 1,
    });
    expect(resultado.distribution).toHaveLength(0);
    expect(resultado.errors[0]).toContain('página');
  });

  test('3 — zero adsets por campanha → erro', () => {
    const resultado = calculateDistribution({
      selectedAccounts: criarContas(1),
      selectedPages: criarPaginas(1),
      adsetsPerCampaign: 0,
      totalCampaigns: 1,
    });
    expect(resultado.errors[0]).toContain('inválido');
  });

  test('4 — zero campanhas totais → erro', () => {
    const resultado = calculateDistribution({
      selectedAccounts: criarContas(1),
      selectedPages: criarPaginas(1),
      adsetsPerCampaign: 2,
      totalCampaigns: 0,
    });
    expect(resultado.errors[0]).toContain('inválido');
  });

  // --- Distribuicao basica ---

  test('5 — 1 conta, 1 pagina, 1 campanha → 1 entrada', () => {
    const resultado = calculateDistribution({
      selectedAccounts: criarContas(1),
      selectedPages: criarPaginas(1),
      adsetsPerCampaign: 2,
      totalCampaigns: 1,
    });
    expect(resultado.errors).toHaveLength(0);
    expect(resultado.distribution).toHaveLength(1);
    expect(resultado.distribution[0]).toEqual({
      campaignIndex: 1,
      accountId: 'acc-1',
      pageId: 'page-1',
      pageName: 'Pagina 1',
      adsetCount: 2,
    });
  });

  test('6 — round-robin entre 2 contas', () => {
    const resultado = calculateDistribution({
      selectedAccounts: criarContas(2),
      selectedPages: criarPaginas(1),
      adsetsPerCampaign: 2,
      totalCampaigns: 4,
    });
    expect(resultado.errors).toHaveLength(0);
    expect(resultado.distribution).toHaveLength(4);
    expect(resultado.distribution[0].accountId).toBe('acc-1');
    expect(resultado.distribution[1].accountId).toBe('acc-2');
    expect(resultado.distribution[2].accountId).toBe('acc-1');
    expect(resultado.distribution[3].accountId).toBe('acc-2');
  });

  test('7 — 3 contas, 5 campanhas → round-robin correto', () => {
    const resultado = calculateDistribution({
      selectedAccounts: criarContas(3),
      selectedPages: criarPaginas(1),
      adsetsPerCampaign: 1,
      totalCampaigns: 5,
    });
    expect(resultado.distribution.map((d) => d.accountId)).toEqual([
      'acc-1', 'acc-2', 'acc-3', 'acc-1', 'acc-2',
    ]);
  });

  // --- Capacidade de slots ---

  test('8 — pagina com 249 adsets ativos e 2 por campanha → pagina filtrada (sem slots)', () => {
    const resultado = calculateDistribution({
      selectedAccounts: criarContas(1),
      selectedPages: [{ id: 'page-1', name: 'Pagina 1', activeAdsets: 249 }],
      adsetsPerCampaign: 2,
      totalCampaigns: 1,
    });
    // 250 - 249 = 1 slot, mas precisa de 2 → pagina filtrada → erro
    expect(resultado.errors.length).toBeGreaterThan(0);
    expect(resultado.errors[0]).toContain('slots');
  });

  test('9 — pagina com 248 adsets ativos e 2 por campanha → 1 campanha cabe', () => {
    const resultado = calculateDistribution({
      selectedAccounts: criarContas(1),
      selectedPages: [{ id: 'page-1', name: 'Pagina 1', activeAdsets: 248 }],
      adsetsPerCampaign: 2,
      totalCampaigns: 1,
    });
    expect(resultado.errors).toHaveLength(0);
    expect(resultado.distribution).toHaveLength(1);
  });

  test('10 — mais campanhas que slots disponiveis → alocacao parcial com erro', () => {
    const resultado = calculateDistribution({
      selectedAccounts: criarContas(1),
      selectedPages: [{ id: 'page-1', name: 'Pagina 1', activeAdsets: 240 }],
      adsetsPerCampaign: 5,
      totalCampaigns: 3,
    });
    // 250 - 240 = 10 slots. 5 por campanha → maximo 2 campanhas
    expect(resultado.distribution).toHaveLength(2);
    expect(resultado.errors.length).toBeGreaterThan(0);
    expect(resultado.errors[0]).toContain('1 campanha');
  });

  // --- Distribuicao multi-pagina ---

  test('11 — campanhas transbordam para segunda pagina quando a primeira acaba', () => {
    const resultado = calculateDistribution({
      selectedAccounts: criarContas(1),
      selectedPages: [
        { id: 'page-1', name: 'Pagina 1', activeAdsets: 245 },
        { id: 'page-2', name: 'Pagina 2', activeAdsets: 0 },
      ],
      adsetsPerCampaign: 5,
      totalCampaigns: 2,
    });
    expect(resultado.errors).toHaveLength(0);
    expect(resultado.distribution).toHaveLength(2);
    expect(resultado.distribution[0].pageId).toBe('page-1');
    expect(resultado.distribution[1].pageId).toBe('page-2');
  });

  test('12 — todas as entradas tem adsetCount correto', () => {
    const resultado = calculateDistribution({
      selectedAccounts: criarContas(2),
      selectedPages: criarPaginas(2),
      adsetsPerCampaign: 10,
      totalCampaigns: 5,
    });
    expect(resultado.errors).toHaveLength(0);
    for (const entrada of resultado.distribution) {
      expect(entrada.adsetCount).toBe(10);
    }
  });

  // --- campaignIndex ---

  test('13 — campaignIndex comeca em 1 e e sequencial', () => {
    const resultado = calculateDistribution({
      selectedAccounts: criarContas(1),
      selectedPages: criarPaginas(1),
      adsetsPerCampaign: 1,
      totalCampaigns: 4,
    });
    expect(resultado.distribution.map((d) => d.campaignIndex)).toEqual([1, 2, 3, 4]);
  });

  // --- Casos extremos ---

  test('14 — volume grande: 50 campanhas em 3 contas e 2 paginas', () => {
    const resultado = calculateDistribution({
      selectedAccounts: criarContas(3),
      selectedPages: criarPaginas(2),
      adsetsPerCampaign: 5,
      totalCampaigns: 50,
    });
    expect(resultado.errors).toHaveLength(0);
    expect(resultado.distribution).toHaveLength(50);
    // Todos devem ter adsetCount de 5
    expect(resultado.distribution.every((d) => d.adsetCount === 5)).toBe(true);
  });

  test('15 — pagina no limite exato MAX_ADSETS_PER_PAGE (250) → filtrada', () => {
    const resultado = calculateDistribution({
      selectedAccounts: criarContas(1),
      selectedPages: [{ id: 'page-1', name: 'Pagina 1', activeAdsets: 250 }],
      adsetsPerCampaign: 1,
      totalCampaigns: 1,
    });
    expect(resultado.errors.length).toBeGreaterThan(0);
    expect(resultado.distribution).toHaveLength(0);
  });
});
