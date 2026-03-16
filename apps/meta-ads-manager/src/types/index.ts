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
