-- Create meta_pages table for storing Meta business pages
CREATE TABLE IF NOT EXISTS meta_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_account_id UUID NOT NULL REFERENCES meta_accounts(id) ON DELETE CASCADE,
  page_id TEXT NOT NULL,
  page_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(meta_account_id, page_id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_meta_pages_account_id ON meta_pages(meta_account_id);
CREATE INDEX IF NOT EXISTS idx_meta_pages_page_id ON meta_pages(page_id);

-- Enable Row Level Security
ALTER TABLE meta_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role can access all
CREATE POLICY "Service role access" ON meta_pages
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- RLS Policy: Authenticated users can read pages from their accounts
CREATE POLICY "Users can read their account pages" ON meta_pages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_account_access
      WHERE user_account_access.user_id = auth.uid()
      AND user_account_access.account_id = meta_pages.meta_account_id
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_meta_pages_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meta_pages_update_timestamp
BEFORE UPDATE ON meta_pages
FOR EACH ROW
EXECUTE FUNCTION update_meta_pages_timestamp();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON meta_pages TO service_role;
GRANT SELECT ON meta_pages TO authenticated;

---

-- Create meta_pixels table for storing Meta tracking pixels
CREATE TABLE IF NOT EXISTS meta_pixels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_account_id UUID NOT NULL REFERENCES meta_accounts(id) ON DELETE CASCADE,
  pixel_id TEXT NOT NULL,
  pixel_name TEXT NOT NULL,
  last_fired_time BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(meta_account_id, pixel_id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_meta_pixels_account_id ON meta_pixels(meta_account_id);
CREATE INDEX IF NOT EXISTS idx_meta_pixels_pixel_id ON meta_pixels(pixel_id);

-- Enable Row Level Security
ALTER TABLE meta_pixels ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role can access all
CREATE POLICY "Service role access" ON meta_pixels
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- RLS Policy: Authenticated users can read pixels from their accounts
CREATE POLICY "Users can read their account pixels" ON meta_pixels
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_account_access
      WHERE user_account_access.user_id = auth.uid()
      AND user_account_access.account_id = meta_pixels.meta_account_id
    )
  );

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_meta_pixels_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meta_pixels_update_timestamp
BEFORE UPDATE ON meta_pixels
FOR EACH ROW
EXECUTE FUNCTION update_meta_pixels_timestamp();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON meta_pixels TO service_role;
GRANT SELECT ON meta_pixels TO authenticated;
