// @ts-nocheck - Supabase client typing doesn't fully support custom tables
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
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

export const config = {
  maxDuration: 60,
};

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
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase admin client not initialized' });
    }

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

        const { data: syncedAccounts } = await supabaseAdmin
          .from('meta_accounts')
          .upsert(accountsToSync, { onConflict: 'meta_account_id' })
          .select();

        accountsCount = syncedAccounts?.length || 0;

        // Create user_account_access entries
        if (syncedAccounts) {
          await supabaseAdmin.from('user_account_access').upsert(
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

    // 2. Sync Pages and Pixels for each account (only user's accounts)
    try {
      // Get only accounts the user has access to
      const { data: userAccounts } = await supabaseAdmin
        .from('user_account_access')
        .select('account_id')
        .eq('user_id', user.id);

      if (!userAccounts || userAccounts.length === 0) {
        // User has no accounts, log sync and return
        const syncLog: SyncLogEntry = {
          user_id: user.id,
          status: accountsCount > 0 ? 'success' : 'failed',
          synced_accounts: accountsCount,
          synced_pages: pagesCount,
          synced_pixels: pixelsCount,
          error_details: accountsCount === 0 ? { message: 'No accounts synced' } : undefined,
        };

        await supabaseAdmin.from('sync_log').insert(syncLog);

        return res.status(200).json({
          success: true,
          status: syncLog.status,
          synced_accounts: accountsCount,
          synced_pages: pagesCount,
          synced_pixels: pixelsCount,
        });
      }

      const accountIds = userAccounts.map(ua => ua.account_id);

      const { data: accounts } = await supabaseAdmin
        .from('meta_accounts')
        .select('id, meta_account_id')
        .in('id', accountIds)
        .limit(100);

      if (accounts && accounts.length > 0) {
        // Parallelize pages+pixels sync across all accounts
        const results = await Promise.allSettled(
          accounts.map(async (account) => {
            let accountPages = 0;
            let accountPixels = 0;

            // Fetch pages and pixels in parallel for each account
            const [pagesResult, pixelsResult] = await Promise.allSettled([
              metaAPI.getPages(account.meta_account_id),
              metaAPI.getPixels(account.meta_account_id),
            ]);

            // Sync pages
            if (pagesResult.status === 'fulfilled' && pagesResult.value?.length > 0) {
              const pagesToSync = pagesResult.value.map((page: any) => ({
                meta_account_id: account.id,
                page_id: page.id,
                page_name: page.name,
              }));
              const { data: syncedPages, error: pagesError } = await supabaseAdmin
                .from('meta_pages')
                .upsert(pagesToSync, { onConflict: 'meta_account_id,page_id' })
                .select();

              if (pagesError) {
                console.error(`Error syncing pages for account ${account.meta_account_id}:`, pagesError);
              } else {
                accountPages = syncedPages?.length || 0;
              }
            } else if (pagesResult.status === 'rejected') {
              console.error(`Exception fetching pages for account ${account.meta_account_id}:`, pagesResult.reason);
            }

            // Sync pixels
            if (pixelsResult.status === 'fulfilled' && pixelsResult.value?.length > 0) {
              const pixelsToSync = pixelsResult.value.map((pixel: any) => ({
                meta_account_id: account.id,
                pixel_id: pixel.id,
                pixel_name: pixel.name,
                last_fired_time: pixel.last_fired_time ? Math.floor(new Date(pixel.last_fired_time).getTime() / 1000) : null,
              }));
              const { data: syncedPixels, error: pixelsError } = await supabaseAdmin
                .from('meta_pixels')
                .upsert(pixelsToSync, { onConflict: 'meta_account_id,pixel_id' })
                .select();

              if (pixelsError) {
                console.error(`Error syncing pixels for account ${account.meta_account_id}:`, pixelsError);
              } else {
                accountPixels = syncedPixels?.length || 0;
              }
            } else if (pixelsResult.status === 'rejected') {
              console.error(`Exception fetching pixels for account ${account.meta_account_id}:`, pixelsResult.reason);
            }

            return { accountPages, accountPixels };
          })
        );

        for (const result of results) {
          if (result.status === 'fulfilled') {
            pagesCount += result.value.accountPages;
            pixelsCount += result.value.accountPixels;
          } else {
            status = 'partial';
            errorDetails = { ...errorDetails, account_error: result.reason?.message || 'unknown' };
          }
        }
      }
    } catch (error) {
      console.error('Error in pages/pixels sync loop:', error);
      status = 'partial';
      errorDetails = { ...errorDetails, pages_pixels_loop: error instanceof Error ? error.message : 'unknown' };
    }

    // If nothing was synced and no explicit success, mark as failed
    if (accountsCount === 0 && pagesCount === 0 && pixelsCount === 0 && status === 'success') {
      status = 'failed';
      errorDetails = { message: 'No data synced from Meta API' };
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

    await supabaseAdmin.from('sync_log').insert(syncLog);

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
