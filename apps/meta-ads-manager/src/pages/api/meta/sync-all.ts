import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';
import { metaAPI } from '@/lib/meta-api';

interface SyncLogEntry {
  user_id: string;
  status: 'success' | 'partial' | 'failed';
  synced_accounts: number;
  synced_pages: number;
  synced_pixels: number;
  error_details?: Record<string, unknown>;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
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

    let accountsCount = 0;
    let pagesCount = 0;
    let pixelsCount = 0;
    let status: 'success' | 'partial' | 'failed' = 'success';
    let errorDetails: Record<string, unknown> | undefined;

    // 1. Sync Accounts
    try {
      const accounts = await metaAPI.getAdAccounts();
      if (accounts && accounts.length > 0) {
        const accountsToSync = accounts.map((account: any) => ({
          meta_account_id: account.id,
          meta_account_name: account.name,
          currency: account.currency || 'USD',
          timezone: account.timezone || 'America/New_York',
        }));

        const { data: syncedAccounts } = await supabase
          .from('meta_accounts')
          .upsert(accountsToSync, { onConflict: 'meta_account_id' })
          .select();

        accountsCount = syncedAccounts?.length || 0;

        // Create user_account_access entries
        if (syncedAccounts) {
          await supabase.from('user_account_access').upsert(
            syncedAccounts.map((account: any) => ({
              user_id: user.id,
              account_id: account.id,
            })),
            { onConflict: 'user_id,account_id' }
          );
        }
      }
    } catch (error) {
      status = 'partial';
      errorDetails = { accounts: error instanceof Error ? error.message : 'unknown' };
    }

    // 2. Sync Pages and Pixels for each account
    try {
      const { data: accounts } = await supabase
        .from('meta_accounts')
        .select('id, meta_account_id')
        .limit(100);

      if (accounts) {
        for (const account of accounts) {
          try {
            const pages = await metaAPI.getPages(account.meta_account_id);
            if (pages && pages.length > 0) {
              const pagesToSync = pages.map((page: any) => ({
                meta_account_id: account.id,
                page_id: page.id,
                page_name: page.name,
              }));
              const { data: syncedPages } = await supabase
                .from('meta_pages')
                .upsert(pagesToSync, { onConflict: 'meta_account_id,page_id' })
                .select();
              pagesCount += syncedPages?.length || 0;
            }
          } catch (error) {
            status = 'partial';
          }

          try {
            const pixels = await metaAPI.getPixels(account.meta_account_id);
            if (pixels && pixels.length > 0) {
              const pixelsToSync = pixels.map((pixel: any) => ({
                meta_account_id: account.id,
                pixel_id: pixel.id,
                pixel_name: pixel.name,
                last_fired_time: pixel.last_fired_time,
              }));
              const { data: syncedPixels } = await supabase
                .from('meta_pixels')
                .upsert(pixelsToSync, { onConflict: 'meta_account_id,pixel_id' })
                .select();
              pixelsCount += syncedPixels?.length || 0;
            }
          } catch (error) {
            status = 'partial';
          }
        }
      }
    } catch (error) {
      status = 'partial';
      errorDetails = { ...errorDetails, pages_pixels: error instanceof Error ? error.message : 'unknown' };
    }

    // 3. Log sync attempt
    const syncLog: SyncLogEntry = {
      user_id: user.id,
      status,
      synced_accounts: accountsCount,
      synced_pages: pagesCount,
      synced_pixels: pixelsCount,
      error_details: errorDetails,
    };

    await supabase.from('sync_log').insert(syncLog);

    return res.status(200).json({
      success: true,
      status,
      synced_accounts: accountsCount,
      synced_pages: pagesCount,
      synced_pixels: pixelsCount,
    });
  } catch (error) {
    console.error('Sync all error:', error);
    return res.status(500).json({
      error: 'Sync failed',
      details: error instanceof Error ? error.message : 'unknown',
    });
  }
}
