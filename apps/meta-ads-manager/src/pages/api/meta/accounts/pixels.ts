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

    const { data: pixels, error } = await supabaseAdmin
      .from('meta_pixels')
      .select('pixel_id as id, pixel_name as name, last_fired_time')
      .eq('meta_account_id', account.id);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch pixels from database' });
    }

    return res.status(200).json({
      pixels: pixels || [],
      count: pixels?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching pixels:', error);
    return res.status(500).json({
      error: 'Failed to fetch pixels',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
