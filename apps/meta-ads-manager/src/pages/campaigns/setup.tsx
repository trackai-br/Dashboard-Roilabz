import React, { useReducer, useCallback } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/DashboardLayout';
import WizardSidebar from '@/components/campaign-wizard/WizardSidebar';
import Step0AccountPicker from '@/components/campaign-wizard/Step0AccountPicker';
import Step1Assets from '@/components/campaign-wizard/Step1Assets';
import { Step1Campaign } from '@/components/campaign-creator/Step1Campaign';
import { Step2AdSet } from '@/components/campaign-creator/Step2AdSet';
import { Step3Ad } from '@/components/campaign-creator/Step3Ad';
import Step5Review from '@/components/campaign-wizard/Step5Review';

type Step = 0 | 1 | 2 | 3 | 4 | 5;

interface WizardFormData {
  accountId: string;
  accountName: string;
  campaignName?: string;
  campaignObjective?: string;
  campaignStatus?: 'ACTIVE' | 'PAUSED';
  budgetType?: 'daily' | 'lifetime';
  campaignDailyBudget?: number;
  campaignLifetimeBudget?: number;
  campaignStartTime?: string;
  campaignStopTime?: string;
  adSetName?: string;
  adSetStatus?: 'ACTIVE' | 'PAUSED';
  adSetBillingEvent?: string;
  adSetBidStrategy?: string;
  adSetBidAmount?: number;
  adSetTargeting?: Record<string, unknown>;
  adName?: string;
  adStatus?: 'ACTIVE' | 'PAUSED';
  creativeFormat?: 'single_image' | 'single_video' | 'carousel' | 'collection';
  creativeHeadline?: string;
  creativeBody?: string;
  creativeUrl?: string;
  creativeImageUrl?: string;
  pageId?: string;
  pixelId?: string;
}

type WizardAction =
  | { type: 'UPDATE_ACCOUNT'; payload: { accountId: string; accountName: string } }
  | { type: 'UPDATE_CAMPAIGN'; payload: Partial<WizardFormData> }
  | { type: 'UPDATE_ADSET'; payload: Partial<WizardFormData> }
  | { type: 'UPDATE_AD'; payload: Partial<WizardFormData> };

function wizardReducer(state: WizardFormData, action: WizardAction): WizardFormData {
  switch (action.type) {
    case 'UPDATE_ACCOUNT':
      return { ...state, accountId: action.payload.accountId, accountName: action.payload.accountName };
    case 'UPDATE_CAMPAIGN':
      return { ...state, ...action.payload };
    case 'UPDATE_ADSET':
      return { ...state, ...action.payload };
    case 'UPDATE_AD':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

const initialState: WizardFormData = {
  accountId: '',
  accountName: '',
  budgetType: 'daily',
  adSetStatus: 'ACTIVE',
  adStatus: 'ACTIVE',
  creativeFormat: 'single_image',
};

export default function CampaignSetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState<Step>(0);
  const [formData, dispatch] = useReducer(wizardReducer, initialState);

  const canProceedToNextStep = useCallback(() => {
    switch (currentStep) {
      case 0:
        return !!formData.accountId;
      case 1:
        return true;
      case 2:
        return !!(formData.campaignName && formData.campaignObjective && formData.budgetType);
      case 3:
        return !!(formData.adSetName && formData.adSetBillingEvent && formData.adSetBidStrategy);
      case 4:
        return !!(formData.adName && formData.creativeHeadline && formData.creativeBody && formData.creativeUrl && formData.pageId);
      case 5:
        return true;
      default:
        return false;
    }
  }, [currentStep, formData]);

  const handleNextStep = () => {
    if (canProceedToNextStep() && currentStep < 5) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handlePublish = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert('User not authenticated');
        return;
      }

      const res = await fetch('/api/meta/campaigns-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(`Error: ${error.message}`);
        return;
      }

      const campaign = await res.json();
      router.push(`/campaigns/${campaign.id}`);
    } catch (error) {
      console.error('Campaign creation error:', error);
      alert('Failed to create campaign');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <Step0AccountPicker formData={formData} dispatch={dispatch} />;
      case 1:
        return <Step1Assets accountId={formData.accountId} />;
      case 2:
        return (
          <Step1Campaign
            data={formData as any}
            onChange={(field, value) => dispatch({ type: 'UPDATE_CAMPAIGN', payload: { [field]: value } })}
          />
        );
      case 3:
        return (
          <Step2AdSet
            data={formData as any}
            onChange={(field, value) => dispatch({ type: 'UPDATE_ADSET', payload: { [field]: value } })}
          />
        );
      case 4:
        return (
          <Step3Ad
            accountId={formData.accountId}
            data={formData as any}
            onChange={(field, value) => dispatch({ type: 'UPDATE_AD', payload: { [field]: value } })}
          />
        );
      case 5:
        return <Step5Review formData={formData} />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex h-full gap-6 bg-gray-50 p-6">
        <WizardSidebar currentStep={currentStep} />
        <div className="flex-1 bg-white rounded-lg shadow-sm p-8 flex flex-col">
          <div className="flex-1 overflow-auto">{renderStepContent()}</div>
          <div className="mt-8 flex items-center justify-between border-t pt-6">
            <button
              onClick={handlePreviousStep}
              disabled={currentStep === 0}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <div className="text-sm text-gray-600">Passo {currentStep + 1} de 6</div>
            {currentStep === 5 ? (
              <button
                onClick={handlePublish}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Publicar Campanha
              </button>
            ) : (
              <button
                onClick={handleNextStep}
                disabled={!canProceedToNextStep()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
