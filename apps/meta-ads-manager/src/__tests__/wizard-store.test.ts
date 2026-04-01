/**
 * Testes do Wizard Store (Zustand)
 * Passo 3 do framework "Pensar Antes de Agir" — testes ANTES de implementar componentes
 *
 * Cobre: mode selection, batch CRUD, accounts/pages toggle, campaign config,
 *        adset types, creative pool, ad config, checklist, selectors, reset
 */

import { act } from '@testing-library/react';
import { useWizardStore, selectActiveBatch, selectChecklistProgress, selectIsBatchValid } from '@/stores/wizard-store';
import type { BatchAccountEntry, BatchPageEntry, BatchAdsetType, BatchCampaignConfig, AdConfig, CreativeFile, NamingTag } from '@/stores/wizard-store';

// Reset store between tests
beforeEach(() => {
  act(() => {
    useWizardStore.getState().reset();
  });
});

// --- Helpers ---

const mockAccount: BatchAccountEntry = {
  accountId: 'act_123',
  accountName: 'Test Account',
  currency: 'BRL',
};

const mockPage: BatchPageEntry = {
  pageId: 'page_456',
  pageName: 'Test Page',
  accountId: 'act_123',
};

const mockAdsetType: BatchAdsetType = {
  id: 'adset-1',
  name: 'Cr1_leva08',
  adsetCount: 5,
  creativesInAdset: ['creative1.jpg', 'creative2.jpg'],
  conversionLocation: 'WEBSITE',
  pixelId: 'px_789',
  conversionEvent: 'PURCHASE',
  startDate: '2026-04-01T00:00:00Z',
  targetCountries: ['BR'],
  adsetStatus: 'PAUSED',
};

const mockAdConfig: AdConfig = {
  destinationUrl: 'https://example.com/landing',
  primaryText: 'Teste de copy primario',
  headline: 'Headline de teste',
  description: 'Descricao de teste',
  utmParams: {
    utm_source: 'facebook',
    utm_medium: 'cpc',
    utm_campaign: 'leva08',
  },
};

const mockCreativeFile: CreativeFile = {
  id: 'file-1',
  fileName: 'creative1.jpg',
  driveUrl: 'https://drive.google.com/uc?id=abc123',
  type: 'image',
};

// =============================================================================
// MODE SELECTION
// =============================================================================

describe('Mode Selection', () => {
  test('estado inicial tem mode null', () => {
    const { mode } = useWizardStore.getState();
    expect(mode).toBeNull();
  });

  test('setMode define o modo e marca checklist "mode" como completo', () => {
    act(() => {
      useWizardStore.getState().setMode('quick');
    });

    const state = useWizardStore.getState();
    expect(state.mode).toBe('quick');

    const modeItem = state.checklist.find(i => i.id === 'mode');
    expect(modeItem?.isComplete).toBe(true);
  });

  test('setMode cria primeiro batch automaticamente se nao existem batches', () => {
    act(() => {
      useWizardStore.getState().setMode('advanced');
    });

    const state = useWizardStore.getState();
    expect(state.batches).toHaveLength(1);
    expect(state.activeBatchId).toBe(state.batches[0].id);
    expect(state.batches[0].name).toBe('Lote 1');
  });

  test('setMode nao cria batch duplicado se ja existe', () => {
    act(() => {
      useWizardStore.getState().setMode('quick');
    });

    act(() => {
      useWizardStore.getState().setMode('advanced');
    });

    expect(useWizardStore.getState().batches).toHaveLength(1);
  });

  test('aceita todos os modos validos', () => {
    for (const mode of ['quick', 'advanced', 'add_adsets'] as const) {
      act(() => {
        useWizardStore.getState().reset();
        useWizardStore.getState().setMode(mode);
      });
      expect(useWizardStore.getState().mode).toBe(mode);
    }
  });
});

// =============================================================================
// BATCH CRUD
// =============================================================================

describe('Batch CRUD', () => {
  beforeEach(() => {
    act(() => {
      useWizardStore.getState().setMode('advanced');
    });
  });

  test('addBatch adiciona novo batch e o torna ativo', () => {
    act(() => {
      useWizardStore.getState().addBatch();
    });

    const state = useWizardStore.getState();
    expect(state.batches).toHaveLength(2);
    expect(state.activeBatchId).toBe(state.batches[1].id);
    expect(state.batches[1].name).toBe('Lote 2');
  });

  test('removeBatch remove o batch e seleciona outro como ativo', () => {
    act(() => {
      useWizardStore.getState().addBatch();
    });

    const firstBatchId = useWizardStore.getState().batches[0].id;
    const secondBatchId = useWizardStore.getState().batches[1].id;

    act(() => {
      useWizardStore.getState().removeBatch(secondBatchId);
    });

    const state = useWizardStore.getState();
    expect(state.batches).toHaveLength(1);
    expect(state.activeBatchId).toBe(firstBatchId);
  });

  test('removeBatch com batch ativo seleciona primeiro restante', () => {
    act(() => {
      useWizardStore.getState().addBatch();
    });

    const activeBatchId = useWizardStore.getState().activeBatchId!;

    act(() => {
      useWizardStore.getState().removeBatch(activeBatchId);
    });

    const state = useWizardStore.getState();
    expect(state.batches).toHaveLength(1);
    expect(state.activeBatchId).toBe(state.batches[0].id);
  });

  test('removeBatch do ultimo batch resulta em activeBatchId null', () => {
    const batchId = useWizardStore.getState().batches[0].id;

    act(() => {
      useWizardStore.getState().removeBatch(batchId);
    });

    expect(useWizardStore.getState().batches).toHaveLength(0);
    expect(useWizardStore.getState().activeBatchId).toBeNull();
  });

  test('updateBatch atualiza campos do batch', () => {
    const batchId = useWizardStore.getState().batches[0].id;

    act(() => {
      useWizardStore.getState().updateBatch(batchId, {
        name: 'Lote Personalizado',
        adsetsPerCampaign: 100,
        totalCampaigns: 5,
      });
    });

    const batch = useWizardStore.getState().batches[0];
    expect(batch.name).toBe('Lote Personalizado');
    expect(batch.adsetsPerCampaign).toBe(100);
    expect(batch.totalCampaigns).toBe(5);
  });

  test('duplicateBatch cria copia com nome "(copia)"', () => {
    const batchId = useWizardStore.getState().batches[0].id;

    act(() => {
      useWizardStore.getState().updateBatch(batchId, { name: 'Meu Lote' });
      useWizardStore.getState().duplicateBatch(batchId);
    });

    const state = useWizardStore.getState();
    expect(state.batches).toHaveLength(2);
    expect(state.batches[1].name).toBe('Meu Lote (copia)');
    expect(state.batches[1].id).not.toBe(batchId);
    expect(state.activeBatchId).toBe(state.batches[1].id);
  });

  test('duplicateBatch de batch inexistente nao altera estado', () => {
    const stateAntes = useWizardStore.getState();

    act(() => {
      useWizardStore.getState().duplicateBatch('inexistente');
    });

    expect(useWizardStore.getState().batches).toHaveLength(stateAntes.batches.length);
  });

  test('setActiveBatch muda o batch ativo', () => {
    act(() => {
      useWizardStore.getState().addBatch();
    });

    const firstBatchId = useWizardStore.getState().batches[0].id;

    act(() => {
      useWizardStore.getState().setActiveBatch(firstBatchId);
    });

    expect(useWizardStore.getState().activeBatchId).toBe(firstBatchId);
  });
});

// =============================================================================
// BATCH ACCOUNTS & PAGES
// =============================================================================

describe('Batch Accounts & Pages', () => {
  let batchId: string;

  beforeEach(() => {
    act(() => {
      useWizardStore.getState().setMode('advanced');
    });
    batchId = useWizardStore.getState().batches[0].id;
  });

  test('toggleBatchAccount adiciona conta ao batch', () => {
    act(() => {
      useWizardStore.getState().toggleBatchAccount(batchId, mockAccount);
    });

    const batch = useWizardStore.getState().batches[0];
    expect(batch.accounts).toHaveLength(1);
    expect(batch.accounts[0].accountId).toBe('act_123');
  });

  test('toggleBatchAccount remove conta se ja existe', () => {
    act(() => {
      useWizardStore.getState().toggleBatchAccount(batchId, mockAccount);
      useWizardStore.getState().toggleBatchAccount(batchId, mockAccount);
    });

    const batch = useWizardStore.getState().batches[0];
    expect(batch.accounts).toHaveLength(0);
  });

  test('toggleBatchPage adiciona pagina ao batch', () => {
    act(() => {
      useWizardStore.getState().toggleBatchPage(batchId, mockPage);
    });

    const batch = useWizardStore.getState().batches[0];
    expect(batch.pages).toHaveLength(1);
    expect(batch.pages[0].pageId).toBe('page_456');
  });

  test('toggleBatchPage remove pagina se ja existe', () => {
    act(() => {
      useWizardStore.getState().toggleBatchPage(batchId, mockPage);
      useWizardStore.getState().toggleBatchPage(batchId, mockPage);
    });

    const batch = useWizardStore.getState().batches[0];
    expect(batch.pages).toHaveLength(0);
  });

  test('contas e paginas sao independentes entre batches', () => {
    act(() => {
      useWizardStore.getState().addBatch();
    });

    const batch2Id = useWizardStore.getState().batches[1].id;

    act(() => {
      useWizardStore.getState().toggleBatchAccount(batchId, mockAccount);
    });

    expect(useWizardStore.getState().batches[0].accounts).toHaveLength(1);
    expect(useWizardStore.getState().batches[1].accounts).toHaveLength(0);
  });
});

// =============================================================================
// BATCH CAMPAIGN CONFIG
// =============================================================================

describe('Batch Campaign Config', () => {
  let batchId: string;

  beforeEach(() => {
    act(() => {
      useWizardStore.getState().setMode('advanced');
    });
    batchId = useWizardStore.getState().batches[0].id;
  });

  test('setBatchCampaignConfig atualiza config do batch', () => {
    const newConfig: BatchCampaignConfig = {
      objective: 'OUTCOME_LEADS',
      namingPattern: { levaNumber: '08', creativeLabel: 'Cr1' },
      namingTags: [],
      budgetType: 'ABO',
      budgetValue: 5000,
      bidStrategy: 'COST_CAP',
      campaignStatus: 'ACTIVE',
    };

    act(() => {
      useWizardStore.getState().setBatchCampaignConfig(batchId, newConfig);
    });

    const batch = useWizardStore.getState().batches[0];
    expect(batch.campaignConfig.objective).toBe('OUTCOME_LEADS');
    expect(batch.campaignConfig.budgetType).toBe('ABO');
    expect(batch.campaignConfig.budgetValue).toBe(5000);
    expect(batch.campaignConfig.bidStrategy).toBe('COST_CAP');
    expect(batch.campaignConfig.campaignStatus).toBe('ACTIVE');
    expect(batch.campaignConfig.namingPattern.levaNumber).toBe('08');
  });

  test('configs sao independentes entre batches', () => {
    act(() => {
      useWizardStore.getState().addBatch();
    });

    const batch2Id = useWizardStore.getState().batches[1].id;

    act(() => {
      useWizardStore.getState().setBatchCampaignConfig(batchId, {
        ...useWizardStore.getState().batches[0].campaignConfig,
        budgetValue: 10000,
      });
    });

    expect(useWizardStore.getState().batches[0].campaignConfig.budgetValue).toBe(10000);
    expect(useWizardStore.getState().batches[1].campaignConfig.budgetValue).toBe(0);
  });
});

// =============================================================================
// BATCH ADSET TYPES
// =============================================================================

describe('Batch Adset Types', () => {
  let batchId: string;

  beforeEach(() => {
    act(() => {
      useWizardStore.getState().setMode('advanced');
    });
    batchId = useWizardStore.getState().batches[0].id;
  });

  test('addBatchAdsetType adiciona tipo de adset ao batch', () => {
    act(() => {
      useWizardStore.getState().addBatchAdsetType(batchId, mockAdsetType);
    });

    const batch = useWizardStore.getState().batches[0];
    expect(batch.adsetTypes).toHaveLength(1);
    expect(batch.adsetTypes[0].name).toBe('Cr1_leva08');
  });

  test('removeBatchAdsetType remove pelo id', () => {
    act(() => {
      useWizardStore.getState().addBatchAdsetType(batchId, mockAdsetType);
      useWizardStore.getState().removeBatchAdsetType(batchId, 'adset-1');
    });

    expect(useWizardStore.getState().batches[0].adsetTypes).toHaveLength(0);
  });

  test('updateBatchAdsetType atualiza campos parciais', () => {
    act(() => {
      useWizardStore.getState().addBatchAdsetType(batchId, mockAdsetType);
      useWizardStore.getState().updateBatchAdsetType(batchId, 'adset-1', {
        adsetCount: 10,
        targetCountries: ['BR', 'US'],
      });
    });

    const adsetType = useWizardStore.getState().batches[0].adsetTypes[0];
    expect(adsetType.adsetCount).toBe(10);
    expect(adsetType.targetCountries).toEqual(['BR', 'US']);
    expect(adsetType.name).toBe('Cr1_leva08'); // nao alterado
  });
});

// =============================================================================
// CREATIVE POOL (SHARED)
// =============================================================================

describe('Creative Pool', () => {
  test('setCreativePool define arquivos e marca checklist', () => {
    act(() => {
      useWizardStore.getState().setCreativePool([mockCreativeFile]);
    });

    const state = useWizardStore.getState();
    expect(state.creativePool).toHaveLength(1);
    expect(state.creativePool[0].fileName).toBe('creative1.jpg');

    const creativesItem = state.checklist.find(i => i.id === 'creatives');
    expect(creativesItem?.isComplete).toBe(true);
  });

  test('setCreativePool vazio marca checklist como incompleto', () => {
    act(() => {
      useWizardStore.getState().setCreativePool([mockCreativeFile]);
      useWizardStore.getState().setCreativePool([]);
    });

    const creativesItem = useWizardStore.getState().checklist.find(i => i.id === 'creatives');
    expect(creativesItem?.isComplete).toBe(false);
  });

  test('addCreativeFile adiciona ao pool existente', () => {
    act(() => {
      useWizardStore.getState().addCreativeFile(mockCreativeFile);
      useWizardStore.getState().addCreativeFile({
        ...mockCreativeFile,
        id: 'file-2',
        fileName: 'creative2.jpg',
      });
    });

    expect(useWizardStore.getState().creativePool).toHaveLength(2);
  });

  test('removeCreativeFile remove pelo id', () => {
    act(() => {
      useWizardStore.getState().addCreativeFile(mockCreativeFile);
      useWizardStore.getState().removeCreativeFile('file-1');
    });

    expect(useWizardStore.getState().creativePool).toHaveLength(0);

    const creativesItem = useWizardStore.getState().checklist.find(i => i.id === 'creatives');
    expect(creativesItem?.isComplete).toBe(false);
  });

  test('setDriveLink atualiza o link do Drive', () => {
    act(() => {
      useWizardStore.getState().setDriveLink('https://drive.google.com/drive/folders/xyz');
    });

    expect(useWizardStore.getState().driveLink).toBe('https://drive.google.com/drive/folders/xyz');
  });
});

// =============================================================================
// AD CONFIG
// =============================================================================

describe('Ad Config', () => {
  test('setAdConfig define config e marca checklist adcopy+destination', () => {
    act(() => {
      useWizardStore.getState().setAdConfig(mockAdConfig);
    });

    const state = useWizardStore.getState();
    expect(state.adConfig).not.toBeNull();
    expect(state.adConfig?.primaryText).toBe('Teste de copy primario');

    const adcopyItem = state.checklist.find(i => i.id === 'adcopy');
    expect(adcopyItem?.isComplete).toBe(true);

    const destItem = state.checklist.find(i => i.id === 'destination');
    expect(destItem?.isComplete).toBe(true);
  });

  test('adConfig sem primaryText marca adcopy como incompleto', () => {
    act(() => {
      useWizardStore.getState().setAdConfig({
        ...mockAdConfig,
        primaryText: '',
      });
    });

    const adcopyItem = useWizardStore.getState().checklist.find(i => i.id === 'adcopy');
    expect(adcopyItem?.isComplete).toBe(false);
  });

  test('adConfig com URL invalida marca destination como incompleto', () => {
    act(() => {
      useWizardStore.getState().setAdConfig({
        ...mockAdConfig,
        destinationUrl: 'not-a-url',
      });
    });

    const destItem = useWizardStore.getState().checklist.find(i => i.id === 'destination');
    expect(destItem?.isComplete).toBe(false);
  });
});

// =============================================================================
// NAVIGATION
// =============================================================================

describe('Navigation', () => {
  test('setStep atualiza currentStep', () => {
    act(() => {
      useWizardStore.getState().setStep(3);
    });

    expect(useWizardStore.getState().currentStep).toBe(3);
  });

  test('markStepComplete adiciona step ao completedSteps', () => {
    act(() => {
      useWizardStore.getState().markStepComplete(0);
      useWizardStore.getState().markStepComplete(1);
    });

    expect(useWizardStore.getState().completedSteps).toEqual([0, 1]);
  });

  test('markStepComplete nao duplica steps', () => {
    act(() => {
      useWizardStore.getState().markStepComplete(0);
      useWizardStore.getState().markStepComplete(0);
    });

    expect(useWizardStore.getState().completedSteps).toEqual([0]);
  });
});

// =============================================================================
// TEMPLATE
// =============================================================================

describe('Template', () => {
  test('setTemplateName atualiza o nome', () => {
    act(() => {
      useWizardStore.getState().setTemplateName('Template de teste');
    });

    expect(useWizardStore.getState().templateName).toBe('Template de teste');
  });
});

// =============================================================================
// DRAFT
// =============================================================================

describe('Draft', () => {
  test('loadDraft carrega estado parcial e marca isDraft', () => {
    act(() => {
      useWizardStore.getState().loadDraft(
        { mode: 'quick', currentStep: 2 },
        'draft-abc'
      );
    });

    const state = useWizardStore.getState();
    expect(state.mode).toBe('quick');
    expect(state.currentStep).toBe(2);
    expect(state.isDraft).toBe(true);
    expect(state.draftId).toBe('draft-abc');
  });
});

// =============================================================================
// CHECKLIST
// =============================================================================

describe('Checklist', () => {
  test('estado inicial tem 10 items, todos incompletos', () => {
    const { checklist } = useWizardStore.getState();
    expect(checklist).toHaveLength(10);
    expect(checklist.every(i => !i.isComplete)).toBe(true);
  });

  test('updateChecklistItem marca item como completo', () => {
    act(() => {
      useWizardStore.getState().updateChecklistItem('review', true);
    });

    const item = useWizardStore.getState().checklist.find(i => i.id === 'review');
    expect(item?.isComplete).toBe(true);
  });

  test('updateChecklistItem pode desmarcar item', () => {
    act(() => {
      useWizardStore.getState().updateChecklistItem('review', true);
      useWizardStore.getState().updateChecklistItem('review', false);
    });

    const item = useWizardStore.getState().checklist.find(i => i.id === 'review');
    expect(item?.isComplete).toBe(false);
  });
});

// =============================================================================
// SELECTORS
// =============================================================================

describe('Selectors', () => {
  test('selectActiveBatch retorna batch ativo ou null', () => {
    expect(selectActiveBatch(useWizardStore.getState())).toBeNull();

    act(() => {
      useWizardStore.getState().setMode('advanced');
    });

    const active = selectActiveBatch(useWizardStore.getState());
    expect(active).not.toBeNull();
    expect(active?.name).toBe('Lote 1');
  });

  test('selectChecklistProgress calcula porcentagem correta', () => {
    let progress = selectChecklistProgress(useWizardStore.getState());
    expect(progress.done).toBe(0);
    expect(progress.total).toBe(10);
    expect(progress.percent).toBe(0);

    act(() => {
      useWizardStore.getState().setMode('quick'); // marca 'mode' como completo
    });

    progress = selectChecklistProgress(useWizardStore.getState());
    expect(progress.done).toBe(1);
    expect(progress.percent).toBe(10);
  });

  test('selectIsBatchValid retorna false para batch vazio', () => {
    act(() => {
      useWizardStore.getState().setMode('advanced');
    });

    const batchId = useWizardStore.getState().batches[0].id;
    const isValid = selectIsBatchValid(batchId)(useWizardStore.getState());
    expect(isValid).toBe(false);
  });

  test('selectIsBatchValid retorna true para batch completo', () => {
    act(() => {
      useWizardStore.getState().setMode('advanced');
    });

    const batchId = useWizardStore.getState().batches[0].id;

    act(() => {
      useWizardStore.getState().toggleBatchAccount(batchId, mockAccount);
      useWizardStore.getState().toggleBatchPage(batchId, mockPage);
      useWizardStore.getState().setBatchCampaignConfig(batchId, {
        objective: 'OUTCOME_SALES',
        namingPattern: { levaNumber: '08', creativeLabel: 'Cr1' },
        namingTags: [],
        budgetType: 'CBO',
        budgetValue: 5000,
        bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
        campaignStatus: 'PAUSED',
      });
      useWizardStore.getState().addBatchAdsetType(batchId, mockAdsetType);
    });

    const isValid = selectIsBatchValid(batchId)(useWizardStore.getState());
    expect(isValid).toBe(true);
  });

  test('selectIsBatchValid retorna false para batch inexistente', () => {
    const isValid = selectIsBatchValid('nao-existe')(useWizardStore.getState());
    expect(isValid).toBe(false);
  });
});

// =============================================================================
// RESET
// =============================================================================

describe('Reset', () => {
  test('reset volta tudo ao estado inicial', () => {
    // Popula o store
    act(() => {
      useWizardStore.getState().setMode('advanced');
      useWizardStore.getState().setStep(3);
      useWizardStore.getState().markStepComplete(0);
      useWizardStore.getState().setAdConfig(mockAdConfig);
      useWizardStore.getState().addCreativeFile(mockCreativeFile);
      useWizardStore.getState().setTemplateName('Meu template');
    });

    // Reset
    act(() => {
      useWizardStore.getState().reset();
    });

    const state = useWizardStore.getState();
    expect(state.mode).toBeNull();
    expect(state.batches).toHaveLength(0);
    expect(state.activeBatchId).toBeNull();
    expect(state.creativePool).toHaveLength(0);
    expect(state.adConfig).toBeNull();
    expect(state.currentStep).toBe(0);
    expect(state.completedSteps).toHaveLength(0);
    expect(state.templateName).toBe('');
    expect(state.checklist.every(i => !i.isComplete)).toBe(true);
  });
});
