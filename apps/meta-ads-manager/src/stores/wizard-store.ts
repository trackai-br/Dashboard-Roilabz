import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- Types ---

export type WizardMode = 'quick' | 'advanced' | 'add_adsets';
export type DistributionMode = 'per_campaign' | 'sequential' | 'random' | 'manual';

export interface NamingTag {
  id: string;
  type: 'date' | 'account' | 'campaign_number' | 'leva' | 'page' | 'creative' | 'text' | 'sequence';
  label: string;
  value: string; // editable for 'text' and 'leva', auto for others
  color: string; // CSS color for the chip
}

export interface BatchAccountEntry {
  accountId: string;
  accountName: string;
  currency: string;
}

export interface BatchPageEntry {
  pageId: string;
  pageName: string;
  accountId: string;
}

export interface BatchCampaignConfig {
  objective: string;
  namingPattern: {
    levaNumber: string;
    creativeLabel: string;
  };
  namingTags: NamingTag[];
  budgetType: 'CBO' | 'ABO';
  budgetValue: number;
  bidStrategy: string;
  campaignStatus: 'ACTIVE' | 'PAUSED';
}

export interface BatchAdsetType {
  id: string;
  name: string;
  adsetCount: number;
  campaignsCount: number;
  creativesInAdset: string[];
  conversionLocation: string;
  bidCapValue?: number;
  pixelId: string;
  conversionEvent: string;
  startDate: string;
  targetCountries: string[];
  adsetStatus: 'ACTIVE' | 'PAUSED';
}

export interface BatchConfig {
  id: string;
  name: string;
  accounts: BatchAccountEntry[];
  pages: BatchPageEntry[];
  adsetsPerCampaign: number;
  totalCampaigns: number;
  campaignConfig: BatchCampaignConfig;
  adsetTypes: BatchAdsetType[];
  isExpanded: boolean;
  isComplete: boolean;
}

export interface CreativeFile {
  id: string;
  fileName: string;
  driveUrl: string;
  type: 'image' | 'video';
  thumbnailUrl?: string;
}

export interface AdConfig {
  destinationUrl: string;
  primaryText: string;
  headline: string;
  description: string;
  utmParams: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  };
}

export interface PublishBatchResult {
  batchId: string;
  batchName: string;
  status: 'pending' | 'publishing' | 'completed' | 'failed';
  results: PublishCampaignResult[];
  completedCampaigns: number;
  totalCampaigns: number;
  jobId?: string;
}

export interface PublishCampaignResult {
  campaignIndex: number;
  status: 'success' | 'failed' | 'timeout';
  error?: string;
  meta_campaign_id?: string;
  campaignName?: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  step: number;
  isComplete: boolean;
}

// --- Store State ---

export interface WizardStoreState {
  // Navigation
  currentStep: number;
  completedSteps: number[];

  // Mode
  mode: WizardMode | null;

  // Batches
  batches: BatchConfig[];
  activeBatchId: string | null;

  // Creative Pool (shared)
  creativePool: CreativeFile[];
  driveLink: string;
  distributionMode: DistributionMode;
  manualAssignment: Record<number, string>; // campaignIndex -> creativeId

  // Ad Config (shared)
  adConfig: AdConfig | null;

  // Publishing
  publishState: PublishBatchResult[];
  isPublishing: boolean;

  // Template
  templateName: string;

  // Draft
  isDraft: boolean;
  draftId: string | null;

  // Checklist
  checklist: ChecklistItem[];
}

// --- Default Values ---

const defaultNamingTags: NamingTag[] = [
  { id: 'tag-date', type: 'date', label: 'Data', value: '', color: '#39ff14' },
  { id: 'tag-account', type: 'account', label: 'Conta', value: '', color: '#00f0ff' },
  { id: 'tag-cp', type: 'campaign_number', label: 'CP ##', value: '', color: '#4fff24' },
  { id: 'tag-leva', type: 'leva', label: 'LEVA', value: '', color: '#a100f2' },
  { id: 'tag-page', type: 'page', label: 'Pagina', value: '', color: '#ffb703' },
  { id: 'tag-creative', type: 'creative', label: 'Criativo', value: '', color: '#ff006e' },
];

const defaultCampaignConfig: BatchCampaignConfig = {
  objective: 'OUTCOME_SALES',
  namingPattern: { levaNumber: '', creativeLabel: '' },
  namingTags: defaultNamingTags.map(t => ({ ...t })),
  budgetType: 'CBO',
  budgetValue: 0,
  bidStrategy: 'LOWEST_COST_WITHOUT_CAP',
  campaignStatus: 'PAUSED',
};

const defaultChecklist: ChecklistItem[] = [
  { id: 'mode', label: 'Modo selecionado', step: 0, isComplete: false },
  { id: 'accounts', label: 'Contas selecionadas', step: 1, isComplete: false },
  { id: 'pages', label: 'Paginas selecionadas', step: 1, isComplete: false },
  { id: 'volume', label: 'Volume configurado', step: 1, isComplete: false },
  { id: 'campaign', label: 'Campanha configurada', step: 1, isComplete: false },
  { id: 'adsets', label: 'Conjuntos configurados', step: 1, isComplete: false },
  { id: 'creatives', label: 'Criativos carregados', step: 2, isComplete: false },
  { id: 'adcopy', label: 'Copy do anuncio', step: 3, isComplete: false },
  { id: 'destination', label: 'URL de destino', step: 3, isComplete: false },
  { id: 'review', label: 'Revisao final', step: 4, isComplete: false },
];

// --- Actions ---

export interface WizardStoreActions {
  // Navigation
  setStep: (step: number) => void;
  markStepComplete: (step: number) => void;

  // Mode
  setMode: (mode: WizardMode) => void;

  // Batch CRUD
  addBatch: (batch?: Partial<BatchConfig>) => void;
  removeBatch: (batchId: string) => void;
  updateBatch: (batchId: string, updates: Partial<BatchConfig>) => void;
  duplicateBatch: (batchId: string) => void;
  setActiveBatch: (batchId: string | null) => void;

  // Batch accounts/pages
  toggleBatchAccount: (batchId: string, account: BatchAccountEntry) => void;
  toggleBatchPage: (batchId: string, page: BatchPageEntry) => void;

  // Batch campaign config
  setBatchCampaignConfig: (batchId: string, config: BatchCampaignConfig) => void;

  // Batch adset types
  addBatchAdsetType: (batchId: string, adsetType: BatchAdsetType) => void;
  removeBatchAdsetType: (batchId: string, adsetTypeId: string) => void;
  updateBatchAdsetType: (batchId: string, adsetTypeId: string, updates: Partial<BatchAdsetType>) => void;

  // Creative Pool
  setCreativePool: (files: CreativeFile[]) => void;
  setDriveLink: (link: string) => void;
  addCreativeFile: (file: CreativeFile) => void;
  removeCreativeFile: (fileId: string) => void;

  // Distribution
  setDistributionMode: (mode: DistributionMode) => void;
  setManualAssignment: (campaignIndex: number, creativeId: string) => void;

  // Naming Tags
  updateNamingTag: (batchId: string, tagId: string, value: string) => void;
  addNamingTag: (batchId: string, tag: NamingTag) => void;
  removeNamingTag: (batchId: string, tagId: string) => void;
  reorderNamingTags: (batchId: string, tags: NamingTag[]) => void;

  // Ad Config
  setAdConfig: (config: AdConfig) => void;

  // Publishing
  setPublishState: (state: PublishBatchResult[]) => void;
  updatePublishBatch: (batchId: string, updates: Partial<PublishBatchResult>) => void;
  setIsPublishing: (value: boolean) => void;

  // Template
  setTemplateName: (name: string) => void;

  // Draft
  loadDraft: (state: Partial<WizardStoreState>, draftId: string) => void;

  // Checklist
  updateChecklistItem: (itemId: string, isComplete: boolean) => void;

  // Reset
  reset: () => void;
}

// --- Helpers ---

let batchCounter = 0;

function generateBatchId(): string {
  batchCounter += 1;
  return `batch-${Date.now()}-${batchCounter}`;
}

function createDefaultBatch(overrides?: Partial<BatchConfig>): BatchConfig {
  return {
    id: generateBatchId(),
    name: `Lote ${(overrides as any)?._index ?? 1}`,
    accounts: [],
    pages: [],
    adsetsPerCampaign: 50,
    totalCampaigns: 1,
    campaignConfig: { ...defaultCampaignConfig },
    adsetTypes: [],
    isExpanded: true,
    isComplete: false,
    ...overrides,
  };
}

// --- Initial State ---

const initialState: WizardStoreState = {
  currentStep: 0,
  completedSteps: [],
  mode: null,
  batches: [],
  activeBatchId: null,
  creativePool: [],
  driveLink: '',
  distributionMode: 'per_campaign',
  manualAssignment: {},
  adConfig: null,
  publishState: [],
  isPublishing: false,
  templateName: '',
  isDraft: false,
  draftId: null,
  checklist: defaultChecklist.map(item => ({ ...item })),
};

// --- Store ---

export type WizardStore = WizardStoreState & WizardStoreActions;

export const useWizardStore = create<WizardStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Navigation
      setStep: (step) => set({ currentStep: step }),
      markStepComplete: (step) => set((s) => ({
        completedSteps: s.completedSteps.includes(step)
          ? s.completedSteps
          : [...s.completedSteps, step],
      })),

      // Mode
      setMode: (mode) => {
        const state = get();
        const updates: Partial<WizardStoreState> = {
          mode,
          checklist: state.checklist.map(item =>
            item.id === 'mode' ? { ...item, isComplete: true } : item
          ),
        };

        // Auto-create first batch when selecting mode
        if (state.batches.length === 0) {
          updates.batches = [createDefaultBatch({ _index: 1 } as any)];
          updates.activeBatchId = updates.batches[0].id;
        }

        set(updates);
      },

      // Batch CRUD
      addBatch: (overrides) => set((s) => {
        const newBatch = createDefaultBatch({
          ...overrides,
          _index: s.batches.length + 1,
        } as any);
        return {
          batches: [...s.batches, newBatch],
          activeBatchId: newBatch.id,
        };
      }),

      removeBatch: (batchId) => set((s) => {
        const filtered = s.batches.filter(b => b.id !== batchId);
        return {
          batches: filtered,
          activeBatchId: s.activeBatchId === batchId
            ? (filtered[0]?.id ?? null)
            : s.activeBatchId,
        };
      }),

      updateBatch: (batchId, updates) => set((s) => ({
        batches: s.batches.map(b =>
          b.id === batchId ? { ...b, ...updates } : b
        ),
      })),

      duplicateBatch: (batchId) => set((s) => {
        const source = s.batches.find(b => b.id === batchId);
        if (!source) return s;
        const newBatch = createDefaultBatch({
          ...source,
          id: undefined as any,
          name: `${source.name} (copia)`,
          isComplete: false,
          _index: s.batches.length + 1,
        } as any);
        return {
          batches: [...s.batches, newBatch],
          activeBatchId: newBatch.id,
        };
      }),

      setActiveBatch: (batchId) => set({ activeBatchId: batchId }),

      // Batch accounts/pages
      toggleBatchAccount: (batchId, account) => set((s) => ({
        batches: s.batches.map(b => {
          if (b.id !== batchId) return b;
          const exists = b.accounts.some(a => a.accountId === account.accountId);
          return {
            ...b,
            accounts: exists
              ? b.accounts.filter(a => a.accountId !== account.accountId)
              : [...b.accounts, account],
          };
        }),
        checklist: s.checklist.map(item =>
          item.id === 'accounts'
            ? { ...item, isComplete: s.batches.some(b => b.accounts.length > 0) }
            : item
        ),
      })),

      toggleBatchPage: (batchId, page) => set((s) => ({
        batches: s.batches.map(b => {
          if (b.id !== batchId) return b;
          const exists = b.pages.some(p => p.pageId === page.pageId);
          return {
            ...b,
            pages: exists
              ? b.pages.filter(p => p.pageId !== page.pageId)
              : [...b.pages, page],
          };
        }),
        checklist: s.checklist.map(item =>
          item.id === 'pages'
            ? { ...item, isComplete: s.batches.some(b => b.pages.length > 0) }
            : item
        ),
      })),

      // Batch campaign config
      setBatchCampaignConfig: (batchId, config) => set((s) => ({
        batches: s.batches.map(b =>
          b.id === batchId ? { ...b, campaignConfig: config } : b
        ),
      })),

      // Batch adset types
      addBatchAdsetType: (batchId, adsetType) => set((s) => ({
        batches: s.batches.map(b =>
          b.id === batchId ? { ...b, adsetTypes: [...b.adsetTypes, adsetType] } : b
        ),
      })),

      removeBatchAdsetType: (batchId, adsetTypeId) => set((s) => ({
        batches: s.batches.map(b =>
          b.id === batchId
            ? { ...b, adsetTypes: b.adsetTypes.filter(t => t.id !== adsetTypeId) }
            : b
        ),
      })),

      updateBatchAdsetType: (batchId, adsetTypeId, updates) => set((s) => ({
        batches: s.batches.map(b =>
          b.id === batchId
            ? {
                ...b,
                adsetTypes: b.adsetTypes.map(t =>
                  t.id === adsetTypeId ? { ...t, ...updates } : t
                ),
              }
            : b
        ),
      })),

      // Distribution
      setDistributionMode: (mode) => set({ distributionMode: mode }),
      setManualAssignment: (campaignIndex, creativeId) => set((s) => ({
        manualAssignment: { ...s.manualAssignment, [campaignIndex]: creativeId },
      })),

      // Naming Tags
      updateNamingTag: (batchId, tagId, value) => set((s) => ({
        batches: s.batches.map(b =>
          b.id === batchId
            ? {
                ...b,
                campaignConfig: {
                  ...b.campaignConfig,
                  namingTags: b.campaignConfig.namingTags.map(t =>
                    t.id === tagId ? { ...t, value } : t
                  ),
                },
              }
            : b
        ),
      })),

      addNamingTag: (batchId, tag) => set((s) => ({
        batches: s.batches.map(b =>
          b.id === batchId
            ? {
                ...b,
                campaignConfig: {
                  ...b.campaignConfig,
                  namingTags: [...b.campaignConfig.namingTags, tag],
                },
              }
            : b
        ),
      })),

      removeNamingTag: (batchId, tagId) => set((s) => ({
        batches: s.batches.map(b =>
          b.id === batchId
            ? {
                ...b,
                campaignConfig: {
                  ...b.campaignConfig,
                  namingTags: b.campaignConfig.namingTags.filter(t => t.id !== tagId),
                },
              }
            : b
        ),
      })),

      reorderNamingTags: (batchId, tags) => set((s) => ({
        batches: s.batches.map(b =>
          b.id === batchId
            ? {
                ...b,
                campaignConfig: {
                  ...b.campaignConfig,
                  namingTags: tags,
                },
              }
            : b
        ),
      })),

      // Creative Pool
      setCreativePool: (files) => set({
        creativePool: files,
        checklist: get().checklist.map(item =>
          item.id === 'creatives' ? { ...item, isComplete: files.length > 0 } : item
        ),
      }),

      setDriveLink: (link) => set({ driveLink: link }),

      addCreativeFile: (file) => set((s) => ({
        creativePool: [...s.creativePool, file],
        checklist: s.checklist.map(item =>
          item.id === 'creatives' ? { ...item, isComplete: true } : item
        ),
      })),

      removeCreativeFile: (fileId) => set((s) => {
        const filtered = s.creativePool.filter(f => f.id !== fileId);
        return {
          creativePool: filtered,
          checklist: s.checklist.map(item =>
            item.id === 'creatives' ? { ...item, isComplete: filtered.length > 0 } : item
          ),
        };
      }),

      // Ad Config
      setAdConfig: (config) => set({
        adConfig: config,
        checklist: get().checklist.map(item => {
          if (item.id === 'adcopy') return { ...item, isComplete: !!config.primaryText && !!config.headline };
          if (item.id === 'destination') return { ...item, isComplete: config.destinationUrl.startsWith('http') };
          return item;
        }),
      }),

      // Publishing
      setPublishState: (publishState) => set({ publishState }),
      updatePublishBatch: (batchId, updates) => set((s) => ({
        publishState: s.publishState.map(b =>
          b.batchId === batchId ? { ...b, ...updates } : b
        ),
      })),
      setIsPublishing: (value) => set({ isPublishing: value }),

      // Template
      setTemplateName: (name) => set({ templateName: name }),

      // Draft
      loadDraft: (draftState, draftId) => set({
        ...draftState,
        draftId,
        isDraft: true,
      }),

      // Checklist
      updateChecklistItem: (itemId, isComplete) => set((s) => ({
        checklist: s.checklist.map(item =>
          item.id === itemId ? { ...item, isComplete } : item
        ),
      })),

      // Reset
      reset: () => set({ ...initialState, checklist: defaultChecklist.map(item => ({ ...item })) }),
    }),
    {
      name: 'wizard-draft',
      version: 2,
      migrate: () => {
        // v2: reset tudo — estrutura mudou (NamingTag, DistributionMode, AdConfig simplificado)
        return {
          ...initialState,
          checklist: defaultChecklist.map(item => ({ ...item })),
        } as any;
      },
      partialize: (state) => ({
        mode: state.mode,
        batches: state.batches,
        activeBatchId: state.activeBatchId,
        creativePool: state.creativePool,
        driveLink: state.driveLink,
        distributionMode: state.distributionMode,
        manualAssignment: state.manualAssignment,
        adConfig: state.adConfig,
        templateName: state.templateName,
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        checklist: state.checklist,
      }),
    }
  )
);

// --- Selectors (for selective re-renders) ---

export const selectMode = (s: WizardStore) => s.mode;
export const selectBatches = (s: WizardStore) => s.batches;
export const selectActiveBatch = (s: WizardStore) =>
  s.batches.find(b => b.id === s.activeBatchId) ?? null;
export const selectCreativePool = (s: WizardStore) => s.creativePool;
export const selectDistributionMode = (s: WizardStore) => s.distributionMode;
export const selectAdConfig = (s: WizardStore) => s.adConfig;
export const selectChecklist = (s: WizardStore) => s.checklist;
export const selectCurrentStep = (s: WizardStore) => s.currentStep;
export const selectCompletedSteps = (s: WizardStore) => s.completedSteps;

// Derived: count of completed checklist items
export const selectChecklistProgress = (s: WizardStore) => {
  const total = s.checklist.length;
  const done = s.checklist.filter(item => item.isComplete).length;
  return { total, done, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
};

// Derived: can the batch generate a valid bulk-publish payload?
export const selectIsBatchValid = (batchId: string) => (s: WizardStore) => {
  const batch = s.batches.find(b => b.id === batchId);
  if (!batch) return false;
  const cfg = batch.campaignConfig;
  return (
    batch.accounts.length > 0 &&
    batch.pages.length > 0 &&
    !!cfg.objective &&
    !!cfg.namingPattern.levaNumber &&
    !!cfg.namingPattern.creativeLabel &&
    cfg.budgetValue > 0 &&
    batch.adsetTypes.length > 0 &&
    batch.adsetTypes.every(
      t => !!t.name && t.adsetCount > 0 && !!t.pixelId && !!t.conversionEvent &&
           !!t.startDate && t.targetCountries.length > 0
    )
  );
};
