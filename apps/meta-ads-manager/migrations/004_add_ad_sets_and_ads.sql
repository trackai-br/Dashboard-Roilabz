-- ============================================================================
-- MIGRATION 004: Add Meta Ad Sets and Ads Tables
-- ============================================================================

-- 1. Create meta_ad_sets table
DROP TABLE IF EXISTS meta_ad_sets CASCADE;
CREATE TABLE meta_ad_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_account_id UUID NOT NULL REFERENCES meta_accounts(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  adset_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT,
  daily_budget BIGINT,
  lifetime_budget BIGINT,
  targeting JSONB,
  billing_event TEXT,
  bid_strategy TEXT,
  bid_amount BIGINT,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend BIGINT DEFAULT 0,
  cpc_micros BIGINT,
  cpm_micros BIGINT,
  ctr DECIMAL(10, 4),
  inline_link_clicks BIGINT DEFAULT 0,
  landing_page_views BIGINT DEFAULT 0,
  cost_per_inline_link_click BIGINT,
  cost_per_landing_page_view BIGINT,
  last_synced TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(meta_account_id, adset_id)
);

CREATE INDEX IF NOT EXISTS idx_meta_ad_sets_account_id ON meta_ad_sets(meta_account_id);
CREATE INDEX IF NOT EXISTS idx_meta_ad_sets_campaign_id ON meta_ad_sets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_meta_ad_sets_adset_id ON meta_ad_sets(adset_id);
CREATE INDEX IF NOT EXISTS idx_meta_ad_sets_status ON meta_ad_sets(status);
CREATE INDEX IF NOT EXISTS idx_meta_ad_sets_updated_at ON meta_ad_sets(updated_at DESC);

ALTER TABLE meta_ad_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role access" ON meta_ad_sets;
CREATE POLICY "Service role access" ON meta_ad_sets
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Authenticated users can read" ON meta_ad_sets;
CREATE POLICY "Authenticated users can read" ON meta_ad_sets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meta_accounts ma
      WHERE ma.id = meta_ad_sets.meta_account_id
      AND EXISTS (
        SELECT 1 FROM user_account_access uaa
        WHERE uaa.account_id = ma.id
        AND uaa.user_id = auth.uid()
      )
    )
  );

DROP FUNCTION IF EXISTS update_meta_ad_sets_timestamp();
CREATE OR REPLACE FUNCTION update_meta_ad_sets_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS meta_ad_sets_update_timestamp ON meta_ad_sets;
CREATE TRIGGER meta_ad_sets_update_timestamp
BEFORE UPDATE ON meta_ad_sets
FOR EACH ROW
EXECUTE FUNCTION update_meta_ad_sets_timestamp();

GRANT SELECT, INSERT, UPDATE ON meta_ad_sets TO service_role;
GRANT SELECT ON meta_ad_sets TO authenticated;

-- 2. Create meta_ads table
DROP TABLE IF EXISTS meta_ads CASCADE;
CREATE TABLE meta_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_account_id UUID NOT NULL REFERENCES meta_accounts(id) ON DELETE CASCADE,
  adset_id TEXT NOT NULL,
  ad_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT,
  creative_id TEXT,
  creative_spec JSONB,
  adset_spec JSONB,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend BIGINT DEFAULT 0,
  cpc_micros BIGINT,
  cpm_micros BIGINT,
  ctr DECIMAL(10, 4),
  inline_link_clicks BIGINT DEFAULT 0,
  landing_page_views BIGINT DEFAULT 0,
  cost_per_inline_link_click BIGINT,
  cost_per_landing_page_view BIGINT,
  last_synced TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(meta_account_id, ad_id)
);

CREATE INDEX IF NOT EXISTS idx_meta_ads_account_id ON meta_ads(meta_account_id);
CREATE INDEX IF NOT EXISTS idx_meta_ads_adset_id ON meta_ads(adset_id);
CREATE INDEX IF NOT EXISTS idx_meta_ads_ad_id ON meta_ads(ad_id);
CREATE INDEX IF NOT EXISTS idx_meta_ads_status ON meta_ads(status);
CREATE INDEX IF NOT EXISTS idx_meta_ads_updated_at ON meta_ads(updated_at DESC);

ALTER TABLE meta_ads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role access" ON meta_ads;
CREATE POLICY "Service role access" ON meta_ads
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Authenticated users can read" ON meta_ads;
CREATE POLICY "Authenticated users can read" ON meta_ads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meta_accounts ma
      WHERE ma.id = meta_ads.meta_account_id
      AND EXISTS (
        SELECT 1 FROM user_account_access uaa
        WHERE uaa.account_id = ma.id
        AND uaa.user_id = auth.uid()
      )
    )
  );

DROP FUNCTION IF EXISTS update_meta_ads_timestamp();
CREATE OR REPLACE FUNCTION update_meta_ads_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS meta_ads_update_timestamp ON meta_ads;
CREATE TRIGGER meta_ads_update_timestamp
BEFORE UPDATE ON meta_ads
FOR EACH ROW
EXECUTE FUNCTION update_meta_ads_timestamp();

GRANT SELECT, INSERT, UPDATE ON meta_ads TO service_role;
GRANT SELECT ON meta_ads TO authenticated;

-- ============================================================================
-- END OF MIGRATION 004
-- ============================================================================
