/**
 * Script pour initialiser une base de données de test
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbName = process.env.TEST_DB_NAME || 'suivi_pam_test2';

async function setupTestDb() {
  console.log(`🔧 Initialisation de la base de test: ${dbName}\n`);

  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: dbName,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    console.log('📋 Lecture du schéma de production...');
    const schemaPath = path.join(__dirname, 'production_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('🔄 Exécution du schéma...');
    await pool.query(schema);

    console.log('✅ Schéma créé avec succès!\n');

    // Vérifier les tables créées
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('📊 Tables créées:');
    result.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });

    console.log('\n✅ Base de test initialisée et prête!\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupTestDb();

