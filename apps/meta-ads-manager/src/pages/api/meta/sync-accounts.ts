import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { metaAPI } from '@/lib/meta-api';

interface SyncResponse {
  synced: number;
  accounts: Array<{
    id: string;
    meta_account_id: string;
    meta_account_name: string;
    currency: string;
    timezone: string;
  }>;
  error?: string;
}

/**
 * POST /api/meta/sync-accounts
 *
 * Synchronizes Meta accounts from Meta API into the database
 * - Fetches all ad accounts from Meta API
 * - Upserts into meta_accounts table
 * - Creates user_account_access entries for authenticated user
 *
 * Returns: { synced: N, accounts: [...] }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SyncResponse>
) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      synced: 0,
      accounts: [],
      error: 'Method not allowed'
    });
  }

  try {
    // Create Supabase client with service role (server-side)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get authenticated user (from Authorization header or session)
    const authHeader = req.headers.authorization?.replace('Bearer ', '');
    let userId: string | null = null;

    if (authHeader) {
      const {
        data: { user },
      } = await supabase.auth.getUser(authHeader);
      userId = user?.id || null;
    }

    if (!userId) {
      // Try to get from cookies if available
      const token = req.cookies['sb-token'];
      if (!token) {
        return res.status(401).json({
          synced: 0,
          accounts: [],
          error: 'Unauthorized - no valid session',
        });
      }
      // In production, validate token properly
      userId = req.cookies['sb-user-id'] || '';
    }

    if (!userId) {
      return res.status(401).json({
        synced: 0,
        accounts: [],
        error: 'Unauthorized',
      });
    }


    // Fetch all ad accounts from Meta API
    const metaAccounts = await metaAPI.getAdAccounts();

    if (!metaAccounts || metaAccounts.length === 0) {
      return res.status(200).json({
        synced: 0,
        accounts: [],
        error: 'No accounts found in Meta API',
      });
    }

    // Upsert accounts into database
    const accountsToSync = metaAccounts.map((account: any) => ({
      meta_account_id: account.account_id,
      meta_account_name: account.name,
      currency: account.currency || 'USD',
      timezone: account.timezone || 'America/New_York',
    }));

    const { data: syncedAccounts, error: syncError } = await supabase
      .from('meta_accounts')
      .upsert(accountsToSync, {
        onConflict: 'meta_account_id',
        ignoreDuplicates: false,
      })
      .select();

    if (syncError) {
      throw new Error(`Database upsert error: ${syncError.message}`);
    }

    // Create user_account_access entries for each account
    const accountAccessEntries = (syncedAccounts || []).map((account: any) => ({
      user_id: userId,
      account_id: account.id,
    }));

    const { error: accessError } = await supabase
      .from('user_account_access')
      .upsert(accountAccessEntries, {
        onConflict: 'user_id,account_id',
        ignoreDuplicates: true,
      });

    if (accessError) {
      console.error('Warning: Could not create access entries:', accessError);
      // Don't fail the whole sync if access entries fail
    }

    // Update last_synced timestamp
    const now = new Date().toISOString();
    await supabase
      .from('meta_accounts')
      .update({ last_synced: now })
      .in(
        'id',
        (syncedAccounts || []).map((a: any) => a.id)
      );

    return res.status(200).json({
      synced: syncedAccounts?.length || 0,
      accounts: syncedAccounts || [],
    });
  } catch (error) {
    console.error('Sync accounts error:', error);
    return res.status(500).json({
      synced: 0,
      accounts: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
