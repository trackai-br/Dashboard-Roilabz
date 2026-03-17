import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/auth';
import { getUserAccounts } from '@/lib/supabase-rls';

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

  if (req.method === 'POST') {
    return handlePost(req, res, user.id);
  }

  res.setHeader('Allow', ['GET', 'POST']);
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

    const userAccounts = await getUserAccounts(userId);
    const accountIds = userAccounts.map((acc) => acc.id);

    if (accountIds.length === 0) {
      return res.status(200).json({ rules: [] });
    }

    const { data: rules, error } = await supabase
      .from('meta_alert_rules')
      .select('*')
      .eq('user_id', userId)
      .in('account_id', accountIds)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch alert rules' });
    }

    return res.status(200).json({
      rules: rules || [],
      count: rules?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { accountId, name, conditionType, conditionValue, telegramEnabled, telegramChatId } =
      req.body;

    if (!accountId || !name || !conditionType || !conditionValue) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const userAccounts = await getUserAccounts(userId);
    const hasAccess = userAccounts.some((acc) => acc.id === accountId);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: rule, error } = await supabase
      .from('meta_alert_rules')
      .insert({
        user_id: userId,
        account_id: accountId,
        name,
        condition_type: conditionType,
        condition_value: conditionValue,
        telegram_enabled: telegramEnabled || false,
        telegram_chat_id: telegramChatId,
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating alert rule:', error);
      return res.status(500).json({ error: 'Failed to create alert rule' });
    }

    return res.status(201).json({
      success: true,
      rule,
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
