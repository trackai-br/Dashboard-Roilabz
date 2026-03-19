import type { NextApiRequest, NextApiResponse } from 'next';
import { randomBytes } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/auth/meta
 * Inicia o fluxo OAuth com o Facebook
 *
 * Fluxo:
 * 1. Gera state aleatório (proteção CSRF)
 * 2. Salva em Supabase `oauth_states` table (10 minutos TTL)
 * 3. Redireciona para dialog de login do Facebook
 *
 * O usuário será validado pelo Facebook durante o login.
 * O callback handler valida o OAuth token e state retornados.
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

    // 1. Gerar state aleatório (proteção CSRF)
    const state = randomBytes(32).toString('hex');

    // 2. Salvar state em Supabase (expira em 10 minutos)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: insertError } = await supabaseAdmin!
      .from('oauth_states')
      .insert({
        state,
        provider: 'meta',
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error('[OAuth] Error saving state:', insertError);
      return res.redirect(
        302,
        `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=server&message=${encodeURIComponent('Failed to initiate OAuth')}`
      );
    }

    console.log('[OAuth] State saved to Supabase:', state.substring(0, 8) + '...');

    // 3. Montar URL de autorização do Facebook (v21.0)
    const params = new URLSearchParams({
      client_id: process.env.META_APP_ID || '',
      redirect_uri: process.env.META_OAUTH_REDIRECT_URI || '',
      scope: 'ads_management,ads_read,business_management,pages_show_list,pages_read_engagement,pages_manage_ads,read_insights,leads_retrieval',
      response_type: 'code',
      state: state,
    });

    const facebookAuthUrl = `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;

    console.log('[OAuth] Redirecting to Facebook OAuth dialog');

    // 4. Redirecionar para Facebook
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
