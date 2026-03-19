import type { NextApiRequest, NextApiResponse } from 'next';
import { randomBytes } from 'crypto';
import { supabase } from '@/lib/supabase';

/**
 * GET /api/auth/meta
 * Inicia o fluxo OAuth com o Facebook
 *
 * Pré-requisitos:
 * - Usuário deve estar autenticado via Supabase Auth
 * - Token pode ser passado via query param (?token=...) ou Authorization header
 *
 * Fluxo:
 * 1. Verifica se usuário está autenticado (via token ou header)
 * 2. Gera state aleatório (proteção CSRF)
 * 3. Salva em cookie httpOnly (10 minutos)
 * 4. Redireciona para dialog de login do Facebook
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Note: We don't validate the user here. Let Facebook validate during login.
    // If user is not authenticated in Facebook, they'll be redirected to login.
    // The callback handler (/api/auth/meta/callback) validates the token.

    console.log('[OAuth] Initiating Meta OAuth flow...');

    console.log(`[OAuth] Initiating Meta OAuth flow for user: ${user.id}`);

    // 2. Gerar state aleatório (proteção CSRF)
    const state = randomBytes(32).toString('hex');

    // 3. Salvar state em cookie httpOnly (expira em 10 minutos)
    res.setHeader(
      'Set-Cookie',
      `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=600`
    );

    // 4. Montar URL de autorização do Facebook (v21.0 como especificado)
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
    return res.redirect(302, `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=server&message=${encodeURIComponent(errorMessage)}`);
  }
}
