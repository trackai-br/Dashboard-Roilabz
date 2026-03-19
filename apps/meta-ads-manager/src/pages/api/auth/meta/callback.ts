import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserFromRequest } from '@/lib/auth';

/**
 * GET /api/auth/meta/callback
 * Recebe o código do Facebook, troca por token (short + long-lived), e salva na base
 *
 * Fluxo detalhado:
 * 1. Valida state (proteção CSRF)
 * 2. Identifica o usuário autenticado
 * 3. Troca code por short-lived token
 * 4. Troca short-lived por long-lived token (60 dias)
 * 5. Busca informações do usuário Meta
 * 6. Busca permissões concedidas
 * 7. Salva/atualiza na tabela meta_connections
 * 8. Limpa cookie de state
 * 9. Redireciona com status
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ========== 1. Validar state (proteção CSRF) ==========
    const { code, state } = req.query;
    const storedState = req.cookies.oauth_state;

    if (!code || !state) {
      const errorUrl = `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=csrf&message=missing_params`;
      return res.redirect(302, errorUrl);
    }

    if (!storedState || storedState !== state) {
      console.warn('State mismatch - CSRF attack prevented');
      const errorUrl = `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=csrf&message=state_mismatch`;
      return res.redirect(302, errorUrl);
    }

    // ========== 2. Verificar se usuário está autenticado ==========
    const user = await getUserFromRequest(req);
    if (!user) {
      console.warn('Unauthorized callback attempt - user not authenticated');
      const errorUrl = `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=unauthorized`;
      return res.redirect(302, errorUrl);
    }

    // ========== 3. Trocar code por SHORT-LIVED token ==========
    const shortLivedParams = new URLSearchParams({
      client_id: process.env.META_APP_ID || '',
      client_secret: process.env.META_APP_SECRET || '',
      redirect_uri: process.env.META_OAUTH_REDIRECT_URI || '',
      code: code as string,
    });

    console.log('[OAuth] Exchanging code for short-lived token...');
    const shortLivedResponse = await fetch(
      'https://graph.facebook.com/v21.0/oauth/access_token',
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!shortLivedResponse.ok) {
      const errorData = await shortLivedResponse.json();
      console.error('[OAuth] Short-lived token exchange failed:', errorData);
      const errorUrl = `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=facebook&message=${encodeURIComponent(errorData.error?.message || 'Token exchange failed')}`;
      return res.redirect(302, errorUrl);
    }

    const shortLivedData = await shortLivedResponse.json();
    const shortLivedToken = shortLivedData.access_token;
    const expiresInShort = shortLivedData.expires_in; // geralmente 5400 segundos (1.5 horas)

    if (!shortLivedToken) {
      console.error('[OAuth] No short-lived token in response');
      const errorUrl = `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=facebook&message=no_token`;
      return res.redirect(302, errorUrl);
    }

    // ========== 4. Trocar SHORT-LIVED por LONG-LIVED token (60 dias) ==========
    const longLivedParams = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: process.env.META_APP_ID || '',
      client_secret: process.env.META_APP_SECRET || '',
      fb_exchange_token: shortLivedToken,
    });

    console.log('[OAuth] Exchanging short-lived for long-lived token...');
    const longLivedResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?${longLivedParams}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!longLivedResponse.ok) {
      const errorData = await longLivedResponse.json();
      console.error('[OAuth] Long-lived token exchange failed:', errorData);
      const errorUrl = `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=facebook&message=${encodeURIComponent(errorData.error?.message || 'Long-lived token exchange failed')}`;
      return res.redirect(302, errorUrl);
    }

    const longLivedData = await longLivedResponse.json();
    const longLivedToken = longLivedData.access_token;
    const expiresInLong = longLivedData.expires_in; // geralmente 5184000 segundos (60 dias)

    if (!longLivedToken) {
      console.error('[OAuth] No long-lived token in response');
      const errorUrl = `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=facebook&message=no_long_lived_token`;
      return res.redirect(302, errorUrl);
    }

    // ========== 5. Buscar informações do usuário Meta ==========
    console.log('[OAuth] Fetching user info...');
    const userInfoResponse = await fetch(
      `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${longLivedToken}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!userInfoResponse.ok) {
      const errorData = await userInfoResponse.json();
      console.error('[OAuth] Failed to fetch user info:', errorData);
      const errorUrl = `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=facebook&message=${encodeURIComponent('Failed to fetch user info')}`;
      return res.redirect(302, errorUrl);
    }

    const metaUserInfo = await userInfoResponse.json();
    console.log(`[OAuth] User info fetched - ID: ${metaUserInfo.id}`);

    // ========== 6. Buscar permissões concedidas ==========
    console.log('[OAuth] Fetching granted permissions...');
    const permissionsResponse = await fetch(
      `https://graph.facebook.com/v21.0/me/permissions?access_token=${longLivedToken}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    let grantedScopes: string[] = [];
    if (permissionsResponse.ok) {
      const permissionsData = await permissionsResponse.json();
      grantedScopes = (permissionsData.data || [])
        .filter((perm: any) => perm.status === 'granted')
        .map((perm: any) => perm.permission);
      console.log(`[OAuth] Permissions granted: ${grantedScopes.join(', ')}`);
    } else {
      console.warn('[OAuth] Could not fetch permissions, continuing without');
    }

    // ========== 7. Salvar/atualizar na tabela meta_connections ==========
    const tokenExpiresAt = new Date(Date.now() + expiresInLong * 1000).toISOString();
    const connectedAt = new Date().toISOString();

    console.log(`[OAuth] Saving connection for user: ${user.id}`);

    // Tentar encontrar conexão existente
    let existingConnection = null;
    const { data: foundConnection, error: selectError } = await supabaseAdmin!
      .from('meta_connections')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 = not found (normal)
      console.error('[OAuth] Error checking existing connection:', selectError);
      const errorUrl = `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=database&message=${encodeURIComponent('Failed to check connection')}`;
      return res.redirect(302, errorUrl);
    }

    existingConnection = foundConnection;

    if (existingConnection) {
      // ===== ATUALIZAR conexão existente =====
      console.log('[OAuth] Updating existing connection...');
      const { error: updateError } = await (supabaseAdmin! as any)
        .from('meta_connections')
        .update({
          meta_user_id: metaUserInfo.id,
          meta_user_name: metaUserInfo.name,
          meta_access_token: longLivedToken,
          meta_token_expires_at: tokenExpiresAt,
          meta_scopes: grantedScopes.join(','),
          connection_status: 'active',
          last_used_at: connectedAt,
          updated_at: connectedAt,
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('[OAuth] Error updating meta_connections:', updateError);
        const errorUrl = `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=database&message=${encodeURIComponent('Failed to update connection')}`;
        return res.redirect(302, errorUrl);
      }
    } else {
      // ===== CRIAR nova conexão =====
      console.log('[OAuth] Creating new connection...');
      const { error: insertError } = await (supabaseAdmin! as any)
        .from('meta_connections')
        .insert({
          user_id: user.id,
          meta_user_id: metaUserInfo.id,
          meta_user_name: metaUserInfo.name,
          meta_access_token: longLivedToken,
          meta_token_expires_at: tokenExpiresAt,
          meta_scopes: grantedScopes.join(','),
          connection_status: 'active',
          created_at: connectedAt,
          updated_at: connectedAt,
        });

      if (insertError) {
        console.error('[OAuth] Error inserting meta_connections:', insertError);
        const errorUrl = `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=database&message=${encodeURIComponent('Failed to save connection')}`;
        return res.redirect(302, errorUrl);
      }
    }

    // ========== 8. Limpar cookie de state ==========
    res.setHeader(
      'Set-Cookie',
      'oauth_state=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
    );

    // ========== 9. Redirecionar com sucesso ==========
    console.log('[OAuth] Success - redirecting to connections page');
    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/connections?connected=true&provider=meta`;
    return res.redirect(302, successUrl);
  } catch (error) {
    console.error('[OAuth] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorUrl = `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=server&message=${encodeURIComponent(errorMessage)}`;
    return res.redirect(302, errorUrl);
  }
}
