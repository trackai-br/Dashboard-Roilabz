import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useMetaAccounts } from '@/hooks/useMetaAccounts';
import { Step1Campaign } from '@/components/campaign-creator/Step1Campaign';
import { Step2AdSet } from '@/components/campaign-creator/Step2AdSet';
import { Step3Ad } from '@/components/campaign-creator/Step3Ad';
import { useMutation } from '@tanstack/react-query';

interface FormData {
  // Account
  accountId: string;

  // Campaign
  campaignName: string;
  campaignObjective: string;
  campaignStatus: 'ACTIVE' | 'PAUSED';
  campaignStartTime?: string;
  campaignStopTime?: string;
  campaignDailyBudget?: number;
  campaignLifetimeBudget?: number;
  budgetType: 'daily' | 'lifetime';

  // Ad Set
  adSetName: string;
  adSetStatus: 'ACTIVE' | 'PAUSED';
  adSetDailyBudget?: number;
  adSetLifetimeBudget?: number;
  adSetTargeting: Record<string, any>;
  adSetBillingEvent: string;
  adSetBidStrategy: string;
  adSetBidAmount?: number;

  // Ad
  adName: string;
  adStatus: 'ACTIVE' | 'PAUSED';
  creativeHeadline: string;
  creativeBody: string;
  creativeUrl: string;
  creativeImageUrl?: string;
  creativeVideoUrl?: string;
  pixelId?: string;
  pageId: string;
  creativeFormat: 'single_image' | 'single_video' | 'carousel' | 'collection';
}

export default function CreateCampaignPage() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { data: accounts, isLoading: accountsLoading } = useMetaAccounts();

  const [formData, setFormData] = useState<FormData>({
    accountId: '',
    campaignName: '',
    campaignObjective: '',
    campaignStatus: 'ACTIVE',
    budgetType: 'daily',
    adSetName: '',
    adSetStatus: 'ACTIVE',
    adSetTargeting: {},
    adSetBillingEvent: 'IMPRESSIONS',
    adSetBidStrategy: 'LOWEST_COST_WITHOUT_CAP',
    adName: '',
    adStatus: 'ACTIVE',
    creativeHeadline: '',
    creativeBody: '',
    creativeUrl: '',
    creativeFormat: 'single_image',
    pageId: '',
  });

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  // Mutation for creating campaign
  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/meta/campaigns-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.details || err.error);
      }

      return res.json();
    },
    onSuccess: (data) => {
      setSuccess(true);
      // Redirect to campaign detail page after 2 seconds
      setTimeout(() => {
        router.push(`/campaigns/${data.campaignId}`);
      }, 2000);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
    },
  });

  const validateStep = () => {
    if (currentStep === 1) {
      if (!formData.campaignName || !formData.campaignObjective) {
        setError('Please fill in all required fields');
        return false;
      }
      if (formData.budgetType === 'daily' && !formData.campaignDailyBudget) {
        setError('Daily budget is required');
        return false;
      }
      if (
        formData.budgetType === 'lifetime' &&
        (!formData.campaignLifetimeBudget || !formData.campaignStartTime || !formData.campaignStopTime)
      ) {
        setError('Total budget, start date, and end date are required for lifetime budget');
        return false;
      }
    }

    if (currentStep === 2) {
      if (!formData.adSetName || !formData.adSetBillingEvent || !formData.adSetBidStrategy) {
        setError('Please fill in all required fields');
        return false;
      }
      if (
        (formData.adSetBidStrategy === 'LOWEST_COST_WITH_BID_CAP' ||
          formData.adSetBidStrategy === 'COST_CAP') &&
        !formData.adSetBidAmount
      ) {
        setError('Bid amount is required for this bid strategy');
        return false;
      }
    }

    if (currentStep === 3) {
      if (
        !formData.adName ||
        !formData.creativeHeadline ||
        !formData.creativeBody ||
        !formData.creativeUrl ||
        !formData.pageId
      ) {
        setError('Please fill in all required fields');
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleCreate = async () => {
    if (validateStep()) {
      createCampaignMutation.mutate();
    }
  };

  React.useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      setDarkMode(JSON.parse(saved));
    }
  }, []);

  const handleDarkModeToggle = (enabled: boolean) => {
    setDarkMode(enabled);
    localStorage.setItem('darkMode', JSON.stringify(enabled));
  };

  // Set default account
  React.useEffect(() => {
    if (accounts && accounts.length > 0 && !formData.accountId) {
      setFormData((prev) => ({
        ...prev,
        accountId: accounts[0].id,
      }));
    }
  }, [accounts, formData.accountId]);

  return (
    <DashboardLayout darkMode={darkMode} onDarkModeToggle={handleDarkModeToggle}>
      <Breadcrumb
        items={[
          { label: 'Campaigns', href: '/campaigns' },
          { label: 'Create New Campaign', href: '/campaigns/create' },
        ]}
        darkMode={darkMode}
      />

      <div className="p-6">
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
          Create Campaign
        </h1>
        <p className="mb-8 text-gray-600 dark:text-gray-400">
          Set up a new Meta Ads campaign in 3 simple steps
        </p>

        {/* Account Selector */}
        <div className="mb-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
          <label htmlFor="account-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Account *
          </label>
          <select
            id="account-select"
            value={formData.accountId}
            onChange={(e) => handleFieldChange('accountId', e.target.value)}
            disabled={accountsLoading}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white"
          >
            <option value="">Select an account</option>
            {accounts?.map((account) => (
              <option key={account.id} value={account.id}>
                {account.account_name}
              </option>
            ))}
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              ✓ Campaign created successfully! Redirecting...
            </p>
          </div>
        )}

        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-between">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${
                  step === currentStep
                    ? 'bg-blue-600 text-white'
                    : step < currentStep
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                }`}
              >
                {step < currentStep ? '✓' : step}
              </div>
              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                {step === 1 && 'Campaign'}
                {step === 2 && 'Ad Set'}
                {step === 3 && 'Creative'}
              </span>
              {step < 3 && (
                <div
                  className={`mx-4 h-1 w-12 ${
                    step < currentStep ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="mb-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
          {currentStep === 1 && (
            <Step1Campaign data={formData} onChange={handleFieldChange} darkMode={darkMode} />
          )}

          {currentStep === 2 && (
            <Step2AdSet data={formData} onChange={handleFieldChange} darkMode={darkMode} />
          )}

          {currentStep === 3 && (
            <Step3Ad
              accountId={formData.accountId}
              data={formData}
              onChange={handleFieldChange}
              darkMode={darkMode}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-6 py-2 font-medium text-gray-700 dark:text-white disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            ← Previous
          </button>

          <div className="flex gap-4">
            {currentStep < 3 && (
              <button
                onClick={handleNext}
                className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Next →
              </button>
            )}

            {currentStep === 3 && (
              <button
                onClick={handleCreate}
                disabled={createCampaignMutation.isPending}
                className="rounded-lg bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {createCampaignMutation.isPending ? 'Creating...' : '✓ Create Campaign'}
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
