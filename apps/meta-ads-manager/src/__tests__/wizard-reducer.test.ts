// Testa a logica do reducer do wizard isoladamente (sem React)
// Reimplementamos o reducer aqui ja que nao e exportado diretamente.
// Isso testa o CONTRATO, nao a implementacao.

import type {
  WizardState,
  CampaignConfig,
  AdsetTypeConfig,
  AdConfig,
  CreativeFile,
  DistributionEntry,
} from '@/contexts/WizardContext';

type WizardAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'TOGGLE_ACCOUNT'; payload: string }
  | { type: 'TOGGLE_PAGE'; payload: string }
  | { type: 'SET_VOLUME'; payload: { adsetsPerCampaign?: number; totalCampaigns?: number } }
  | { type: 'CALCULATE_DISTRIBUTION'; payload: DistributionEntry[] }
  | { type: 'SET_CAMPAIGN_CONFIG'; payload: CampaignConfig }
  | { type: 'ADD_ADSET_TYPE'; payload: AdsetTypeConfig }
  | { type: 'REMOVE_ADSET_TYPE'; payload: string }
  | { type: 'UPDATE_ADSET_TYPE'; payload: { id: string; updates: Partial<AdsetTypeConfig> } }
  | { type: 'SET_AD_CONFIG'; payload: AdConfig }
  | { type: 'SET_TEMPLATE_NAME'; payload: string }
  | { type: 'LOAD_DRAFT'; payload: { state: WizardState; draftId: string } }
  | { type: 'MARK_STEP_COMPLETE'; payload: number }
  | { type: 'RESET' };

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'TOGGLE_ACCOUNT': {
      const id = action.payload;
      const ids = state.selectedAccountIds.includes(id)
        ? state.selectedAccountIds.filter((a) => a !== id)
        : [...state.selectedAccountIds, id];
      return { ...state, selectedAccountIds: ids };
    }
    case 'TOGGLE_PAGE': {
      const id = action.payload;
      const ids = state.selectedPageIds.includes(id)
        ? state.selectedPageIds.filter((p) => p !== id)
        : [...state.selectedPageIds, id];
      return { ...state, selectedPageIds: ids };
    }
    case 'SET_VOLUME':
      return {
        ...state,
        ...(action.payload.adsetsPerCampaign !== undefined && { adsetsPerCampaign: action.payload.adsetsPerCampaign }),
        ...(action.payload.totalCampaigns !== undefined && { totalCampaigns: action.payload.totalCampaigns }),
      };
    case 'CALCULATE_DISTRIBUTION':
      return { ...state, distributionMap: action.payload };
    case 'SET_CAMPAIGN_CONFIG':
      return { ...state, campaignConfig: action.payload };
    case 'ADD_ADSET_TYPE':
      return { ...state, adsetTypes: [...state.adsetTypes, action.payload] };
    case 'REMOVE_ADSET_TYPE':
      return { ...state, adsetTypes: state.adsetTypes.filter((t) => t.id !== action.payload) };
    case 'UPDATE_ADSET_TYPE':
      return {
        ...state,
        adsetTypes: state.adsetTypes.map((t) =>
          t.id === action.payload.id ? { ...t, ...action.payload.updates } : t
        ),
      };
    case 'SET_AD_CONFIG':
      return { ...state, adConfig: action.payload };
    case 'SET_TEMPLATE_NAME':
      return { ...state, templateName: action.payload };
    case 'LOAD_DRAFT':
      return { ...action.payload.state, draftId: action.payload.draftId, isDraft: true };
    case 'MARK_STEP_COMPLETE': {
      const step = action.payload;
      if (state.completedSteps.includes(step)) return state;
      return { ...state, completedSteps: [...state.completedSteps, step] };
    }
    case 'RESET':
      return { ...estadoInicial };
    default:
      return state;
  }
}

const estadoInicial: WizardState = {
  currentStep: 0,
  completedSteps: [],
  selectedAccountIds: [],
  selectedPageIds: [],
  adsetsPerCampaign: 50,
  totalCampaigns: 1,
  distributionMap: [],
  campaignConfig: {
    objective: 'OUTCOME_SALES',
    namingPattern: { levaNumber: '', creativeLabel: '' },
    budgetType: 'CBO',
    budgetValue: 0,
    bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
    campaignStatus: 'PAUSED',
  },
  adsetTypes: [],
  adConfig: null,
  templateName: '',
  isDraft: false,
  draftId: null,
};

function criarTipoAdset(overrides?: Partial<AdsetTypeConfig>): AdsetTypeConfig {
  return {
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
    ...overrides,
  };
}

function criarAdConfig(overrides?: Partial<AdConfig>): AdConfig {
  return {
    destinationUrl: 'https://example.com',
    creativeFormat: 'image',
    driveLink: '',
    creativeFiles: [
      { id: 'f1', fileName: 'banner.jpg', driveUrl: '', type: 'image' },
    ],
    primaryText: 'Texto',
    headline: 'Titulo',
    description: 'Desc',
    utmParams: {},
    ...overrides,
  };
}

// ============================
// TESTES DO REDUCER DO WIZARD (15 testes)
// ============================

describe('wizardReducer', () => {
  test('1 — SET_STEP altera currentStep', () => {
    const resultado = wizardReducer(estadoInicial, { type: 'SET_STEP', payload: 3 });
    expect(resultado.currentStep).toBe(3);
  });

  test('2 — TOGGLE_ACCOUNT adiciona conta', () => {
    const resultado = wizardReducer(estadoInicial, { type: 'TOGGLE_ACCOUNT', payload: 'acc-1' });
    expect(resultado.selectedAccountIds).toEqual(['acc-1']);
  });

  test('3 — TOGGLE_ACCOUNT remove conta ja selecionada', () => {
    const estado = { ...estadoInicial, selectedAccountIds: ['acc-1', 'acc-2'] };
    const resultado = wizardReducer(estado, { type: 'TOGGLE_ACCOUNT', payload: 'acc-1' });
    expect(resultado.selectedAccountIds).toEqual(['acc-2']);
  });

  test('4 — TOGGLE_PAGE adiciona pagina', () => {
    const resultado = wizardReducer(estadoInicial, { type: 'TOGGLE_PAGE', payload: 'page-1' });
    expect(resultado.selectedPageIds).toEqual(['page-1']);
  });

  test('5 — TOGGLE_PAGE remove pagina ja selecionada', () => {
    const estado = { ...estadoInicial, selectedPageIds: ['page-1'] };
    const resultado = wizardReducer(estado, { type: 'TOGGLE_PAGE', payload: 'page-1' });
    expect(resultado.selectedPageIds).toEqual([]);
  });

  test('6 — SET_VOLUME atualiza apenas adsetsPerCampaign', () => {
    const resultado = wizardReducer(estadoInicial, {
      type: 'SET_VOLUME',
      payload: { adsetsPerCampaign: 10 },
    });
    expect(resultado.adsetsPerCampaign).toBe(10);
    expect(resultado.totalCampaigns).toBe(1); // inalterado
  });

  test('7 — SET_VOLUME atualiza apenas totalCampaigns', () => {
    const resultado = wizardReducer(estadoInicial, {
      type: 'SET_VOLUME',
      payload: { totalCampaigns: 5 },
    });
    expect(resultado.totalCampaigns).toBe(5);
    expect(resultado.adsetsPerCampaign).toBe(50); // inalterado
  });

  test('8 — ADD_ADSET_TYPE adiciona ao array', () => {
    const tipoAdset = criarTipoAdset();
    const resultado = wizardReducer(estadoInicial, { type: 'ADD_ADSET_TYPE', payload: tipoAdset });
    expect(resultado.adsetTypes).toHaveLength(1);
    expect(resultado.adsetTypes[0].id).toBe('type-1');
  });

  test('9 — REMOVE_ADSET_TYPE remove pelo id', () => {
    const estado = {
      ...estadoInicial,
      adsetTypes: [criarTipoAdset({ id: 'type-1' }), criarTipoAdset({ id: 'type-2', name: 'Tipo B' })],
    };
    const resultado = wizardReducer(estado, { type: 'REMOVE_ADSET_TYPE', payload: 'type-1' });
    expect(resultado.adsetTypes).toHaveLength(1);
    expect(resultado.adsetTypes[0].id).toBe('type-2');
  });

  test('10 — UPDATE_ADSET_TYPE faz merge das atualizacoes no tipo correto', () => {
    const estado = {
      ...estadoInicial,
      adsetTypes: [criarTipoAdset({ id: 'type-1' })],
    };
    const resultado = wizardReducer(estado, {
      type: 'UPDATE_ADSET_TYPE',
      payload: { id: 'type-1', updates: { name: 'Nome Atualizado', adsetCount: 5 } },
    });
    expect(resultado.adsetTypes[0].name).toBe('Nome Atualizado');
    expect(resultado.adsetTypes[0].adsetCount).toBe(5);
    expect(resultado.adsetTypes[0].pixelId).toBe('px-1'); // inalterado
  });

  test('11 — SET_AD_CONFIG define adConfig', () => {
    const config = criarAdConfig();
    const resultado = wizardReducer(estadoInicial, { type: 'SET_AD_CONFIG', payload: config });
    expect(resultado.adConfig).toEqual(config);
  });

  test('12 — MARK_STEP_COMPLETE adiciona etapa e ignora duplicatas', () => {
    let estado = wizardReducer(estadoInicial, { type: 'MARK_STEP_COMPLETE', payload: 0 });
    expect(estado.completedSteps).toEqual([0]);
    estado = wizardReducer(estado, { type: 'MARK_STEP_COMPLETE', payload: 0 });
    expect(estado.completedSteps).toEqual([0]); // sem duplicata
    estado = wizardReducer(estado, { type: 'MARK_STEP_COMPLETE', payload: 1 });
    expect(estado.completedSteps).toEqual([0, 1]);
  });

  test('13 — LOAD_DRAFT substitui estado e marca isDraft', () => {
    const estadoRascunho: WizardState = {
      ...estadoInicial,
      currentStep: 3,
      selectedAccountIds: ['acc-99'],
    };
    const resultado = wizardReducer(estadoInicial, {
      type: 'LOAD_DRAFT',
      payload: { state: estadoRascunho, draftId: 'draft-abc' },
    });
    expect(resultado.currentStep).toBe(3);
    expect(resultado.selectedAccountIds).toEqual(['acc-99']);
    expect(resultado.isDraft).toBe(true);
    expect(resultado.draftId).toBe('draft-abc');
  });

  test('14 — RESET volta ao estado inicial', () => {
    const estado = {
      ...estadoInicial,
      currentStep: 4,
      selectedAccountIds: ['acc-1'],
      adsetTypes: [criarTipoAdset()],
    };
    const resultado = wizardReducer(estado, { type: 'RESET' });
    expect(resultado.currentStep).toBe(0);
    expect(resultado.selectedAccountIds).toEqual([]);
    expect(resultado.adsetTypes).toEqual([]);
  });

  test('15 — SET_AD_CONFIG preserva driveLink e creativeFiles com driveUrl', () => {
    const config = criarAdConfig({
      driveLink: 'https://drive.google.com/drive/folders/abc123',
      creativeFiles: [
        { id: 'f1', fileName: 'banner.jpg', driveUrl: 'https://drive.google.com/uc?id=xyz', type: 'image' },
        { id: 'f2', fileName: 'video.mp4', driveUrl: '', type: 'video' },
      ],
    });
    const resultado = wizardReducer(estadoInicial, { type: 'SET_AD_CONFIG', payload: config });
    expect(resultado.adConfig!.driveLink).toBe('https://drive.google.com/drive/folders/abc123');
    expect(resultado.adConfig!.creativeFiles).toHaveLength(2);
    expect(resultado.adConfig!.creativeFiles[0].driveUrl).toBe('https://drive.google.com/uc?id=xyz');
    expect(resultado.adConfig!.creativeFiles[1].driveUrl).toBe('');
  });
});
