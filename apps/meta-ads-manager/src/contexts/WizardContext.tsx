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
  name: string;
  objective: string;
  status: 'ACTIVE' | 'PAUSED';
  budgetType: 'daily' | 'lifetime';
  dailyBudget?: number;
  lifetimeBudget?: number;
  startTime?: string;
  stopTime?: string;
}

export interface AdsetTypeConfig {
  id: string;
  name: string;
  billingEvent: string;
  bidStrategy: string;
  bidAmount?: number;
  targeting: Record<string, unknown>;
}

export interface AdConfig {
  name: string;
  status: 'ACTIVE' | 'PAUSED';
  creativeFormat: string;
  headline: string;
  body: string;
  url: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface WizardState {
  currentStep: number;
  completedSteps: number[];
  selectedAccountIds: string[];
  selectedPageIds: string[];
  adsetsPerCampaign: number;
  totalCampaigns: number;
  distributionMap: DistributionEntry[];
  campaignConfig: CampaignConfig | null;
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
  campaignConfig: null,
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
