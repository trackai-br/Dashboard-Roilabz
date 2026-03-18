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
    <DashboardLayout>
      <Breadcrumb
        items={[
          { label: 'Campaigns', href: '/campaigns' },
          { label: 'Create New Campaign', href: '/campaigns/create' },
        ]}
      />

      <div className="p-6">
        <h1 className="mb-2 text-3xl font-bold font-display" style={{ color: 'var(--color-primary)' }}>
          Create Campaign
        </h1>
        <p className="mb-8" style={{ color: 'var(--color-secondary)' }}>
          Set up a new Meta Ads campaign in 3 simple steps
        </p>

        {/* Account Selector */}
        <div className="mb-6 rounded-lg border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--color-tertiary)' }}>
          <label htmlFor="account-select" className="block text-sm font-medium mb-2" style={{ color: 'var(--color-primary)' }}>
            Select Account *
          </label>
          <select
            id="account-select"
            value={formData.accountId}
            onChange={(e) => handleFieldChange('accountId', e.target.value)}
            disabled={accountsLoading}
            className="input w-full rounded-lg px-4 py-2"
          >
            <option value="">Select an account</option>
            {accounts?.map((account) => (
              <option key={account.id} value={account.id}>
                {account.meta_account_name}
              </option>
            ))}
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg border p-4" style={{ backgroundColor: 'var(--color-danger-bg)', borderColor: 'var(--color-danger)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 rounded-lg border p-4" style={{ backgroundColor: 'var(--color-success-bg)', borderColor: 'var(--color-success)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--color-success)' }}>
              ✓ Campaign created successfully! Redirecting...
            </p>
          </div>
        )}

        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-between">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full font-semibold text-white"
                style={{
                  backgroundColor: step === currentStep ? 'var(--color-brand)' : step < currentStep ? 'var(--color-success)' : 'var(--color-tertiary)'
                }}
              >
                {step < currentStep ? '✓' : step}
              </div>
              <span className="ml-2 text-sm font-medium" style={{ color: 'var(--color-primary)' }}>
                {step === 1 && 'Campaign'}
                {step === 2 && 'Ad Set'}
                {step === 3 && 'Creative'}
              </span>
              {step < 3 && (
                <div
                  className="mx-4 h-1 w-12"
                  style={{
                    backgroundColor: step < currentStep ? 'var(--color-success)' : 'var(--color-tertiary)'
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className="mb-8 rounded-lg border p-6" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--color-tertiary)' }}>
          {currentStep === 1 && (
            <Step1Campaign data={formData} onChange={handleFieldChange} />
          )}

          {currentStep === 2 && (
            <Step2AdSet data={formData} onChange={handleFieldChange} />
          )}

          {currentStep === 3 && (
            <Step3Ad
              accountId={formData.accountId}
              data={formData}
              onChange={handleFieldChange}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="rounded-lg border px-6 py-2 font-medium disabled:opacity-50 transition-colors"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--color-tertiary)', color: 'var(--color-primary)' }}
          >
            ← Previous
          </button>

          <div className="flex gap-4">
            {currentStep < 3 && (
              <button
                onClick={handleNext}
                className="rounded-lg px-6 py-2 font-medium text-white transition-colors"
                style={{ backgroundColor: 'var(--color-brand)' }}
              >
                Next →
              </button>
            )}

            {currentStep === 3 && (
              <button
                onClick={handleCreate}
                disabled={createCampaignMutation.isPending}
                className="rounded-lg px-6 py-2 font-medium text-white disabled:opacity-50 transition-colors"
                style={{ backgroundColor: 'var(--color-success)' }}
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
