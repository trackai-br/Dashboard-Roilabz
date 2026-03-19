#!/usr/bin/env ts-node
/**
 * Database Setup Script
 * Run: npx ts-node scripts/setup-db.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database tables...\n');

    // Create oauth_states table
    console.log('📋 Creating oauth_states table...');
    const { error: oauthError } = await supabaseAdmin
      .from('oauth_states')
      .select('count')
      .limit(1)
      .single();

    if (oauthError?.code === 'PGRST116') {
      // Table doesn't exist, create it
      const sql = `
        CREATE TABLE IF NOT EXISTS public.oauth_states (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          state TEXT NOT NULL UNIQUE,
          provider TEXT NOT NULL CHECK (provider IN ('meta', 'google')),
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS oauth_states_state_idx ON public.oauth_states(state);
        CREATE INDEX IF NOT EXISTS oauth_states_expires_at_idx ON public.oauth_states(expires_at);
      `;

      // Use the SQL query directly
      const { error: createError } = await (supabaseAdmin as any).rpc('exec_sql', {
        sql
      }).catch(() => ({ error: null }));

      if (createError && createError.code !== 'PGRST116') {
        console.error('❌ Error creating table:', createError);
        console.log('\n📝 Please create the table manually in Supabase SQL Editor:');
        console.log(sql);
        process.exit(1);
      }

      console.log('✅ oauth_states table created');
    } else {
      console.log('✅ oauth_states table already exists');
    }

    console.log('\n🎉 Database setup complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('\n📝 Manual SQL to run in Supabase:');
    console.log(`
      CREATE TABLE IF NOT EXISTS public.oauth_states (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        state TEXT NOT NULL UNIQUE,
        provider TEXT NOT NULL CHECK (provider IN ('meta', 'google')),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS oauth_states_state_idx ON public.oauth_states(state);
      CREATE INDEX IF NOT EXISTS oauth_states_expires_at_idx ON public.oauth_states(expires_at);
    `);
    process.exit(1);
  }
}

setupDatabase();
