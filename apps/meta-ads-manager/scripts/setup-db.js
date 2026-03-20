#!/usr/bin/env node
/**
 * Database Setup Script
 * Run: node scripts/setup-db.js
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const SQL = `CREATE TABLE IF NOT EXISTS public.oauth_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state text NOT NULL UNIQUE,
  provider text NOT NULL CHECK (provider IN ('meta', 'google')),
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT current_timestamp
);

CREATE INDEX IF NOT EXISTS oauth_states_state_idx ON public.oauth_states(state);
CREATE INDEX IF NOT EXISTS oauth_states_expires_at_idx ON public.oauth_states(expires_at);`;

async function verifyTableExists() {
  try {
    const { error } = await supabaseAdmin
      .from('oauth_states')
      .select('*')
      .limit(1);

    // PGRST116 = relation doesn't exist
    return error?.code !== 'PGRST116';
  } catch {
    return false;
  }
}

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database tables...\n');

    // Check if table exists
    console.log('📋 Checking oauth_states table...');
    const tableExists = await verifyTableExists();

    if (tableExists) {
      console.log('✅ oauth_states table already exists\n');
      console.log('🎉 Database setup complete!\n');
      process.exit(0);
    }

    // Table doesn't exist - show SQL to run manually
    console.log('❌ oauth_states table not found\n');
    console.log('📝 Please run this SQL in Supabase SQL Editor:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(SQL);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📌 Steps:');
    console.log('1. Go to https://app.supabase.com');
    console.log('2. Select your project');
    console.log('3. Open "SQL Editor"');
    console.log('4. Click "+ New query"');
    console.log('5. Paste the SQL above');
    console.log('6. Click "RUN"');
    console.log('7. Run this script again to verify\n');

    process.exit(1);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('\n📝 Manual SQL:');
    console.log(SQL);
    process.exit(1);
  }
}

setupDatabase();
