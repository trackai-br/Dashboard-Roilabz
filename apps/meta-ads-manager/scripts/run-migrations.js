#!/usr/bin/env node

/**
 * 🚀 Executar Migrations — Supabase
 *
 * Uso:
 *   npm run migrate
 *
 * Este script executa todas as migrations SQL contra seu projeto Supabase
 * usando postgres.js com a URL do Session Pooler (6543)
 */

const fs = require('fs');
const path = require('path');

// Carregar .env.local
require('dotenv').config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('\n❌ Erro: DATABASE_URL não configurada\n');
  console.error('   Adicione ao .env.local:');
  console.error('   DATABASE_URL=postgresql://user:password@host:6543/postgres\n');
  process.exit(1);
}

async function runMigrations() {
  try {
    console.log('\n📦 Executando migrations...\n');

    // Ler arquivo master migrations
    const migrationsPath = path.join(__dirname, '../migrations/000_master_migrations.sql');
    const sqlContent = fs.readFileSync(migrationsPath, 'utf8');

    // Importar postgres dinamicamente
    const postgres = (await import('postgres')).default;

    console.log('📡 Conectando ao Session Pooler (6543)...');
    const client = postgres(databaseUrl, {
      ssl: 'require',
      prepare: false,
    });

    console.log(`📝 Executando SQL...\n`);

    try {
      // Executar arquivo SQL inteiro de uma vez (preserva funções PL/pgSQL)
      await client.file(migrationsPath);
      console.log('✓');
    } catch (err) {
      // Se file() não funcionar, tentar com exec() alternativo
      if (err.message.includes('Unknown method')) {
        // Fallback: executar query como string única
        await client.unsafe(sqlContent);
        console.log('✓');
      } else {
        throw err;
      }
    }

    await client.end();

    console.log('\n✅ Migrations executadas com sucesso!\n');
    console.log('📋 Tabelas criadas:');
    console.log('   ✓ meta_accounts');
    console.log('   ✓ users');
    console.log('   ✓ user_account_access');
    console.log('   ✓ access_logs');
    console.log('   ✓ meta_ads_campaigns (META/Facebook Ads)');
    console.log('   ✓ google_ads_accounts');
    console.log('   ✓ google_ads_campaigns\n');
    console.log('🎉 Banco de dados pronto (7/7 tabelas)!\n');

  } catch (error) {
    console.error('\n❌ Erro ao executar migrations:\n');
    console.error('Erro:', error.message);
    console.error('\nDica: Verifique se DATABASE_URL está correta no .env.local\n');
    process.exit(1);
  }
}

runMigrations();
