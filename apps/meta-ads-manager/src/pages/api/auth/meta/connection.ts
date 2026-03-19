import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

/**
 * GET /api/auth/meta/connection
 * Busca dados de conexão Meta do usuário autenticado
 * Retorna 404 se não há conexão
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar autenticação
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Buscar conexão Meta
    const { data: connection, error } = await supabaseAdmin!
      .from('meta_connections')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // PGRST116 = not found (normal, usuário não conectado)
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'No Meta connection found' });
      }
      console.error('[Meta Connection] Error fetching connection:', error);
      return res.status(500).json({ error: 'Failed to fetch connection' });
    }

    return res.status(200).json(connection);
  } catch (error) {
    console.error('[Meta Connection] Unexpected error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
