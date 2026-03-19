-- Create sync_log table for tracking Meta API synchronizations
CREATE TABLE IF NOT EXISTS sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  synced_accounts INTEGER NOT NULL DEFAULT 0,
  synced_pages INTEGER NOT NULL DEFAULT 0,
  synced_pixels INTEGER NOT NULL DEFAULT 0,
  error_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_sync_log_user_id ON sync_log(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_created_at ON sync_log(created_at DESC);

-- Enable RLS
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own sync logs
CREATE POLICY sync_log_user_policy ON sync_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Only users can insert their own sync logs
CREATE POLICY sync_log_insert_policy ON sync_log
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
