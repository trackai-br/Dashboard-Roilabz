import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/auth/meta/callback
 * Recebe o código do Facebook, troca por token (short + long-lived), e salva na base
 *
 * Fluxo:
 * 1. Valida state (proteção CSRF) e recupera user_id da tabela oauth_states
 * 2. Troca code por short-lived token
 * 3. Troca short-lived por long-lived token (60 dias)
 * 4. Busca informações do usuário Meta
 * 5. Busca permissões concedidas
 * 6. Salva/atualiza na tabela meta_connections
 * 7. Redireciona com status
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ========== 1. Validar state e recuperar user_id ==========
    const { code, state } = req.query;

    if (!code || !state) {
      console.warn('[OAuth] Missing code or state in callback');
      return res.redirect(302, `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=csrf&message=missing_params`);
    }

    const stateStr = state as string;
    console.log('[OAuth] Validating state from Supabase...');

    const { data: storedStateRecord, error: fetchError } = await supabaseAdmin!
      .from('oauth_states')
      .select('*')
      .eq('state', stateStr)
      .eq('provider', 'meta')
      .single();

    if (fetchError || !storedStateRecord) {
      console.warn('[OAuth] State not found in Supabase - CSRF attack prevented');
      return res.redirect(302, `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=csrf&message=state_mismatch`);
    }

    // Verificar expiração
    if (new Date() > new Date(storedStateRecord.expires_at)) {
      console.warn('[OAuth] State expired');
      await supabaseAdmin!.from('oauth_states').delete().eq('id', storedStateRecord.id);
      return res.redirect(302, `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=csrf&message=state_expired`);
    }

    // Recuperar user_id do state
    const userId = storedStateRecord.user_id;
    if (!userId) {
      console.error('[OAuth] No user_id found in state record');
      return res.redirect(302, `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=unauthorized`);
    }

    // Deletar state usado (previne replay attack)
    await supabaseAdmin!.from('oauth_states').delete().eq('id', storedStateRecord.id);

    console.log(`[OAuth] State validated - user: ${userId}`);

    // ========== 2. Trocar code por SHORT-LIVED token ==========
    const shortLivedParams = new URLSearchParams({
      client_id: process.env.META_APP_ID || '',
      client_secret: process.env.META_APP_SECRET || '',
      redirect_uri: process.env.META_OAUTH_REDIRECT_URI || '',
      code: code as string,
    });

    console.log('[OAuth] Exchanging code for short-lived token...');
    const shortLivedResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?${shortLivedParams.toString()}`,
      {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      }
    );

    if (!shortLivedResponse.ok) {
      const errorData = await shortLivedResponse.json();
      console.error('[OAuth] Short-lived token exchange failed:', errorData);
      return res.redirect(302, `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=facebook&message=${encodeURIComponent(errorData.error?.message || 'Token exchange failed')}`);
    }

    const shortLivedData = await shortLivedResponse.json();
    const shortLivedToken = shortLivedData.access_token;

    if (!shortLivedToken) {
      console.error('[OAuth] No short-lived token in response');
      return res.redirect(302, `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=facebook&message=no_token`);
    }

    console.log('[OAuth] Short-lived token obtained');

    // ========== 3. Trocar SHORT-LIVED por LONG-LIVED token (60 dias) ==========
    const longLivedParams = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: process.env.META_APP_ID || '',
      client_secret: process.env.META_APP_SECRET || '',
      fb_exchange_token: shortLivedToken,
    });

    console.log('[OAuth] Exchanging for long-lived token...');
    const longLivedResponse = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?${longLivedParams.toString()}`,
      {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      }
    );

    if (!longLivedResponse.ok) {
      const errorData = await longLivedResponse.json();
      console.error('[OAuth] Long-lived token exchange failed:', errorData);
      return res.redirect(302, `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=facebook&message=${encodeURIComponent(errorData.error?.message || 'Long-lived token exchange failed')}`);
    }

    const longLivedData = await longLivedResponse.json();
    const longLivedToken = longLivedData.access_token;
    const expiresInLong = longLivedData.expires_in; // ~5184000 segundos (60 dias)

    if (!longLivedToken) {
      console.error('[OAuth] No long-lived token in response');
      return res.redirect(302, `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=facebook&message=no_long_lived_token`);
    }

    console.log('[OAuth] Long-lived token obtained');

    // ========== 4. Buscar informações do usuário Meta ==========
    console.log('[OAuth] Fetching user info...');
    const userInfoResponse = await fetch(
      `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${longLivedToken}`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!userInfoResponse.ok) {
      const errorData = await userInfoResponse.json();
      console.error('[OAuth] Failed to fetch user info:', errorData);
      return res.redirect(302, `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=facebook&message=${encodeURIComponent('Failed to fetch user info')}`);
    }

    const metaUserInfo = await userInfoResponse.json();
    console.log(`[OAuth] Meta user: ${metaUserInfo.id} - ${metaUserInfo.name}`);

    // ========== 5. Buscar permissões concedidas ==========
    let grantedScopes: string[] = [];
    try {
      const permissionsResponse = await fetch(
        `https://graph.facebook.com/v21.0/me/permissions?access_token=${longLivedToken}`,
        { headers: { 'Accept': 'application/json' } }
      );
      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json();
        grantedScopes = (permissionsData.data || [])
          .filter((perm: any) => perm.status === 'granted')
          .map((perm: any) => perm.permission);
        console.log(`[OAuth] Permissions: ${grantedScopes.join(', ')}`);
      }
    } catch {
      console.warn('[OAuth] Could not fetch permissions, continuing without');
    }

    // ========== 6. Salvar/atualizar na tabela meta_connections ==========
    const tokenExpiresAt = new Date(Date.now() + expiresInLong * 1000).toISOString();
    const now = new Date().toISOString();

    console.log(`[OAuth] Saving connection for user: ${userId}`);

    // Verificar se já existe conexão
    const { data: existingConnection } = await supabaseAdmin!
      .from('meta_connections')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingConnection) {
      const { error: updateError } = await supabaseAdmin!
        .from('meta_connections')
        .update({
          meta_user_id: metaUserInfo.id,
          meta_user_name: metaUserInfo.name,
          meta_access_token: longLivedToken,
          meta_token_expires_at: tokenExpiresAt,
          meta_scopes: grantedScopes.join(','),
          connection_status: 'active',
          last_used_at: now,
          updated_at: now,
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('[OAuth] Error updating connection:', updateError);
        return res.redirect(302, `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=database&message=${encodeURIComponent('Failed to update connection')}`);
      }
      console.log('[OAuth] Connection updated');
    } else {
      const { error: insertError } = await supabaseAdmin!
        .from('meta_connections')
        .insert({
          user_id: userId,
          meta_user_id: metaUserInfo.id,
          meta_user_name: metaUserInfo.name,
          meta_access_token: longLivedToken,
          meta_token_expires_at: tokenExpiresAt,
          meta_scopes: grantedScopes.join(','),
          connection_status: 'active',
          created_at: now,
          updated_at: now,
        });

      if (insertError) {
        console.error('[OAuth] Error creating connection:', insertError);
        return res.redirect(302, `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=database&message=${encodeURIComponent('Failed to save connection')}`);
      }
      console.log('[OAuth] Connection created');
    }

    // ========== 7. Redirecionar com sucesso ==========
    console.log('[OAuth] ✅ Success!');
    return res.redirect(302, `${process.env.NEXT_PUBLIC_APP_URL}/connections?connected=true&provider=meta`);
  } catch (error) {
    console.error('[OAuth] Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.redirect(302, `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=server&message=${encodeURIComponent(errorMessage)}`);
  }
}
