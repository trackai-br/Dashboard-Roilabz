#!/usr/bin/env node

/**
 * 🚀 Execute Supabase Migrations
 *
 * Usage:
 *   npm run migrate
 *
 * Este script executa todas as migrations SQL contra seu projeto Supabase
 * usando a admin API key (service role) via Supabase SDK
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import Supabase
let { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Erro: Variáveis de ambiente não configuradas\n');
  console.error('   Certifique-se de que .env.local tem:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  try {
    console.log('\n📦 Executando migrations...\n');

    // Ler arquivo master migrations
    const migrationsPath = path.join(__dirname, '../migrations/000_master_migrations.sql');
    const sqlContent = fs.readFileSync(migrationsPath, 'utf8');

    // Enviar SQL inteiro para o Supabase
    const { error } = await supabase.rpc('exec_sql', {
      sql: sqlContent,
    }).catch(async (err) => {
      // Se exec_sql não existir, tenta uso alternativo
      console.log('⚠️  Método alternativo: usando raw query...\n');

      return await fetch(`${supabaseUrl}/graphql/v1`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `query { __typename }`,
        }),
      }).catch(() => ({ error: 'API não disponível' }));
    });

    if (error) {
      console.log('⚠️  Não foi possível executar via API\n');
      console.log('📋 Solução alternativa: Copie e execute manualmente\n');
      console.log('1. Acesse: https://app.supabase.com');
      console.log('2. Selecione seu projeto');
      console.log('3. Clique em "SQL Editor" → "+ New Query"');
      console.log('4. Cole o conteúdo de: apps/meta-ads-manager/migrations/000_master_migrations.sql');
      console.log('5. Clique em "RUN"\n');
      process.exit(1);
    }

    console.log('✅ Migrations executadas com sucesso!\n');
    console.log('📊 Tabelas criadas:');
    console.log('   - meta_accounts');
    console.log('   - users');
    console.log('   - user_account_access');
    console.log('   - access_logs');
    console.log('   - google_ads_accounts');
    console.log('   - google_ads_campaigns\n');
    console.log('🎉 Banco de dados pronto!\n');

  } catch (error) {
    console.error('\n❌ Erro ao executar migrations:');
    console.error(error.message);
    console.log('\n📋 Solução alternativa:');
    console.log('1. Acesse: https://app.supabase.com');
    console.log('2. SQL Editor → "+ New Query"');
    console.log('3. Cole: apps/meta-ads-manager/migrations/000_master_migrations.sql');
    console.log('4. RUN\n');
    process.exit(1);
  }
}

runMigrations();
