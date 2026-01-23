/**
 * Script pour peupler la base de test avec quelques données
 */

const { Pool } = require('pg');
require('dotenv').config();

const sourceDb = process.env.DB_NAME || 'suivi_pam_mha';
const testDb = process.env.TEST_DB_NAME || 'suivi_pam_test2';

async function populateTestDb() {
  console.log(`📊 Copie des données de ${sourceDb} vers ${testDb}\n`);

  // Pool vers la base source
  const sourcePool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: sourceDb,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  // Pool vers la base de test
  const testPool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: testDb,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    // 1. Copier les utilisateurs (sauf admin qui existe déjà)
    console.log('👥 Copie des utilisateurs...');
    const users = await sourcePool.query('SELECT * FROM users WHERE username != \'admin\'');
    for (const user of users.rows) {
      await testPool.query(`
        INSERT INTO users (id, username, passwordHash, fullName, role, isActive, createdAt, updatedAt)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (username) DO NOTHING
      `, [user.id, user.username, user.passwordhash, user.fullname, user.role, user.isactive, user.createdat, user.updatedat]);
    }
    console.log(`   ✅ ${users.rows.length} utilisateur(s) copié(s)`);

    // 2. Copier les assignations
    console.log('🔗 Copie des assignations...');
    const assignments = await sourcePool.query('SELECT * FROM userAssignments');
    for (const assignment of assignments.rows) {
      await testPool.query(`
        INSERT INTO userAssignments (id, userId, assignmentType, assignmentValue, createdAt, createdBy)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [assignment.id, assignment.userid, assignment.assignmenttype, assignment.assignmentvalue, assignment.createdat, assignment.createdby]);
    }
    console.log(`   ✅ ${assignments.rows.length} assignation(s) copiée(s)`);

    // 3. Copier quelques actions (limité à 5 pour le test)
    console.log('📋 Copie de 5 actions (échantillon)...');
    const actions = await sourcePool.query('SELECT * FROM actions LIMIT 5');
    for (const action of actions.rows) {
      await testPool.query(`
        INSERT INTO actions (
          id, programme, sousDirection, action, activite, intitule,
          resultatsAttendus, indicateursCibles, indicateursResultats,
          responsable, echeance, tauxPhysique, tauxFinancier, statut,
          budgetTotal, budgetPrevisionnel, budgetT1, budgetT2, budgetT3, budgetT4,
          commentaire, lastModifiedBy, createdAt, updatedAt
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      `, [
        action.id, action.programme, action.sousdirection, action.action, action.activite, action.intitule,
        action.resultatsattendus, action.indicateurscibles, action.indicateursresultats,
        action.responsable, action.echeance, action.tauxphysique, action.tauxfinancier, action.statut,
        action.budgettotal, action.budgetprevisionnel, action.budgett1, action.budgett2, action.budgett3, action.budgett4,
        action.commentaire, action.lastmodifiedby, action.createdat, action.updatedat
      ]);
    }
    console.log(`   ✅ ${actions.rows.length} action(s) copiée(s)`);

    // 4. Vérifier
    const countUsers = await testPool.query('SELECT COUNT(*) FROM users');
    const countAssignments = await testPool.query('SELECT COUNT(*) FROM userAssignments');
    const countActions = await testPool.query('SELECT COUNT(*) FROM actions');

    console.log('\n✅ Données de test copiées avec succès!\n');
    console.log('📊 Résumé de la base de test:');
    console.log(`   - ${countUsers.rows[0].count} utilisateur(s)`);
    console.log(`   - ${countAssignments.rows[0].count} assignation(s)`);
    console.log(`   - ${countActions.rows[0].count} action(s)`);
    console.log('');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await sourcePool.end();
    await testPool.end();
  }
}

populateTestDb();

