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

    // Get authenticated user from Authorization header (Bearer token)
    const authHeader = req.headers.authorization?.replace('Bearer ', '');

    if (!authHeader) {
      return res.status(401).json({
        synced: 0,
        accounts: [],
        error: 'Unauthorized - missing Authorization header',
      });
    }

    // Verify token and get user
    const { data, error: userError } = await supabase.auth.getUser(authHeader);

    if (userError || !data.user) {
      return res.status(401).json({
        synced: 0,
        accounts: [],
        error: `Unauthorized - invalid token: ${userError?.message || 'unknown'}`,
      });
    }

    const userId = data.user.id;


    // Fetch all ad accounts from Meta API
    console.log('[Sync] Fetching accounts from Meta API...');
    let metaAccounts;
    try {
      metaAccounts = await metaAPI.getAdAccounts();
      console.log(`[Sync] Got ${metaAccounts?.length || 0} accounts from Meta API`);
    } catch (metaError) {
      console.error('[Sync] Meta API error:', metaError);
      return res.status(500).json({
        synced: 0,
        accounts: [],
        error: `Meta API error: ${metaError instanceof Error ? metaError.message : 'unknown'}`,
      });
    }

    if (!metaAccounts || metaAccounts.length === 0) {
      console.warn('[Sync] No accounts returned from Meta API');
      return res.status(200).json({
        synced: 0,
        accounts: [],
        error: 'No accounts found in Meta API',
      });
    }

    // Upsert accounts into database
    // metaAPI.getAdAccounts() returns { id, name, currency, timezone }
    const accountsToSync = metaAccounts.map((account: any) => ({
      meta_account_id: account.id,  // Use 'id' field from Meta SDK response
      meta_account_name: account.name,
      currency: account.currency || 'USD',
      timezone: account.timezone || 'America/New_York',
    }));

    console.log(`[Sync] Upserting ${accountsToSync.length} accounts to database...`);
    console.log('[Sync] Sample account:', accountsToSync[0]);

    const { data: syncedAccounts, error: syncError } = await supabase
      .from('meta_accounts')
      .upsert(accountsToSync, {
        onConflict: 'meta_account_id',
        ignoreDuplicates: false,
      })
      .select();

    if (syncError) {
      console.error('[Sync] Database error:', syncError);
      throw new Error(`Database upsert error: ${syncError.message}`);
    }

    console.log(`[Sync] Successfully upserted ${syncedAccounts?.length || 0} accounts`);

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
