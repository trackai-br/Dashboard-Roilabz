-- Create meta_accounts table for storing Meta Ads Manager account information
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

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_meta_account_id ON meta_accounts(meta_account_id);
CREATE INDEX IF NOT EXISTS idx_last_synced ON meta_accounts(last_synced DESC);

-- Enable Row Level Security
ALTER TABLE meta_accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for service role (full access for backend)
CREATE POLICY "Service role access" ON meta_accounts
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Create RLS policy for authenticated users (read-only)
CREATE POLICY "Authenticated users can read" ON meta_accounts
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
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

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON meta_accounts TO service_role;
GRANT SELECT ON meta_accounts TO authenticated;
