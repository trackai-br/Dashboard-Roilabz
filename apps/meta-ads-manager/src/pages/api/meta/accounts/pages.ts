// @ts-nocheck - Supabase client typing doesn't fully support custom tables
import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

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
      console.error('[pages] Error looking up account:', accountError);
      return res.status(500).json({ error: 'Failed to look up account' });
    }

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Fetch pages for this account
    const { data: pages, error: pagesError } = await supabaseAdmin
      .from('meta_pages')
      .select('page_id, page_name')
      .eq('meta_account_id', account.id);

    if (pagesError) {
      console.error('[pages] Error fetching pages:', pagesError);
      return res.status(500).json({ error: 'Failed to fetch pages' });
    }

    return res.status(200).json({
      pages: (pages || []).map((p: any) => ({ id: p.page_id, name: p.page_name })),
      count: pages?.length || 0,
    });
  } catch (error) {
    console.error('[pages] Unhandled error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
