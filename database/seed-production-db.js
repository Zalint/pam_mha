/**
 * Script pour remplir la base de données avec les données du seed
 * Usage: node database/seed-production-db.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbName = process.env.DB_NAME_PROD || 'mha_pam_production';

async function seedProductionDb() {
  console.log('📊 Remplissage de la base de données avec les données du seed\n');
  console.log(`📦 Base de données : ${dbName}\n`);

  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: dbName,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    // Vérifier que la base existe et a les tables
    console.log('🔍 Vérification de la base de données...');
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    if (tables.rows.length === 0) {
      console.error('❌ Erreur: La base ne contient aucune table!');
      console.error('   Exécutez d\'abord: node database/create-production-db.js');
      process.exit(1);
    }

    console.log(`   ✅ Base trouvée avec ${tables.rows.length} table(s)\n`);

    // Vérifier si des données existent déjà
    const countUsers = await pool.query('SELECT COUNT(*) FROM users WHERE username != \'admin\'');
    const countActions = await pool.query('SELECT COUNT(*) FROM actions');

    if (countUsers.rows[0].count > 0 || countActions.rows[0].count > 0) {
      console.log('⚠️  La base contient déjà des données:');
      console.log(`   - ${countUsers.rows[0].count} utilisateur(s)`);
      console.log(`   - ${countActions.rows[0].count} action(s)\n`);

      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        readline.question('   Voulez-vous supprimer ces données et réimporter? (oui/non): ', resolve);
      });
      readline.close();

      if (answer.toLowerCase() === 'oui') {
        console.log('🗑️  Suppression des données existantes...');
        await pool.query('TRUNCATE TABLE historique, actions, userAssignments RESTART IDENTITY CASCADE');
        await pool.query('DELETE FROM users WHERE username != \'admin\'');
        console.log('   ✅ Données supprimées\n');
      } else {
        console.log('❌ Opération annulée');
        process.exit(0);
      }
    }

    // Lire le fichier seed
    console.log('📋 Lecture du fichier seed...');
    const seedPath = path.join(__dirname, 'production_seed.sql');
    
    if (!fs.existsSync(seedPath)) {
      console.error(`❌ Fichier ${seedPath} introuvable!`);
      console.error('   Générez-le d\'abord avec: node database/export_seed.js');
      process.exit(1);
    }

    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('🔄 Import des données...');
    await pool.query(seedSql);

    // Vérifier les données importées
    const finalCountUsers = await pool.query('SELECT COUNT(*) FROM users');
    const finalCountAssignments = await pool.query('SELECT COUNT(*) FROM userAssignments');
    const finalCountActions = await pool.query('SELECT COUNT(*) FROM actions');
    const finalCountHistorique = await pool.query('SELECT COUNT(*) FROM historique');

    console.log('   ✅ Données importées avec succès\n');

    console.log('📊 Résumé des données:');
    console.log(`   - ${finalCountUsers.rows[0].count} utilisateur(s)`);
    console.log(`   - ${finalCountAssignments.rows[0].count} assignation(s)`);
    console.log(`   - ${finalCountActions.rows[0].count} action(s)`);
    console.log(`   - ${finalCountHistorique.rows[0].count} entrée(s) d'historique`);
    console.log('');

    // Statistiques sur les actions
    const statuts = await pool.query(`
      SELECT statut, COUNT(*) as count 
      FROM actions 
      GROUP BY statut 
      ORDER BY count DESC;
    `);

    console.log('📈 Répartition par statut:');
    statuts.rows.forEach(row => {
      console.log(`   - ${row.statut}: ${row.count} action(s)`);
    });

    console.log('');
    console.log('✅ Base de données de production prête!\n');
    console.log('⚠️  IMPORTANT: Changez le mot de passe admin immédiatement!');
    console.log('   Login: admin / admin123\n');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.detail) console.error('   Détail:', error.detail);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedProductionDb();

