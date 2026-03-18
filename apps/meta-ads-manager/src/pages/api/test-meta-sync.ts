import type { NextApiRequest, NextApiResponse } from 'next';
import { metaAPI } from '@/lib/meta-api';
import { createClient } from '@supabase/supabase-js';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result: any = {
      timestamp: new Date().toISOString(),
      checks: {},
      errors: [],
    };

    // 1. Check environment variables
    result.checks.env = {
      has_meta_token: !!process.env.META_ACCESS_TOKEN,
      has_system_user: !!process.env.META_SYSTEM_USER_ID,
      has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      has_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    // 2. Try to fetch accounts from Meta API
    try {
      const accounts = await metaAPI.getAdAccounts();
      result.checks.meta_api = {
        status: 'success',
        accounts_count: accounts.length,
        accounts,
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      result.checks.meta_api = {
        status: 'failed',
        error: errMsg,
      };
      result.errors.push(`Meta API Error: ${errMsg}`);
    }

    // 3. Check Supabase tables
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    try {
      const { data: accountsData, error: accountsError } = await supabase
        .from('meta_accounts')
        .select('*');

      if (accountsError) {
        result.checks.supabase_accounts = {
          status: 'failed',
          error: accountsError.message,
        };
        result.errors.push(`Supabase error: ${accountsError.message}`);
      } else {
        result.checks.supabase_accounts = {
          status: 'success',
          count: accountsData?.length || 0,
          data: accountsData || [],
        };
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      result.checks.supabase_accounts = {
        status: 'failed',
        error: errMsg,
      };
      result.errors.push(`Supabase connection error: ${errMsg}`);
    }

    // 4. Check campaigns table
    try {
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('meta_ads_campaigns')
        .select('*');

      if (campaignsError) {
        result.checks.supabase_campaigns = {
          status: 'failed',
          error: campaignsError.message,
        };
      } else {
        result.checks.supabase_campaigns = {
          status: 'success',
          count: campaignsData?.length || 0,
        };
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      result.checks.supabase_campaigns = {
        status: 'failed',
        error: errMsg,
      };
    }

    // Summary
    const failedChecks = Object.values(result.checks).filter(
      (check: any) => check.status === 'failed'
    ).length;

    result.summary = {
      total_checks: Object.keys(result.checks).length,
      passed: Object.keys(result.checks).length - failedChecks,
      failed: failedChecks,
      status: failedChecks === 0 ? 'healthy' : 'degraded',
    };

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      error: 'Diagnostic failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
