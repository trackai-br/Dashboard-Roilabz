-- ============================================================================
-- SQL CONSOLIDADO — Migrations Pendentes + search_path fix
-- Gerado em: 2026-03-31
--
-- INSTRUCOES:
-- 1. Abra o Supabase SQL Editor (https://supabase.com/dashboard)
-- 2. Cole este SQL inteiro e execute
-- 3. Verifique se nao houve erros
-- 4. Apos aplicar, faça um sync manual via /campaigns/setup > "Sincronizar Contas"
-- ============================================================================

-- ============================================================================
-- PARTE 1: Migration 004 — meta_ad_sets + meta_ads
-- (Cria tabelas para ad sets e ads sincronizados da Meta)
-- ============================================================================

CREATE TABLE IF NOT EXISTS meta_ad_sets (
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meta_ad_sets' AND policyname = 'Service role access') THEN
    CREATE POLICY "Service role access" ON meta_ad_sets FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meta_ad_sets' AND policyname = 'Authenticated users can read') THEN
    CREATE POLICY "Authenticated users can read" ON meta_ad_sets FOR SELECT
      USING (EXISTS (SELECT 1 FROM meta_accounts ma WHERE ma.id = meta_ad_sets.meta_account_id AND EXISTS (SELECT 1 FROM user_account_access uaa WHERE uaa.account_id = ma.id AND uaa.user_id = auth.uid())));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION update_meta_ad_sets_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS meta_ad_sets_update_timestamp ON meta_ad_sets;
CREATE TRIGGER meta_ad_sets_update_timestamp BEFORE UPDATE ON meta_ad_sets FOR EACH ROW EXECUTE FUNCTION update_meta_ad_sets_timestamp();

GRANT SELECT, INSERT, UPDATE ON meta_ad_sets TO service_role;
GRANT SELECT ON meta_ad_sets TO authenticated;

-- meta_ads
CREATE TABLE IF NOT EXISTS meta_ads (
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meta_ads' AND policyname = 'Service role access') THEN
    CREATE POLICY "Service role access" ON meta_ads FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meta_ads' AND policyname = 'Authenticated users can read') THEN
    CREATE POLICY "Authenticated users can read" ON meta_ads FOR SELECT
      USING (EXISTS (SELECT 1 FROM meta_accounts ma WHERE ma.id = meta_ads.meta_account_id AND EXISTS (SELECT 1 FROM user_account_access uaa WHERE uaa.account_id = ma.id AND uaa.user_id = auth.uid())));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION update_meta_ads_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS meta_ads_update_timestamp ON meta_ads;
CREATE TRIGGER meta_ads_update_timestamp BEFORE UPDATE ON meta_ads FOR EACH ROW EXECUTE FUNCTION update_meta_ads_timestamp();

GRANT SELECT, INSERT, UPDATE ON meta_ads TO service_role;
GRANT SELECT ON meta_ads TO authenticated;

-- ============================================================================
-- PARTE 2: Migration 010 — meta_insights + meta_sync_status
-- (Pipeline de insights historicos e controle de sync)
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_meta_insights_account_type_date ON meta_insights(meta_account_id, object_type, date_start DESC);
CREATE INDEX IF NOT EXISTS idx_meta_insights_object_date ON meta_insights(object_id, date_start DESC);
CREATE INDEX IF NOT EXISTS idx_meta_insights_date ON meta_insights(date_start);

ALTER TABLE meta_insights ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meta_insights' AND policyname = 'Service role full access') THEN
    CREATE POLICY "Service role full access" ON meta_insights FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meta_insights' AND policyname = 'Users can read own insights') THEN
    CREATE POLICY "Users can read own insights" ON meta_insights FOR SELECT
      USING (EXISTS (SELECT 1 FROM meta_accounts ma WHERE ma.id = meta_insights.meta_account_id AND EXISTS (SELECT 1 FROM user_account_access uaa WHERE uaa.account_id = ma.id AND uaa.user_id = auth.uid())));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION update_meta_insights_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS meta_insights_update_timestamp ON meta_insights;
CREATE TRIGGER meta_insights_update_timestamp BEFORE UPDATE ON meta_insights FOR EACH ROW EXECUTE FUNCTION update_meta_insights_timestamp();

GRANT SELECT, INSERT, UPDATE ON meta_insights TO service_role;
GRANT SELECT ON meta_insights TO authenticated;

-- meta_sync_status
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

CREATE INDEX IF NOT EXISTS idx_meta_sync_status_account ON meta_sync_status(meta_account_id);

ALTER TABLE meta_sync_status ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meta_sync_status' AND policyname = 'Service role full access') THEN
    CREATE POLICY "Service role full access" ON meta_sync_status FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meta_sync_status' AND policyname = 'Users can read own sync status') THEN
    CREATE POLICY "Users can read own sync status" ON meta_sync_status FOR SELECT
      USING (EXISTS (SELECT 1 FROM meta_accounts ma WHERE ma.id = meta_sync_status.meta_account_id AND EXISTS (SELECT 1 FROM user_account_access uaa WHERE uaa.account_id = ma.id AND uaa.user_id = auth.uid())));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION update_meta_sync_status_timestamp() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS meta_sync_status_update_timestamp ON meta_sync_status;
CREATE TRIGGER meta_sync_status_update_timestamp BEFORE UPDATE ON meta_sync_status FOR EACH ROW EXECUTE FUNCTION update_meta_sync_status_timestamp();

GRANT SELECT, INSERT, UPDATE ON meta_sync_status TO service_role;
GRANT SELECT ON meta_sync_status TO authenticated;

-- ============================================================================
-- PARTE 3: search_path fix para todas as funcoes
-- (Previne "relation not found" em ambientes com search_path incorreto)
-- ============================================================================

ALTER FUNCTION update_meta_accounts_timestamp() SET search_path = public;
ALTER FUNCTION update_users_timestamp() SET search_path = public;
ALTER FUNCTION update_user_account_access_timestamp() SET search_path = public;
ALTER FUNCTION update_meta_ads_campaigns_timestamp() SET search_path = public;
ALTER FUNCTION update_google_ads_accounts_timestamp() SET search_path = public;
ALTER FUNCTION update_google_ads_campaigns_timestamp() SET search_path = public;
ALTER FUNCTION update_meta_connections_timestamp() SET search_path = public;
ALTER FUNCTION update_google_connections_timestamp() SET search_path = public;
ALTER FUNCTION update_meta_alert_rules_timestamp() SET search_path = public;
ALTER FUNCTION update_meta_pages_timestamp() SET search_path = public;
ALTER FUNCTION update_meta_pixels_timestamp() SET search_path = public;
ALTER FUNCTION update_meta_ad_sets_timestamp() SET search_path = public;
ALTER FUNCTION update_meta_ads_timestamp() SET search_path = public;
ALTER FUNCTION update_meta_insights_timestamp() SET search_path = public;
ALTER FUNCTION update_meta_sync_status_timestamp() SET search_path = public;

-- ============================================================================
-- FIM — Verifique se nao houve erros acima
-- ============================================================================
