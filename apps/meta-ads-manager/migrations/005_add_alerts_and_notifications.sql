-- ============================================================================
-- MIGRATION 005: Add Alert Rules and Notifications Tables
-- ============================================================================

-- 1. Create meta_alert_rules table
DROP TABLE IF EXISTS meta_alert_rules CASCADE;
CREATE TABLE meta_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES meta_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  condition_type TEXT NOT NULL,
  condition_value JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  telegram_enabled BOOLEAN DEFAULT false,
  telegram_chat_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_user_id ON meta_alert_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_account_id ON meta_alert_rules(account_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_enabled ON meta_alert_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_alert_rules_updated_at ON meta_alert_rules(updated_at DESC);

ALTER TABLE meta_alert_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own alert rules" ON meta_alert_rules;
CREATE POLICY "Users can manage their own alert rules" ON meta_alert_rules
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role access" ON meta_alert_rules;
CREATE POLICY "Service role access" ON meta_alert_rules
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP FUNCTION IF EXISTS update_meta_alert_rules_timestamp();
CREATE OR REPLACE FUNCTION update_meta_alert_rules_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS meta_alert_rules_update_timestamp ON meta_alert_rules;
CREATE TRIGGER meta_alert_rules_update_timestamp
BEFORE UPDATE ON meta_alert_rules
FOR EACH ROW
EXECUTE FUNCTION update_meta_alert_rules_timestamp();

GRANT SELECT, INSERT, UPDATE, DELETE ON meta_alert_rules TO service_role;
GRANT ALL ON meta_alert_rules TO authenticated;

-- 2. Create meta_notifications table
DROP TABLE IF EXISTS meta_notifications CASCADE;
CREATE TABLE meta_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_rule_id UUID NOT NULL REFERENCES meta_alert_rules(id) ON DELETE CASCADE,
  campaign_id TEXT,
  adset_id TEXT,
  ad_id TEXT,
  message TEXT NOT NULL,
  metric_name TEXT,
  metric_value NUMERIC,
  threshold_value NUMERIC,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON meta_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_alert_rule_id ON meta_notifications(alert_rule_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON meta_notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON meta_notifications(created_at DESC);

ALTER TABLE meta_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own notifications" ON meta_notifications;
CREATE POLICY "Users can read their own notifications" ON meta_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON meta_notifications;
CREATE POLICY "Users can update their own notifications" ON meta_notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage notifications" ON meta_notifications;
CREATE POLICY "Service role can manage notifications" ON meta_notifications
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

GRANT SELECT, INSERT, UPDATE ON meta_notifications TO service_role;
GRANT SELECT, UPDATE ON meta_notifications TO authenticated;

-- ============================================================================
-- END OF MIGRATION 005
-- ============================================================================
