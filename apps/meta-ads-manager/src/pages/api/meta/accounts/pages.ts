// @ts-nocheck - Supabase client typing doesn't fully support custom tables
import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication
  const { user, error: authError } = await requireAuth(req);
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    return handleGet(req, res, user.id);
  }

  res.setHeader('Allow', ['GET']);
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const { accountId } = req.query;

    if (!accountId) {
      return res.status(400).json({ error: 'accountId is required' });
    }

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase admin client not initialized' });
    }

    // Get user's accounts (using admin client to bypass RLS)
    const { data: userAccessList } = await supabaseAdmin
      .from('user_account_access')
      .select('account_id')
      .eq('user_id', userId);

    const accessIds = userAccessList?.map((ua: any) => ua.account_id) || [];
    if (accessIds.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: userAccounts } = await supabaseAdmin
      .from('meta_accounts')
      .select('id, meta_account_id')
      .in('id', accessIds);

    const account = (userAccounts || []).find((acc: any) => acc.id === accountId || acc.meta_account_id === accountId);

    if (!account) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: pages, error } = await supabaseAdmin
      .from('meta_pages')
      .select('page_id as id, page_name as name')
      .eq('meta_account_id', account.id);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch pages from database' });
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      pages: pages || [],
      count: pages?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching pages:', error);
    return res.status(500).json({
      error: 'Failed to fetch pages',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
