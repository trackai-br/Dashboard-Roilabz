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

  return (
    <DashboardLayout darkMode={darkMode} onDarkModeToggle={handleDarkModeToggle}>
      <Breadcrumb
        items={[
          { label: 'Campaigns', href: '/campaigns' },
          { label: 'Bulk Create Campaigns', href: '/campaigns/bulk-create' },
        ]}
        darkMode={darkMode}
      />

      <div className="p-6">
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
          Bulk Create Campaigns
        </h1>
        <p className="mb-8 text-gray-600 dark:text-gray-400">
          Create the same campaign across multiple accounts with optional customizations
        </p>

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
              ✓ Bulk campaign creation started! Redirecting...
            </p>
          </div>
        )}

        {/* Step Indicator */}
        <div className="mb-8 flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
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
                {step === 4 && 'Accounts'}
              </span>
              {step < 4 && (
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
              accountId=""
              data={formData}
              onChange={handleFieldChange}
              darkMode={darkMode}
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
                        borderColor: bulkData.selectedAccounts.includes(account.id)
                          ? '#3B82F6'
                          : '#E5E7EB',
                        backgroundColor: bulkData.selectedAccounts.includes(account.id)
                          ? darkMode
                            ? '#1E3A8A'
                            : '#EFF6FF'
                          : darkMode
                          ? '#1F2937'
                          : '#F9FAFB',
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
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {account.account_name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {account.account_id}
                          </p>
                        </div>
                      </div>

                      {/* Override Fields */}
                      {bulkData.selectedAccounts.includes(account.id) && (
                        <div className="mt-4 space-y-3 border-t border-gray-300 dark:border-gray-600 pt-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                              className="w-full rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-2 py-1 text-sm dark:text-white"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                              className="w-full rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 px-2 py-1 text-sm dark:text-white"
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
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
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
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-6 py-2 font-medium text-gray-700 dark:text-white disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            ← Previous
          </button>

          <div className="flex gap-4">
            {currentStep < 4 && (
              <button
                onClick={handleNext}
                className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Next →
              </button>
            )}

            {currentStep === 4 && (
              <button
                onClick={handleCreate}
                disabled={bulkCreateMutation.isPending || bulkData.selectedAccounts.length === 0}
                className="rounded-lg bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
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
