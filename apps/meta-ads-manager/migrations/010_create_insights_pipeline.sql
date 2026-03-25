-- ============================================================================
-- MIGRATION 010: Create Insights Pipeline Tables
-- meta_insights: historical daily metrics
-- meta_sync_status: incremental sync control
-- ============================================================================

-- 1. Create meta_insights table
CREATE TABLE IF NOT EXISTS meta_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_account_id UUID NOT NULL REFERENCES meta_accounts(id) ON DELETE CASCADE,
  object_id TEXT NOT NULL,
  object_type TEXT NOT NULL CHECK (object_type IN ('campaign', 'adset', 'ad')),
  date_start DATE NOT NULL,
  date_stop DATE NOT NULL,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  spend_micros BIGINT DEFAULT 0,
  cpc_micros BIGINT,
  cpm_micros BIGINT,
  ctr DECIMAL(10, 4),
  inline_link_clicks BIGINT DEFAULT 0,
  landing_page_views BIGINT DEFAULT 0,
  actions JSONB,
  action_values JSONB,
  conversions BIGINT DEFAULT 0,
  roas DECIMAL(10, 4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meta_account_id, object_id, object_type, date_start)
);

CREATE INDEX IF NOT EXISTS idx_meta_insights_account_type_date
  ON meta_insights(meta_account_id, object_type, date_start DESC);
CREATE INDEX IF NOT EXISTS idx_meta_insights_object_date
  ON meta_insights(object_id, date_start DESC);
CREATE INDEX IF NOT EXISTS idx_meta_insights_date
  ON meta_insights(date_start);

ALTER TABLE meta_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON meta_insights
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can read own insights" ON meta_insights
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meta_accounts ma
      WHERE ma.id = meta_insights.meta_account_id
      AND EXISTS (
        SELECT 1 FROM user_account_access uaa
        WHERE uaa.account_id = ma.id
        AND uaa.user_id = auth.uid()
      )
    )
  );

CREATE OR REPLACE FUNCTION update_meta_insights_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meta_insights_update_timestamp
BEFORE UPDATE ON meta_insights
FOR EACH ROW
EXECUTE FUNCTION update_meta_insights_timestamp();

GRANT SELECT, INSERT, UPDATE ON meta_insights TO service_role;
GRANT SELECT ON meta_insights TO authenticated;

-- 2. Create meta_sync_status table
CREATE TABLE IF NOT EXISTS meta_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_account_id UUID NOT NULL REFERENCES meta_accounts(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('campaigns', 'adsets', 'ads', 'insights')),
  last_synced_at TIMESTAMPTZ,
  last_sync_status TEXT DEFAULT 'pending' CHECK (last_sync_status IN ('pending', 'running', 'success', 'partial', 'failed')),
  last_error TEXT,
  records_synced INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meta_account_id, sync_type)
);

CREATE INDEX IF NOT EXISTS idx_meta_sync_status_account
  ON meta_sync_status(meta_account_id);

ALTER TABLE meta_sync_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON meta_sync_status
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can read own sync status" ON meta_sync_status
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meta_accounts ma
      WHERE ma.id = meta_sync_status.meta_account_id
      AND EXISTS (
        SELECT 1 FROM user_account_access uaa
        WHERE uaa.account_id = ma.id
        AND uaa.user_id = auth.uid()
      )
    )
  );

CREATE OR REPLACE FUNCTION update_meta_sync_status_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meta_sync_status_update_timestamp
BEFORE UPDATE ON meta_sync_status
FOR EACH ROW
EXECUTE FUNCTION update_meta_sync_status_timestamp();

GRANT SELECT, INSERT, UPDATE ON meta_sync_status TO service_role;
GRANT SELECT ON meta_sync_status TO authenticated;

-- ============================================================================
-- END OF MIGRATION 010
-- ============================================================================
