-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_account_access table (junction table)
CREATE TABLE IF NOT EXISTS user_account_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES meta_accounts(id) ON DELETE CASCADE,
  access_level TEXT DEFAULT 'viewer' CHECK (access_level IN ('viewer', 'editor', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, account_id)
);

-- Create access_logs table for audit trail
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES meta_accounts(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'denied', 'error')),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_account_access_user_id ON user_account_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_account_access_account_id ON user_account_access(account_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_account_id ON access_logs(account_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON access_logs(created_at DESC);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_users_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_update_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_timestamp();

CREATE OR REPLACE FUNCTION update_user_account_access_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_account_access_update_timestamp
BEFORE UPDATE ON user_account_access
FOR EACH ROW
EXECUTE FUNCTION update_user_account_access_timestamp();

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_account_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Update meta_accounts RLS policies to use user_account_access junction table
DROP POLICY IF EXISTS "Authenticated users can read" ON meta_accounts;

CREATE POLICY "Users can read accounts they have access to" ON meta_accounts
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM user_account_access
      WHERE user_account_access.account_id = meta_accounts.id
      AND user_account_access.user_id = auth.uid()
    )
  );

-- RLS Policies for users table
CREATE POLICY "Users can read their own profile" ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_account_access table
CREATE POLICY "Users can read their own access records" ON user_account_access
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all access records for their accounts" ON user_account_access
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM user_account_access uaa
      WHERE uaa.user_id = auth.uid()
      AND uaa.account_id = user_account_access.account_id
      AND uaa.access_level = 'admin'
    )
  );

CREATE POLICY "Service role can manage access" ON user_account_access
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for access_logs table
CREATE POLICY "Users can read logs for their accounts" ON access_logs
  FOR SELECT
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM user_account_access
      WHERE user_account_access.account_id = access_logs.account_id
      AND user_account_access.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert logs" ON access_logs
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Grant permissions to roles
GRANT SELECT ON users TO authenticated;
GRANT UPDATE ON users TO authenticated;
GRANT SELECT ON user_account_access TO authenticated;
GRANT SELECT, INSERT ON access_logs TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON users TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_account_access TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON access_logs TO service_role;
