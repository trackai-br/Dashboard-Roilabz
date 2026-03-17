import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
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

  if (req.method === 'PUT') {
    return handlePut(req, res, user.id);
  }

  res.setHeader('Allow', ['PUT']);
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handlePut(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { id: adId } = req.query;
    const updates = req.body;

    if (!adId) {
      return res.status(400).json({ error: 'Ad ID is required' });
    }

    // Get user's accounts
    const userAccounts = await getUserAccounts(userId);
    if (userAccounts.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if user has access to this ad
    const { data: ad, error: adError } = await supabase
      .from('meta_ads')
      .select('meta_account_id, ad_id')
      .eq('id', adId as string)
      .single();

    if (adError || !ad) {
      return res.status(404).json({ error: 'Ad not found' });
    }

    const hasAccess = userAccounts.some((acc) => acc.id === ad.meta_account_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    try {
      // Update via Meta API
      await metaAPI.updateAd(ad.ad_id, updates);

      // Update in database
      const { error: updateError } = await supabase
        .from('meta_ads')
        .update({
          ...updates,
          updated_at: new Date(),
        })
        .eq('id', adId as string);

      if (updateError) {
        console.error('Database update error:', updateError);
      }

      return res.status(200).json({
        success: true,
        adId,
        message: 'Ad updated successfully',
      });
    } catch (metaError) {
      const message =
        metaError instanceof Error ? metaError.message : 'Unknown error';
      console.error('Meta API error:', message);

      return res.status(500).json({
        error: 'Failed to update ad',
        details: message,
      });
    }
  } catch (error) {
    console.error('Error updating ad:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
