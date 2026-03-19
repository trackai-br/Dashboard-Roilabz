import * as Business from 'facebook-nodejs-business-sdk';

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

class MetaAPIClient {
  private accessToken: string;
  private apiVersion: string;
  private systemUserId: string;

  constructor() {
    this.accessToken = process.env.META_ACCESS_TOKEN || '';
    this.apiVersion = process.env.META_API_VERSION || 'v23.0';
    this.systemUserId = process.env.META_SYSTEM_USER_ID || '';

    if (!this.accessToken) {
      throw new Error('META_ACCESS_TOKEN is not set in environment variables');
    }

    // Initialize Business SDK
    Business.FacebookAdsApi.init(this.accessToken);
  }

  /**
   * Get all ad accounts for the Business Manager
   */
  async getAdAccounts(): Promise<MetaAccount[]> {
    try {
      // Use the authenticated user to access ad accounts
      // The token must belong to a user who has access to the ad accounts
      const user = new (Business as any).User('me');
      const fields = ['id', 'name', 'currency', 'timezone'];

      const response = await user.getAdAccounts(fields);

      return response.map((account: any) => ({
        id: account.id,
        name: account.name || '',
        currency: account.currency || 'USD',
        timezone: account.timezone || 'America/Los_Angeles',
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message.includes('401')) {
        throw new Error('Invalid Meta access token');
      }
      if (message.includes('429')) {
        throw new Error('Meta API rate limit exceeded');
      }
      throw new Error(`Failed to fetch ad accounts: ${message}`);
    }
  }

  /**
   * Get campaigns for an ad account
   */
  async getCampaigns(
    accountId: string,
    fields?: string[],
    limit: number = 100,
    after?: string
  ): Promise<{ campaigns: MetaCampaign[]; paging?: { cursors: { after: string; before: string } } }> {
    try {
      const account = new Business.AdAccount(accountId);
      const defaultFields = [
        'id',
        'name',
        'objective',
        'status',
        'daily_budget',
        'lifetime_budget',
        'start_time',
        'stop_time',
        'effective_status',
        'created_time',
      ];

      const params: any = {
        limit,
        fields: fields || defaultFields,
      };

      if (after) {
        params.after = after;
      }

      const response = await account.getCampaigns([], params);

      return {
        campaigns: response.map((campaign: any) => ({
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
        paging: response.paging,
      };
    } catch (error) {
      throw new Error(`Failed to fetch campaigns: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get ad sets for a campaign
   */
  async getAdSets(
    campaignId: string,
    fields?: string[],
    limit: number = 100,
    after?: string
  ): Promise<{ adsets: MetaAdSet[]; paging?: any }> {
    try {
      console.log(`[Meta API] Fetching ad sets for campaign: ${campaignId}`);

      const defaultFields = [
        'id',
        'campaign_id',
        'name',
        'status',
        'daily_budget',
        'lifetime_budget',
        'targeting',
        'billing_event',
        'bid_strategy',
        'bid_amount',
        'created_time',
      ];

      const fieldsList = (fields || defaultFields).join(',');

      // Make direct REST API call via fetch
      const queryParams = new URLSearchParams({
        fields: fieldsList,
        limit: limit.toString(),
        access_token: this.accessToken,
      });

      if (after) {
        queryParams.append('after', after);
      }

      const url = `https://graph.facebook.com/${this.apiVersion}/${campaignId}/adsets?${queryParams.toString()}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[Meta API] Ad sets fetched: ${data?.data?.length || 0}`);

      return {
        adsets: (data?.data || []).map((adset: any) => ({
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
        paging: data?.paging,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Meta API] Failed to fetch ad sets for campaign ${campaignId}:`, errorMsg);
      throw new Error(`Failed to fetch ad sets: ${errorMsg}`);
    }
  }

  /**
   * Get ads for an ad set
   */
  async getAds(
    adsetId: string,
    fields?: string[],
    limit: number = 100,
    after?: string
  ): Promise<{ ads: MetaAd[]; paging?: any }> {
    try {
      const adset = new Business.AdSet(adsetId);
      const defaultFields = ['id', 'adset_id', 'name', 'status', 'creative', 'created_time'];

      const params: any = {
        limit,
        fields: fields || defaultFields,
      };

      if (after) {
        params.after = after;
      }

      const response = await adset.getAds([], params);

      return {
        ads: response.map((ad: any) => ({
          id: ad.id,
          adset_id: ad.adset_id,
          name: ad.name,
          status: ad.status,
          creative: ad.creative,
          created_time: ad.created_time,
        })),
        paging: response.paging,
      };
    } catch (error) {
      throw new Error(`Failed to fetch ads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get Facebook Pages for an ad account
   */
  async getPages(accountId: string): Promise<MetaPage[]> {
    try {
      console.log(`[Meta API] Fetching pages for account: ${accountId}`);

      const queryParams = new URLSearchParams({
        fields: 'id,name,access_token',
        limit: '100',
        access_token: this.accessToken,
      });

      const url = `https://graph.facebook.com/${this.apiVersion}/${accountId}/promote_pages?${queryParams.toString()}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[Meta API] Pages fetched: ${data?.data?.length || 0}`);
      return (data?.data || []).map((page: any) => ({
        id: page.id,
        name: page.name,
        access_token: page.access_token,
      }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Meta API] Failed to fetch pages for account ${accountId}:`, errorMsg);
      throw new Error(`Failed to fetch pages: ${errorMsg}`);
    }
  }

  /**
   * Get conversion pixels for an ad account
   */
  async getPixels(accountId: string): Promise<MetaPixel[]> {
    try {
      console.log(`[Meta API] Fetching pixels for account: ${accountId}`);

      const queryParams = new URLSearchParams({
        fields: 'id,name,last_fired_time',
        limit: '100',
        access_token: this.accessToken,
      });

      const url = `https://graph.facebook.com/${this.apiVersion}/${accountId}/ads_pixels?${queryParams.toString()}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[Meta API] Pixels fetched: ${data?.data?.length || 0}`);
      return (data?.data || []).map((pixel: any) => ({
        id: pixel.id,
        name: pixel.name,
        last_fired_time: pixel.last_fired_time,
      }));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[Meta API] Failed to fetch pixels for account ${accountId}:`, errorMsg);
      throw new Error(`Failed to fetch pixels: ${errorMsg}`);
    }
  }

  /**
   * Get custom audiences for an ad account
   */
  async getAudiences(accountId: string): Promise<MetaAudience[]> {
    try {
      const account = new Business.AdAccount(accountId);
      const response = await account.getCustomAudiences(
        [],
        {
          fields: ['id', 'name', 'approximate_count', 'subtype'],
          limit: 100,
        }
      );

      return response.map((audience: any) => ({
        id: audience.id,
        name: audience.name,
        approximate_count: audience.approximate_count,
        subtype: audience.subtype,
      }));
    } catch (error) {
      throw new Error(`Failed to fetch audiences: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get insights (metrics) for campaigns, ad sets, or ads
   */
  async getInsights(
    objectId: string,
    dateStart: string,
    dateStop: string,
    level: 'campaign' | 'adset' | 'ad' = 'campaign'
  ): Promise<MetaInsight[]> {
    try {
      let obj: any;

      if (level === 'campaign') {
        obj = new Business.Campaign(objectId);
      } else if (level === 'adset') {
        obj = new Business.AdSet(objectId);
      } else {
        obj = new Business.Ad(objectId);
      }

      const fields = [
        'campaign_id',
        'adset_id',
        'ad_id',
        'campaign_name',
        'adset_name',
        'ad_name',
        'date_start',
        'date_stop',
        'impressions',
        'clicks',
        'spend',
        'actions',
        'action_values',
        'cpc',
        'cpm',
        'cpp',
        'ctr',
        'inline_link_clicks',
        'landing_page_views',
        'cost_per_inline_link_click',
        'cost_per_landing_page_view',
        'cost_per_action_type',
      ];

      const response = await obj.getInsights([], {
        fields,
        date_preset: 'today',
        time_range: {
          since: dateStart,
          until: dateStop,
        },
      });

      return response.map((insight: any) => ({
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
    } catch (error) {
      throw new Error(`Failed to fetch insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
    }
  ): Promise<{ id: string }> {
    try {
      const account = new Business.AdAccount(accountId);
      const campaign = new Business.Campaign();

      // Set parameters
      campaign.setData({
        name: data.name,
        objective: data.objective,
        status: data.status,
        ...(data.daily_budget && { daily_budget: data.daily_budget }),
        ...(data.lifetime_budget && { lifetime_budget: data.lifetime_budget }),
        ...(data.start_time && { start_time: data.start_time }),
        ...(data.stop_time && { stop_time: data.stop_time }),
      });

      const response = await account.createCampaign([], campaign);
      return { id: response.id };
    } catch (error) {
      throw new Error(`Failed to create campaign: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create an ad set
   */
  async createAdSet(
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
    }
  ): Promise<{ id: string }> {
    try {
      const campaign = new Business.Campaign(campaignId);
      const adset = new Business.AdSet();

      adset.setData({
        name: data.name,
        status: data.status,
        ...(data.daily_budget && { daily_budget: data.daily_budget }),
        ...(data.lifetime_budget && { lifetime_budget: data.lifetime_budget }),
        ...(data.targeting && { targeting: data.targeting }),
        ...(data.billing_event && { billing_event: data.billing_event }),
        ...(data.bid_strategy && { bid_strategy: data.bid_strategy }),
        ...(data.bid_amount && { bid_amount: data.bid_amount }),
      });

      const response = await campaign.createAdset([], adset);
      return { id: response.id };
    } catch (error) {
      throw new Error(`Failed to create ad set: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create an ad
   */
  async createAd(
    adsetId: string,
    data: {
      name: string;
      status: 'ACTIVE' | 'PAUSED';
      creative_id?: string;
      adset_spec?: Record<string, any>;
    }
  ): Promise<{ id: string }> {
    try {
      const adset = new Business.AdSet(adsetId);
      const ad = new Business.Ad();

      ad.setData({
        name: data.name,
        status: data.status,
        ...(data.creative_id && { creative_id: data.creative_id }),
        ...(data.adset_spec && { adset_spec: data.adset_spec }),
      });

      const response = await adset.createAd([], ad);
      return { id: response.id };
    } catch (error) {
      throw new Error(`Failed to create ad: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
    }>
  ): Promise<{ success: boolean }> {
    try {
      const campaign = new Business.Campaign(campaignId);
      await campaign.update([], data);
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to update campaign: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
    }>
  ): Promise<{ success: boolean }> {
    try {
      const adset = new Business.AdSet(adsetId);
      await adset.update([], data);
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to update ad set: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
    }>
  ): Promise<{ success: boolean }> {
    try {
      const ad = new Business.Ad(adId);
      await ad.update([], data);
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to update ad: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const metaAPI = new MetaAPIClient();

export default metaAPI;
