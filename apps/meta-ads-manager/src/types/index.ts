export interface User {
  id: string;
  email: string;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
}

export interface MetaAccount {
  id: string;
  meta_account_id: string;
  meta_account_name: string;
  currency?: string;
  timezone?: string;
  last_synced?: string;
  created_at: string;
  updated_at: string;
}

export interface UserAccountAccess {
  id: string;
  user_id: string;
  account_id: string;
  access_level: "viewer" | "editor" | "admin";
  created_at: string;
  updated_at: string;
}

export interface AccessLog {
  id: string;
  user_id: string;
  account_id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  status: "success" | "denied" | "error";
  details?: Record<string, any>;
  created_at: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
}

export interface CampaignConfig {
  objective: string;
  namingPattern: {
    levaNumber: string;
    creativeLabel: string;
  };
  budgetType: 'CBO' | 'ABO';
  budgetValue: number;
  bidStrategy: string;
  campaignStatus: 'ACTIVE' | 'PAUSED';
}

export interface AdsetTypeConfig {
  id: string;
  name: string;
  adsetCount: number;
  campaignsCount: number;
  creativesInAdset: string[];
  conversionLocation: string;
  bidCapValue?: number;
  pixelId: string;
  conversionEvent: string;
  startDate: string;
  targetCountries: string[];
  adsetStatus: 'ACTIVE' | 'PAUSED';
}

export interface SyncLog {
  id: string;
  user_id: string;
  status: 'success' | 'partial' | 'failed';
  synced_accounts: number;
  synced_pages: number;
  synced_pixels: number;
  error_details: Record<string, unknown> | null;
  created_at: string;
}
