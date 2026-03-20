import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

const API_VERSION = process.env.META_API_VERSION || 'v23.0';

async function graphGet(path: string, token: string): Promise<any> {
  const res = await fetch(
    `https://graph.facebook.com/${API_VERSION}/${path}${path.includes('?') ? '&' : '?'}access_token=${token}`
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user, error: authError } = await requireAuth(req);
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const results: Record<string, { status: string; [key: string]: any }> = {};

  // 1. Token check
  let token: string | null = null;
  try {
    if (!supabaseAdmin) throw new Error('Supabase admin not initialized');

    const { data, error } = await supabaseAdmin
      .from('meta_connections')
      .select('meta_access_token, meta_token_expires_at')
      .eq('user_id', user.id)
      .eq('connection_status', 'active')
      .single();

    if (error || !data) throw new Error('Nenhuma conexao ativa encontrada');

    token = data.meta_access_token;
    const expiresAt = data.meta_token_expires_at ? new Date(data.meta_token_expires_at) : null;
    const now = new Date();

    if (expiresAt && expiresAt < now) {
      results.token = { status: 'error', error: 'Token expirado' };
      return res.status(200).json(results);
    }

    const expiresInDays = expiresAt
      ? Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    results.token = { status: 'ok', expires_in_days: expiresInDays };
  } catch (e: any) {
    results.token = { status: 'error', error: e.message };
    return res.status(200).json(results);
  }

  // 2. GET /me
  try {
    const me = await graphGet('me?fields=id,name', token);
    results.me = { status: 'ok', user_id: me.id, name: me.name };
  } catch (e: any) {
    results.me = { status: 'error', error: e.message };
  }

  // 3. GET /me/adaccounts
  let firstAccountId: string | null = null;
  try {
    const accounts = await graphGet('me/adaccounts?fields=id,name&limit=100', token);
    const list = accounts.data || [];
    firstAccountId = list[0]?.id || null;
    results.adAccounts = { status: 'ok', count: list.length };
  } catch (e: any) {
    results.adAccounts = { status: 'error', error: e.message };
  }

  // 4. GET /me/accounts (pages)
  try {
    const pages = await graphGet('me/accounts?fields=id,name,category&limit=100', token);
    results.pages = { status: 'ok', count: (pages.data || []).length };
  } catch (e: any) {
    results.pages = { status: 'error', error: e.message };
  }

  // 5. Pixels — try multiple accounts until we find one with pixels
  let allAccountIds: string[] = [];
  try {
    const accounts = await graphGet('me/adaccounts?fields=id&limit=100', token);
    allAccountIds = (accounts.data || []).map((a: any) => a.id);
  } catch (_) {}

  if (allAccountIds.length > 0) {
    // Pixels: try first 10 accounts
    let totalPixels = 0;
    let pixelAccountId: string | null = null;
    for (const accId of allAccountIds.slice(0, 10)) {
      try {
        const pixels = await graphGet(`${accId}/adspixels?fields=id,name,last_fired_time&limit=100`, token);
        const count = (pixels.data || []).length;
        if (count > 0) {
          totalPixels += count;
          if (!pixelAccountId) pixelAccountId = accId;
        }
      } catch (_) {}
    }
    results.pixels = { status: 'ok', count: totalPixels, checked_accounts: Math.min(10, allAccountIds.length), ...(pixelAccountId ? { found_in: pixelAccountId } : {}) };

    // Campaigns: try first 10 accounts
    let totalCampaigns = 0;
    let campaignAccountId: string | null = null;
    for (const accId of allAccountIds.slice(0, 10)) {
      try {
        const campaigns = await graphGet(`${accId}/campaigns?fields=id,name&limit=100`, token);
        const count = (campaigns.data || []).length;
        if (count > 0) {
          totalCampaigns += count;
          if (!campaignAccountId) campaignAccountId = accId;
        }
      } catch (_) {}
    }
    results.campaigns = { status: 'ok', count: totalCampaigns, checked_accounts: Math.min(10, allAccountIds.length), ...(campaignAccountId ? { found_in: campaignAccountId } : {}) };
  } else {
    results.pixels = { status: 'skipped', error: 'Nenhuma ad account encontrada' };
    results.campaigns = { status: 'skipped', error: 'Nenhuma ad account encontrada' };
  }

  return res.status(200).json(results);
}
