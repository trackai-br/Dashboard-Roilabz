// @ts-nocheck - Supabase client typing doesn't fully support custom tables
import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { metaAPI } from '@/lib/meta-api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader('Cache-Control', 'no-store');

  const { user, error: authError } = await requireAuth(req);
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const accountId = req.query.accountId as string;
    if (!accountId) {
      return res.status(400).json({ error: 'accountId is required' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase admin client not initialized' });
    }

    // Look up account UUID from meta_account_id
    const { data: account, error: accountError } = await supabaseAdmin
      .from('meta_accounts')
      .select('id')
      .eq('meta_account_id', accountId)
      .maybeSingle();

    if (accountError) {
      console.error('[pixels] Error looking up account:', accountError);
      return res.status(500).json({ error: 'Failed to look up account' });
    }

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Try DB first
    const { data: pixels, error: pixelsError } = await supabaseAdmin
      .from('meta_pixels')
      .select('pixel_id, pixel_name, last_fired_time')
      .eq('meta_account_id', account.id);

    if (!pixelsError && pixels && pixels.length > 0) {
      return res.status(200).json({
        pixels: pixels.map((p: any) => ({ id: p.pixel_id, name: p.pixel_name, last_fired_time: p.last_fired_time })),
        count: pixels.length,
        source: 'database',
      });
    }

    // Fallback: fetch from Meta API (account-level + Business Manager)
    console.log(`[pixels] DB empty for ${accountId}, falling back to Meta API`);
    const apiPixels = await metaAPI.getPixels(accountId, user.id);

    // Cache in DB for future requests
    if (apiPixels.length > 0) {
      const rows = apiPixels.map((p) => ({
        meta_account_id: account.id,
        pixel_id: p.id,
        pixel_name: p.name,
        last_fired_time: p.last_fired_time ? new Date(p.last_fired_time * 1000).toISOString() : null,
      }));
      await supabaseAdmin
        .from('meta_pixels')
        .upsert(rows, { onConflict: 'meta_account_id,pixel_id' })
        .then(({ error }) => {
          if (error) console.warn('[pixels] Cache upsert failed:', error.message);
        });
    }

    return res.status(200).json({
      pixels: apiPixels,
      count: apiPixels.length,
      source: 'meta_api',
    });
  } catch (error) {
    console.error('[pixels] Unhandled error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
