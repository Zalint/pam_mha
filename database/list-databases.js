/**
 * Script pour lister les bases de données PostgreSQL disponibles
 */

const { Pool } = require('pg');
require('dotenv').config();

async function listDatabases() {
  // Se connecter à la base postgres par défaut pour lister les bases
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres', // Base par défaut pour lister les autres
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    console.log('🔍 Connexion à PostgreSQL...\n');
    
    const result = await pool.query(`
      SELECT datname 
      FROM pg_database 
      WHERE datistemplate = false 
      ORDER BY datname;
    `);

    console.log('📊 Bases de données disponibles:\n');
    result.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.datname}`);
    });
    
    console.log('\n✅ Total:', result.rows.length, 'base(s) de données\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

listDatabases();

