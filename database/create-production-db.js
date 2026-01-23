/**
 * Script pour créer la base de données de production
 * Usage: node database/create-production-db.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbName = process.env.DB_NAME_PROD || 'mha_pam_production';

async function createProductionDb() {
  console.log('🚀 Création de la base de données de production\n');
  console.log(`📦 Base de données : ${dbName}\n`);

  // Se connecter à la base postgres par défaut pour créer la nouvelle base
  const adminPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    // Vérifier si la base existe déjà
    console.log('🔍 Vérification de l\'existence de la base...');
    const checkDb = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (checkDb.rows.length > 0) {
      console.log(`⚠️  La base ${dbName} existe déjà!`);
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        readline.question('   Voulez-vous la supprimer et la recréer? (oui/non): ', resolve);
      });
      readline.close();

      if (answer.toLowerCase() === 'oui') {
        console.log('🗑️  Suppression de la base existante...');
        await adminPool.query(`DROP DATABASE ${dbName}`);
        console.log('   ✅ Base supprimée');
      } else {
        console.log('❌ Opération annulée');
        process.exit(0);
      }
    }

    // Créer la base
    console.log('📦 Création de la base de données...');
    await adminPool.query(`CREATE DATABASE ${dbName}`);
    console.log('   ✅ Base créée avec succès\n');

    await adminPool.end();

    // Se connecter à la nouvelle base pour créer le schéma
    const dbPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: dbName,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    });

    // Lire et exécuter le schéma
    console.log('📋 Lecture du schéma de production...');
    const schemaPath = path.join(__dirname, 'production_schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      console.error(`❌ Fichier ${schemaPath} introuvable!`);
      process.exit(1);
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('🔄 Création des tables, index, triggers...');
    await dbPool.query(schema);

    // Vérifier les tables créées
    const tables = await dbPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('   ✅ Schéma créé avec succès\n');
    console.log('📊 Tables créées:');
    tables.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });

    // Compter les données initiales
    const countUsers = await dbPool.query('SELECT COUNT(*) FROM users');
    
    console.log('\n✅ Base de données de production créée et prête!\n');
    console.log('📋 État actuel:');
    console.log(`   - ${tables.rows.length} table(s) créée(s)`);
    console.log(`   - ${countUsers.rows[0].count} utilisateur(s) par défaut (admin)`);
    console.log('');
    console.log('🚀 Prochaine étape:');
    console.log('   Exécutez: node database/seed-production-db.js');
    console.log('');

    await dbPool.end();

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

createProductionDb();

