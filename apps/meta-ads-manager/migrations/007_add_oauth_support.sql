-- Migration 007: Add OAuth support for Facebook/Meta and Google authentication

-- ============================================================================
-- 1. Add Meta/Facebook OAuth columns to users table
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS meta_user_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS meta_user_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS meta_access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS meta_token_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS meta_connected_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS meta_scopes TEXT;

-- ============================================================================
-- 2. Add Google OAuth columns to users table
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS google_user_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_user_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_access_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_token_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_connected_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_scopes TEXT;

-- ============================================================================
-- 3. Create meta_connections table for connection history/auditing
-- ============================================================================

CREATE TABLE IF NOT EXISTS meta_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meta_user_id TEXT NOT NULL,
  meta_user_name TEXT,
  meta_access_token TEXT NOT NULL,
  meta_token_expires_at TIMESTAMPTZ,
  meta_scopes TEXT,
  connection_status TEXT DEFAULT 'active' CHECK (connection_status IN ('active', 'revoked', 'expired')),
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================================
-- 4. Create google_connections table for connection history/auditing
-- ============================================================================

CREATE TABLE IF NOT EXISTS google_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  google_user_id TEXT NOT NULL,
  google_email TEXT,
  google_user_name TEXT,
  google_access_token TEXT NOT NULL,
  google_refresh_token TEXT,
  google_token_expires_at TIMESTAMPTZ,
  google_scopes TEXT,
  connection_status TEXT DEFAULT 'active' CHECK (connection_status IN ('active', 'revoked', 'expired')),
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================================
-- 5. Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_meta_user_id ON users(meta_user_id);
CREATE INDEX IF NOT EXISTS idx_users_google_user_id ON users(google_user_id);
CREATE INDEX IF NOT EXISTS idx_meta_connections_user_id ON meta_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_google_connections_user_id ON google_connections(user_id);

-- ============================================================================
-- 6. Update trigger for users table to handle updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_users_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger to ensure it's applied
DROP TRIGGER IF EXISTS users_update_timestamp ON users;

CREATE TRIGGER users_update_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_timestamp();

-- ============================================================================
-- 7. Create triggers for meta_connections and google_connections
-- ============================================================================

CREATE OR REPLACE FUNCTION update_meta_connections_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meta_connections_update_timestamp
BEFORE UPDATE ON meta_connections
FOR EACH ROW
EXECUTE FUNCTION update_meta_connections_timestamp();

CREATE OR REPLACE FUNCTION update_google_connections_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER google_connections_update_timestamp
BEFORE UPDATE ON google_connections
FOR EACH ROW
EXECUTE FUNCTION update_google_connections_timestamp();

-- ============================================================================
-- 8. Enable Row Level Security on OAuth tables
-- ============================================================================

ALTER TABLE meta_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_connections ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 9. RLS Policies for meta_connections
-- ============================================================================

CREATE POLICY "Users can read their own Meta connections" ON meta_connections
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own Meta connections" ON meta_connections
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage Meta connections" ON meta_connections
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 10. RLS Policies for google_connections
-- ============================================================================

CREATE POLICY "Users can read their own Google connections" ON google_connections
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own Google connections" ON google_connections
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage Google connections" ON google_connections
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 11. Grant permissions to roles
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON meta_connections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON google_connections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON meta_connections TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON google_connections TO service_role;

-- ============================================================================
-- 12. Update users table grants to include new columns
-- ============================================================================

GRANT UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO service_role;
