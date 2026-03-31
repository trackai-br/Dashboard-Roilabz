// @ts-nocheck - Supabase client typing doesn't fully support custom tables
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuth } from '@/lib/auth';
import { metaAPI } from '@/lib/meta-api';
import { getUserAccounts } from '@/lib/supabase-rls';

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

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase admin client not initialized' });
  }

  const step = req.body?.step || 'accounts';

  try {
    // STEP 1: Sync accounts from Meta API
    if (step === 'accounts') {
      let accountsCount = 0;

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

        if (syncedAccounts) {
          // Ensure user exists in users table (FK requirement for user_account_access)
          const userEmail = user.email || `${user.id}@noemail.local`;
          console.log(`[sync] Upserting user: id=${user.id}, email=${userEmail}`);
          const { error: userError } = await supabaseAdmin.from('users').upsert(
            { id: user.id, email: userEmail },
            { onConflict: 'id' }
          );

          if (userError) {
            console.error('[sync] Error upserting user:', userError);
          }

          console.log(`[sync] Creating ${syncedAccounts.length} access entries for user ${user.id}`);
          const { error: accessError } = await supabaseAdmin.from('user_account_access').upsert(
            syncedAccounts.map((account: any) => ({
              user_id: user.id,
              account_id: account.id,
            })),
            { onConflict: 'user_id,account_id' }
          );

          if (accessError) {
            console.error('[sync] Error creating user_account_access:', accessError);
          } else {
            console.log('[sync] user_account_access entries created successfully');
          }
        }
      }

      return res.status(200).json({
        success: true,
        step: 'accounts',
        synced_accounts: accountsCount,
      });
    }

    // STEP 2: Sync pages for all user accounts
    // me/accounts returns the SAME pages regardless of ad account,
    // so we fetch once and associate with all accounts.
    if (step === 'pages') {
      let pagesCount = 0;
      const accounts = await getUserAccounts(user.id);

      if (accounts.length > 0) {
        // Fetch pages ONCE (me/accounts is user-level, not per ad account)
        const pages = await metaAPI.getPages(accounts[0].meta_account_id);

        if (pages && pages.length > 0) {
          // Associate each page with every account (so they appear for any selected account)
          const allPageRows = accounts.flatMap((account) =>
            pages.map((page: any) => ({
              meta_account_id: account.id,
              page_id: page.id,
              page_name: page.name,
            }))
          );

          // Batch upsert in chunks of 500 (Supabase handles dedup via UNIQUE constraint)
          const CHUNK_SIZE = 500;
          for (let i = 0; i < allPageRows.length; i += CHUNK_SIZE) {
            const chunk = allPageRows.slice(i, i + CHUNK_SIZE);
            const { error } = await supabaseAdmin
              .from('meta_pages')
              .upsert(chunk, { onConflict: 'meta_account_id,page_id' });

            if (error) console.error(`Error syncing pages chunk ${i}:`, error);
          }
          pagesCount = pages.length; // Report unique page count, not total rows
        }
      }

      return res.status(200).json({
        success: true,
        step: 'pages',
        synced_pages: pagesCount,
      });
    }

    // STEP 3: Sync pixels for all user accounts
    if (step === 'pixels') {
      let pixelsCount = 0;
      const accounts = await getUserAccounts(user.id);

      if (accounts.length > 0) {
        const results = await Promise.allSettled(
          accounts.map(async (account) => {
            const pixels = await metaAPI.getPixels(account.meta_account_id);
            if (pixels && pixels.length > 0) {
              const pixelsToSync = pixels.map((pixel: any) => ({
                meta_account_id: account.id,
                pixel_id: pixel.id,
                pixel_name: pixel.name,
                last_fired_time: (() => {
                  if (!pixel.last_fired_time) return null;
                  try {
                    const d = new Date(pixel.last_fired_time);
                    return isNaN(d.getTime()) ? null : Math.floor(d.getTime() / 1000);
                  } catch { return null; }
                })(),
              }));
              const { data, error } = await supabaseAdmin
                .from('meta_pixels')
                .upsert(pixelsToSync, { onConflict: 'meta_account_id,pixel_id' })
                .select();

              if (error) console.error(`Error syncing pixels for ${account.meta_account_id}:`, error);
              return data?.length || 0;
            }
            return 0;
          })
        );

        for (const r of results) {
          if (r.status === 'fulfilled') pixelsCount += r.value;
        }
      }

      // Log sync attempt if requested (final step)
      if (req.body?.logSync) {
        const syncedAccounts = req.body.synced_accounts || 0;
        const syncedPages = req.body.synced_pages || 0;
        await supabaseAdmin.from('sync_log').insert({
          user_id: user.id,
          status: 'success',
          synced_accounts: syncedAccounts,
          synced_pages: syncedPages,
          synced_pixels: pixelsCount,
        }).then(({ error }) => {
          if (error) console.error('[sync] Error writing sync_log:', error);
        });
      }

      return res.status(200).json({
        success: true,
        step: 'pixels',
        synced_pixels: pixelsCount,
      });
    }

    return res.status(400).json({ error: `Unknown step: ${step}` });
  } catch (error) {
    console.error(`Sync error (step=${step}):`, error);
    return res.status(500).json({
      error: 'Sync failed',
      step,
      details: error instanceof Error ? error.message : 'unknown',
    });
  }
}

