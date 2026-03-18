import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Breadcrumb } from '@/components/Breadcrumb';
import { useMetaAccounts } from '@/hooks/useMetaAccounts';
import { Step1Campaign } from '@/components/campaign-creator/Step1Campaign';
import { Step2AdSet } from '@/components/campaign-creator/Step2AdSet';
import { Step3Ad } from '@/components/campaign-creator/Step3Ad';

interface FormData {
  accountId: string;
  campaignName: string;
  campaignObjective: string;
  campaignStatus: 'ACTIVE' | 'PAUSED';
  campaignStartTime?: string;
  campaignStopTime?: string;
  campaignDailyBudget?: number;
  campaignLifetimeBudget?: number;
  budgetType: 'daily' | 'lifetime';
  adSetName: string;
  adSetStatus: 'ACTIVE' | 'PAUSED';
  adSetDailyBudget?: number;
  adSetLifetimeBudget?: number;
  adSetTargeting: Record<string, any>;
  adSetBillingEvent: string;
  adSetBidStrategy: string;
  adSetBidAmount?: number;
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

interface AccountOverride {
  campaignName?: string;
  adSetDailyBudget?: number;
  pageId?: string;
  pixelId?: string;
}

interface BulkFormData {
  selectedAccounts: string[];
  overridesByAccount: Record<string, AccountOverride>;
}

export default function BulkCreateCampaignPage() {
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

  const [bulkData, setBulkData] = useState<BulkFormData>({
    selectedAccounts: [],
    overridesByAccount: {},
  });

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const toggleAccountSelection = (accountId: string) => {
    setBulkData((prev) => ({
      ...prev,
      selectedAccounts: prev.selectedAccounts.includes(accountId)
        ? prev.selectedAccounts.filter((id) => id !== accountId)
        : [...prev.selectedAccounts, accountId],
    }));
  };

  const updateAccountOverride = (accountId: string, field: string, value: any) => {
    setBulkData((prev) => ({
      ...prev,
      overridesByAccount: {
        ...prev.overridesByAccount,
        [accountId]: {
          ...prev.overridesByAccount[accountId],
          [field]: value,
        },
      },
    }));
  };

  // Mutation for bulk creation
  const bulkCreateMutation = useMutation({
    mutationFn: async () => {
      if (bulkData.selectedAccounts.length === 0) {
        throw new Error('Please select at least one account');
      }

      const res = await fetch('/api/meta/bulk-campaigns-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          accountIds: bulkData.selectedAccounts,
          overridesByAccount: bulkData.overridesByAccount,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.details || err.error);
      }

      return res.json();
    },
    onSuccess: (data) => {
      setSuccess(true);
      // Redirect to campaigns page after 2 seconds
      setTimeout(() => {
        router.push('/campaigns');
      }, 2000);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to create campaigns');
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
    }
    if (currentStep === 2) {
      if (!formData.adSetName || !formData.adSetBillingEvent || !formData.adSetBidStrategy) {
        setError('Please fill in all required fields');
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
    if (currentStep === 4 && bulkData.selectedAccounts.length === 0) {
      setError('Please select at least one account');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleCreate = () => {
    if (validateStep()) {
      bulkCreateMutation.mutate();
    }
  };

  return (
    <DashboardLayout>
      <Breadcrumb
        items={[
          { label: 'Campaigns', href: '/campaigns' },
          { label: 'Bulk Create Campaigns', href: '/campaigns/bulk-create' },
        ]}
      />

      <div className="p-6">
        <h1 className="mb-2 text-3xl font-bold font-display" style={{ color: 'var(--color-primary)' }}>
          Bulk Create Campaigns
        </h1>
        <p className="mb-8" style={{ color: 'var(--color-secondary)' }}>
          Create the same campaign across multiple accounts with optional customizations
        </p>

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
              ✓ Bulk campaign creation started! Redirecting...
            </p>
          </div>
        )}

        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
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
                {step === 4 && 'Accounts'}
              </span>
              {step < 4 && (
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
              accountId=""
              data={formData}
              onChange={handleFieldChange}
            />
          )}

          {/* Step 4: Account Selection */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Select Accounts
              </h3>

              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {accountsLoading ? (
                  <p className="text-gray-500 dark:text-gray-400">Loading accounts...</p>
                ) : accounts?.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No accounts available</p>
                ) : (
                  accounts?.map((account) => (
                    <div
                      key={account.id}
                      className="rounded-lg border-2 p-4 cursor-pointer transition-all"
                      onClick={() => toggleAccountSelection(account.id)}
                      style={{
                        borderColor: bulkData.selectedAccounts.includes(account.id) ? 'var(--color-brand)' : 'var(--color-tertiary)',
                        backgroundColor: bulkData.selectedAccounts.includes(account.id) ? 'var(--color-brand-light)' : 'var(--bg-card)',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={bulkData.selectedAccounts.includes(account.id)}
                          onChange={() => {}} // Handled by parent div
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium" style={{ color: 'var(--color-primary)' }}>
                            {account.meta_account_name}
                          </h4>
                          <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
                            {account.meta_account_id}
                          </p>
                        </div>
                      </div>

                      {/* Override Fields */}
                      {bulkData.selectedAccounts.includes(account.id) && (
                        <div className="mt-4 space-y-3 pt-4" style={{ borderTop: '1px solid var(--color-tertiary)' }}>
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-primary)' }}>
                              Campaign Name (override)
                            </label>
                            <input
                              type="text"
                              placeholder="Leave empty to use default"
                              value={
                                bulkData.overridesByAccount[account.id]?.campaignName || ''
                              }
                              onChange={(e) =>
                                updateAccountOverride(
                                  account.id,
                                  'campaignName',
                                  e.target.value || undefined
                                )
                              }
                              className="input w-full rounded px-2 py-1 text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-primary)' }}>
                              Daily Budget (override)
                            </label>
                            <input
                              type="number"
                              placeholder="Leave empty to use default"
                              value={
                                bulkData.overridesByAccount[account.id]?.adSetDailyBudget || ''
                              }
                              onChange={(e) =>
                                updateAccountOverride(
                                  account.id,
                                  'adSetDailyBudget',
                                  e.target.value ? Number(e.target.value) : undefined
                                )
                              }
                              className="input w-full rounded px-2 py-1 text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {bulkData.selectedAccounts.length > 0 && (
                <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-info-bg)' }}>
                  <p className="text-sm" style={{ color: 'var(--color-info)' }}>
                    📊 <strong>{bulkData.selectedAccounts.length}</strong> account
                    {bulkData.selectedAccounts.length !== 1 ? 's' : ''} selected for bulk
                    creation
                  </p>
                </div>
              )}
            </div>
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
            {currentStep < 4 && (
              <button
                onClick={handleNext}
                className="rounded-lg px-6 py-2 font-medium text-white transition-colors"
                style={{ backgroundColor: 'var(--color-brand)' }}
              >
                Next →
              </button>
            )}

            {currentStep === 4 && (
              <button
                onClick={handleCreate}
                disabled={bulkCreateMutation.isPending || bulkData.selectedAccounts.length === 0}
                className="rounded-lg px-6 py-2 font-medium text-white disabled:opacity-50 transition-colors"
                style={{ backgroundColor: 'var(--color-success)' }}
              >
                {bulkCreateMutation.isPending ? 'Creating...' : '✓ Create in Bulk'}
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
