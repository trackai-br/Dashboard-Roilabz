import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Prevent caching on ALL responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user, error: authError } = await requireAuth(req);
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    console.log(`[accounts] Fetching accounts for user: ${user.id}`);

    // Fetch meta_accounts for this user
    const { data: userAccounts, error } = await supabase
      .from('user_account_access')
      .select('account_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('[accounts] Error fetching user_account_access:', error);
      return res.status(500).json({ error: 'Failed to fetch user accounts' });
    }

    const accountIds = userAccounts?.map((ua: any) => ua.account_id) || [];
    console.log(`[accounts] Found ${accountIds.length} account access entries`);

    if (accountIds.length === 0) {
      return res.status(200).json({ data: [] });
    }

    // Fetch account details
    const { data: accounts, error: accountsError } = await supabase
      .from('meta_accounts')
      .select('*')
      .in('id', accountIds);

    if (accountsError) {
      console.error('[accounts] Error fetching meta_accounts:', accountsError);
      return res.status(500).json({ error: 'Failed to fetch account details' });
    }

    console.log(`[accounts] Returning ${accounts?.length || 0} accounts`);
    return res.status(200).json({ data: accounts || [] });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'unknown',
    });
  }
}
