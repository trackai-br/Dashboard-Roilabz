import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';

interface WizardFormData {
  accountId: string;
  accountName: string;
  campaignName: string;
  campaignObjective: string;
  campaignStatus: 'ACTIVE' | 'PAUSED';
  budgetType: 'daily' | 'lifetime';
  campaignDailyBudget?: number;
  campaignLifetimeBudget?: number;
  campaignStartTime?: string;
  campaignStopTime?: string;
  adSetName: string;
  adSetStatus: 'ACTIVE' | 'PAUSED';
  adSetBillingEvent: string;
  adSetBidStrategy: string;
  adSetBidAmount?: number;
  adSetTargeting: Record<string, unknown>;
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

interface Step5ReviewProps {
  data: WizardFormData;
}

export function Step5Review({ data }: Step5ReviewProps) {
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePublish = async () => {
    setIsPublishing(true);
    setError(null);

    try {
      // Get Supabase client to extract session token
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );

      // Get current session with access token
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error('No valid session - user must be logged in');
      }

      // Call API with Bearer token
      const response = await fetch('/api/meta/campaigns-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create campaign');
      }

      const result = await response.json();

      // Redirect to campaign detail page
      if (result.campaignId) {
        await router.push(`/campaigns/${result.campaignId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>
          Review Your Campaign
        </h2>
        <p className="text-gray-600 text-sm">
          Review all details before publishing. Once published, you can edit individual components.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Campaign Summary */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Campaign Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Account</p>
            <p className="text-sm font-medium text-gray-900">{data.accountName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Campaign Name</p>
            <p className="text-sm font-medium text-gray-900">{data.campaignName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Objective</p>
            <p className="text-sm font-medium text-gray-900">{data.campaignObjective}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Status</p>
            <p className="text-sm font-medium text-gray-900">{data.campaignStatus}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-500">Budget</p>
            <p className="text-sm font-medium text-gray-900">
              {data.budgetType === 'daily'
                ? `$${data.campaignDailyBudget}/day`
                : `$${data.campaignLifetimeBudget} total`}
            </p>
          </div>
        </div>
      </div>

      {/* Ad Set Summary */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Ad Set Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Ad Set Name</p>
            <p className="text-sm font-medium text-gray-900">{data.adSetName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Status</p>
            <p className="text-sm font-medium text-gray-900">{data.adSetStatus}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Billing Event</p>
            <p className="text-sm font-medium text-gray-900">{data.adSetBillingEvent}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Bid Strategy</p>
            <p className="text-sm font-medium text-gray-900">{data.adSetBidStrategy}</p>
          </div>
        </div>
      </div>

      {/* Ad Summary */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Ad Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Ad Name</p>
            <p className="text-sm font-medium text-gray-900">{data.adName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Format</p>
            <p className="text-sm font-medium text-gray-900">{data.creativeFormat}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-500">Headline</p>
            <p className="text-sm font-medium text-gray-900">{data.creativeHeadline}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-500">Body</p>
            <p className="text-sm font-medium text-gray-900">{data.creativeBody}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-500">Landing URL</p>
            <p className="text-sm font-medium text-gray-900 break-all">{data.creativeUrl}</p>
          </div>
        </div>
      </div>

      <button
        onClick={handlePublish}
        disabled={isPublishing}
        className="w-full py-3 px-4 rounded-lg font-medium text-white transition disabled:opacity-50"
        style={{
          backgroundColor: isPublishing ? '#ccc' : 'var(--color-primary)',
        }}
      >
        {isPublishing ? 'Publishing...' : 'Publish Campaign'}
      </button>

      <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--color-info-bg)' }}>
        <p className="text-sm" style={{ color: 'var(--color-info)' }}>
          ✅ <strong>Ready to go!</strong> Once you publish, your campaign will start running
          according to the schedule you set.
        </p>
      </div>
    </div>
  );
}
