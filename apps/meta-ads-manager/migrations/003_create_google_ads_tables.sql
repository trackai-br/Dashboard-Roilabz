-- Create google_ads_accounts table for storing Google Ads account information
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

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_google_ads_accounts_user_id ON google_ads_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_accounts_customer_id ON google_ads_accounts(google_customer_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_accounts_last_synced ON google_ads_accounts(last_synced DESC);

-- Enable Row Level Security
ALTER TABLE google_ads_accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for service role (full access for backend)
CREATE POLICY "Service role access" ON google_ads_accounts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create RLS policy for authenticated users (can only read their own accounts)
CREATE POLICY "Users can read own accounts" ON google_ads_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
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

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON google_ads_accounts TO service_role;
GRANT SELECT ON google_ads_accounts TO authenticated;

---

-- Create google_ads_campaigns table for storing campaign data
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

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_google_ads_campaigns_account_id ON google_ads_campaigns(account_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_campaigns_google_id ON google_ads_campaigns(google_campaign_id);
CREATE INDEX IF NOT EXISTS idx_google_ads_campaigns_status ON google_ads_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_google_ads_campaigns_last_synced ON google_ads_campaigns(last_synced DESC);

-- Enable Row Level Security
ALTER TABLE google_ads_campaigns ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for service role (full access for backend)
CREATE POLICY "Service role access" ON google_ads_campaigns
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create RLS policy for authenticated users (can only read campaigns from their accounts)
CREATE POLICY "Users can read own campaigns" ON google_ads_campaigns
  FOR SELECT
  USING (
    account_id IN (
      SELECT id FROM google_ads_accounts
      WHERE user_id = auth.uid()
    )
  );

-- Create trigger for updated_at
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

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON google_ads_campaigns TO service_role;
GRANT SELECT ON google_ads_campaigns TO authenticated;
