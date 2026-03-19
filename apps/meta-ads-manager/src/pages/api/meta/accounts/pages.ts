// @ts-nocheck - Supabase client typing doesn't fully support custom tables
import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { getUserAccounts } from '@/lib/supabase-rls';
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

    // Get user's accounts
    const userAccounts = await getUserAccounts(userId);
    const account = userAccounts.find((acc) => acc.id === accountId);

    if (!account) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Fetch pages from Supabase (already synced)
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Supabase admin client not initialized' });
    }

    const { data: pages, error } = await supabaseAdmin
      .from('meta_pages')
      .select('page_id as id, page_name as name')
      .eq('meta_account_id', accountId);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch pages from database' });
    }

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
