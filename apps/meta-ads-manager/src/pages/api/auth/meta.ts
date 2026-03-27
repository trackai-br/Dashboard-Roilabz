import type { NextApiRequest, NextApiResponse } from 'next';
import { randomBytes } from 'crypto';
import { supabaseAdmin, supabase } from '@/lib/supabase';

/**
 * GET /api/auth/meta?token=<supabase_access_token>
 * Inicia o fluxo OAuth com o Facebook
 *
 * Fluxo:
 * 1. Verifica autenticação do usuário via token query param
 * 2. Gera state aleatório (proteção CSRF)
 * 3. Salva state + user_id em Supabase `oauth_states` table (10 minutos TTL)
 * 4. Redireciona para dialog de login do Facebook
 *
 * O user_id é armazenado junto com o state para que o callback
 * saiba qual usuário está conectando, sem depender de cookies/sessão.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[OAuth] Initiating Meta OAuth flow...');

    // 1. Verificar autenticação via token query param
    const token = req.query.token as string;
    if (!token) {
      console.warn('[OAuth] Missing token in request');
      return res.redirect(
        302,
        `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=unauthorized&message=${encodeURIComponent('Please log in first')}`
      );
    }

    const { data: userData, error: authError } = await supabaseAdmin!.auth.getUser(token);
    if (authError || !userData.user) {
      console.warn('[OAuth] Invalid or expired token');
      return res.redirect(
        302,
        `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=unauthorized&message=${encodeURIComponent('Session expired, please log in again')}`
      );
    }

    const userId = userData.user.id;
    console.log(`[OAuth] Authenticated user: ${userId}`);

    // 2. Gerar state aleatório (proteção CSRF)
    const state = randomBytes(32).toString('hex');

    // 3. Salvar state + user_id em Supabase (expira em 10 minutos)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: insertError } = await supabaseAdmin!
      .from('oauth_states')
      .insert({
        state,
        provider: 'meta',
        user_id: userId,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error('[OAuth] Error saving state:', insertError);
      return res.redirect(
        302,
        `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=server&message=${encodeURIComponent('Failed to initiate OAuth')}`
      );
    }

    console.log('[OAuth] State saved with user_id:', state.substring(0, 8) + '...');

    // 4. Montar URL de autorização do Facebook (v21.0)
    const params = new URLSearchParams({
      client_id: process.env.META_APP_ID || '',
      redirect_uri: process.env.META_OAUTH_REDIRECT_URI || '',
      scope: 'ads_management,ads_read,business_management,pages_show_list,pages_read_engagement,pages_manage_ads,read_insights,leads_retrieval',
      response_type: 'code',
      state: state,
    });

    const facebookAuthUrl = `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;

    console.log('[OAuth] Redirecting to Facebook OAuth dialog');

    // 5. Redirecionar para Facebook
    return res.redirect(302, facebookAuthUrl);
  } catch (error) {
    console.error('[OAuth] OAuth init error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.redirect(
      302,
      `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=server&message=${encodeURIComponent(errorMessage)}`
    );
  }
}
