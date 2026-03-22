-- ============================================
-- MIGRATION 009: Criar tabelas faltantes
-- campaign_templates e publish_jobs
-- Executar no Supabase SQL Editor
-- ============================================

-- 1. campaign_templates
CREATE TABLE IF NOT EXISTS public.campaign_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  config_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.campaign_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates_select_own" ON public.campaign_templates
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "templates_insert_own" ON public.campaign_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "templates_update_own" ON public.campaign_templates
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "templates_delete_own" ON public.campaign_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Service role bypass (para endpoints API com supabaseAdmin)
CREATE POLICY "templates_service_role" ON public.campaign_templates
  FOR ALL USING (current_setting('role') = 'service_role');

CREATE INDEX IF NOT EXISTS idx_campaign_templates_user_id
  ON public.campaign_templates(user_id);


-- 2. publish_jobs
CREATE TABLE IF NOT EXISTS public.publish_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'partial', 'failed')),
  total_campaigns INT NOT NULL DEFAULT 0,
  completed_campaigns INT NOT NULL DEFAULT 0,
  results JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.publish_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jobs_select_own" ON public.publish_jobs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "jobs_insert_own" ON public.publish_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "jobs_update_own" ON public.publish_jobs
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role bypass
CREATE POLICY "jobs_service_role" ON public.publish_jobs
  FOR ALL USING (current_setting('role') = 'service_role');

CREATE INDEX IF NOT EXISTS idx_publish_jobs_user_id
  ON public.publish_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_publish_jobs_status
  ON public.publish_jobs(status);


-- 3. campaign_drafts (IF NOT EXISTS — pode ja existir)
CREATE TABLE IF NOT EXISTS public.campaign_drafts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.campaign_drafts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campaign_drafts' AND policyname = 'drafts_select_own') THEN
    CREATE POLICY "drafts_select_own" ON public.campaign_drafts FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campaign_drafts' AND policyname = 'drafts_insert_own') THEN
    CREATE POLICY "drafts_insert_own" ON public.campaign_drafts FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campaign_drafts' AND policyname = 'drafts_update_own') THEN
    CREATE POLICY "drafts_update_own" ON public.campaign_drafts FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campaign_drafts' AND policyname = 'drafts_delete_own') THEN
    CREATE POLICY "drafts_delete_own" ON public.campaign_drafts FOR DELETE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campaign_drafts' AND policyname = 'drafts_service_role') THEN
    CREATE POLICY "drafts_service_role" ON public.campaign_drafts FOR ALL USING (current_setting('role') = 'service_role');
  END IF;
END $$;


-- 4. sync_log (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  synced_accounts INT DEFAULT 0,
  synced_pages INT DEFAULT 0,
  synced_pixels INT DEFAULT 0,
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sync_log' AND policyname = 'sync_log_select_own') THEN
    CREATE POLICY "sync_log_select_own" ON public.sync_log FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sync_log' AND policyname = 'sync_log_insert_own') THEN
    CREATE POLICY "sync_log_insert_own" ON public.sync_log FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sync_log' AND policyname = 'sync_log_service_role') THEN
    CREATE POLICY "sync_log_service_role" ON public.sync_log FOR ALL USING (current_setting('role') = 'service_role');
  END IF;
END $$;
