import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { getUserAccounts } from '@/lib/supabase-rls';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
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
    const { accountId, objectId, objectType, dateStart, dateStop } = req.query;

    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    // Validate dates
    const isValidDate = (date: string | undefined): boolean => {
      if (!date) return true;
      return /^\d{4}-\d{2}-\d{2}$/.test(date);
    };

    if (!isValidDate(dateStart as string) || !isValidDate(dateStop as string)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Default: last 7 days
    const finalDateStart =
      (dateStart as string) ||
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const finalDateStop =
      (dateStop as string) ||
      new Date().toISOString().split('T')[0];

    // Get user's accounts and verify access
    const userAccounts = await getUserAccounts(userId);
    if (userAccounts.length === 0) {
      return res.status(200).json({ insights: [] });
    }

    const targetAccounts = accountId
      ? userAccounts.filter((acc: any) => acc.id === accountId)
      : userAccounts;

    if (targetAccounts.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const accountIds = targetAccounts.map((acc: any) => acc.id);

    // Build query — meta_insights table created by migration 010
    let query = (supabaseAdmin as any)
      .from('meta_insights')
      .select('*')
      .in('meta_account_id', accountIds)
      .gte('date_start', finalDateStart)
      .lte('date_start', finalDateStop)
      .order('date_start', { ascending: false });

    if (objectId) {
      query = query.eq('object_id', objectId as string);
    }
    if (objectType) {
      query = query.eq('object_type', objectType as string);
    }

    const { data: insights, error: dbError } = await query;

    if (dbError) {
      console.error('[insights] DB error:', dbError.message);
      return res.status(500).json({ error: 'Failed to fetch insights' });
    }

    return res.status(200).json({
      insights: insights || [],
      count: insights?.length || 0,
      dateRange: { dateStart: finalDateStart, dateStop: finalDateStop },
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    return res.status(500).json({
      error: 'Failed to fetch insights',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
