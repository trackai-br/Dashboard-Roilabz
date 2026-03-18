import { createClient } from '@supabase/supabase-js';

async function checkSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  console.log('🔍 Checking Supabase tables...\n');

  const tables = ['meta_accounts', 'meta_campaigns', 'meta_ad_sets', 'meta_ads'];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(1);

      if (error && error.code === 'PGRST116') {
        console.log(`❌ ${table}: TABLE DOES NOT EXIST`);
      } else if (error) {
        console.log(`⚠️  ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: EXISTS (${count} rows)`);
      }
    } catch (err: any) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
}

checkSupabase();
