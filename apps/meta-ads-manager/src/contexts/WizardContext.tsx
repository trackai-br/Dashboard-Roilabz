import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// --- Types ---

export interface DistributionEntry {
  campaignIndex: number;
  accountId: string;
  pageId: string;
  pageName: string;
  adsetCount: number;
}

export interface CampaignConfig {
  objective: string;          // OUTCOME_SALES, OUTCOME_LEADS, OUTCOME_TRAFFIC, etc.
  namingPattern: {
    levaNumber: string;       // ex: "08" — manual
    creativeLabel: string;    // ex: "Cr1" — manual
    // Dinâmicos (preenchidos pelo sistema na hora da publicação):
    // [DATA], [CONTA], [CP NÚMERO], [PÁGINA]
  };
  budgetType: 'CBO' | 'ABO';
  budgetValue: number;        // se CBO: valor por campanha / se ABO: valor por adset (em centavos)
  bidStrategy: string;        // LOWEST_COST_WITHOUT_CAP, LOWEST_COST_WITH_BID_CAP, COST_CAP, LOWEST_COST_WITH_MIN_ROAS
  campaignStatus: 'ACTIVE' | 'PAUSED';
}

export interface AdsetTypeConfig {
  id: string;                        // uuid local para identificar o tipo
  name: string;                      // nome digitado livre (ex: "Cr1_leva10_Angulo2")
  adsetCount: number;                // quantos adsets deste tipo
  campaignsCount: number;            // em quantas campanhas este tipo aparece
  creativesInAdset: string[];        // nomes dos criativos dentro de cada adset (cada um vira 1 ad)
  conversionLocation: string;        // WEBSITE, APP, MESSENGER, WHATSAPP, etc.
  bidCapValue?: number;              // se estratégia for Bid Cap — valor em centavos
  pixelId: string;                   // pixel selecionado
  conversionEvent: string;           // PURCHASE, LEAD, VIEW_CONTENT, etc.
  startDate: string;                 // ISO date (mesma para todos adsets deste tipo)
  targetCountries: string[];         // array de country codes (ex: ["BR", "US"])
  adsetStatus: 'ACTIVE' | 'PAUSED';
}

export interface CreativeFile {
  id: string;
  fileName: string;
  driveUrl: string;
  type: 'image' | 'video';
}

export interface AdConfig {
  destinationUrl: string;
  creativeFormat: 'image' | 'video' | 'carousel';
  driveLink: string;
  creativeFiles: CreativeFile[];
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

export interface WizardState {
  currentStep: number;
  completedSteps: number[];
  selectedAccountIds: string[];
  selectedPageIds: string[];
  adsetsPerCampaign: number;
  totalCampaigns: number;
  distributionMap: DistributionEntry[];
  campaignConfig: CampaignConfig;
  adsetTypes: AdsetTypeConfig[];
  adConfig: AdConfig | null;
  templateName: string;
  isDraft: boolean;
  draftId: string | null;
}

const initialState: WizardState = {
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

// --- Actions ---

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
      return { ...initialState };

    default:
      return state;
  }
}

// --- Context ---

interface WizardContextValue {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used within WizardProvider');
  return ctx;
}

// --- Provider ---

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(wizardReducer, initialState);

  // Auto-save draft on step change (debounced)
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();
  const prevStep = useRef(state.currentStep);

  const saveDraft = useCallback(async (wizardState: WizardState) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      await fetch('/api/drafts/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ state: wizardState }),
      });
    } catch (e) {
      console.warn('[Wizard] Draft save failed:', e);
    }
  }, []);

  useEffect(() => {
    if (prevStep.current !== state.currentStep) {
      prevStep.current = state.currentStep;
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => saveDraft(state), 2000);
    }
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [state, saveDraft]);

  return (
    <WizardContext.Provider value={{ state, dispatch }}>
      {children}
    </WizardContext.Provider>
  );
}
