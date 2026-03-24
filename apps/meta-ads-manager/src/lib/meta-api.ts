import { supabaseAdmin } from './supabase';

/**
 * Erro estruturado da Meta Graph API.
 * Preserva code, subcode e mensagens da Meta para o catalogo de erros.
 */
export class MetaAPIError extends Error {
  code?: number;
  error_subcode?: number;
  error_user_title?: string;
  error_user_msg?: string;
  fbtrace_id?: string;
  httpStatus: number;

  constructor(errorData: any, httpStatus: number) {
    const metaError = errorData?.error || {};
    const msg = metaError.message || `HTTP ${httpStatus}`;
    super(msg);
    this.name = 'MetaAPIError';
    this.code = metaError.code;
    this.error_subcode = metaError.error_subcode;
    this.error_user_title = metaError.error_user_title;
    this.error_user_msg = metaError.error_user_msg;
    this.fbtrace_id = metaError.fbtrace_id;
    this.httpStatus = httpStatus;
  }

  toJSON() {
    return {
      message: this.message,
      code: this.code,
      error_subcode: this.error_subcode,
      error_user_title: this.error_user_title,
      error_user_msg: this.error_user_msg,
      fbtrace_id: this.fbtrace_id,
      httpStatus: this.httpStatus,
    };
  }
}

// Types for Meta API responses
export interface MetaAccount {
  id: string;
  name: string;
  currency: string;
  timezone: string;
}

export interface MetaCampaign {
  id: string;
  name: string;
  objective: string;
  status: string;
  daily_budget?: number;
  lifetime_budget?: number;
  start_time?: string;
  stop_time?: string;
  effective_status?: string;
  created_time?: string;
}

export interface MetaAdSet {
  id: string;
  campaign_id: string;
  name: string;
  status: string;
  daily_budget?: number;
  lifetime_budget?: number;
  targeting?: Record<string, any>;
  billing_event?: string;
  bid_strategy?: string;
  bid_amount?: number;
  created_time?: string;
}

export interface MetaAd {
  id: string;
  adset_id: string;
  name: string;
  status: string;
  creative?: {
    id: string;
    object_story_spec?: Record<string, any>;
  };
  created_time?: string;
}

export interface MetaPage {
  id: string;
  name: string;
  category?: string;
  picture?: { data?: { url?: string } };
  instagram_business_account?: { id: string };
  access_token?: string;
}

export interface MetaPixel {
  id: string;
  name: string;
  last_fired_time?: number;
}

export interface MetaAudience {
  id: string;
  name: string;
  approximate_count: number;
  subtype: string;
}

export interface MetaInsight {
  campaign_id?: string;
  adset_id?: string;
  ad_id?: string;
  campaign_name?: string;
  adset_name?: string;
  ad_name?: string;
  date_start: string;
  date_stop: string;
  impressions: string;
  clicks: string;
  spend: string;
  actions?: Array<{
    action_type: string;
    value: string;
  }>;
  action_values?: Array<{
    action_type: string;
    value: string;
  }>;
  cpc?: string;
  cpm?: string;
  cpp?: string;
  ctr?: string;
  inline_link_clicks?: string;
  landing_page_views?: string;
  cost_per_inline_link_click?: string;
  cost_per_landing_page_view?: string;
  cost_per_action_type?: Array<{
    action_type: string;
    value: string;
  }>;
}

/**
 * Busca o token Meta OAuth do banco de dados.
 * - Se userId fornecido, busca o token desse usuário
 * - Se não, busca o primeiro token ativo (para background jobs como Inngest)
 */
async function getMetaToken(userId?: string): Promise<string> {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin not initialized');
  }

  let query = supabaseAdmin
    .from('meta_connections')
    .select('meta_access_token, meta_token_expires_at')
    .eq('connection_status', 'active');

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.order('updated_at', { ascending: false }).limit(1).single();

  if (error || !data) {
    throw new Error('Nenhuma conta do Facebook conectada.');
  }

  if (data.meta_token_expires_at && new Date(data.meta_token_expires_at) < new Date()) {
    throw new Error('Token expirado. Reconecte sua conta do Facebook.');
  }

  return data.meta_access_token;
}

const META_USER_AGENT = 'RoiLabz/1.0 (Meta Ads Dashboard)';

/**
 * Le headers de uso da API e loga quando o consumo esta alto.
 * Headers: x-business-use-case-usage, x-app-usage, x-ad-account-usage
 */
function checkRateLimitHeaders(response: Response, context: string) {
  const businessUsage = response.headers.get('x-business-use-case-usage');
  const appUsage = response.headers.get('x-app-usage');

  if (businessUsage) {
    try {
      const parsed = JSON.parse(businessUsage);
      for (const [accountId, usageArr] of Object.entries(parsed)) {
        const usage = (usageArr as any[])?.[0];
        if (usage) {
          const maxUsage = Math.max(
            usage.call_count || 0,
            usage.total_cputime || 0,
            usage.total_time || 0
          );
          if (maxUsage > 75) {
            console.warn(`[meta-api] Rate limit alto (${maxUsage}%) para conta ${accountId} em ${context}`);
          }
        }
      }
    } catch {}
  }

  if (appUsage) {
    try {
      const parsed = JSON.parse(appUsage);
      const maxUsage = Math.max(
        parsed.call_count || 0,
        parsed.total_cputime || 0,
        parsed.total_time || 0
      );
      if (maxUsage > 75) {
        console.warn(`[meta-api] App usage alto (${maxUsage}%) em ${context}`);
      }
    } catch {}
  }
}

/**
 * Helper para fazer chamadas à Graph API do Facebook
 */
async function graphFetch<T = any>(
  path: string,
  params: Record<string, string>,
  token: string,
  apiVersion: string
): Promise<T> {
  const queryParams = new URLSearchParams({ ...params, access_token: token });
  const url = `https://graph.facebook.com/${apiVersion}/${path}?${queryParams.toString()}`;

  const response = await fetch(url, {
    headers: { 'User-Agent': META_USER_AGENT },
  });

  checkRateLimitHeaders(response, `GET ${path}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new MetaAPIError(errorData, response.status);
  }

  return response.json();
}

/**
 * Helper para POST na Graph API
 */
async function graphPost<T = any>(
  path: string,
  body: Record<string, any>,
  token: string,
  apiVersion: string
): Promise<T> {
  const url = `https://graph.facebook.com/${apiVersion}/${path}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': META_USER_AGENT,
    },
    body: JSON.stringify({ ...body, access_token: token }),
  });

  checkRateLimitHeaders(response, `POST ${path}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new MetaAPIError(errorData, response.status);
  }

  return response.json();
}

class MetaAPIClient {
  private apiVersion: string;

  constructor() {
    this.apiVersion = process.env.META_API_VERSION || 'v23.0';
  }

  /**
   * Get all ad accounts for the authenticated user
   */
  async getAdAccounts(userId?: string): Promise<MetaAccount[]> {
    const token = await getMetaToken(userId);
    const data = await graphFetch<{ data: any[] }>(
      'me/adaccounts',
      { fields: 'id,name,currency,timezone', limit: '100' },
      token,
      this.apiVersion
    );

    return (data.data || []).map((account: any) => ({
      id: account.id,
      name: account.name || '',
      currency: account.currency || 'USD',
      timezone: account.timezone || 'America/Los_Angeles',
    }));
  }

  /**
   * Get campaigns for an ad account
   */
  async getCampaigns(
    accountId: string,
    fields?: string[],
    limit: number = 100,
    after?: string,
    userId?: string
  ): Promise<{ campaigns: MetaCampaign[]; paging?: { cursors: { after: string; before: string } } }> {
    const token = await getMetaToken(userId);
    const defaultFields = [
      'id', 'name', 'objective', 'status', 'daily_budget',
      'lifetime_budget', 'start_time', 'stop_time', 'effective_status', 'created_time',
    ];

    const params: Record<string, string> = {
      fields: (fields || defaultFields).join(','),
      limit: limit.toString(),
    };
    if (after) params.after = after;

    const data = await graphFetch<{ data: any[]; paging?: any }>(
      `${accountId}/campaigns`,
      params,
      token,
      this.apiVersion
    );

    return {
      campaigns: (data.data || []).map((campaign: any) => ({
        id: campaign.id,
        name: campaign.name,
        objective: campaign.objective,
        status: campaign.status,
        daily_budget: campaign.daily_budget,
        lifetime_budget: campaign.lifetime_budget,
        start_time: campaign.start_time,
        stop_time: campaign.stop_time,
        effective_status: campaign.effective_status,
        created_time: campaign.created_time,
      })),
      paging: data.paging,
    };
  }

  /**
   * Get ad sets for a campaign
   */
  async getAdSets(
    campaignId: string,
    fields?: string[],
    limit: number = 100,
    after?: string,
    userId?: string
  ): Promise<{ adsets: MetaAdSet[]; paging?: any }> {
    const token = await getMetaToken(userId);
    const defaultFields = [
      'id', 'campaign_id', 'name', 'status', 'daily_budget', 'lifetime_budget',
      'targeting', 'billing_event', 'bid_strategy', 'bid_amount', 'created_time',
    ];

    const params: Record<string, string> = {
      fields: (fields || defaultFields).join(','),
      limit: limit.toString(),
    };
    if (after) params.after = after;

    console.log(`[Meta API] Fetching ad sets for campaign: ${campaignId}`);
    const data = await graphFetch<{ data: any[]; paging?: any }>(
      `${campaignId}/adsets`,
      params,
      token,
      this.apiVersion
    );
    console.log(`[Meta API] Ad sets fetched: ${data.data?.length || 0}`);

    return {
      adsets: (data.data || []).map((adset: any) => ({
        id: adset.id,
        campaign_id: adset.campaign_id,
        name: adset.name,
        status: adset.status,
        daily_budget: adset.daily_budget,
        lifetime_budget: adset.lifetime_budget,
        targeting: adset.targeting,
        billing_event: adset.billing_event,
        bid_strategy: adset.bid_strategy,
        bid_amount: adset.bid_amount,
        created_time: adset.created_time,
      })),
      paging: data.paging,
    };
  }

  /**
   * Get ads for an ad set
   */
  async getAds(
    adsetId: string,
    fields?: string[],
    limit: number = 100,
    after?: string,
    userId?: string
  ): Promise<{ ads: MetaAd[]; paging?: any }> {
    const token = await getMetaToken(userId);
    const defaultFields = ['id', 'adset_id', 'name', 'status', 'creative', 'created_time'];

    const params: Record<string, string> = {
      fields: (fields || defaultFields).join(','),
      limit: limit.toString(),
    };
    if (after) params.after = after;

    const data = await graphFetch<{ data: any[]; paging?: any }>(
      `${adsetId}/ads`,
      params,
      token,
      this.apiVersion
    );

    return {
      ads: (data.data || []).map((ad: any) => ({
        id: ad.id,
        adset_id: ad.adset_id,
        name: ad.name,
        status: ad.status,
        creative: ad.creative,
        created_time: ad.created_time,
      })),
      paging: data.paging,
    };
  }

  /**
   * Get Facebook Pages for the authenticated user
   */
  async getPages(accountId: string, userId?: string): Promise<MetaPage[]> {
    const token = await getMetaToken(userId);
    console.log(`[Meta API] Fetching pages for account: ${accountId}`);

    const data = await graphFetch<{ data: any[] }>(
      'me/accounts',
      { fields: 'id,name,category,picture{url},instagram_business_account', limit: '100' },
      token,
      this.apiVersion
    );
    console.log(`[Meta API] Pages fetched: ${data.data?.length || 0}`);

    return (data.data || []).map((page: any) => ({
      id: page.id,
      name: page.name,
      category: page.category,
      picture: page.picture,
      instagram_business_account: page.instagram_business_account,
      access_token: page.access_token,
    }));
  }

  /**
   * Get conversion pixels for an ad account
   */
  async getPixels(accountId: string, userId?: string): Promise<MetaPixel[]> {
    const token = await getMetaToken(userId);
    console.log(`[Meta API] Fetching pixels for account: ${accountId}`);

    const data = await graphFetch<{ data: any[] }>(
      `${accountId}/adspixels`,
      { fields: 'id,name,last_fired_time', limit: '100' },
      token,
      this.apiVersion
    );
    console.log(`[Meta API] Pixels fetched: ${data.data?.length || 0}`);

    return (data.data || []).map((pixel: any) => ({
      id: pixel.id,
      name: pixel.name,
      last_fired_time: pixel.last_fired_time,
    }));
  }

  /**
   * Get custom audiences for an ad account
   */
  async getAudiences(accountId: string, userId?: string): Promise<MetaAudience[]> {
    const token = await getMetaToken(userId);

    const data = await graphFetch<{ data: any[] }>(
      `${accountId}/customaudiences`,
      { fields: 'id,name,approximate_count,subtype', limit: '100' },
      token,
      this.apiVersion
    );

    return (data.data || []).map((audience: any) => ({
      id: audience.id,
      name: audience.name,
      approximate_count: audience.approximate_count,
      subtype: audience.subtype,
    }));
  }

  /**
   * Get insights (metrics) for campaigns, ad sets, or ads
   */
  async getInsights(
    objectId: string,
    dateStart: string,
    dateStop: string,
    level: 'campaign' | 'adset' | 'ad' = 'campaign',
    userId?: string
  ): Promise<MetaInsight[]> {
    const token = await getMetaToken(userId);

    const fields = [
      'campaign_id', 'adset_id', 'ad_id', 'campaign_name', 'adset_name', 'ad_name',
      'date_start', 'date_stop', 'impressions', 'clicks', 'spend',
      'actions', 'action_values', 'cpc', 'cpm', 'cpp', 'ctr',
      'inline_link_clicks', 'landing_page_views',
      'cost_per_inline_link_click', 'cost_per_landing_page_view', 'cost_per_action_type',
    ];

    const data = await graphFetch<{ data: any[] }>(
      `${objectId}/insights`,
      {
        fields: fields.join(','),
        time_range: JSON.stringify({ since: dateStart, until: dateStop }),
        level,
      },
      token,
      this.apiVersion
    );

    return (data.data || []).map((insight: any) => ({
      campaign_id: insight.campaign_id,
      adset_id: insight.adset_id,
      ad_id: insight.ad_id,
      campaign_name: insight.campaign_name,
      adset_name: insight.adset_name,
      ad_name: insight.ad_name,
      date_start: insight.date_start,
      date_stop: insight.date_stop,
      impressions: insight.impressions,
      clicks: insight.clicks,
      spend: insight.spend,
      actions: insight.actions,
      action_values: insight.action_values,
      cpc: insight.cpc,
      cpm: insight.cpm,
      cpp: insight.cpp,
      ctr: insight.ctr,
      inline_link_clicks: insight.inline_link_clicks,
      landing_page_views: insight.landing_page_views,
      cost_per_inline_link_click: insight.cost_per_inline_link_click,
      cost_per_landing_page_view: insight.cost_per_landing_page_view,
      cost_per_action_type: insight.cost_per_action_type,
    }));
  }

  /**
   * Create a campaign
   */
  async createCampaign(
    accountId: string,
    data: {
      name: string;
      objective: string;
      status: 'ACTIVE' | 'PAUSED';
      daily_budget?: number;
      lifetime_budget?: number;
      start_time?: string;
      stop_time?: string;
      special_ad_categories?: string[];
    },
    userId?: string
  ): Promise<{ id: string }> {
    const token = await getMetaToken(userId);
    const body: Record<string, any> = {
      name: data.name,
      objective: data.objective,
      status: data.status,
      special_ad_categories: data.special_ad_categories ?? [],
    };
    if (data.daily_budget) body.daily_budget = data.daily_budget;
    if (data.lifetime_budget) body.lifetime_budget = data.lifetime_budget;
    if (data.start_time) body.start_time = data.start_time;
    if (data.stop_time) body.stop_time = data.stop_time;

    const result = await graphPost<{ id: string }>(
      `${accountId}/campaigns`,
      body,
      token,
      this.apiVersion
    );
    return { id: result.id };
  }

  /**
   * Create an ad set
   */
  async createAdSet(
    accountId: string,
    campaignId: string,
    data: {
      name: string;
      status: 'ACTIVE' | 'PAUSED';
      daily_budget?: number;
      lifetime_budget?: number;
      targeting?: Record<string, any>;
      billing_event?: string;
      bid_strategy?: string;
      bid_amount?: number;
      start_time?: string;
      end_time?: string;
      promoted_object?: Record<string, any>;
    },
    userId?: string
  ): Promise<{ id: string }> {
    const token = await getMetaToken(userId);
    const body: Record<string, any> = {
      name: data.name,
      campaign_id: campaignId,
      status: data.status,
    };
    if (data.daily_budget) body.daily_budget = data.daily_budget;
    if (data.lifetime_budget) body.lifetime_budget = data.lifetime_budget;
    if (data.targeting) body.targeting = data.targeting;
    if (data.billing_event) body.billing_event = data.billing_event;
    if (data.bid_strategy) body.bid_strategy = data.bid_strategy;
    if (data.bid_amount) body.bid_amount = data.bid_amount;
    if (data.start_time) body.start_time = data.start_time;
    if (data.end_time) body.end_time = data.end_time;
    if (data.promoted_object) body.promoted_object = data.promoted_object;

    const result = await graphPost<{ id: string }>(
      `${accountId}/adsets`,
      body,
      token,
      this.apiVersion
    );
    return { id: result.id };
  }

  /**
   * Upload an image to the ad account via URL and return the image_hash
   */
  async uploadImage(
    accountId: string,
    imageUrl: string,
    userId?: string
  ): Promise<{ hash: string }> {
    const token = await getMetaToken(userId);
    const body = { url: imageUrl };
    const result = await graphPost<{ images: Record<string, { hash: string }> }>(
      `${accountId}/adimages`,
      body,
      token,
      this.apiVersion
    );
    // Response format: { images: { "filename": { hash: "...", url: "..." } } }
    const firstImage = Object.values(result.images || {})[0];
    if (!firstImage?.hash) {
      throw new Error('Image upload failed: no hash returned');
    }
    return { hash: firstImage.hash };
  }

  /**
   * Create an ad
   */
  async createAd(
    accountId: string,
    adsetId: string,
    data: {
      name: string;
      status: 'ACTIVE' | 'PAUSED';
      creative_id?: string;
      creative?: Record<string, any>;
      adset_spec?: Record<string, any>;
      tracking_specs?: any[];
    },
    userId?: string
  ): Promise<{ id: string }> {
    const token = await getMetaToken(userId);
    const body: Record<string, any> = {
      name: data.name,
      adset_id: adsetId,
      status: data.status,
    };
    if (data.creative_id) {
      body.creative = { creative_id: data.creative_id };
    } else if (data.creative) {
      body.creative = data.creative;
    }
    if (data.adset_spec) body.adset_spec = data.adset_spec;
    if (data.tracking_specs) body.tracking_specs = data.tracking_specs;

    const result = await graphPost<{ id: string }>(
      `${accountId}/ads`,
      body,
      token,
      this.apiVersion
    );
    return { id: result.id };
  }

  /**
   * Update a campaign
   */
  async updateCampaign(
    campaignId: string,
    data: Partial<{
      name: string;
      status: 'ACTIVE' | 'PAUSED';
      daily_budget: number;
      lifetime_budget: number;
      start_time: string;
      stop_time: string;
    }>,
    userId?: string
  ): Promise<{ success: boolean }> {
    const token = await getMetaToken(userId);
    await graphPost(campaignId, data, token, this.apiVersion);
    return { success: true };
  }

  /**
   * Update an ad set
   */
  async updateAdSet(
    adsetId: string,
    data: Partial<{
      name: string;
      status: 'ACTIVE' | 'PAUSED';
      daily_budget: number;
      lifetime_budget: number;
      bid_amount: number;
      bid_strategy: string;
    }>,
    userId?: string
  ): Promise<{ success: boolean }> {
    const token = await getMetaToken(userId);
    await graphPost(adsetId, data, token, this.apiVersion);
    return { success: true };
  }

  /**
   * Update an ad
   */
  async updateAd(
    adId: string,
    data: Partial<{
      name: string;
      status: 'ACTIVE' | 'PAUSED';
      creative_id: string;
    }>,
    userId?: string
  ): Promise<{ success: boolean }> {
    const token = await getMetaToken(userId);
    await graphPost(adId, data, token, this.apiVersion);
    return { success: true };
  }
}

// Export singleton instance
export const metaAPI = new MetaAPIClient();

export default metaAPI;
