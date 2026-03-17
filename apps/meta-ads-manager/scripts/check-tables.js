#!/usr/bin/env node

/**
 * ✅ Verificar Status das Migrations
 *
 * Usage:
 *   npm run check-tables
 *
 * Verifica se as 7 tabelas foram criadas corretamente no Supabase
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Erro: Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const tables = [
  'meta_accounts',
  'users',
  'user_account_access',
  'access_logs',
  'meta_ads_campaigns',
  'google_ads_accounts',
  'google_ads_campaigns'
];

async function checkTables() {
  console.log('\n📊 Verificando tabelas...\n');

  let created = 0;
  let missing = 0;

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('1')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        console.log(`   ❌ ${table}`);
        missing++;
      } else if (error && error.message.includes('not found')) {
        console.log(`   ❌ ${table}`);
        missing++;
      } else {
        console.log(`   ✅ ${table}`);
        created++;
      }
    } catch (err) {
      console.log(`   ❌ ${table}`);
      missing++;
    }
  }

  console.log(`\n📈 Resultado: ${created}/${tables.length} tabelas criadas\n`);

  if (created === tables.length) {
    console.log('✅ Criadas: 7/7 — Banco pronto!\n');
    console.log('🎉 Próximos passos:');
    console.log('   1. Configurar Google OAuth (SETUP_GUIDE.md — Passo 2)');
    console.log('   2. Testar login em http://localhost:3000/login\n');
  } else {
    console.log(`⚠️  Ainda faltam ${missing} tabelas.\n`);
    console.log('📋 Instruções para criar:');
    console.log('   1. Abra: EXECUTE_MIGRATIONS.md');
    console.log('   2. Siga os passos para executar SQL no Supabase\n');
  }

  process.exit(created === tables.length ? 0 : 1);
}

checkTables();
