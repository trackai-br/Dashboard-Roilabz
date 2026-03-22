import { validateWizardState, ValidationError } from '@/lib/validation';
import type { WizardState } from '@/contexts/WizardContext';

// --- Helpers ---

function criarEstadoValido(overrides?: Partial<WizardState>): WizardState {
  return {
    currentStep: 5,
    completedSteps: [0, 1, 2, 3, 4],
    selectedAccountIds: ['acc-1'],
    selectedPageIds: ['page-1'],
    adsetsPerCampaign: 2,
    totalCampaigns: 1,
    distributionMap: [
      { campaignIndex: 1, accountId: 'acc-1', pageId: 'page-1', pageName: 'Pagina 1', adsetCount: 2 },
    ],
    campaignConfig: {
      objective: 'OUTCOME_SALES',
      namingPattern: { levaNumber: '08', creativeLabel: 'Cr1' },
      budgetType: 'CBO',
      budgetValue: 5000,
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      campaignStatus: 'PAUSED',
    },
    adsetTypes: [
      {
        id: 'type-1',
        name: 'Tipo A',
        adsetCount: 2,
        campaignsCount: 1,
        creativesInAdset: ['banner.jpg'],
        conversionLocation: 'WEBSITE',
        pixelId: 'px-1',
        conversionEvent: 'PURCHASE',
        startDate: '2026-04-01',
        targetCountries: ['BR'],
        adsetStatus: 'PAUSED',
      },
    ],
    adConfig: {
      destinationUrl: 'https://example.com/oferta',
      creativeFormat: 'image',
      driveLink: 'https://drive.google.com/drive/folders/abc123',
      creativeFiles: [
        { id: 'f1', fileName: 'banner.jpg', driveUrl: 'https://drive.google.com/uc?export=download&id=xyz', type: 'image' },
      ],
      primaryText: 'Texto do anuncio',
      headline: 'Titulo',
      description: 'Descricao',
      utmParams: { utm_source: 'facebook' },
    },
    templateName: '',
    isDraft: false,
    draftId: null,
    ...overrides,
  };
}

function camposDeErro(errors: ValidationError[]): string[] {
  return errors.map((e) => e.field);
}

// ============================
// TESTES DE VALIDACAO (15 testes)
// ============================

describe('validateWizardState', () => {
  // --- 1. Estado valido completo ---
  test('1 — estado valido retorna isValid=true sem erros', () => {
    const resultado = validateWizardState(criarEstadoValido());
    expect(resultado.isValid).toBe(true);
    expect(resultado.errors).toHaveLength(0);
  });

  // --- 2-3. Aba 1 — Contas ---
  test('2 — nenhuma conta selecionada → erro', () => {
    const resultado = validateWizardState(criarEstadoValido({ selectedAccountIds: [] }));
    expect(resultado.isValid).toBe(false);
    expect(camposDeErro(resultado.errors)).toContain('accounts');
  });

  test('3 — multiplas contas selecionadas → valido', () => {
    const resultado = validateWizardState(criarEstadoValido({ selectedAccountIds: ['acc-1', 'acc-2'] }));
    expect(camposDeErro(resultado.errors)).not.toContain('accounts');
  });

  // --- 4-5. Aba 2 — Paginas & Volume ---
  test('4 — nenhuma pagina selecionada → erro', () => {
    const resultado = validateWizardState(criarEstadoValido({ selectedPageIds: [] }));
    expect(resultado.isValid).toBe(false);
    expect(camposDeErro(resultado.errors)).toContain('pages');
  });

  test('5 — zero adsets por campanha → erro', () => {
    const resultado = validateWizardState(criarEstadoValido({ adsetsPerCampaign: 0 }));
    expect(camposDeErro(resultado.errors)).toContain('adsetsPerCampaign');
  });

  // --- 6-8. Aba 3 — Config da Campanha ---
  test('6 — sem objetivo → erro', () => {
    const estado = criarEstadoValido();
    estado.campaignConfig.objective = '';
    const resultado = validateWizardState(estado);
    expect(camposDeErro(resultado.errors)).toContain('objective');
  });

  test('7 — sem numero da leva → erro', () => {
    const estado = criarEstadoValido();
    estado.campaignConfig.namingPattern.levaNumber = '';
    const resultado = validateWizardState(estado);
    expect(camposDeErro(resultado.errors)).toContain('namingPattern.levaNumber');
  });

  test('8 — orcamento zero → erro', () => {
    const estado = criarEstadoValido();
    estado.campaignConfig.budgetValue = 0;
    const resultado = validateWizardState(estado);
    expect(camposDeErro(resultado.errors)).toContain('budgetValue');
  });

  // --- 9-10. Aba 4 — Tipos de Adset ---
  test('9 — nenhum tipo de adset → erro', () => {
    const resultado = validateWizardState(criarEstadoValido({ adsetTypes: [] }));
    expect(camposDeErro(resultado.errors)).toContain('adsetTypes');
  });

  test('10 — tipo de adset sem pixel → erro', () => {
    const estado = criarEstadoValido();
    estado.adsetTypes[0].pixelId = '';
    const resultado = validateWizardState(estado);
    expect(camposDeErro(resultado.errors)).toEqual(
      expect.arrayContaining([expect.stringContaining('pixelId')])
    );
  });

  // --- 11-13. Aba 5 — Config do Anuncio (CRITICO para integracao Drive) ---
  test('11 — sem URL de destino → erro', () => {
    const estado = criarEstadoValido();
    estado.adConfig!.destinationUrl = '';
    const resultado = validateWizardState(estado);
    expect(camposDeErro(resultado.errors)).toContain('destinationUrl');
  });

  test('12 — URL invalida (sem http) → erro', () => {
    const estado = criarEstadoValido();
    estado.adConfig!.destinationUrl = 'example.com';
    const resultado = validateWizardState(estado);
    expect(camposDeErro(resultado.errors)).toContain('destinationUrl');
  });

  test('13 — nenhum arquivo de criativo → erro', () => {
    const estado = criarEstadoValido();
    estado.adConfig!.creativeFiles = [];
    const resultado = validateWizardState(estado);
    expect(camposDeErro(resultado.errors)).toContain('creativeFiles');
  });

  // --- 14-15. Avisos de incompatibilidade de criativos ---
  test('14 — criativo referenciado no adset mas ausente nos arquivos → aviso', () => {
    const estado = criarEstadoValido();
    estado.adsetTypes[0].creativesInAdset = ['arquivo_faltante.jpg'];
    estado.adConfig!.creativeFiles = [
      { id: 'f1', fileName: 'outro.jpg', driveUrl: '', type: 'image' },
    ];
    const resultado = validateWizardState(estado);
    expect(resultado.warnings.length).toBeGreaterThan(0);
    expect(resultado.warnings[0].field).toBe('creativeMismatch');
    expect(resultado.warnings[0].message).toContain('arquivo_faltante.jpg');
  });

  test('15 — creativeFiles com driveUrl preenchido → validacao passa (sem erro no driveUrl)', () => {
    const estado = criarEstadoValido();
    estado.adConfig!.creativeFiles = [
      { id: 'f1', fileName: 'banner.jpg', driveUrl: 'https://drive.google.com/uc?export=download&id=abc', type: 'image' },
    ];
    const resultado = validateWizardState(estado);
    // Validacao NAO deve se importar com o conteudo do driveUrl — so verifica se fileName existe
    expect(camposDeErro(resultado.errors)).not.toContain('creativeFiles');
  });
});
