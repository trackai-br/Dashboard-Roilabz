import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { user, error: authError } = await requireAuth(req);
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });
  if (!supabaseAdmin) return res.status(500).json({ error: 'Server error' });

  if (req.method === 'POST') {
    const { name, configJson } = req.body;
    if (!name || !configJson) return res.status(400).json({ error: 'Missing name or configJson' });

    const { data, error } = await (supabaseAdmin as any)
      .from('campaign_templates')
      .insert({
        user_id: user.id,
        name,
        config_json: configJson,
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ id: (data as any).id });
  }

  if (req.method === 'GET') {
    const { data, error } = await (supabaseAdmin as any)
      .from('campaign_templates')
      .select('id, name, config_json, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ templates: data || [] });
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing id' });

    const { error } = await (supabaseAdmin as any)
      .from('campaign_templates')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
