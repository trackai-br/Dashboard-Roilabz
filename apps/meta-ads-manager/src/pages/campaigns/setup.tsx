import React, { useReducer, useState } from 'react';
import { DashboardLayout } from '../../components/DashboardLayout';
import { WizardSidebar } from '../../components/campaign-wizard/WizardSidebar';
import { Step0AccountPicker } from '../../components/campaign-wizard/Step0AccountPicker';
import { Step1Assets } from '../../components/campaign-wizard/Step1Assets';
import { Step1Campaign } from '../../components/campaign-creator/Step1Campaign';
import { Step2AdSet } from '../../components/campaign-creator/Step2AdSet';
import { Step3Ad } from '../../components/campaign-creator/Step3Ad';
import { Step5Review } from '../../components/campaign-wizard/Step5Review';

interface WizardFormData {
  // Step 0: Account
  accountId: string;
  accountName: string;

  // Step 2: Campaign
  campaignName: string;
  campaignObjective: string;
  campaignStatus: 'ACTIVE' | 'PAUSED';
  budgetType: 'daily' | 'lifetime';
  campaignDailyBudget?: number;
  campaignLifetimeBudget?: number;
  campaignStartTime?: string;
  campaignStopTime?: string;

  // Step 3: AdSet
  adSetName: string;
  adSetStatus: 'ACTIVE' | 'PAUSED';
  adSetBillingEvent: string;
  adSetBidStrategy: string;
  adSetBidAmount?: number;
  adSetTargeting: Record<string, unknown>;

  // Step 4: Ad
  adName: string;
  adStatus: 'ACTIVE' | 'PAUSED';
  creativeFormat: string;
  creativeHeadline: string;
  creativeBody: string;
  creativeUrl: string;
  creativeImageUrl?: string;
  pageId: string;
  pixelId?: string;
}

type WizardAction =
  | { type: 'SET_ACCOUNT'; payload: { accountId: string; accountName: string } }
  | { type: 'UPDATE_CAMPAIGN'; payload: Partial<WizardFormData> }
  | { type: 'UPDATE_ADSET'; payload: Partial<WizardFormData> }
  | { type: 'UPDATE_AD'; payload: Partial<WizardFormData> }
  | { type: 'RESET' };

const initialState: WizardFormData = {
  accountId: '',
  accountName: '',
  campaignName: '',
  campaignObjective: '',
  campaignStatus: 'ACTIVE',
  budgetType: 'daily',
  adSetName: '',
  adSetStatus: 'ACTIVE',
  adSetBillingEvent: 'IMPRESSIONS',
  adSetBidStrategy: 'LOWEST_COST',
  adSetTargeting: {},
  adName: '',
  adStatus: 'ACTIVE',
  creativeFormat: 'SINGLE_IMAGE',
  creativeHeadline: '',
  creativeBody: '',
  creativeUrl: '',
  pageId: '',
};

function wizardReducer(state: WizardFormData, action: WizardAction): WizardFormData {
  switch (action.type) {
    case 'SET_ACCOUNT':
      return {
        ...state,
        accountId: action.payload.accountId,
        accountName: action.payload.accountName,
      };
    case 'UPDATE_CAMPAIGN':
      return { ...state, ...action.payload };
    case 'UPDATE_ADSET':
      return { ...state, ...action.payload };
    case 'UPDATE_AD':
      return { ...state, ...action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export default function CampaignSetupPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, dispatch] = useReducer(wizardReducer, initialState);

  const handleAccountSelect = (accountId: string, accountName: string) => {
    dispatch({ type: 'SET_ACCOUNT', payload: { accountId, accountName } });
    setCurrentStep(1);
  };

  const handleCampaignChange = (field: string, value: any) => {
    dispatch({ type: 'UPDATE_CAMPAIGN', payload: { [field]: value } });
  };

  const handleAdSetChange = (field: string, value: any) => {
    dispatch({ type: 'UPDATE_ADSET', payload: { [field]: value } });
  };

  const handleAdChange = (field: string, value: any) => {
    dispatch({ type: 'UPDATE_AD', payload: { [field]: value } });
  };

  const validateStep = (): boolean => {
    switch (currentStep) {
      case 0:
        return !!formData.accountId;
      case 1:
        return true; // Step 1 is informative only
      case 2:
        return (
          !!formData.campaignName &&
          !!formData.campaignObjective &&
          (formData.budgetType === 'daily'
            ? !!formData.campaignDailyBudget
            : !!formData.campaignLifetimeBudget)
        );
      case 3:
        return (
          !!formData.adSetName &&
          !!formData.adSetBillingEvent &&
          !!formData.adSetBidStrategy
        );
      case 4:
        return (
          !!formData.adName &&
          !!formData.creativeHeadline &&
          !!formData.creativeBody &&
          !!formData.creativeUrl &&
          !!formData.pageId
        );
      case 5:
        return true; // Step 5 is review only
      default:
        return false;
    }
  };

  const canGoNext = validateStep();

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Step0AccountPicker
            selectedAccountId={formData.accountId}
            onSelectAccount={handleAccountSelect}
          />
        );
      case 1:
        return <Step1Assets accountId={formData.accountId} accountName={formData.accountName} />;
      case 2:
        return (
          <Step1Campaign
            data={{
              campaignName: formData.campaignName,
              campaignObjective: formData.campaignObjective,
              campaignStatus: formData.campaignStatus,
              campaignStartTime: formData.campaignStartTime,
              campaignStopTime: formData.campaignStopTime,
              campaignDailyBudget: formData.campaignDailyBudget,
              campaignLifetimeBudget: formData.campaignLifetimeBudget,
              budgetType: formData.budgetType,
            }}
            onChange={handleCampaignChange}
          />
        );
      case 3:
        return (
          <Step2AdSet
            data={{
              adSetName: formData.adSetName,
              adSetStatus: formData.adSetStatus,
              adSetBillingEvent: formData.adSetBillingEvent,
              adSetBidStrategy: formData.adSetBidStrategy,
              adSetBidAmount: formData.adSetBidAmount,
              adSetTargeting: formData.adSetTargeting,
            }}
            onChange={handleAdSetChange}
          />
        );
      case 4:
        return (
          <Step3Ad
            data={{
              adName: formData.adName,
              adStatus: formData.adStatus,
              creativeFormat: formData.creativeFormat,
              creativeHeadline: formData.creativeHeadline,
              creativeBody: formData.creativeBody,
              creativeUrl: formData.creativeUrl,
              creativeImageUrl: formData.creativeImageUrl,
              pageId: formData.pageId,
              pixelId: formData.pixelId,
            }}
            onChange={handleAdChange}
            accountId={formData.accountId}
          />
        );
      case 5:
        return <Step5Review data={formData} />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex h-full">
        <WizardSidebar currentStep={currentStep} />

        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-8">
            {renderStepContent()}

            {currentStep < 5 && (
              <div className="mt-8 flex justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>

                <button
                  onClick={() => {
                    if (canGoNext && currentStep < 5) {
                      setCurrentStep(currentStep + 1);
                    }
                  }}
                  disabled={!canGoNext || currentStep === 5}
                  className="px-6 py-2 rounded-lg text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: canGoNext ? 'var(--color-primary)' : '#ccc',
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
