import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { getUserAccounts } from '@/lib/supabase-rls';
import { metaAPI } from '@/lib/meta-api';

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
    const metaAccountId = userAccounts.find((acc) => acc.id === accountId)
      ?.meta_account_id;

    if (!metaAccountId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Fetch pixels from Meta API
    const pixels = await metaAPI.getPixels(metaAccountId);

    return res.status(200).json({
      pixels,
      count: pixels.length,
    });
  } catch (error) {
    console.error('Error fetching pixels:', error);
    return res.status(500).json({
      error: 'Failed to fetch pixels',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
