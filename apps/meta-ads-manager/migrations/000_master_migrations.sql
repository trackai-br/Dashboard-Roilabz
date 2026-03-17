-- ============================================================================
-- MASTER MIGRATIONS - Dashboard Meta Ads Manager
-- Execute this file in Supabase SQL Editor to initialize all tables
-- ============================================================================

-- 1. Create meta_accounts table
DROP TABLE IF EXISTS meta_accounts CASCADE;
CREATE TABLE meta_accounts (
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

DROP POLICY IF EXISTS "Service role access" ON meta_accounts;
CREATE POLICY "Service role access" ON meta_accounts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP FUNCTION IF EXISTS update_meta_accounts_timestamp();
CREATE OR REPLACE FUNCTION update_meta_accounts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS meta_accounts_update_timestamp ON meta_accounts;
CREATE TRIGGER meta_accounts_update_timestamp
BEFORE UPDATE ON meta_accounts
FOR EACH ROW
EXECUTE FUNCTION update_meta_accounts_timestamp();

GRANT SELECT, INSERT, UPDATE ON meta_accounts TO service_role;
GRANT SELECT ON meta_accounts TO authenticated;

-- 2. Create users table (extends auth.users)
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own profile" ON users;
CREATE POLICY "Users can read their own profile" ON users
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP FUNCTION IF EXISTS update_users_timestamp();
CREATE OR REPLACE FUNCTION update_users_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_update_timestamp ON users;
CREATE TRIGGER users_update_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_timestamp();

GRANT SELECT, INSERT, UPDATE ON users TO service_role;
GRANT SELECT ON users TO authenticated;

-- 3. Create user_account_access table
DROP TABLE IF EXISTS user_account_access CASCADE;
CREATE TABLE user_account_access (
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

DROP POLICY IF EXISTS "Users can read their own access records" ON user_account_access;
CREATE POLICY "Users can read their own access records" ON user_account_access
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage access" ON user_account_access;
CREATE POLICY "Service role can manage access" ON user_account_access
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP FUNCTION IF EXISTS update_user_account_access_timestamp();
CREATE OR REPLACE FUNCTION update_user_account_access_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_account_access_update_timestamp ON user_account_access;
CREATE TRIGGER user_account_access_update_timestamp
BEFORE UPDATE ON user_account_access
FOR EACH ROW
EXECUTE FUNCTION update_user_account_access_timestamp();

GRANT SELECT, INSERT, UPDATE, DELETE ON user_account_access TO service_role;
GRANT SELECT ON user_account_access TO authenticated;

-- 4. Create access_logs table
DROP TABLE IF EXISTS access_logs CASCADE;
CREATE TABLE access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES meta_accounts(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON access_logs(created_at DESC);

ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own logs" ON access_logs;
CREATE POLICY "Users can read their own logs" ON access_logs
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can write logs" ON access_logs;
CREATE POLICY "Service role can write logs" ON access_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

GRANT SELECT, INSERT ON access_logs TO service_role;
GRANT SELECT ON access_logs TO authenticated;

-- 5. Create meta_ads_campaigns table (CORE - Meta/Facebook Ads)
DROP TABLE IF EXISTS meta_ads_campaigns CASCADE;
CREATE TABLE meta_ads_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_account_id UUID NOT NULL REFERENCES meta_accounts(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  status TEXT,
  objective TEXT,
  budget_amount_micros BIGINT,
  daily_budget_micros BIGINT,
  spend_micros BIGINT,
  impressions BIGINT,
  clicks BIGINT,
  conversions BIGINT,
  cost_per_result_micros BIGINT,
  cpc_micros BIGINT,
  cpm_micros BIGINT,
  ctr DECIMAL(10, 4),
  conversion_rate DECIMAL(10, 4),
  roas DECIMAL(10, 4),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  last_synced TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(meta_account_id, campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_meta_campaigns_account_id ON meta_ads_campaigns(meta_account_id);
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_campaign_id ON meta_ads_campaigns(campaign_id);
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_status ON meta_ads_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_updated_at ON meta_ads_campaigns(updated_at DESC);

ALTER TABLE meta_ads_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role access" ON meta_ads_campaigns;
CREATE POLICY "Service role access" ON meta_ads_campaigns
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Authenticated users can read" ON meta_ads_campaigns;
CREATE POLICY "Authenticated users can read" ON meta_ads_campaigns
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meta_accounts ma
      WHERE ma.id = meta_ads_campaigns.meta_account_id
      AND EXISTS (
        SELECT 1 FROM user_account_access uaa
        WHERE uaa.account_id = ma.id
        AND uaa.user_id = auth.uid()
      )
    )
  );

DROP FUNCTION IF EXISTS update_meta_ads_campaigns_timestamp();
CREATE OR REPLACE FUNCTION update_meta_ads_campaigns_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS meta_ads_campaigns_update_timestamp ON meta_ads_campaigns;
CREATE TRIGGER meta_ads_campaigns_update_timestamp
BEFORE UPDATE ON meta_ads_campaigns
FOR EACH ROW
EXECUTE FUNCTION update_meta_ads_campaigns_timestamp();

GRANT SELECT, INSERT, UPDATE ON meta_ads_campaigns TO service_role;
GRANT SELECT ON meta_ads_campaigns TO authenticated;

-- 6. Create google_ads_accounts table
DROP TABLE IF EXISTS google_ads_accounts CASCADE;
CREATE TABLE google_ads_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_account_id UUID NOT NULL REFERENCES meta_accounts(id) ON DELETE CASCADE,
  google_account_id TEXT UNIQUE NOT NULL,
  google_account_name TEXT NOT NULL,
  currency TEXT,
  timezone TEXT,
  last_synced TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_google_ads_accounts_meta_account_id ON google_ads_accounts(meta_account_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_accounts_account_id ON google_ads_accounts(google_account_id);

ALTER TABLE google_ads_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role access" ON google_ads_accounts;
CREATE POLICY "Service role access" ON google_ads_accounts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Authenticated users can read" ON google_ads_accounts;
CREATE POLICY "Authenticated users can read" ON google_ads_accounts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meta_accounts ma
      WHERE ma.id = google_ads_accounts.meta_account_id
      AND EXISTS (
        SELECT 1 FROM user_account_access uaa
        WHERE uaa.account_id = ma.id
        AND uaa.user_id = auth.uid()
      )
    )
  );

DROP FUNCTION IF EXISTS update_google_ads_accounts_timestamp();
CREATE OR REPLACE FUNCTION update_google_ads_accounts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS google_ads_accounts_update_timestamp ON google_ads_accounts;
CREATE TRIGGER google_ads_accounts_update_timestamp
BEFORE UPDATE ON google_ads_accounts
FOR EACH ROW
EXECUTE FUNCTION update_google_ads_accounts_timestamp();

GRANT SELECT, INSERT, UPDATE ON google_ads_accounts TO service_role;
GRANT SELECT ON google_ads_accounts TO authenticated;

-- 7. Create google_ads_campaigns table
DROP TABLE IF EXISTS google_ads_campaigns CASCADE;
CREATE TABLE google_ads_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_account_id UUID NOT NULL REFERENCES google_ads_accounts(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  status TEXT,
  advertising_channel_type TEXT,
  budget_amount_micros BIGINT,
  spend_micros BIGINT,
  impressions BIGINT,
  clicks BIGINT,
  average_cpc_micros BIGINT,
  cost_micros BIGINT,
  last_synced TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(google_account_id, campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_google_ads_campaigns_account_id ON google_ads_campaigns(google_account_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_campaigns_campaign_id ON google_ads_campaigns(campaign_id);

ALTER TABLE google_ads_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role access" ON google_ads_campaigns;
CREATE POLICY "Service role access" ON google_ads_campaigns
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Authenticated users can read" ON google_ads_campaigns;
CREATE POLICY "Authenticated users can read" ON google_ads_campaigns
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM google_ads_accounts gaa
      WHERE gaa.id = google_ads_campaigns.google_account_id
      AND EXISTS (
        SELECT 1 FROM meta_accounts ma
        WHERE ma.id = gaa.meta_account_id
        AND EXISTS (
          SELECT 1 FROM user_account_access uaa
          WHERE uaa.account_id = ma.id
          AND uaa.user_id = auth.uid()
        )
      )
    )
  );

DROP FUNCTION IF EXISTS update_google_ads_campaigns_timestamp();
CREATE OR REPLACE FUNCTION update_google_ads_campaigns_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS google_ads_campaigns_update_timestamp ON google_ads_campaigns;
CREATE TRIGGER google_ads_campaigns_update_timestamp
BEFORE UPDATE ON google_ads_campaigns
FOR EACH ROW
EXECUTE FUNCTION update_google_ads_campaigns_timestamp();

GRANT SELECT, INSERT, UPDATE ON google_ads_campaigns TO service_role;
GRANT SELECT ON google_ads_campaigns TO authenticated;

-- ============================================================================
-- FIM DAS MIGRATIONS
-- ============================================================================
