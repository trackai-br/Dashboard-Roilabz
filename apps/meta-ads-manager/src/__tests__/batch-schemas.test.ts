import { validateBatch, validateAllBatches } from '@/lib/batch-schemas';
import type { BatchConfig } from '@/stores/wizard-store';

// --- Helpers ---

function validAdset() {
  return {
    id: 'adset-1',
    name: 'Conjunto 1',
    adsetCount: 1,
    creativesInAdset: [],
    conversionLocation: 'WEBSITE',
    pixelId: 'px-123',
    conversionEvent: 'PURCHASE',
    startDate: '2026-04-01',
    targetCountries: ['BR'],
    adsetStatus: 'PAUSED' as const,
  };
}

function validBatch(overrides?: Partial<BatchConfig>): BatchConfig {
  return {
    id: 'batch-1',
    name: 'Lote 1',
    accounts: [{ accountId: 'acc-1', accountName: 'Conta 1', currency: 'BRL' }],
    pages: [{ pageId: 'page-1', pageName: 'Página 1', accountId: 'acc-1' }],
    adsetsPerCampaign: 2,
    totalCampaigns: 3,
    campaignConfig: {
      objective: 'OUTCOME_SALES',
      namingPattern: { levaNumber: '01', creativeLabel: 'ESPORTIVA' },
      namingTags: [],
      budgetType: 'CBO',
      budgetValue: 5000,
      bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
      campaignStatus: 'PAUSED',
    },
    adsetTypes: [validAdset()],
    isExpanded: true,
    isComplete: false,
    ...overrides,
  };
}

// --- Tests ---

describe('validateBatch — lote válido', () => {
  it('retorna isValid=true para lote completamente preenchido', () => {
    const result = validateBatch(validBatch());
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('retorna sem warnings para orçamento normal', () => {
    const result = validateBatch(validBatch());
    expect(result.warnings).toHaveLength(0);
  });
});

describe('validateBatch — contas e páginas', () => {
  it('erro quando sem contas', () => {
    const result = validateBatch(validBatch({ accounts: [] }));
    expect(result.isValid).toBe(false);
    expect(result.errors['accounts']).toBeDefined();
  });

  it('erro quando sem páginas', () => {
    const result = validateBatch(validBatch({ pages: [] }));
    expect(result.isValid).toBe(false);
    expect(result.errors['pages']).toBeDefined();
  });
});

describe('validateBatch — volume', () => {
  it('erro quando totalCampaigns = 0', () => {
    const result = validateBatch(validBatch({ totalCampaigns: 0 }));
    expect(result.isValid).toBe(false);
    expect(result.errors['totalCampaigns']).toBeDefined();
  });

  it('erro quando adsetsPerCampaign > 250', () => {
    const result = validateBatch(validBatch({ adsetsPerCampaign: 251 }));
    expect(result.isValid).toBe(false);
    expect(result.errors['adsetsPerCampaign']).toBeDefined();
  });
});

describe('validateBatch — configuração de campanha', () => {
  it('erro quando objetivo vazio', () => {
    const result = validateBatch(validBatch({
      campaignConfig: { ...validBatch().campaignConfig, objective: '' },
    }));
    expect(result.isValid).toBe(false);
    expect(result.errors['campaignConfig.objective']).toBeDefined();
  });

  it('erro quando orçamento = 0', () => {
    const result = validateBatch(validBatch({
      campaignConfig: { ...validBatch().campaignConfig, budgetValue: 0 },
    }));
    expect(result.isValid).toBe(false);
    expect(result.errors['campaignConfig.budgetValue']).toBeDefined();
  });

  it('erro quando número da leva vazio', () => {
    const result = validateBatch(validBatch({
      campaignConfig: {
        ...validBatch().campaignConfig,
        namingPattern: { levaNumber: '', creativeLabel: 'TESTE' },
      },
    }));
    expect(result.isValid).toBe(false);
    expect(result.errors['campaignConfig.namingPattern.levaNumber']).toBeDefined();
  });

  it('warning para estratégia ROAS', () => {
    const result = validateBatch(validBatch({
      campaignConfig: { ...validBatch().campaignConfig, bidStrategy: 'LOWEST_COST_WITH_MIN_ROAS' },
    }));
    expect(result.isValid).toBe(true);
    expect(result.warnings.some((w) => w.includes('ROAS'))).toBe(true);
  });
});

describe('validateBatch — tipos de conjunto', () => {
  it('erro quando sem adsets', () => {
    const result = validateBatch(validBatch({ adsetTypes: [] }));
    expect(result.isValid).toBe(false);
    expect(result.errors['adsetTypes']).toBeDefined();
  });

  it('erro quando adset sem pixel', () => {
    const result = validateBatch(validBatch({
      adsetTypes: [{ ...validAdset(), pixelId: '' }],
    }));
    expect(result.isValid).toBe(false);
    expect(result.errors['adsetTypes.0.pixelId']).toBeDefined();
  });

  it('erro quando adset sem nome', () => {
    const result = validateBatch(validBatch({
      adsetTypes: [{ ...validAdset(), name: '' }],
    }));
    expect(result.isValid).toBe(false);
    expect(result.errors['adsetTypes.0.name']).toBeDefined();
  });

  it('erro quando adset sem país', () => {
    const result = validateBatch(validBatch({
      adsetTypes: [{ ...validAdset(), targetCountries: [] }],
    }));
    expect(result.isValid).toBe(false);
    expect(result.errors['adsetTypes.0.targetCountries']).toBeDefined();
  });

  it('erro de bid cap quando estratégia LOWEST_COST_WITH_BID_CAP sem bidCapValue', () => {
    const result = validateBatch(validBatch({
      campaignConfig: { ...validBatch().campaignConfig, bidStrategy: 'LOWEST_COST_WITH_BID_CAP' },
      adsetTypes: [{ ...validAdset(), bidCapValue: undefined }],
    }));
    expect(result.isValid).toBe(false);
    expect(result.errors['campaignConfig.bidStrategy']).toBeDefined();
  });

  it('sem erro de bid cap quando bidCapValue preenchido', () => {
    const result = validateBatch(validBatch({
      campaignConfig: { ...validBatch().campaignConfig, bidStrategy: 'LOWEST_COST_WITH_BID_CAP' },
      adsetTypes: [{ ...validAdset(), bidCapValue: 1000 }],
    }));
    expect(result.isValid).toBe(true);
  });
});

describe('validateBatch — warnings de orçamento', () => {
  it('warning quando orçamento CBO total > R$50.000', () => {
    // 3 campanhas × R$20.000 = R$60.000
    const result = validateBatch(validBatch({
      totalCampaigns: 3,
      campaignConfig: { ...validBatch().campaignConfig, budgetType: 'CBO', budgetValue: 2_000_000 },
    }));
    expect(result.isValid).toBe(true);
    expect(result.warnings.some((w) => w.includes('50.000'))).toBe(true);
  });

  it('sem warning para orçamento normal', () => {
    const result = validateBatch(validBatch({
      campaignConfig: { ...validBatch().campaignConfig, budgetValue: 1000 },
    }));
    expect(result.warnings).toHaveLength(0);
  });
});

describe('validateBatch — bid_strategy rules (BR-017, BR-018, BR-019)', () => {
  it('BR-017: LOWEST_COST_WITH_BID_CAP sem bidCapValue → isValid=false', () => {
    const result = validateBatch(validBatch({
      campaignConfig: { ...validBatch().campaignConfig, bidStrategy: 'LOWEST_COST_WITH_BID_CAP' },
      adsetTypes: [{ ...validAdset(), bidCapValue: undefined }],
    }));
    expect(result.isValid).toBe(false);
  });

  it('BR-017: LOWEST_COST_WITH_BID_CAP com bidCapValue=0 → isValid=false (0 não é valor válido)', () => {
    const result = validateBatch(validBatch({
      campaignConfig: { ...validBatch().campaignConfig, bidStrategy: 'LOWEST_COST_WITH_BID_CAP' },
      adsetTypes: [{ ...validAdset(), bidCapValue: 0 }],
    }));
    expect(result.isValid).toBe(false);
  });

  it('BR-018: COST_CAP sem bidCapValue → isValid=false', () => {
    const result = validateBatch(validBatch({
      campaignConfig: { ...validBatch().campaignConfig, bidStrategy: 'COST_CAP' },
      adsetTypes: [{ ...validAdset(), bidCapValue: undefined }],
    }));
    expect(result.isValid).toBe(false);
    expect(result.errors['campaignConfig.bidStrategy']).toBeDefined();
  });

  it('BR-018: COST_CAP com bidCapValue > 0 → isValid=true', () => {
    const result = validateBatch(validBatch({
      campaignConfig: { ...validBatch().campaignConfig, bidStrategy: 'COST_CAP' },
      adsetTypes: [{ ...validAdset(), bidCapValue: 500 }],
    }));
    expect(result.isValid).toBe(true);
  });

  it('BR-019: LOWEST_COST_WITH_MIN_ROAS gera warning "ROAS"', () => {
    const result = validateBatch(validBatch({
      campaignConfig: { ...validBatch().campaignConfig, bidStrategy: 'LOWEST_COST_WITH_MIN_ROAS' },
    }));
    expect(result.warnings.some((w) => w.includes('ROAS'))).toBe(true);
  });

  it('BR-022: LOWEST_COST_WITHOUT_CAP sem bidCapValue → isValid=true', () => {
    const result = validateBatch(validBatch({
      campaignConfig: { ...validBatch().campaignConfig, bidStrategy: 'LOWEST_COST_WITHOUT_CAP' },
      adsetTypes: [{ ...validAdset(), bidCapValue: undefined }],
    }));
    expect(result.isValid).toBe(true);
  });

  it('bid_strategy inválido (string vazia) → isValid=false', () => {
    const result = validateBatch(validBatch({
      campaignConfig: { ...validBatch().campaignConfig, bidStrategy: '' },
    }));
    expect(result.isValid).toBe(false);
  });
});

describe('validateBatch — campaignCount por conta (BR-001, BR-002, BR-003)', () => {
  it('BR-001: conta com campaignCount=0 deve gerar warning ou erro de volume', () => {
    // Quando TODAS as contas têm campaignCount=0, totalCampaigns efetivo é 0 → inválido
    const batch = validBatch({
      accounts: [
        { accountId: 'acc-1', accountName: 'Conta 1', currency: 'BRL', campaignCount: 0 },
      ],
    });
    const result = validateBatch(batch);
    // Com campaignCount=0 em todas as contas, a publicação não faz sentido
    // O comportamento exato depende da implementação (warning ou error)
    // Pelo menos um dos dois deve estar presente
    const hasIssue = !result.isValid || result.warnings.length > 0;
    expect(hasIssue).toBe(true);
  });

  it('BR-003: conta com campaignCount negativo → isValid=false', () => {
    const batch = validBatch({
      accounts: [
        { accountId: 'acc-1', accountName: 'Conta 1', currency: 'BRL', campaignCount: -1 },
      ],
    });
    const result = validateBatch(batch);
    expect(result.isValid).toBe(false);
  });

  it('conta com campaignCount positivo → sem erro de volume', () => {
    const batch = validBatch({
      accounts: [
        { accountId: 'acc-1', accountName: 'Conta 1', currency: 'BRL', campaignCount: 3 },
      ],
    });
    const result = validateBatch(batch);
    // campaignCount válido não deve causar erros por si só
    expect(result.errors['accounts.0.campaignCount']).toBeUndefined();
  });
});

describe('validateAllBatches', () => {
  it('válido quando todos os lotes passam', () => {
    const result = validateAllBatches([validBatch(), validBatch({ id: 'batch-2', name: 'Lote 2' })]);
    expect(result.isValid).toBe(true);
    expect(result.batchErrors).toHaveLength(0);
  });

  it('inválido quando um lote falha, aponta o índice correto', () => {
    const result = validateAllBatches([validBatch(), validBatch({ accounts: [] })]);
    expect(result.isValid).toBe(false);
    expect(result.batchErrors).toHaveLength(1);
    expect(result.batchErrors[0].batchIndex).toBe(1);
  });

  it('lista erros de todos os lotes inválidos', () => {
    const result = validateAllBatches([
      validBatch({ accounts: [] }),
      validBatch({ adsetTypes: [] }),
    ]);
    expect(result.batchErrors).toHaveLength(2);
  });
});
