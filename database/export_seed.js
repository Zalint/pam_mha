/**
 * Script d'export des données locales pour seed en production
 * Génère un fichier SQL avec toutes les données actuelles
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration de la connexion à la base de données locale
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'mha_pam',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

/**
 * Échappe les valeurs pour SQL
 */
function escapeSqlValue(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }
  if (typeof value === 'number') {
    return value;
  }
  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }
  // Chaîne de caractères - échapper les quotes
  return `'${String(value).replace(/'/g, "''")}'`;
}

/**
 * Génère un INSERT pour une table
 */
function generateInsert(tableName, rows) {
  if (!rows || rows.length === 0) {
    return `-- Aucune donnée pour la table ${tableName}\n`;
  }

  let sql = `-- ============================================================================\n`;
  sql += `-- DONNÉES DE LA TABLE: ${tableName.toUpperCase()}\n`;
  sql += `-- ============================================================================\n\n`;

  // Obtenir les colonnes depuis la première ligne
  const columns = Object.keys(rows[0]);
  
  rows.forEach((row, index) => {
    const values = columns.map(col => escapeSqlValue(row[col])).join(', ');
    sql += `INSERT INTO ${tableName} (${columns.join(', ')})\n`;
    sql += `VALUES (${values});\n`;
    
    if ((index + 1) % 10 === 0) {
      sql += `\n-- ${index + 1} lignes insérées...\n\n`;
    }
  });

  sql += `\n-- Total: ${rows.length} ligne(s) insérée(s) dans ${tableName}\n\n`;
  return sql;
}

/**
 * Export des données
 */
async function exportData() {
  try {
    console.log('🔄 Connexion à la base de données locale...');
    await pool.query('SELECT 1');
    console.log('✅ Connecté à la base de données\n');

    let sqlOutput = '';
    
    // En-tête du fichier
    sqlOutput += `-- ============================================================================\n`;
    sqlOutput += `-- SEED DE PRODUCTION - MHA PAM 2026\n`;
    sqlOutput += `-- Généré automatiquement depuis l'environnement local\n`;
    sqlOutput += `-- Date: ${new Date().toISOString()}\n`;
    sqlOutput += `-- ============================================================================\n\n`;
    sqlOutput += `-- IMPORTANT: Ce script doit être exécuté APRÈS production_schema.sql\n\n`;
    sqlOutput += `-- Désactiver temporairement les triggers et contraintes pour l'import\n`;
    sqlOutput += `SET session_replication_role = 'replica';\n\n`;

    // 1. Export des utilisateurs (sauf admin par défaut)
    console.log('📊 Export des utilisateurs...');
    const usersResult = await pool.query(`
      SELECT id, username, passwordHash, fullName, role, isActive, createdAt, updatedAt
      FROM users
      WHERE username != 'admin'
      ORDER BY id
    `);
    console.log(`   → ${usersResult.rows.length} utilisateur(s) trouvé(s)`);
    sqlOutput += generateInsert('users', usersResult.rows);

    // 2. Export des assignations utilisateurs
    console.log('📊 Export des assignations utilisateurs...');
    const assignmentsResult = await pool.query(`
      SELECT id, userId, assignmentType, assignmentValue, createdAt, createdBy
      FROM userAssignments
      ORDER BY id
    `);
    console.log(`   → ${assignmentsResult.rows.length} assignation(s) trouvée(s)`);
    sqlOutput += generateInsert('userAssignments', assignmentsResult.rows);

    // 3. Export des actions
    console.log('📊 Export des actions...');
    const actionsResult = await pool.query(`
      SELECT id, programme, sousDirection, action, activite, intitule,
             resultatsAttendus, indicateursCibles, indicateursResultats,
             responsable, echeance, tauxPhysique, tauxFinancier, statut,
             budgetTotal, budgetPrevisionnel, budgetT1, budgetT2, budgetT3, budgetT4,
             commentaire, lastModifiedBy, createdAt, updatedAt
      FROM actions
      ORDER BY id
    `);
    console.log(`   → ${actionsResult.rows.length} action(s) trouvée(s)`);
    sqlOutput += generateInsert('actions', actionsResult.rows);

    // 4. Export de l'historique
    console.log('📊 Export de l\'historique...');
    const historiqueResult = await pool.query(`
      SELECT id, actionId, userId, champModifie, ancienneValeur, nouvelleValeur,
             commentaire, createdAt
      FROM historique
      ORDER BY id
    `);
    console.log(`   → ${historiqueResult.rows.length} entrée(s) d'historique trouvée(s)`);
    sqlOutput += generateInsert('historique', historiqueResult.rows);

    // Réactiver les contraintes
    sqlOutput += `\n-- Réactiver les triggers et contraintes\n`;
    sqlOutput += `SET session_replication_role = 'origin';\n\n`;

    // Réinitialiser les séquences
    sqlOutput += `-- ============================================================================\n`;
    sqlOutput += `-- RÉINITIALISATION DES SÉQUENCES\n`;
    sqlOutput += `-- ============================================================================\n\n`;
    
    if (usersResult.rows.length > 0) {
      const maxUserId = Math.max(...usersResult.rows.map(r => r.id));
      sqlOutput += `SELECT setval('users_id_seq', ${maxUserId + 1}, false);\n`;
    }
    
    if (assignmentsResult.rows.length > 0) {
      const maxAssignmentId = Math.max(...assignmentsResult.rows.map(r => r.id));
      sqlOutput += `SELECT setval('userassignments_id_seq', ${maxAssignmentId + 1}, false);\n`;
    }
    
    if (actionsResult.rows.length > 0) {
      const maxActionId = Math.max(...actionsResult.rows.map(r => r.id));
      sqlOutput += `SELECT setval('actions_id_seq', ${maxActionId + 1}, false);\n`;
    }
    
    if (historiqueResult.rows.length > 0) {
      const maxHistoriqueId = Math.max(...historiqueResult.rows.map(r => r.id));
      sqlOutput += `SELECT setval('historique_id_seq', ${maxHistoriqueId + 1}, false);\n`;
    }

    sqlOutput += `\n-- ============================================================================\n`;
    sqlOutput += `-- FIN DU SEED\n`;
    sqlOutput += `-- ============================================================================\n`;

    // Écrire le fichier
    const outputPath = path.join(__dirname, 'production_seed.sql');
    fs.writeFileSync(outputPath, sqlOutput, 'utf8');

    console.log('\n✅ Export terminé avec succès !');
    console.log(`📄 Fichier généré: ${outputPath}`);
    console.log('\n📋 Résumé:');
    console.log(`   - ${usersResult.rows.length} utilisateur(s)`);
    console.log(`   - ${assignmentsResult.rows.length} assignation(s)`);
    console.log(`   - ${actionsResult.rows.length} action(s)`);
    console.log(`   - ${historiqueResult.rows.length} entrée(s) d'historique`);
    console.log('\n🚀 Prochaines étapes:');
    console.log('   1. Exécutez production_schema.sql sur la base de production');
    console.log('   2. Exécutez production_seed.sql sur la base de production');
    console.log('   3. Vérifiez que toutes les données sont bien importées');

  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Exécuter l'export
exportData();

