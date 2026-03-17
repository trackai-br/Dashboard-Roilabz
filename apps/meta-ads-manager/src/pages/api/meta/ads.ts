import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';
import { getUserAccounts } from '@/lib/supabase-rls';

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
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { adsetId } = req.query;

    if (!adsetId) {
      return res.status(400).json({ error: 'adsetId is required' });
    }

    // Get user's accounts
    const userAccounts = await getUserAccounts(userId);
    if (userAccounts.length === 0) {
      return res.status(200).json({ ads: [] });
    }

    // Check if user has access to this ad set
    const { data: adset, error: adsetError } = await supabase
      .from('meta_ad_sets')
      .select('meta_account_id')
      .eq('adset_id', adsetId as string)
      .single();

    if (adsetError || !adset) {
      return res.status(404).json({ error: 'Ad set not found' });
    }

    // Verify user has access by comparing meta_account_id (TEXT)
    const hasAccess = userAccounts.some((acc) => acc.meta_account_id === adset.meta_account_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Fetch ads from database
    const { data: ads, error } = await supabase
      .from('meta_ads')
      .select('*')
      .eq('adset_id', adsetId as string)
      .order('updated_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch ads' });
    }

    return res.status(200).json({
      ads: ads || [],
      count: ads?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching ads:', error);
    return res.status(500).json({
      error: 'Failed to fetch ads',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
