import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

/**
 * POST /api/auth/meta/disconnect
 * Remove a conexão Meta do usuário autenticado
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verificar autenticação
    const user = await getUserFromRequest(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log(`[Meta Disconnect] Disconnecting user: ${user.id}`);

    // Deletar conexão Meta da tabela meta_connections
    const { error: deleteError } = await supabaseAdmin
      ?.from('meta_connections')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('[Meta Disconnect] Error deleting from meta_connections:', deleteError);
      return res.status(500).json({
        error: 'Failed to disconnect',
        details: deleteError.message
      });
    }

    // Limpar campos meta_* da tabela users
    const { error: updateError } = await supabaseAdmin
      ?.from('users')
      .update({
        meta_access_token: null,
        meta_token_expires_at: null,
        meta_user_id: null,
        meta_user_name: null,
        meta_connected_at: null,
        meta_scopes: null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[Meta Disconnect] Error updating users table:', updateError);
      // Log warning but don't fail - meta_connections is what matters
      console.warn('[Meta Disconnect] Failed to clear users table, but meta_connections was deleted');
    }

    console.log(`[Meta Disconnect] Successfully disconnected user: ${user.id}`);
    return res.status(200).json({
      success: true,
      message: 'Desconectado com sucesso'
    });
  } catch (error) {
    console.error('[Meta Disconnect] Unexpected error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
