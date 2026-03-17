-- ============================================================================
-- MASTER MIGRATIONS - Dashboard Meta Ads Manager
-- Execute this file in Supabase SQL Editor to initialize all tables
-- ============================================================================

-- 1. Create meta_accounts table
CREATE TABLE IF NOT EXISTS meta_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_account_id TEXT UNIQUE NOT NULL,
  meta_account_name TEXT NOT NULL,
  currency TEXT,
  timezone TEXT,
  last_synced TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meta_account_id ON meta_accounts(meta_account_id);
CREATE INDEX IF NOT EXISTS idx_last_synced ON meta_accounts(last_synced DESC);

ALTER TABLE meta_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role access" ON meta_accounts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION update_meta_accounts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meta_accounts_update_timestamp
BEFORE UPDATE ON meta_accounts
FOR EACH ROW
EXECUTE FUNCTION update_meta_accounts_timestamp();

GRANT SELECT, INSERT, UPDATE ON meta_accounts TO service_role;
GRANT SELECT ON meta_accounts TO authenticated;

-- 2. Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own profile" ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION update_users_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_update_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_timestamp();

-- 3. Create user_account_access table
CREATE TABLE IF NOT EXISTS user_account_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES meta_accounts(id) ON DELETE CASCADE,
  access_level TEXT DEFAULT 'viewer' CHECK (access_level IN ('viewer', 'editor', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, account_id)
);

CREATE INDEX IF NOT EXISTS idx_user_account_access_user_id ON user_account_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_account_access_account_id ON user_account_access(account_id);

ALTER TABLE user_account_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own access records" ON user_account_access
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage access" ON user_account_access
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION update_user_account_access_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_account_access_update_timestamp
BEFORE UPDATE ON user_account_access
FOR EACH ROW
EXECUTE FUNCTION update_user_account_access_timestamp();

-- 4. Create access_logs table
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES meta_accounts(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'denied', 'error')),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_account_id ON access_logs(account_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON access_logs(created_at DESC);

ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read logs for their accounts" ON access_logs
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM user_account_access
      WHERE user_account_access.account_id = access_logs.account_id
      AND user_account_access.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert logs" ON access_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- 5. Create google_ads_accounts table
CREATE TABLE IF NOT EXISTS google_ads_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  google_customer_id TEXT NOT NULL,
  account_name TEXT NOT NULL,
  currency_code TEXT,
  time_zone TEXT,
  descriptive_name TEXT,
  auto_tagging_enabled BOOLEAN DEFAULT FALSE,
  last_synced TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, google_customer_id)
);

CREATE INDEX IF NOT EXISTS idx_google_ads_accounts_user_id ON google_ads_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_accounts_customer_id ON google_ads_accounts(google_customer_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_accounts_last_synced ON google_ads_accounts(last_synced DESC);

ALTER TABLE google_ads_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role access" ON google_ads_accounts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can read own accounts" ON google_ads_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_google_ads_accounts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER google_ads_accounts_update_timestamp
BEFORE UPDATE ON google_ads_accounts
FOR EACH ROW
EXECUTE FUNCTION update_google_ads_accounts_timestamp();

GRANT SELECT, INSERT, UPDATE ON google_ads_accounts TO service_role;
GRANT SELECT ON google_ads_accounts TO authenticated;

-- 6. Create google_ads_campaigns table
CREATE TABLE IF NOT EXISTS google_ads_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES google_ads_accounts(id) ON DELETE CASCADE,
  google_campaign_id TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  campaign_status TEXT,
  campaign_type TEXT,
  status TEXT,
  start_date DATE,
  end_date DATE,
  budget_amount_micros BIGINT,
  budget_period TEXT,
  spend_micros BIGINT DEFAULT 0,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  ctr NUMERIC(10, 4) DEFAULT 0,
  average_cpc_micros BIGINT DEFAULT 0,
  cost_micros BIGINT DEFAULT 0,
  conversions NUMERIC(10, 2) DEFAULT 0,
  conversion_value NUMERIC(15, 2) DEFAULT 0,
  last_synced TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id, google_campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_google_ads_campaigns_account_id ON google_ads_campaigns(account_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_campaigns_google_id ON google_ads_campaigns(google_campaign_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_campaigns_status ON google_ads_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_google_ads_campaigns_last_synced ON google_ads_campaigns(last_synced DESC);

ALTER TABLE google_ads_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role access" ON google_ads_campaigns
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can read own campaigns" ON google_ads_campaigns
  FOR SELECT
  USING (
    account_id IN (
      SELECT id FROM google_ads_accounts
      WHERE user_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION update_google_ads_campaigns_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER google_ads_campaigns_update_timestamp
BEFORE UPDATE ON google_ads_campaigns
FOR EACH ROW
EXECUTE FUNCTION update_google_ads_campaigns_timestamp();

GRANT SELECT, INSERT, UPDATE ON google_ads_campaigns TO service_role;
GRANT SELECT ON google_ads_campaigns TO authenticated;

-- 7. Update meta_accounts RLS policy to use user_account_access
DROP POLICY IF EXISTS "Authenticated users can read" ON meta_accounts;

CREATE POLICY "Users can read accounts they have access to" ON meta_accounts
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM user_account_access
      WHERE user_account_access.account_id = meta_accounts.id
      AND user_account_access.user_id = auth.uid()
    )
  );

-- 8. Grant permissions to roles
GRANT SELECT ON users TO authenticated;
GRANT UPDATE ON users TO authenticated;
GRANT SELECT ON user_account_access TO authenticated;
GRANT SELECT, INSERT ON access_logs TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON users TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_account_access TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON access_logs TO service_role;
GRANT SELECT, INSERT, UPDATE ON meta_accounts TO service_role;
